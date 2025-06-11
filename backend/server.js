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
      { expiresIn: '1h' });
      
      delete userData.password;
      res.json({message: 'SUCCESSFUL', userData, token});
    }
  }
  catch{
    res.json({message: 'INVALID'});
  }

});

// Запускаем сервер
app.listen(port, () => {
  console.log(`Launched on port: ${port}`);
});