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
const upload = multer({ //все что дальше по сути можно удалить
  storage: multer.memoryStorage(), // Хранить в памяти для обработки
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // Только 1 файл
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed'));
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
    return jwt.verify(token, process.env.JWT_SECRET);
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

//Смена фото профиля
/* app.get('/avatars', (req, res) => {
  checkToken()
  const id = req.body;
  try {
    checkToken();
    const
    res.json();
  }
  catch {
    res.json({ message: 'INVALID AUTH!'});
  }
}); */

app.post('/avatars',
  upload.single('avatar'),
  async (req, res) => {
    try{
      const user_id = checkToken(req);
      if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
      }
      const file = req.file;
      const { error } = await supabase.storage
      .from('avatars')
      .upload(`avatars/${user_id}.jpg`, file.buffer,
        {upsert: true, //upsert = true разрешает перезапись
        contentType: file.mimetype});

      if (error) {
        console.error('Supabase Error:', error); // Логируем детали
        return res.status(500).json({ 
        error: 'Ошибка загрузки файла'});
      }
      res.status(200).json({ message: 'Аватар обновлён!' });
    }
    catch (err) {
      res.status(400).json({ error: 'Uploading problem!'});
    }
  }
);

// Запускаем сервер
app.listen(port, () => {
  console.log(`Launched on port: ${port}`);
});