const Author = require('../models/author');
const Book = require('../models/book');
const { body, validationResult } = require('express-validator');

// Импортируем эту библиотеку для возможности обработки исключений, возникающих в обработчиках маршрутов. 
const asyncHandler = require("express-async-handler");

// Улучшеный способ логирования
const debug = require('debug');
const debugAuthor = debug('author'); // Создаются логеры для различных частей приложения 


// Показать список всех авторов.
exports.author_list = asyncHandler(async (req, res, next) => {
  const list_authors = await Author
    .find()
    .sort([["family_name", "ascending"]])
    .exec();
  // Успех, значит рендер
  res.render("author_list", {
    title: "Список Авторов",
    author_list: list_authors,
  });
  
});


// Показать подробную страницу для данного автора.
exports.author_detail = asyncHandler(async (req, res, next) => {
  // Получите подробную информацию об авторе и всех его книгах (параллельно)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (!author) {
    // Без результата
    const err = new Error("Автор не найден");
    err.status = 404;
    return next(err);
  }

  res.render("author_detail", {
    title: "Подробнее про Автора",
    author: author,
    author_books: allBooksByAuthor,
  });
});


// Показать форму создания автора по запросу GET.
exports.author_create_get = asyncHandler(async (req, res, next) => {
  res.render('author_form', { 
    title: 'Создать Автора' 
  });
});


// Создать автора по запросу POST.
exports.author_create_post = [
  //Проверка и очистка полей 
  body("first_name")
    .trim() // Удаление пробелов
    .isLength({ min: 1 }) // Проверка, что строка не пустая.
    .escape() // Экранирование специальных HTML-символов.
    .withMessage("Необходимо указать имя.") // Сообщение об ошибке, если имя не указано.
    
    // ДАННЫЙ МЕТОД ИСПОЛЬЗУЕТСЯ ТОЛЬКО ДЛЯ ДЕМОНСТРАЦИИ (НЕ ИСПОЛЬЗОВАТЬ В ЖИЗНИ!)
    .isAlphanumeric() // Проверка, что строка содержит только буквенно-цифровые символы.
    
    .withMessage("Имя состоит не из буквенно-цифровых символов."), // Сообщение об ошибке, если имя содержит не буквенно-цифровые символы.
  
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Необходимо указать фамилию.")
    .isAlphanumeric()
    .withMessage("Фамилия состоит не из буквенно-цифровых символов."),
  
  body("date_of_birth", "Invalid date of birth")
    .optional({ values: "falsy" }) // Поле необязательно.
    .isISO8601() // Проверка, что дата соответствует формату ISO 8601.
    .toDate(), // Преобразование строки в объект Date.
  
  body("date_of_death", "Invalid date of death")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  // Обработка запроса после проверки и санитарной обработки.
  asyncHandler(async (req, res, next) => {
    // Извлечение ошибки проверки из запроса.
    const errors = validationResult(req);

    // Создание объекта Author с экранированными и обработанными данными
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if (!errors.isEmpty()) {
      // Есть ошибки. Повтор вывода формы с исправленными значениями/сообщениями об ошибках.
      res.render("author_form", {
        title: "Создать Автора",
        author: author,
        errors: errors.array(),
      });

      return;
    } else {
      // Данные валидны
      // Сохраняем автора в БД
      await author.save();
      
      // Перенаправить на новую запись автора.
      res.redirect(author.url);
    }
  }),
];

// Показать форму удаления автора по запросу GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  
  const author = await Author.findById(req.params.id);
  const authors_books = await Book.find({ author: req.params.id });

  if (!author) {
    // Если автор не найден, перенаправляем на страницу всех авторов
    return res.redirect("/catalog/authors");
  }

  // Рендерим шаблон для удаления автора
  res.render("author_delete", {
    title: "Удаление автора",
    author: author,
    author_books: authors_books,
  });
});

// Удалить автора по запросу POST.
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  // Логирование для диагностики
  debugAuthor('Получен запрос на удаление автора с ID:', req.body.authorid);

  // Выполняем параллельные запросы к базе данных
  const [ author, authors_books ] = await Promise.all([
    Author.findById(req.body.authorid).exec(),
    Book.find({ author: req.body.authorid }).exec(),
  ]);

  // Логирование результатов
  debugAuthor('Результаты поиска автора:', author);
  debugAuthor('Результаты поиска книг автора:', authors_books);

  // Проверяем, найден ли автор
  if (!author) {
    return res.status(404).send('Автор не найден');
  }

  // Проверяем, есть ли у автора книги
  if (authors_books.length > 0) {
    // Автор имеет книги. Отображаем форму удаления.
    res.render("author_delete", {
      title: "Удаление автора",
      author: author,
      author_books: authors_books,
    });
    } else {
      // У автора нет книг. Удаляем автора и перенаправляем на список авторов.
      await Author.findByIdAndDelete(req.body.authorid);
      debugAuthor('Автор успешно удален');
      res.redirect("/catalog/authors");
    }
});

// Показать форму обновления автора по запросу GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
  // Логирование для диагностики 
  debugAuthor(`Получен запрос на обновление атвора с ID: ${req.params.id}`);

  // Выполняем запрос к бд
  const author = await Author.findById(req.params.id).exec();

  // Логирование результатов 
  debugAuthor(`Результат поиска автора: ${author}`);

  if(!author) {
    // Используем новое логирование 
    debugAuthor(`Идентификатор не найден при обновлении: ${req.params.id}`);
    const err = new Error('Автор не найден');
    err.status = 404;
    return next(err);
  }

  res.render('author_form', {
    title: "Обновить автора",
    author: author,
  });

  debugAuthor('Форма обновления автора успешно отображена');
});

// Обновить автора по запросу POST.
exports.author_update_post = [
  // Проверка и санитизация полей
  body('first_name', 'Поле с именем не должно быть пустым').isLength({ min: 1 }).trim().escape(),
  body('family_name', 'Поле с фамилией не должно быть пустым').isLength({ min: 1 }).trim().escape(),
  body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601().toDate(), // .optional({ checkFalsy: true }) - поле в запросе является необязательным
  body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601().toDate(),

  // Обработка запроса после валидации и обработки полей.
  asyncHandler(async (req, res, next) => {      
    // Извлечение ошибок проверки из запроса
    const errors = validationResult(req);

    // Создание объекта Author c  экранированными/обработанными данными и старым идентификатором.
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id // Нужен для обновления существующего объекта
    });

    if(!errors.isEmpty()) {
      // Если есть ошибки,  повторно отобразить форму с текущими значениями и ошибками.
      debugAuthor(`Ошибки валидации: ${errors.array()}`);

      res.render('author_form', {
        title: 'Обновить данные автора',
        author: author,
        errors: errors.array(),
      });

      debugAuthor('Форма обновления автора успешно отображена');
      
      return;
    } else {
      // Данные из формы действительны. Обновить запись
      const theauthor = await Author.findByIdAndUpdate(req.params.id, author, {});
      // Успешно - перенаправление на страницу сведений о экземпляре книги.
      res.redirect(theauthor.url);

      debugAuthor('Успешное обновление данных');
    }
  })
];