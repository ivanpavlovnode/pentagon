require('dotenv').config();
const express = require('express');
const http = require('http');
const multer = require('multer');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require ('ws');
const path = require('path');
//Подключение приложения
const app = express();
const server = http.createServer(app);
//CORS готовый для деплоя
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 
    true // Разрешить ВСЕ домены в продакшене
    : [
    'http://localhost:3000',
    'http://192.168.1.17:3000',
    'http://192.168.1.84:3000'
      ],
  credentials: true
}));
app.use(express.json());
//Читаем порт из env или 5000
const port = process.env.PORT || 5000;
//Тестовый роут
app.get('/api/test', (req, res) => {
  if(req || !req) return res.status(200).json({ message: 'А нам все равно, а нам все равно'});
});
//Настраиваем Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {fileSize: 10 * 1024 * 1024},
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/pdf',
      'application/rtf',
      'application/vnd.ms-excel',
      'text/plain'
    ];
    if(allowedTypes.includes(file.mimetype)){
      cb(null, true);
    }
    else{
      cb(null, false);
    }
  }
}); 
// Подключаемся к Supabase
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
// Middleware проверки токена
const checkToken = (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if(!token) throw new Error();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  };
// Middleware поиска документа
const findDocument = async(document_id, res) => {
    //Принимает айди, возвращает документ. При ошибке отправляет ответ
    const { data: document, error: documentError } = await db
    .from('Documents')
    .select('*')
    .eq('id', document_id)
    .single();
    if (!document) {
      return res.status(404).json({ error: 'Document not found'});
    }
    if (documentError) {
      return res.status(404).json({ error: 'Document search error'});
    }
    return document;
}
// Middleware поиска пользователя
const findUser = async(user_id, res) => {
    //Принимает айди, возвращает документ. При ошибке отправляет ответ
    const { data: userData, error: userDataError } = await db
    .from('Staff')
    .select('*')
    .eq('id', user_id)
    .single();
    if (!userData) {
      return res.status(404).json({ error: 'User not found'});
    }
    if (userDataError) {
      return res.status(404).json({ error: 'User search error'});
    }
    return userData;
}
//Маршрут аутентификации
app.post('/api/auth', async (req, res) =>
{
  const {id, password} = req.body;

  //Поиск пользователя в БД
  try{
    const{data: userData, error} = await db
    .from('Staff')
    .select('*')
    .eq('id', id)
    .single();
    if(error) return res.status(500).json({message: 'DB_ERROR'});
    //Добавить хэширование надо будет!
    if(password != userData.password)
    {
      return res.status(401).json({message: 'INVALID'});
    }
    else if(password == userData.password)
    {
      // Генерация JWT токена
      const token = jwt.sign(
        { id : userData.id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' });

      delete userData.password;
      return res.status(202).json({message: 'SUCCESSFUL', userData, token});
    }
  }
  catch{
    return res.status(500).json({message: 'SERVER_ERROR'});
  }
});
//Замена и получение аватара
app.get('/api/avatars', async (req, res) => {
  try{
    const user_id = checkToken(req);
    if(!user_id) return res.status(401).json({ error: 'Токен невалиден' });
    const { data, error } = await db.storage
     .from('avatars')
     .download(`avatars/${user_id}.jpg`);
    if (error) throw error

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.type('jpg'); // Устанавливаем Content-Type: image/jpeg
    res.set('Cache-Control', 'public, max-age=31536000');
    res.status(200).send(buffer);
  }
  catch(err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
//Эндпоинт для заполнения вкладки Staff аватарами. Дает конкретный аватар по id
app.get('/api/avatars/byid', async (req, res) => {
  try{
    const user_id = checkToken(req);
    const asked_id = req.headers['asked_id'];
    if(!user_id) return res.status(401).json({ error: 'Токен невалиден' });
    const { data, error } = await db.storage
     .from('avatars')
     .download(`avatars/${asked_id}.jpg`);
    if (error) throw error
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.type('jpg'); // Устанавливаем Content-Type: image/jpeg
    res.status(200).send(buffer);
  }  
  catch(err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
//Установка аватара в Account
app.post('/api/avatars', upload.single('avatar'), async (req, res) => {
  try{
    const user_id = checkToken(req);
    if(!user_id) return res.status(401).json({ error: 'Токен невалиден' });
    if (!req.file) return res.status(400).json({ error: 'Файл отсутствует' });
    const { error } = await db.storage
    .from('avatars')
    .upload(`avatars/${user_id}.jpg`, req.file.buffer,
    {upsert: true, //upsert = true разрешает перезапись
    contentType: req.file.mimetype});
    if (error) {
      return res.status(500).json({ 
      error: 'Ошибка сохранения файла'});
    }
    return res.status(202).json({ message: 'Аватар обновлён' });
  }
  catch (err){
    return res.status(500).json({ error: 'Ошибка сервера'});
  }
});
//Список персонала 
app.get('/api/staff', async (req, res) => {
  try{
    const user_id = checkToken(req);
    if(user_id) {
      try{
        const { data, error } = await db
        .from('Staff')
        .select('id, access_level, full_name, call_name, rank, div, status, service_record')
        .order('id', { ascending: true });
        if(error) return res.status(500).json({ error: 'Database error' });
        return res.status(200).json(data);
      }
      catch (err){
        return res.status(500).json({ error: 'Ошибка сервера' });
      }
    }
    else throw new Error();
  }
  catch{
    return res.status(401).json({ error: 'Ошибка аутентификации' });
  }
});
//История собщений по айди пользователя
app.get('/api/messenger', async (req, res) => {
  try{
    const user_id = checkToken(req);
    if(!user_id) return res.status(401).json({ error: 'Ошибка аутентификации' });
    try{
      const { data, error } = await db
        .from('Messenger')
        .select('*')
        .or(`sender.eq.${user_id}, getter.eq.${user_id}`)
        .order('id', { ascending: true });
      if(error) return res.status(500).json({ error: 'Database error' });
      return res.status(200).json(data);
    }
    catch (err){
      return res.status(500).json({ error: 'Ошибка сервера' });
    }

  }
  catch{
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});
//Отметка получения сообщений
app.post('/api/messenger', async (req, res) => {
  try{
    const user_id = checkToken(req);
    if(!user_id) return res.status(401).json({ error: 'Токен невалиден' });
    const { error } = await db
    .from('Messenger')
    .update({delivered: true})
    .match({
      sender: req.body.chosenContact,
      getter: user_id,
      delivered: false
    });
    if (error) {
      return res.status(500).json({error: 'Ошибка БД при отметке delivered'});
    }
    return res.status(200).json({ message: 'Сообщения отмечены delivered' });
  }
  catch (err){
    return res.status(500).json({ error: 'SERVER FATAL ERROR'});
  }
});
//Получение документов пользователя
app.get('/api/documents', async (req, res) => {
  try{
    const user_id = checkToken(req);
    if(!user_id) {
      return res.status(401).json({ error: 'Ошибка аутентификации' });
    }
    try{
      const { data: user_access_level, error: user_error } = await db
        .from('Staff')
        .select('access_level')
        .eq('id', user_id)
        .single();
      if(user_error || !user_access_level) {
        return res.status(500).json({ error: 'Database find user error' });
      }
      const { data: documents, error: docs_error } = await db
        .from('Documents')
        .select('*')
        .or(`recipient.eq.${user_id}, recipient.is.null, creator.eq.${user_id}`)
        .or(`access_level.lte.${user_access_level.access_level}, access_level.is.null`)
        .order('id', { ascending: false });

      if(docs_error) return res.status(500).json({ error: 'Database find doc error' });
      return res.status(200).json(documents);
    }
    catch (err){
      return res.status(500).json({ error: 'Database fatal error CAUGHT' });
    }
  }
  catch{
    return res.status(500).json({ error: 'SERVER FATAL ERROR' });
  }
});
//Изменение документа пользователя
app.patch('/api/documents', async (req, res) => {
  try{
    //Проверяем токен
    const user_id = checkToken(req);
    if(!user_id) return res.status(401).json({ error: 'Токен невалиден' });
    //Берем тело запроса
    const reqBody = req.body;
    //Получаем данные пользователя
    const userData = await findUser(user_id, res);
    //Получаем документ
    const document = await findDocument(reqBody.id, res);
    //Проверяем существование получателя
    if(reqBody.recipient !== null){
      const newRecipient = await findUser(reqBody.recipient);
    }
    else if(reqBody.recipient !== null && (typeof reqBody.recipient !== 'number')){
      return res.status(400).json({ error: 'Incorrect recipient value'});
    }
    //Проверяем уровень доступа
    if(document.creator !== userData.id ||
      reqBody.access_level > userData.access_level ||
      document.access_level > userData.access_level){
        return res.status(403).json({ error: 'Access denied'});
    }
    //Проверяем длину имени и описания (защита от гриферства)
    if(reqBody.docdata.name.length > 200 || reqBody.docdata.description.length > 2000){
      return res.status(413).json({ error: 'Too long name or description. Dont try to mess up my db, kiddo.'});
    }
    const { error: updateError } = await db
    .from('Documents')
    .update(
      {
        recipient: reqBody.recipient,
        access_level: reqBody.access_level,
        disposable: reqBody.disposable,
        docdata: 
        {
          name: reqBody.docdata.name,
          description: reqBody.docdata.description
        },
        //Всегда меняется
        delivered: false,
        version: (document.version + 1),
        date: new Date() 
      }
    )
    .eq('id', reqBody.id);
    if (updateError) {
      return res.status(500).json({ error: 'Database error while updating document' + updateError.message});
    }
    return res.status(202).json({ error: 'Succesfully updated'});
  }
  catch (err){
    return res.status(500).json({ error: 'SERVER FATAL ERROR!'});
  }
});
//Создание нового документа
app.post('/api/documents', async (req, res) => {
  try{
    //Проверяем токен
    const user_id = checkToken(req);
    if(!user_id) return res.status(401).json({ error: 'Токен невалиден' });
    //Берем тело запроса
    const reqBody = req.body;
    //Получаем данные пользователя
    const userData = await findUser(user_id, res);
    //Проверяем существование получателя
    if(reqBody.recipient !== null){
      const newRecipient = await findUser(reqBody.recipient, res);
    }
    else if(reqBody.recipient !== null && (typeof reqBody.recipient !== 'number')){
      return res.status(400).json({ error: 'Incorrect recipient value'});
    }
    //Проверяем уровень доступа
    if(reqBody.access_level > userData.access_level){
        return res.status(403).json({ error: 'Access denied'});
    }
    //Проверяем длину имени и описания (защита от гриферства)
    if(reqBody.docdata.name.length > 200 || reqBody.docdata.description.length > 2000){
      return res.status(413).json({ error: 'Too long name or description'});
    }

    const { data: createdDocument, error: insertError } = await db
    .from('Documents')
    .insert([
      {
        creator: userData.id,
        recipient: reqBody.recipient,
        access_level: reqBody.access_level,
        disposable: reqBody.disposable,
        docdata: 
        {
          name: reqBody.docdata.name,
          description: reqBody.docdata.description
        },
        //Всегда устанавливается
        delivered: false,
        version: 0,
        date: new Date() 
      }
    ])
    .select('*')
    .single();
    if (!createdDocument || insertError) {
      return res.status(500).json({ error: 'Database error while creating document ' + insertError.message});
    }
    return res.status(201).json({id: createdDocument.id});
  }
  catch (err){
    return res.status(500).json({ error: 'SERVER FATAL ERROR!'});
  }
});
// Роут для получения документа
app.get('/api/documents/file', async (req, res) => {
  try{
    const user_id = checkToken(req);
    if(!user_id) return res.status(401).json({ error: 'Invalid token' });
    //Получаем документ
    const document_id = req.headers.id;
    const document = await findDocument(document_id, res);
    //Проверяем доступ пользователя
    const userData = await findUser(user_id, res);
    if(document.access_level > userData.access_level){
      return res.status(403).json({error: 'Access denied'});
    }
    //Проверяем принадлежность пользователя
    if(document.recipient !== null && (document.creator !== user_id || document.recipient !== user_id)){
      return res.status(403).json({error: 'Access denied'});
    }
    //Ищем требуемый файл
    const { data: file, error: fileError } = await db.storage
     .from('documents')
     .download(document_id);
    if (!file) return res.status(404).json({error: 'File not found'});
    if (fileError) return res.status(400).json({error: 'File search error'});
    //Создаем имя файла
    const fileName = `${document.docdata.name}.${document.file_extension}`;
    //Удаляем документ и файл, если одноразовый (disposable)
    if(document.disposable === true){
      const {error: deleteDocError} = await db
      .from('Documents')
      .delete()
      .eq('id', document.id);
      if(deleteDocError){
        res.status(500).json({ error: 'Document delete error' });
      }
      const {error: deleteFileError} = await db.storage
      .from('documents')
      .remove(document.id);
      if(deleteFileError){
        res.status(500).json({ error: 'File delete error' });
      }
    }
    if(document.delivered === false){
      const { error: setDeliveredError } = await db
      .from('Documents')
      .update({delivered: true})
      .eq('id', document.id);
      if(setDeliveredError){
        res.status(500).json({ error: 'Set delivered error' });
      }
    }
    //Отправляем файл
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.set('Cache-Control', 'public, max-age=31536000');
    res.status(200).send(Buffer.from(await file.arrayBuffer()));
  }
  catch(err) {
    res.status(500).json({ error: 'SERVER FATAL ERROR WHILE SENDING FILE' });
  }
});
// Для изменения и создания файла - один роут. Не видел смысла делать отдельные.
app.post('/api/documents/file', upload.single('file'), async (req, res) => {
  try{
    const user_id = checkToken(req);
    if(!user_id) return res.status(401).json({ error: 'Invalid token' });
    if (!req.file) return res.status(400).json({ error: 'No file or unacceptable file' });
    //Переменная с айди нужного документа
    const document_id = req.body.id;
    //Получаем документ
    const { data: document, error: documentError } = await db
    .from('Documents')
    .select('*')
    .eq('id', document_id)
    .single();
    if (!document) {
      return res.status(404).json({ error: 'Document not found'});
    }
    if (documentError) {
      return res.status(404).json({ error: 'Document search error'});
    }
    if(document.creator !== user_id){
      return res.status(403).json({ error: 'Upload denied, not your document'});
    }
    //Получаем данные пользователя
    const{data: userData, error: userDataError} = await db
    .from('Staff')
    .select('*')
    .eq('id', user_id)
    .single();
    if (userDataError || !userData) {
      return res.status(404).json({ error: 'User not found'});
    }
    if(document.access_level > userData.access_level){
      return res.status(403).json({ error: 'Upload denied, no access'});
    }
    //Объект для перевода mime в расширение
    const mimeToExt = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/pdf': '.pdf',
      'application/rtf': '.rtf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'text/plain': '.txt'
    };
    //Переменная с расширением загружаемого файла
    const extension = mimeToExt[req.file.mimetype];
    //Загружаем файл
    const { error: FileError } = await db.storage
    .from('documents')
    .upload(`${document_id}`, req.file.buffer,
    {upsert: true, //upsert = true разрешает перезапись
    contentType: req.file.mimetype});
    if (FileError) {
      return res.status(500).json({ error: 'Error while saving file'});
    }
    /*Запись расширения в БД в таблицу Documents
    Необходимо для скачивания файла в клиенте с нужным расширением
    Иначе пришлось бы искать в хранилище через list(), это неэффективно*/
    const{error: ExtError} = await db
    .from('Documents')
    .update({file_extension: extension})
    .eq('id', document_id);
    if (ExtError) {
      return res.status(500).json({ error: 'Error while saving file'});
    }
    return res.status(202).json({ message: 'File uploaded' });
  }
  catch (err){
    return res.status(500).json({ error: 'Server file upload error'});
  }
});
/*WEBSOCKET SERVER WEBSOCKET SERVER WEBSOCKET SERVER*/
// Функция рассылки пришедшего сообщения через сокеты
function notifyUsers(message){
  const participants = [message.sender, message.getter];
  participants.forEach(userId => {
    try{
      const neededSocket = websocketConnections.get(userId);
      if (neededSocket && neededSocket.readyState === WebSocket.OPEN) neededSocket.send(JSON.stringify(message));
      else console.warn(`Socket not found or closed for user: ${id}`);
    }
    catch (err){
      console.error(`Notify error for user ${userId}:`, err);
    };
  });
}
//Создаем вебсокет сервер
const wss = new WebSocket.Server({noServer: true});
//Карта подключений для хранения сокетов
const websocketConnections = new Map();
//Апгрейдим сервер
server.on('upgrade', (request, socket, head) => {
  if (request.url.startsWith('/messenger'))
  {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
  else {socket.destroy()};
});
// Весь вебсокет для мессенджера
wss.on('connection', (socket, request) => {
  try {
    const websocketProtocol = (req) => {
      if (req.headers['x-forwarded-proto']) {
        return `${req.headers['x-forwarded-proto']}:`;
      }
      return req.socket.encrypted ? 'https' : 'http';
    }
    const protocol = websocketProtocol(request);
    const url = new URL(request.url, `${protocol}://${request.headers.host}`);
    //Аутентификация для соединения
    const token = url.searchParams.get('token');
    if(!token){
      socket.close(4403, 'Token required');
      return;
    }
    //Получаем айди пользователя из токена
    const user_id = jwt.verify(token, process.env.JWT_SECRET).id;
    //Добавляем пользователя в Map по айди
    websocketConnections.set(user_id, socket);
    //Обработка пришедшего сообщения
    socket.on('message', async (data) => {
      try{
        const message = JSON.parse(data);
        const{data: insertedData, error} = await db
        .from('Messenger')
        .insert([
          {
            sender: message.sender,
            getter: message.getter,
            text: message.text
          }
        ])
        .select();
        if (error) throw error;
        //Рассылка полученного от БД сообщения пользователям
        const insertedMessage = insertedData[0];
        notifyUsers(insertedMessage);
      }
      catch(error){
        console.error('Ошибка:', error);
        socket.send(JSON.stringify({ error: 'Не удалось отправить сообщение' }));
      }
    })
    socket.on('close', () => {
      websocketConnections.delete(user_id);
    });
  }
  catch{
    socket.close(4401, 'Unauthorized');
  }
});


//Path для статических файлов
app.use(express.static(path.resolve(__dirname, 'client/build')));

//Роут для выдачи React приложения
app.get(/.*/, (req, res) => {
  // Пропускаем вебсокет
  if (req.path.startsWith('/messenger')) {
    return next();
  }
  // Пропускаем статические файлы
  if (req.path.startsWith('/static/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});


//Обработчик ошибок, чтобы сервер не падал
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: 'Denied by Multer, uncorrect file' });
  } else {
    console.error(err);
    res.status(520).json({ error: 'UNKNOWN SERVER ERROR' });
  }
});
// Запускаем сервер
server.listen(port);
