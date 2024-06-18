const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GenreSchema = new Schema({
    name: { type: String, required: true, min: 3, max: 100, unique: true },
});

// Виртуальное св-во URL жанра
GenreSchema.virtual('url').get(function () {
    return '/catalog/genre/' + this._id;
});

GenreSchema.index({ name: 1 }, { collation: { locale: 'en', strength: 2 } });

module.exports = mongoose.model('Genre', GenreSchema);