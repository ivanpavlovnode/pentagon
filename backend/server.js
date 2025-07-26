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
//Подключение приложения
const app = express();
const server = http.createServer(app);
//CORS для dev режима с двух портов, также для тестов с телефона
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.1.17:3000',
    'http://192.168.1.84:3000'
  ],
  credentials: true 
}));
app.use(express.json());
//Читаем порт из env или 5000
const port = process.env.PORT || 5000;
//Создаем вебсокет сервер
const wss = new WebSocket.Server({noServer: true});
const websocketConnections = new Map();
server.on('upgrade', (request, socket, head) => {
  if (request.url.startsWith('/messenger'))
  {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
  else {socket.destroy()};
});
//Тестовый роут
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok' });
});
//Настраиваем Multer
const upload = multer({storage: multer.memoryStorage()}); 
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
//Маршрут аутентификации
app.post('/auth', async (req, res) =>
{
  const {id, password} = req.body;

  //Поиск пользователя в БД
  try{
    const{data, error} = await db
    .from('Staff')
    .select('*')
    .eq('id', id)
    .single();

    const userData = data;
    //Добавить хэширование надо будет!
    if(password != userData.password)
    {
      res.json({message: 'INVALID'});
    }
    else if(password == userData.password)
    {
      // Генерация JWT токена
      const token = jwt.sign(
        { id : userData.id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' });

      delete userData.password;
      res.json({message: 'SUCCESSFUL', userData, token});
    }
  }
  catch{
    res.json({message: 'SERVER_ERROR'});
  }
});
//Замена и получение аватара
app.get('/avatars', async (req, res) => {
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
    res.send(buffer);
  }  
  catch(err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
//Эндпоинт для заполнения вкладки Staff аватарами
//Дает конкретный аватар по id
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
    res.send(buffer);
  }  
  catch(err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
//Установка аватара в Account
app.post('/avatars', upload.single('avatar'), async (req, res) => {
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
    return res.status(200).json({ message: 'Аватар обновлён' });
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
        res.json(data);
      }
      catch (err){
        res.status(500).json({ error: 'Ошибка сервера' });
      }
    }
    else throw new Error();
  }
  catch{
    res.status(401).json({ error: 'Ошибка аутентификации' });
  }
});
//История собщений по айди пользователя
app.get('/api/messenger', async (req, res) => {
  try{
    const user_id = checkToken(req);
    if(!user_id) res.status(401).json({ error: 'Ошибка аутентификации' });
    try{
      const { data, error } = await db
        .from('Messenger')
        .select('*')
        .or(`sender.eq.${user_id}, getter.eq.${user_id}`)
        .order('id', { ascending: true });
      if(error) return res.status(500).json({ error: 'Database error' });
      res.json(data);
    }
    catch (err){
      res.status(500).json({ error: 'Ошибка сервера' });
    }

  }
  catch{
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});
//Отметка Delivered для прочитанного сообщения
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
      return res.status(500).json({ 
      error: 'Ошибка БД при отметке delivered'});
    }
    return res.status(200).json({ message: 'Сообщения отмечены delivered' });
  }
  catch (err){
    return res.status(500).json({ error: 'Фатальная ошибка сервера, он чудом избежал смэрти!'});
  }
});

/*WEBSOCKET SERVER WEBSOCKET SERVER WEBSOCKET SERVER
  WEBSOCKET SERVER WEBSOCKET SERVER WEBSOCKET SERVER
  WEBSOCKET SERVER WEBSOCKET SERVER WEBSOCKET SERVER*/
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
// Весь вебсокет для мессенджера
wss.on('connection', (socket, request) => {
  //Аутентификация для соединения
  const token = new URL(request.url, 'ws://localhost').searchParams.get('token');
  const user_id = jwt.verify(token, process.env.JWT_SECRET).id;
  if(!user_id) {
    socket.close(1008, 'Invalid token');
    return;
  }
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
});

// Запускаем сервер
server.listen(port);