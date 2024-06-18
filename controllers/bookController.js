// Импортируем все модели для подсчета кол-ва записей
const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const { body, validationResult } = require("express-validator");

// Импортируем эту библиотеку для возможности обработки исключений,  возникающих в обработчиках маршрутов. 
const asyncHandler = require("express-async-handler");

// Улучшеный способ логирования
const debug = require('debug');
const debugBook = debug('book'); // Создаются логеры для различных частей приложения 


// Получение главной страницы каталога.
exports.index = asyncHandler(async (req, res, next) => {
  // Получаем информацию о количестве книг, экземпляров книг, авторов и жанров (параллельно)
  const [
    numBooks,
    numBookInstances,
    numAvailableBookInstances,
    numAuthors,
    numGenres,
  ] = await Promise.all([
    // метод сountDocuments() - для получения кол-ва экземпляров каждой модели
    Book.countDocuments({}).exec(),
    BookInstance.countDocuments({}).exec(),
    BookInstance.countDocuments({ status: "Available" }).exec(),
    Author.countDocuments({}).exec(),
    Genre.countDocuments({}).exec(),
  ]);

  res.render("index", {
    title: "Домашняя страница Local Library",
    book_count: numBooks,
    book_instance_count: numBookInstances,
    book_instance_available_count: numAvailableBookInstances,
    author_count: numAuthors,
    genre_count: numGenres,
  });
});


// Показать полный список Book.
exports.book_list = asyncHandler(async (req, res, next) => {
  const list_books = await Book
    .find({}, 'title author')
    .populate("author")
    .exec();
    // Успешно, поэтому рендерим
    res.render("book_list", { 
      title: "Список Книг", 
      book_list: list_books 
    });
});


// Показать подробную страницу для данного Book.
exports.book_detail = asyncHandler(async (req, res, next) => {
  // Получить подробную информацию о книгах, экземплярах книг для конкретной книги
  const [ book, bookInstances ] = await Promise.all([
    Book.findById(req.params.id)
        .populate("author")
        .populate("genre")
        .exec(),

    BookInstance.find({ book: req.params.id }).exec(),
  ]);

  if (!book) {
    // Нет результатов
    const err = new Error("Книга не найдена");
    err.status = 404;
    return next(err);
  }

  res.render("book_detail", {
    title: book.title,
    book: book,
    book_instances: bookInstances,
  });
});


// Показать форму создания Book по запросу GET
exports.book_create_get = asyncHandler(async (req, res, next) => {
  // Получите всех авторов и жанры, которые можно использовать для добавления в книгу.
  const [allAuthors, allGenres] = await Promise.all([
    Author
      .find()
      .sort({ family_name: 1 })
      .exec(),
    Genre
      .find()
      .sort({ name: 1 })
      .exec(),
  ]);

  res.render("book_form", {
    title: "Создать Книгу",
    authors: allAuthors,
    genres: allGenres,
  });
});


// Создать Book по запросу POST. 
exports.book_create_post = [
  // Преобразовать жанр в массив.
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) req.body.genre = typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    next();
  },

  // Проверка и обработка поля.
  body("title", "Заголовок не должен быть пустым.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Автор не должен быть пустым.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Резюме не должно быть пустым.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN не должен быть пустым")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("genre.*") // для индивидуальной проверки каждой записи массива жанров.
    .escape(),
  
  // Обработка запроса после проверки и обработки.
  asyncHandler(async (req, res, next) => {
    // Извлечение ошибки проверки из запроса.
    const errors = validationResult(req);

    // Создать объект Book с экранированными и обрезанными данными.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if (!errors.isEmpty()) {
      // Есть ошибки. Повтор вывода формы с исправленными значениями/сообщениями об ошибках.
      // Получить всех авторов и жанры для заполнения.
      const [allAuthors, allGenres] = await Promise.all([
        Author
          .find()
          .sort({ family_name: 1 })
          .exec(),
        Genre
          .find()
          .sort({ name: 1 })
          .exec(),
      ]);

      // Отметить выбранные жанры как отмеченные.
      for (const genre of allGenres) {
        if (book.genre.includes(genre._id)) {
          genre.checked = "true";
        }
      }

      res.render("book_form", {
        title: "Создать Книгу",
        authors: allAuthors,
        genres: allGenres,
        book: book,
        errors: errors.array(),
      });
    } else {
      // Данные из формы действительны. Сохранить книгу.
      await book.save();
      res.redirect(book.url);
    }
  }),
];


// Показать форму удаления Book по запросу GET.
exports.book_delete_get = asyncHandler(async (req, res, next) => {
    
  const book = await Book
    .findById(req.params.id)
    .populate('author')
    .populate('genre')
    .exec();
  
  const bookinstances_books = await BookInstance
    .find({ book: req.params.id })
    .exec();

  if (!book) {
    debugBook('Книга не найдена!')
    return res.redirect('/catalog/books');
  }

  debugBook('Успех! Рендерим страницу!');

  res.render('book_delete', {
    title: 'Удаление книги',
    book: book,
    bookinstance_books: bookinstances_books,
  });
});

