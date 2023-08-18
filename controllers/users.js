const mongoose = require('mongoose');
const User = require('../models/user');

module.exports.addUser = (req, res) => {
  const { name, about, avatar } = req.body;
  User.create({ name, about, avatar })
    .then((user) => res.status(201).send(user))
    .catch((err) => {
      if (err instanceof mongoose.Error.ValidationError) {
        res.status(400).send({ message: err.message });
      } else {
        res.status(500).send({ message: 'На сервере произошла ошибка' });
      }
    });
};

module.exports.getUsers = (req, res) => {
  User.find({})
    .then((users) => res.send(users))
    .catch(() => res.status(500).send({ message: 'На сервере произошла ошибка' }));
};

module.exports.getUserById = (req, res) => {
  User.findById(req.params.userId)
    .orFail()
    .then((user) => {
      res.send(user);
    })
    .catch((err) => {
      if (err instanceof mongoose.Error.CastError) {
        res.status(400).send({ message: `Некоректный _id: ${req.params.userId}` });
      } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
        res.status(404).send({
          message: `Пользователь по указанному _id: ${req.params.userId} не найден`,
        });
      } else {
        res.status(500).send({ message: 'На сервере произошла ошибка' });
      }
    });
};

module.exports.editUserData = async (req, res) => {
  const { name, about } = req.body;
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { name, about }, { new: 'true', runValidators: true })
      .orFail();
    res.status(200).send(user);
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).send({ message: 'Некоректно заполненные поля' });
    }
    if (err instanceof mongoose.Error.CastError) {
      res.status(400).send({ message: `Некоректный id: ${req.user._id}` });
    } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
      res.status(404).send({
        message: `Пользователь по указанному _id: ${req.user._id} не найден`,
      });
    } else {
      res.status(500).send({ message: 'На сервере произошла ошибка' });
    }
  }
};

module.exports.editUserAvatar = async (req, res) => {
  const { avatar } = req.body;
  try {
    const user = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: 'true', runValidators: true })
      .orFail();
    res.status(200).send(user);
  } catch (err) {
    if (err instanceof mongoose.Error.CastError) {
      res.status(400).send({ message: `Некоректный id: ${req.user._id}` });
    } else if (err instanceof mongoose.Error.DocumentNotFoundError) {
      res.status(404).send({
        message: `Пользователь по указанному _id: ${req.user._id} не найден`,
      });
    } else {
      res.status(500).send({ message: 'На сервере произошла ошибка' });
    }
  }
};
