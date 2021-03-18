const jwt = require('jsonwebtoken');
const redis = require('../../redis');
require('dotenv').config();

module.exports = async (req, res, userId) => {
  try {
    const access_token = req.headers.authorization;
    const blacklist_token = await redis.get(`blacklist_${access_token}`);
    if (blacklist_token || !access_token) {
      res.status(401).end('Unauthorized');
    } else {
      const secretKey = process.env.TOKEN_KEY;
      const userinfo = await jwt.verify(access_token, secretKey);
      if (userinfo.id === userId) {
        return userinfo.id;
      } else {
        res.status(401).end('Unauthorized');
      }
    }
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      res.status(419).json({
        code: 419,
        message: 'TokenExpiredError',
      });
    } else {
      console.log(err);
      res.status(500).end('Server Error');
    }
  }
};