// Удалить Book по запросу POST.
exports.book_delete_post = asyncHandler(async (req, res, next) => {
  // Логирование для диагностики
  debugBook('Получен запрос на удаление книги с ID:', req.body.bookid);

  // Выполняем параллельные запросы к базе данных
  const [ book, bookinstances_books ] = await Promise.all([
    Book
      .findById(req.body.bookid)
      .populate('author')
      .populate('genre')
      .exec(),
    BookInstance
      .find({ book: req.body.bookid })
      .exec(),
  ]);

  // Логирование результатов
  debugBook('Результаты поиска книги:', book);
  debugBook('Результаты поиска экземпляра книги:', bookinstances_books);

  // Найдена ли книга?
  if (!book) {
    return res.status(404).send('Книга не найдена!');
  }

  // Проверяем, есть ли у книги экземпляры
  if (bookinstances_books.length > 0) {
    // У книги есть экземпляры. Отображаем форму удаления.
    res.render('book_delete', {
      title: 'Удаление книги',
      book: book,
      bookinstance_books: bookinstances_books,
    });

  } else {
    // У книги нет экземпляров. Удаляем книгу и перенаправляем на список книг.
    await Book.findByIdAndDelete(req.body.bookid);
    debugBook('Книга успешно удалена!');
    res.redirect('/catalog/books');
  }
});


// Показать форму обновления Book по запросу GET.
exports.book_update_get = asyncHandler (async (req, res, next) => {

  // Логгирование для диагностики 
  debugBook('Получен запрос на обновление книги с ID:', req.params.id);

  // Выполняем параллельные запросы к базе данных
  const [ book, authors, genres ] = await Promise.all([
    Book
      .findById(req.params.id)
      .populate("author")
      .populate("genre")
      .exec(),
    Author
      .find()
      .exec(),
    Genre
      .find()
      .exec(),
    ]);

  // Логирование результатов
  debugBook('Результат поиска книги:' , book);
  debugBook('Результаты поиска автора:', authors);
  debugBook('Результаты поиска жанра:', genres);
    
  if (!book) {
    // Нет результата.
    const err = new Error("Книга не найдена");
    err.status = 404;
    debugBook(err.message);
    return next(err);
  }

  // Отметьте выбранные нами жанры как отмеченные.
  genres.forEach(genre => {
    // some() для проверки, присутствует ли жанр книги в общем списке жанров, и отметка его как выбранного, если это так.
    if (book.genre.some(bookGenre => bookGenre._id.toString() === genre._id.toString())) {
      genre.checked = "true";
    }
  });

  debugBook("Жанры отмечены как выбранные");
        
  res.render("book_form", {
    title: "Обновить данные книги",
    authors: authors,
    genres: genres,
    book: book,
  });
    
  debugBook("Форма обновления книги успешно отображена");

});


  // Обновить Book по запросу POST.
exports.book_update_post = [
  // Преобразуем жанр в массив
  (req, res, next) => {
    let genre = req.body.genre;
    if (!(genre instanceof Array)) {
      if (typeof genre === 'undefined') genre = [];
      else genre = new Array(genre);
    }
    next();
  },

  // Проверка (валидация) и санитизация полей
  body('title', 'Название не должно быть пустым.').isLength({ min: 1 }).trim().escape(),
  body('author', 'Автор не должен быть пустым.').isLength({ min:1 }).trim().escape(),
  body('summary', 'Описание не должно быть пустым.').isLength({ min:1 }).trim().escape(),
  body('isbn', 'ISBN не должен быть пустым').isLength({ min: 1 }).trim().escape(),
  body("genre.*").trim().escape(),
  
  // Обработка запроса после валидации и обработки полей.
  asyncHandler(async (req, res, next) => {
    // Извлечение ошибки проверки из запроса.
    const errors = validationResult(req);

    // Создание объекта Book с экранированными/обработанными данными и старым идентификатором.
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
      _id: req.params.id, //Это необходимо, иначе будет присвоен новый идентификатор!
    });

    if (!errors.isEmpty()) {
      // Получить всех авторов и жанры для формы.
      const [ authors, genres ] = await Promise.all([
        Author
          .find()
          .exec(),
        Genre
          .find()
          .exec(),
      ]);
          
      // Отметить выбранные жанры как отмеченные.
      for (let i = 0; i < genres.length; i++) {
        if (book.genre.indexOf(genres[i]._id) > -1) {
          genres[i].checked = "true";
        }
      }
          
      res.render('book_form', {
        title: 'Обновить книгу',
        authors: authors,
        genres: genres,
        book: book,
        errors: errors.array(),
      });

      return;
    } else {
      // Данные из формы действительны. Обновите запись
      const thebook = await Book.findByIdAndUpdate(req.params.id, book, {}).exec();
      // Успешно - перенаправление на страницу сведений о странице.
      res.redirect(thebook.url);
    }
  })
];
