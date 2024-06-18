
//// ПОСЛЕДНИЙ ВАРИАНТ 
// Импорт и конфигурирование dotenv в самом начале файла
require('dotenv').config({ path: './.env' });

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const debug = require('debug')('app');
const compression = require('compression');
const helmet = require('helmet');
const RateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Подключение маршрутов
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const catalogRouter = require('./routes/catalog');

// Лимит запросов в минуту
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
});

const app = express();

// Установка движка шаблонов
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());
app.use(helmet.contentSecurityPolicy({
  directives: {
    "script-src": ["'self'", "code.jquery.com", "cdn.jsdelivr.net"],
  },
}));
app.use(limiter);
app.use(express.static(path.join(__dirname, 'public')));

// Использование маршрутов
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);

// Обработка 404 ошибок
app.use(function(req, res, next) {
  next(createError(404));
});

// Централизованная обработка ошибок (Handler)
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Подключение к MongoDB
mongoose.set('strictQuery', false);

const mongoDB = process.env.MONGODB_URI || 'mongodb+srv://gilart:Jordan1324@cluster0.dn7jtyi.mongodb.net/librarydb?retryWrites=true&w=majority&appName=Cluster0';

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('mongoDB URL:', mongoDB);

const connectDB = async () => {
  try {
    await mongoose.connect(mongoDB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    debug('Подключение к MongoDb успешно');
  } catch (err) {
    debug(`Ошибка подключения к MongoDB: ${err.message}`);
    console.log(`Ошибка подключения к MongoDB: ${err.message}`);
    process.exit(1);
  }
};
connectDB();

module.exports = app;




//// ПЕРВЫЙ РАБОЧИЙ ВАРИАНТ 
// const createError = require('http-errors');
// const express = require('express');
// const path = require('path');
// const cookieParser = require('cookie-parser');
// const logger = require('morgan');
// const compression = require('compression'); // библиотека сжатия gzip/deflate для HTML-ответов.
// const helmet = require('helmet');
// const RateLimit = require('express-rate-limit');  // Ограничиваем скорость в маршрутах API


// const limiter = RateLimit({
//   windowMs: 1 * 60 * 1000, // 1 минута 
//   max: 20,
// });

// const indexRouter = require('./routes/index');
// const usersRouter = require('./routes/users');
// const catalogRouter = require('./routes/catalog')


// //// Работа с бд без должного соблюдения безопасности 
// // $$$$$ Подключение MongoDB
// // const mongoose = require('mongoose');
// // const URL = 'mongodb+srv://gilart:Jordan1324@cluster0.dn7jtyi.mongodb.net/librarydb?retryWrites=true&w=majority&appName=Cluster0';

// // mongoose.connect(URL);
// // mongoose.Promise = global.Promise;

// // const db = mongoose.connection;

// // db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// // $$$$$ Конец подключения MongoDB
// ////

// //// Правильная работа с бд 
// // $$$$$ Подключение MongoDB
// const mongoose = require("mongoose");
// mongoose.set("strictQuery", false); // Это отключает строгий режим запросов, что означает, что mongoose будет более гибко обрабатывать запросы к базе данных.

// const dev_db_url = 'mongodb+srv://gilart:Jordan1324@cluster0.dn7jtyi.mongodb.net/librarydb?retryWrites=true&w=majority&appName=Cluster0';
// const mongoDB = process.env.MONGODB_URI || dev_db_url;

// main() // запускает подключение к базе данных. 
// .catch((err) => console.log(err));
// async function main() {
//   await mongoose.connect(mongoDB);
// }
// // $$$$$
// ////


// const app = express();

// // view engine setup (шаблонизатор pug)
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'pug');

// app.use(logger('dev'));
// app.use(express.json()); // app.use(bodyParser.json());
// app.use(express.urlencoded({ extended: false })); // app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cookieParser());


// // Часть 7
// app.use(compression()); // сжимаем все роутеры
// app.use(
//   helmet.contentSecurityPolicy({    // Установливаем заголовки CSP, чтобы разрешить обработку наших Bootstrap и Jquery
//     directives: {
//       "script-src": ["'self", "code.jqurey.com", "cdn.jsdelivr.net"],
//     },
// }),
// );
// app.use(limiter); // Применяем ограничитель скорости ко всем запросам
// // Конец Часть 7


// app.use(express.static(path.join(__dirname, 'public')));

// // ROUTES
// app.use('/', indexRouter);
// app.use('/users', usersRouter);
// app.use("/catalog", catalogRouter); 


// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

// module.exports = app;
