const express = require("express");
const router = express.Router();

// Требующиеся модули контроллеров.
const book_controller = require("../controllers/bookController");
const author_controller = require("../controllers/authorController");
const genre_controller = require("../controllers/genreController");
const book_instance_controller = require("../controllers/bookinstanceController");

/// BOOK ROUTES МАРШРУТЫ КНИГ///

// GET домашнюю страницу каталога.
router.get("/", book_controller.index); // Фактически происходит сопоставление с /catalog/, потому что мы импортируем маршрут с префиксом /catalog

// GET запрос для создания Book. Должен появиться до маршрута, показывающего Book (использует id)
router.get("/book/create", book_controller.book_create_get);

// POST запрос для создания Book.
router.post("/book/create", book_controller.book_create_post);

// GET запрос для удаления Book.
router.get("/book/:id/delete", book_controller.book_delete_get);

// POST запрос для удаления Book.
router.post("/book/:id/delete", book_controller.book_delete_post);

// GET запрос для обновления Book.
router.get("/book/:id/update", book_controller.book_update_get);

// POST запрос для обновления Book.
router.post("/book/:id/update", book_controller.book_update_post);

// GET запрос для определенной Book.
router.get("/book/:id", book_controller.book_detail);

// GET запрос для списка всех элементов Book.
router.get("/books", book_controller.book_list);


/// AUTHOR ROUTES ///

// GET-запрос для создания автора. Должен появиться до маршрута для id (для вывода автора)
router.get("/author/create", author_controller.author_create_get);

// POST запрос для создания Author.
router.post("/author/create", author_controller.author_create_post);

// GET запрос для удаления Author.
router.get("/author/:id/delete", author_controller.author_delete_get);

// POST запрос для удаления Author.
router.post("/author/:id/delete", author_controller.author_delete_post);

// GET запрос для обновления Author.
router.get("/author/:id/update", author_controller.author_update_get);

// POST запрос для обновления  Author.
router.post("/author/:id/update", author_controller.author_update_post);

// GET запрос для определенной Author.
router.get("/author/:id", author_controller.author_detail);

// GET запрос для списка всех элементов Authors.
router.get("/authors", author_controller.author_list);


/// GENRE ROUTES ///

// GET-запрос для создания жанра. Должен появиться до маршрута, выводящего жанр (( с использованием id)
router.get("/genre/create", genre_controller.genre_create_get);

//POST запрос для создания Genre.
router.post("/genre/create", genre_controller.genre_create_post);

// GET запрос для удаления Genre.
router.get("/genre/:id/delete", genre_controller.genre_delete_get);

// POST запрос для удаления Genre.
router.post("/genre/:id/delete", genre_controller.genre_delete_post);

// GET запрос для обновления Genre.
router.get("/genre/:id/update", genre_controller.genre_update_get);

// POST запрос для обновления Genre.
router.post("/genre/:id/update", genre_controller.genre_update_post);

// GET запрос для определенной Genre.
router.get("/genre/:id", genre_controller.genre_detail);

// GET запрос для списка всех элементов Genre.
router.get("/genres", genre_controller.genre_list);


/// BOOKINSTANCE ROUTES ///

// GET-запрос для создания экземпляра книги. Должен появиться до маршрута, выводящего BookInstance с использованием id
router.get(
  "/bookinstance/create",
  book_instance_controller.bookinstance_create_get,
);

// POST запрос для создания экземпляра BookInstance.
router.post(
  "/bookinstance/create",
  book_instance_controller.bookinstance_create_post,
);

// GET запрос для удаления экземпляра BookInstance.
router.get(
  "/bookinstance/:id/delete",
  book_instance_controller.bookinstance_delete_get,
);

// POST запрос для удаления экземпляра BookInstance.
router.post(
  "/bookinstance/:id/delete",
  book_instance_controller.bookinstance_delete_post,
);

// GET запрос для обновления экземпляра BookInstance.
router.get(
  "/bookinstance/:id/update",
  book_instance_controller.bookinstance_update_get,
);

// POST запрос для обновления экземпляра BookInstance.
router.post(
  "/bookinstance/:id/update",
  book_instance_controller.bookinstance_update_post,
);

// GET запрос для определенной BookInstance.
router.get("/bookinstance/:id", book_instance_controller.bookinstance_detail);

// GET запрос для списка всех элементов BookInstance.
router.get("/bookinstances", book_instance_controller.bookinstance_list);

module.exports = router;
