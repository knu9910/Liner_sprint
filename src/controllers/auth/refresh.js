const jwt = require('jsonwebtoken');
require('dotenv').config();
const redis = require('../../redis');

module.exports = async (req, res) => {
  try {
    const refresh_token = req.headers.authorization;
    if (!refresh_token) {
      return res.status(400).end('Bad Request');
    }

    const blacklist_token = await redis.get(`blacklist_${refresh_token}`);

    if (blacklist_token) {
      return res.status(401).end('Unauthorized');
    }

    const secretKey = process.env.TOKEN_KEY;

    await jwt.verify(refresh_token, secretKey);

    const userinfo = JSON.parse(await redis.get(refresh_token));
    const access_token = await jwt.sign(userinfo, secretKey, {
      expiresIn: '30m',
    });

    return res.status(200).json({ access_token });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(419).json({
        code: 419,
        message: '토큰이 만료되었습니다',
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).end('Unauthorized');
    }
    console.error(err);
    return res.status(500).end('Server error');
  }
};
