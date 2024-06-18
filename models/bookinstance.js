const moment = require('moment');
const { DateTime } = require('luxon');
const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const BookInstanceSchema = new Schema({
  book: { type: Schema.ObjectId, ref: "Book", required: true }, //ссылка на книгу
  imprint: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ["Available", "Maintenance", "Loaned", "Reserved"],
    default: "Maintenance",
  },
  due_back: { type: Date, default: Date.now },
});

// Виртуальное св-во для BookInstance's URL
BookInstanceSchema.virtual("url").get(function () {
  return "/catalog/bookinstance/" + this._id;
});

// Форматирование даты 
BookInstanceSchema.virtual("due_back_formatted").get(function () {
  return moment(this.due_back).format("MMMM Do, YYYY"); // варианты форматирования http://momentjs.com/docs/#/displaying/
});

BookInstanceSchema.virtual("due_back_yyyy_mm_dd").get(function () {
  return DateTime.fromJSDate(this.due_back).toISODate(); // format 'YYYY-MM-DD'
});

module.exports = mongoose.model("BookInstance", BookInstanceSchema);

