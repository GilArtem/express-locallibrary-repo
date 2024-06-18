var express = require('express');
var router = express.Router();

// GET домашней страницы.
router.get("/", function (req, res) {
  res.redirect("/catalog");
});

module.exports = router;
