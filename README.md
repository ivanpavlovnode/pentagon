# Pentagon - пародийный портал (React/Express)
[🌐Ссылка на рабочий проект](https://ivanpavlov.site)
### Данные гостевой учетной записи (вводить только числа!): 
```userData
id: 12 
password: 0000
```

## Особенности
- Мессенджер в реальном времени с поиском собеседников по имени, историей сообщений
- Документообменник с добавлением файла, созданием и редактированием документов.
- Документы могут иметь уровень доступа, могут быть адресованы конкретному получателю, могут быть одноразовыми. 

## Технологический стэк
- **Frontend:** React 19.1, styled-components(used in Documents.js)
- **Backend:** Express 5.1.0, supabase-js
- **Деплой:** VPS Ubuntu 24, Nginx

## Освоенные навыки
1. Аутентификация через JWT в sessionStorage
1. Реализовал WebSocket-протокол для мессенджера в реальном времени
2. Освоил React-хуки: useState, useRef, useMemo, useEffect
3. Применил Context API для передачи состояний и функций в дочерний компонент
4. Применил styled-components для хранения стилей в одном файле
5. Освоил рендеринг через условия if и &&, также через метод .map
6. Научился работать c библиотекой supabase-js

## Локальный запуск
### Вам потребуется база данных supabase (в моем варианте использована бесплатная nano), в ней нужно создать таблицы.
SQL-команды для создания таблиц с нужной структурой в scheme"public"
```sql
CREATE TABLE public.Documents (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  creator integer NOT NULL,
  recipient integer,
  access_level smallint,
  docdata json NOT NULL,
  delivered boolean DEFAULT false,
  disposable boolean DEFAULT false,
  date timestamp without time zone,
  version integer NOT NULL DEFAULT 0,
  file_extension text,
  CONSTRAINT Documents_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Messenger (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  sender integer NOT NULL,
  getter integer,
  text text,
  delivered boolean NOT NULL DEFAULT false,
  CONSTRAINT Messenger_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Staff (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  full_name text NOT NULL DEFAULT 'FULL NAME'::text,
  call_name text,
  rank text NOT NULL DEFAULT 'PVT'::text,
  div text NOT NULL DEFAULT '315P'::text,
  status text NOT NULL DEFAULT 'ACTIVE'::text,
  access_level smallint NOT NULL DEFAULT '1'::smallint,
  password text NOT NULL DEFAULT '1111'::text,
  service_record text NOT NULL DEFAULT 'No record'::text,
  CONSTRAINT Staff_pkey PRIMARY KEY (id)
);
```
Также нужно создать две корзины в хранилище с именами "avatars" и "documents". В таблице Staff создайте свою учетную запись с паролем. 
# Затем нужно создать .env файл в /backend, и заполнить как показано ниже.
### Не забудьте вписать свои значения для URL, API ключей и JWT секрета.
```env
SUPABASE_URL=your.supabase.url
SUPABASE_ANON_KEY=yourAnonKeyFromSupabase
SUPABASE_SERVICE_ROLE_KEY=yourServiceKeyFromSupabase
JWT_SECRET=yourKeyEnterWhatYouWantItMustBeStrong
PORT=5000
NODE_ENV=production
```

Когда все подготовлено, в терминале нужно перейти в директорию для проекта и выполнить:
```bash
git clone https://github.com/bickdick0/pentagon
cd pentagon/backend
npm install
cd client
npm install
cd ../
npm run build-client
npm start
```
Чтобы получить SPA от локального сервера в адресной строке браузера введите localhost:5000
