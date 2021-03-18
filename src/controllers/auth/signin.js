const { Users } = require('../../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const redis = require('../../redis');
require('dotenv').config();

module.exports = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).end('Bad Request');
    }
    const user = await Users.findOne({ where: { email } });

    if (!user) {
      return res.status(404).end('Nonexistent User');
    }

    const judge = await bcrypt.compare(password, user.password);

    if (judge) {
      const secretKey = process.env.TOKEN_KEY;
      const acOptions = { expiresIn: '30m' };
      const rfOptions = { expiresIn: '14d' };

      const access_token = await jwt.sign(
        { id: user.id, email },
        secretKey,
        acOptions
      );
      const refresh_token = await jwt.sign(
        { id: user.id, refresh: true },
        secretKey,
        rfOptions
      );

      const userinfo = { id: user.id, name: user.name, email };

      await redis.set(refresh_token, JSON.stringify({ id: user.id, email }));
      await redis.expire(refresh_token, 8640 * 14);

      return res.status(200).json({
        userinfo,
        access_token,
        refresh_token,
      });
    } else {
      return res.status(404).end('Wrong Password');
    }
  } catch (err) {
    console.error(err);
    return res.status(500).end('Server Error');
  }
};
