const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

// Импортируем эту библиотеку для возможности обработки исключений,  возникающих в обработчиках маршрутов. 
const asyncHandler = require("express-async-handler");

// Улучшеный способ логирования
const debug = require('debug');
const debugBookInstnace = debug('bookInstance'); // Создаются логеры для различных частей приложения 


// Показать полный список BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const list_bookinstances = await BookInstance
    .find()
    .populate('book')
    .exec();
  
  // Успешно, тогда рендерим
  res.render("bookinstance_list", {
    title: "Список Книжных Экземпляров",
    bookinstance_list: list_bookinstances,
  });
});


// Показать подробную страницу для данного BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance
    .findById(req.params.id)
    .populate('book')
    .exec();

  if (!bookInstance) {
    // Нет результатов
    const err = new Error("Экземпляр книги не найдена");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_detail", {
    title: "Книга:",
    bookinstance: bookInstance,
  });
});


// Показать форму создания BookInstance по запросу GET
// Внимание: при первом отображении этой формы книга не была выбрана, 
// поэтому мы не передаем переменную selected_book в render(). 
// По этой причине в шаблоне selected_book будет иметь значение .undefined
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book
    .find({}, "title")
    .sort({ title: 1 })
    .exec();

  res.render("bookinstance_form", {
    title: "Создать Экземпляр Книги",
    book_list: allBooks,
  });
});


// Создать BookInstance по запросу POST. 
exports.bookinstance_create_post = [
  // Проверка и очистка полей.
  body("book", "Книга должна быть указана").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Печать должна быть").trim().isLength({ min: 1 }).escape(),
  body("status").escape(),
  body("due_back", "Неверная дата").optional({ values: "falsy" }).isISO8601().toDate(),

  // Обработайтка запроса после проверки и обработки.
  asyncHandler(async (req, res, next) => {
    // Извлечение ошибки проверки из запроса.
    const errors = validationResult(req);

    // Создать объект экземпляра книги с экранированными и обрезанными данными.
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // Есть ошибки.
      // Снова отобразить форму с исправленными значениями и сообщениями об ошибках.
      const allBooks = await Book
        .find({}, "title")
        .sort({ title: 1 })
        .exec();

      res.render("bookinstance_form", {
        title: "Создать Экземпляр Книги",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    
    } else {
      // Данные валидны
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }
  }),
];


// Показать форму удаления BookInstance по запросу GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  const bookinstance = await BookInstance.findById(req.params.id);

  if (!bookinstance) {
    debugBookInstnace('Экземпляр книги не найден');
    return res.redirect('/catalog/bookinstances');
  }
  
  res.render('bookinstance_delete', {
    title: 'Удаление экземпляра книги',
    bookinstance: bookinstance,
  });

  debugBookInstnace('Выполнена форма удаления экземпляра книги');
});


// Удалить BookInstance по запросу POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  debugBookInstnace('Получен запрос на удаление жанра с ID:', req.body.bookinstanceid);
    
  const bookinstance = await BookInstance
    .findById(req.body.bookinstanceid)
    .exec();
    
  if (!bookinstance) {
    return res.status(404).send('Экземпляр книги не найден');
  } 

  await BookInstance.findByIdAndDelete(req.body.bookinstanceid);
  debugBookInstnace('Экземпляр книги успешно удален');
  res.redirect('/catalog/bookinstances');

});


// Показать форму обновления BookInstance по запросу GET. 
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
    
  // Логирование для диагностики 
  debugBookInstnace('Получен запрос на обновление экземпляра книги с ID:', req.params.id);

  // Выполняем запрос к бд 
  const bookinstance = await BookInstance
    .findById(req.params.id)
    .exec();
  
  const allBooks = await Book
    .find({}, 'title')
    .exec(); 

  // Логирование результатов
  debugBookInstnace('Результат поиска экземпляра книги:' , bookinstance);
  debugBookInstnace('Список всех книг:', allBooks);

  if (!bookinstance) {
    const err = new Error('Экземпляр книги не найден');
    err.status = 404;
    debugBookInstnace(err.message);
    return next(err);
  }
  
  res.render('bookinstance_form', {
    title: 'Обновить данные экземпляра книги',
    bookinstance: bookinstance,
    book_list: allBooks,
    selected_book: bookinstance.book._id
  });

  debugBookInstnace("Форма обновления экземпляра книги успешно отображена");

});


// Обновить bookinstance по запросу POST.
exports.bookinstance_update_post = [
  
  // Проверка и санитизация полей
  body('book', 'Книга должна быть указана').isLength({ min: 1 }).trim().escape(),
  body('imprint', 'Печать не должна быть пустой').isLength({ min: 1 }).trim().escape(),
  body('status', 'Статус не должен быть пустым').isLength({ min: 1 }).trim().escape(),
  body('due_back', 'Дата должна быть указана').isISO8601().toDate(),

  // Обработка запроса после валидации и обработки полей.
  asyncHandler(async (req, res, next) => {
    // Извлечение ошибок проверки из запроса
    const errors = validationResult(req);

    // Создание объекта BookInstance c  экранированными/обработанными данными и старым идентификатором.
    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id // Нужен для обновления существующего объекта
    });

    if(!errors.isEmpty()) {
      // Если есть ошибки,  повторно отобразить форму с текущими значениями и ошибками.
      const allBooks = await Book
        .find({}, 'title')
        .exec(); 
        
      debugBookInstnace('Ошибки валидации:', errors.array());
      debugBookInstnace('Список всех книг:', allBooks);

      res.render('bookinstance_form', {
        title: 'Обновить данные экземпляра книги',
        book_list: allBooks,
        selected_book: bookinstance.book._id,
        errors: errors.array(),
        bookinstance: bookinstance
      });
      return;
    
    } else {
      // Данные из формы действительны. Обновить запись
      const thebookinstance = await BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {});
      // Успешно - перенаправление на страницу сведений о экземпляре книги.
      res.redirect(thebookinstance.url);
    }
  })
];
