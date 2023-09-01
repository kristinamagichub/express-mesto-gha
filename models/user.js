const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const UnauthorizedError = require('../errors/Unauthorized');
const urlRegex = require('../utils/constants');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Жак-Ив Кусто',
    minlength: [2, 'Минимальная длина имени — 2 символа'],
    maxlength: [30, 'Максимальная длина имени — 30 символов'],
  },
  about: {
    type: String,
    default: 'Исследователь',
    minlength: [2, 'Минимальная длина поля  — 2 символа'],
    maxlength: [30, 'Максимальная длина поля — 30 символов'],
  },
  avatar: {
    type: String,
    // default: 'https://www.digitalocean.com/_next/static/media/intro-to-cloud.d49bc5f7.jpeg',
    default: 'https://pictures.s3.yandex.net/resources/jacques-cousteau_1604399756.png',
    validate: {
      validator(v) {
        return urlRegex.test(v);
      },
      message: 'Введите url адрес',
    },
  },
  //   validate: [{
  //     validator: url => validator.isURL(url),
  //     message: 'Введите url адрес',
  //   }],
  // },

  // validate: [{
  //   validator: v => validator.isEmail(v),
  //   message: shared.i18n.t('invalidEmail'),
  // }],
  email: {
    type: String,
    required: [true, 'Поле должно быть заполнено'],
    unique: true,
    validate: [{
      validator: (email) => validator.isEmail(email),
      //   return /^\S+@\S+\.\S+$/.test(email);
      // },
      message: 'Введите верный email',
    }],
  },
  password: {
    type: String,
    required: [true, 'Поле должно быть заполнено'],
    select: false,
  },
}, { versionKey: false });

userSchema.statics.findUserByCredentials = function findUserByCredentials(email, password) {
  return this.findOne({ email })
    .select('+password')
    .then((user) => {
      if (!user) {
        throw new UnauthorizedError('Неправильные почта или пароль');
      }

      return bcrypt.compare(password, user.password)
        .then((matched) => {
          if (!matched) {
            throw new UnauthorizedError('Неправильные почта или пароль');
          }

          return user; // теперь user доступен
        });
    });
};

module.exports = mongoose.model('user', userSchema);
