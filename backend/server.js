require('dotenv').config();
const express = require('express');
const multer = require('multer');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
//Подключение приложения
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;

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
app.get('/avatars/byid', async (req, res) => {
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
app.get('/staff', async (req, res) => {
  try{
    const user_id = checkToken(req);
    if(user_id) {
      try{
        const { data, error } = await db
        .from('Staff')
        .select('id, full_name, call_name, rank, div, status, service_record')
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
// Запускаем сервер
app.listen(port, () => {
  console.log(`Launched on port: ${port}`);
});