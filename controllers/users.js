const { HTTP_STATUS_OK, HTTP_STATUS_CREATED } = require('http2').constants; // 200/201
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');

module.exports.addUser = (req, res, next) => {
  const {
    name, about, avatar, email, password,
  } = req.body;
  bcrypt.hash(password, 10)
    .then((hash) => User.create({
      name, about, email, avatar, password: hash,
    })
      .then((user) => res.status(HTTP_STATUS_CREATED).send({ // 201
        name: user.name, about: user.about, avatar: user.avatar, _id: user._id, email: user.email,
      }))
      .catch((err) => {
        if (err.code === 11000) {
          next(new ConflictError(`Пользователь с email:${email} уже зарегистрирован`));// 409
        } else if (err instanceof mongoose.Error.ValidationError) {
          next(new BadRequestError(err.message));// 400
        } else {
          next(err);
        }
      }));
};

module.exports.getUsers = (req, res, next) => {
  User.find({})
    .then((users) => res.status(HTTP_STATUS_OK).send(users))
    .catch(next);
};

module.exports.getUserById = (req, res, next) => {
  User.findById(req.params.userId)
    .orFail()
    .then((user) => {
      res.status(HTTP_STATUS_OK).send(user);
    })
    .catch((err) => {
      if (err instanceof mongoose.Error.CastError) {
        next(new BadRequestError(`Некоректный id: ${req.params.userId}`)); // 400
      } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
        next(new NotFoundError(`Пользователь по указанному id: ${req.params.userId} не найден`)); // 404
      } else {
        next(err);
      }
    });
};

module.exports.editUserData = async (req, res, next) => {
  const { name, about } = req.body;
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { name, about }, { new: 'true', runValidators: true })
      .orFail();
    res.status(HTTP_STATUS_OK).send(user);
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      next(new BadRequestError('Некорректно заполнено одно из двух полей')); // 400
      return;
    }
    if (err instanceof mongoose.Error.CastError) {
      next(new BadRequestError(`Некоректный id: ${req.user._id}`));// 400
    } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
      next(new NotFoundError(`Пользователь по указанному _id: ${req.params.userId} не найден`));// 404
    } else {
      next(err);
    }
  }
};

module.exports.editUserAvatar = async (req, res, next) => {
  const { avatar } = req.body;
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: 'true', runValidators: true })
      .orFail();
    res.status(HTTP_STATUS_OK).send(user);
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      next(new BadRequestError(`Некоректно заполненное поле ${err.errors.avatar.message} `)); // 400
      return;
    }
    if (err instanceof mongoose.Error.CastError) {
      next(new BadRequestError(`Некоректный id: ${req.user._id}`));// 400
    } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
      next(new NotFoundError(`Пользователь по указанному _id: ${req.params.userId} не найден`));// 404
    } else {
      next(err);
    }
  }
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign({ _id: user._id }, 'some-secret-key');// создадим токен
      res.send({ token }); // вернём токен
    })
    .catch((err) => {
      next(err);
    });
};

module.exports.getMeUser = (req, res, next) => {
  User.findById(req.user._id)
    .then((users) => res.status(HTTP_STATUS_OK).send(users))
    .catch(next);
};
