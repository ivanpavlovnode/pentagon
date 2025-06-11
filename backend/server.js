require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
//Подключение приложения
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 5000;
// Подключаемся к Supabase
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
// Middleware проверки токена
const checkToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Токен отсутствует' });
  }

  try {
    // Проверяем подпись токена
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;



  } catch (err) {
    res.status(401).json({ error: 'Неверный токен' });
  }
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
    if(password !== userData.password || error)
    {
      res.json({message: 'INVALID'});
    }
    else if(password === userData.password)
    {
      // Генерация JWT токена
      const token = jwt.sign(
      { userId: userData.id},
      process.env.JWT_SECRET,
      { expiresIn: '1h' });//секунды
      
      delete userData.password;
      res.json({message: 'SUCCESSFUL', userData, token});
    }
  }
  catch{
    res.json({message: 'INVALID'});
  }

});
//Защищенные маршруты
app.get('/protected', checkToken, (req, res) => {
  res.json({ 
    message: 'Секретные данные!',
    user: req.user 
  });
});

// Запускаем сервер
app.listen(port, () => {
  console.log(`Launched on port: ${port}`);
});