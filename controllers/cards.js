const mongoose = require('mongoose');
const Card = require('../models/card');

module.exports.addCard = (req, res) => {
  const { name, link } = req.body;
  console.log('addCard', name, link)
  Card.create({ name, link, owner: req.user._id })
    .then((card) => {
      Card.findById(card._id)
        .populate('owner')
        .then((data) => res.status(201).send(data))
        .catch(() => res.status(404).send({
          message: `Карточка по указанному _id: ${req.params.cardId} не найдена`,
        }));
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        res.status(400).send({ message: err.message });
      } else {
        res.status(500).send({ message: 'На сервере произошла ошибка' });
      }
    });
};

module.exports.getCards = (req, res) => {
  Card.find({})
    .populate(['owner', 'likes'])
    .then((cards) => res.status(200).send(cards))
    .catch(() => res.status(500).send({ message: 'На сервере произошла ошибка' }));
};

module.exports.deleteCard = (req, res) => {
  Card.findByIdAndRemove(req.params.cardId)
    .then((card) => {
      if (card) {
        res.status(200).send(card)
      } else { throw new Error('DocumentNotFoundError') }
    })
    .catch((err) => {
      if (err instanceof mongoose.Error.CastError) {
        res.status(400).send({ message: `Некоректный _id: ${req.params.cardId} карточки` });
      } else if (err.message === 'DocumentNotFoundError') {
        res.status(404).send({
          message: `Карточка по указанному _id: ${req.params.cardId} не найдена`,
        });
      } else {
        res.status(500).send({ message: 'На сервере произошла ошибка' });
      }
    });
};

module.exports.likeCard = (req, res) => {
  Card.findByIdAndUpdate(req.params.cardId, { $addToSet: { likes: req.user._id } }, { new: true })
    .populate(['owner', 'likes'])
    .then((card) => {
      if (card) {
        res.status(200).send(card)
      } else { throw new Error('DocumentNotFoundError') }
    })
    .catch((err) => {
      if (err instanceof mongoose.Error.CastError) {
        res.status(400).send({ message: `Некоректный _id: ${req.params.cardId} карточки` });
      } else if (err.message === 'DocumentNotFoundError') {
        res.status(404).send({
          message: `Карточка по указанному _id: ${req.params.cardId} не найдена`,
        });
      } else {
        res.status(500).send({ message: 'На сервере произошла ошибка' });
      }
    });
};

module.exports.dislikeCard = (req, res) => {
  Card.findByIdAndUpdate(req.params.cardId, { $pull: { likes: req.user._id } }, { new: true })
    .populate(['owner', 'likes'])
    .then((card) => {
      if (card) {
        res.status(200).send(card)
      } else { throw new Error('DocumentNotFoundError') }
    })
    .catch((err) => {
      if (err instanceof mongoose.Error.CastError) {
        res.status(400).send({ message: `Некоректный _id: ${req.params.cardId} карточки` });
      } else if (err.message === 'DocumentNotFoundError') {
        res.status(404).send({
          message: `Карточка по указанному _id: ${req.params.cardId} не найдена`,
        });
      } else {
        res.status(500).send({ message: 'На сервере произошла ошибка' });
      }
    });
};
