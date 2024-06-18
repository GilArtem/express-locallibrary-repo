const Genre = require("../models/genre");
const Book = require('../models/book');
const { body, validationResult } = require("express-validator");

// Импортируем эту библиотеку для возможности обработки исключений,  возникающих в обработчиках маршрутов. 
const asyncHandler = require("express-async-handler");

// Улучшеный способ логирования
const debug = require('debug');
const debugGenre = debug('genre'); // Создаются логеры для различных частей приложения 


// Показать полный список Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
  const list_genres = await Genre
    .find()
    .sort([["genre", "ascending"]])
    .exec();

  // Успешно, тогда рендеринг
  res.render("genre_list", {
    title: "Список Жанров",
    genre_list: list_genres,
  });
});


// Показать подробную страницу для данного Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  const [ genre, genre_books ] = await Promise.all([
    Genre
      .findById(req.params.id)
      .exec(),
    Book
      .find({ genre: req.params.id })
      .exec(),
  ]);

  if (!genre) {
    // Нет результатов
    const err = new Error('Жанр не найден');
    err.status = 404;
    return next(err);
  }

  // Успех и рендер 
  res.render('genre_detail', {
    title: 'Подробнее про жанры',
    genre: genre,
    genre_books: genre_books,
  });
});


// Показать форму создания Genre по запросу GET
exports.genre_create_get = asyncHandler((req, res, next) => {
  res.render("genre_form", { 
    title: "Создать Жанр" 
  });
});

// Создать Genre по запросу POST. 
exports.genre_create_post = [
  
  // Проверка и очистка поля имя.
  body("name", "Название жанра должно содержать не менее 3 символов")
    .trim()
    .isLength({ min: 3 }) // метод, если больше 3 символов => ошибка 
    .escape(), // Замена HTML-символов, используемых при XSS-атаках (<, >, &, и ") 

  // Обработайка запроса после проверки и санитарной обработки.
  asyncHandler(async (req, res, next) => {
    // Извлечение ошибки проверки из запроса.
    const errors = validationResult(req);

    // Создание Genre объекта с экранированными и очищенными данными.
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // Есть ошибки. Повторение вывода формы с исправленными значениями/сообщениями об ошибках.
      res.render("genre_form", {
        title: "Создать Жанр",
        genre: genre,
        errors: errors.array(),
      });
      return;

    } else {
      // Данные из формы являются действительными.
      // Проверка на существование жанра с таким названием.
      const genreExists = await Genre
        .findOne({ name: req.body.name })
        .collation({ locale: "en", strength: 2 }) // Чтобы игнорировать регистр букв и диакритические знаки при поиске, мы связываем этот метод
        .exec();
      
        if (genreExists) {
        // Жанр существует, перейдите на страницу с подробной информацией о нем
        res.redirect(genreExists.url);
          
      } else {
        await genre.save();
        //Новый жанр сохранен. Перенаправить на страницу с подробной информацией о жанре.
        res.redirect(genre.url);
      }
    }
  }),
];

// Показать форму удаления Genre по запросу GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  const genre = await Genre
    .findById(req.params.id)
    .exec();
  const genres_books = await Book
    .find({ genre: req.params.id })
    .exec();

  if (!genre) {
    debugGenre('Жанр не найден');
    return res.redirect('/catalog/genres');
  }

  res.render('genre_delete', {
    title: 'Удаление жанра',
    genre: genre,
    genre_books: genres_books,
  });
});

// Удалить Genre по запросу POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  
  debugGenre('Получен запрос на удаление жанра с ID:', req.body.genreid);

  const [ genre, genres_books ] = await Promise.all([
    Genre
      .findById(req.body.genreid)
      .exec(),
    Book
      .find({ genre: req.body.genreid })
      .exec(),
  ]);

  debugGenre('Результаты поиска жанра', genre);
  debugGenre('Результаты поиска книг жанра:', genres_books);

  if (!genre) {
    return res.status(404).send('Жанр не найден');
  }

  if (genres_books.length > 0) {
    res.render('genre_delete', {
      title: 'Удаление жанра',
      genre: genre,
      genre_books: genres_books,
    });
  
  } else {
    await Genre.findByIdAndDelete(req.body.genreid);
    debugGenre('Жанр успешно удален');
    res.redirect('/catalog/genres');
  }
});

//  Показать форму обновления Genre по запросу GET.
exports.genre_update_get = asyncHandler(async (req, res) => {
   
  // Логирование для диагностики 
  debugGenre('Получен запрос на обновление жанра с ID:', req.params.id);

  // Выполняем запрос к бд
  const genre = await Genre
    .findById(req.params.id)
    .exec();

  // Логирование результатов 
  debugGenre('Результат поиска жанра:', genre);

  if(!genre) {
    const err = new Error('Жанр не найден');
    err.status = 404;
    debugGenre(err.message);
    return next(err);
  }

  res.render('genre_form', {
    title: 'Обновить данные жанра',
    genre: genre,
  });

  debugGenre('Форма обновления жанра успешно отображена');
});

// Обновить Genre по запросу POST.
exports.genre_update_post = [

  // Проверка и сенитизация полей
  body('name', 'Название жанра не должно быть пустым').isLength({ min: 1 }).trim().escape(),

  // Обработка запроса после валидации и обработки полей
  asyncHandler(async (req, res, next) => {
      
    // Извлекаем ошибки проверки из запроса 
    const errors = validationResult(req);

    // Создание объекта Genre c  экранированными/обработанными данными и старым идентификатором.
    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id  // Нужен для обновления существующего объекта
    });

    if(!errors.isEmpty()) {
      // Если есть ошибки,  повторно отобразить форму с текущими значениями и ошибками.
      debugGenre('Ошибки валидации', errors.array());

      res.render('genre_form', {
        title: 'Обновить данные жанра',
        genre: genre,
        errors: errors.array(),
      });
      return;
      
    } else {
      // Данные из формы действительны. Обновить запись
      const thegenre = await Genre.findByIdAndUpdate(req.params.id, genre, {});
      // Успешно - перенаправление на страницу сведений о жанре.
      res.redirect(thegenre.url);
    }
  })
];
