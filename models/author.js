const moment = require('moment');
const { DateTime } = require('luxon');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;


const AuthorSchema = new Schema({
    first_name: { type: String, required: true, max: 100 },
    family_name: { type: String, required: true, max: 100 },
    date_of_birth: { type: Date },
    date_of_death: { type: Date },
});

// Виртуальное св-во для полного имени автора 
AuthorSchema.virtual('name').get(function () {
    return this.family_name + ',' + this.first_name;
});

// Виртуальное св-во URL автора
AuthorSchema.virtual('url').get(function () {
    return '/catalog/author/' + this._id;
});

// форматирование даты рождения 
AuthorSchema.virtual('date_of_birth_formatted').get(function () {
    return this.date_of_birth ?
    moment(this.date_of_birth).format("YYYY-MM-DD") : 'Не известо '; // варианты форматирования http://momentjs.com/docs/#/displaying/
});


// форматирование даты смерти 
AuthorSchema.virtual('date_of_death_formatted').get(function () {
    return this.date_of_death ?
    moment(this.date_of_death).format("YYYY-MM-DD") : 'По сей день'; // варианты форматирования http://momentjs.com/docs/#/displaying/
});

// виртуальное свойство lifespan (luxon форматирование времени)
AuthorSchema.virtual('lifespan').get(function() {
    let lifespan = '';
    if (this.date_of_birth) {
        lifespan += DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED);
    }

    lifespan += ' - ';
    
    if (this.date_of_death) {
        lifespan += DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED);
    }

    return lifespan;
})

module.exports = mongoose.model('Author', AuthorSchema);