const { Highlights, Users } = require('../../models');
const { authOrHandling, getThemes } = require('../hellpFunction');

module.exports = async (req, res) => {
  try {
    const { userId, themeId } = req.body;
    if (!userId || !themeId) {
      return res.status(400).end('Bad Request');
    }
    const tokenUserId = await authOrHandling(req, res, userId);
    if (!tokenUserId) return;

    const user = await Users.findOne({ where: { id: userId } });
    const pevThemes = getThemes(user.themeId);
    const themes = getThemes(themeId);

    for (let i = 0; i < 3; i++) {
      await Highlights.update(
        { colorHex: themes[i] },
        { where: { userId, colorHex: pevThemes[i] } }
      );
    }
    user.themeId = themeId;
    await user.save();
    return res.status(200).end('ok');
  } catch (err) {
    console.error(err);
    return res.status(500).end('Server Error');
  }
};
