const { Users } = require('../../models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

module.exports = async (req, res) => {
  try {
    await Users.sync();
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).end('Bad Request');
    }

    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);

    const [user, created] = await Users.findOrCreate({
      where: { email },
      defaults: {
        name,
        password: hashPass,
      },
    });

    if (created && user) {
      return res.status(201).json({ userId: user.id, username: name, email });
    } else {
      return res.status(409).end('Already User');
    }
  } catch (err) {
    console.error(err);
    return res.status(500).end('Server Error');
  }
};
