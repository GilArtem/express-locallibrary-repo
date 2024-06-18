var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* test */
router.get('/cool', function(req, res, next) {
  res.send('Ну ты и пес!');
});

module.exports = router;
