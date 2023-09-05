const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) { res.status(HTTP_STATUS_UNAUTHORIZED).send(); }
  if (err instanceof mongoose.Error.UnauthorizedError) {
    next(new UnauthorizedError('Необходима авторизация')); // 401
    return;
  } else {
    next(err);
  }

  const token = authorization.replace('Bearer ', '');
  let payload;

  try {
    payload = jwt.verify(token, 'some-secret-key');
  } catch (err) {
    if (err instanceof mongoose.Error.UnauthorizedError) {
      next(new UnauthorizedError('Необходима авторизация')); // 401
      return;
    } else {
      next(err);
    }
  }

  req.user = payload; // записываем пейлоуд в объект запроса

  next(); // пропускаем запрос дальше
  return undefined;
};
