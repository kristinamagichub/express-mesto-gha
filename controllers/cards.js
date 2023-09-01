const { HTTP_STATUS_OK, HTTP_STATUS_CREATED } = require('http2').constants; // 200/201
const mongoose = require('mongoose');
const Card = require('../models/card');

const BadRequestError = require('../errors/BadRequestError');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');

module.exports.addCard = async (req, res, next) => {
  const { name, link } = req.body;
  try {
    const card = await Card.create({ name, link, owner: req.user._id });
    const newCard = await Card.findById(card._id)
      .populate('owner');
    res.status(HTTP_STATUS_CREATED).send(newCard); // 201
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      next(new BadRequestError(err.message));
    } else {
      next(err);
    }
  }
};

module.exports.getCards = (req, res, next) => {
  Card.find({})
    .populate(['owner', 'likes'])
    .then((cards) => res.status(HTTP_STATUS_OK).send(cards))
    .catch(next);
};

module.exports.deleteCard = async (req, res, next) => {
  try {
    const card = await Card.findById(req.params.cardId)
      .orFail();
    if (!card.owner.equals(req.user._id)) {
      throw new ForbiddenError('Карточка другого пользователя');// 403
    }
    const deleteItem = await Card.deleteOne(card)
      .orFail();
    res.status(HTTP_STATUS_OK).send({ message: `Карточка удалена, id: ${deleteItem._id} ` });
  } catch (err) {
    if (err instanceof mongoose.Error.DocumentNotFoundError) {
      next(new NotFoundError(`Карточка по указанному id: ${req.params.cardId} не найдена`));// 404
    } else if (err instanceof mongoose.Error.CastError) {
      next(new BadRequestError(`Некоректный id: ${req.params.cardId} карточки`));// 400
    } else {
      next(err);
    }
  }
};

module.exports.likeCard = (req, res, next) => {
  Card.findByIdAndUpdate(req.params.cardId, { $addToSet: { likes: req.user._id } }, { new: true })
    .populate(['owner', 'likes'])
    .then((card) => {
      if (card) {
        res.status(HTTP_STATUS_OK).send(card);
      } else { throw new Error('DocumentNotFoundError'); }
    })
    .catch((err) => {
      if (err instanceof mongoose.Error.CastError) {
        next(new BadRequestError(`Некоректный id: ${req.params.cardId} карточки`));// 400
      } else if (err.message === 'DocumentNotFoundError') {
        next(new NotFoundError(`Карточка по указанному id: ${req.params.cardId} не найдена`));// 404
      } else {
        next(err);
      }
    });
};

module.exports.dislikeCard = (req, res, next) => {
  Card.findByIdAndUpdate(req.params.cardId, { $pull: { likes: req.user._id } }, { new: true })
    .populate(['owner', 'likes'])
    .then((card) => {
      if (card) {
        res.status(HTTP_STATUS_OK).send(card);
      } else { throw new Error('DocumentNotFoundError'); }
    })
    .catch((err) => {
      if (err instanceof mongoose.Error.CastError) {
        next(new BadRequestError(`Некоректный id: ${req.params.cardId} карточки`));// 400
      } else if (err.message === 'DocumentNotFoundError') {
        next(new NotFoundError(`Карточка по указанному id: ${req.params.cardId} не найдена`));// 404
      } else {
        next(err);
      }
    });
};
