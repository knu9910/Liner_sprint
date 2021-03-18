const { Highlights } = require('../../models');
const { authOrHandling } = require('../hellpFunction');

module.exports = async (req, res) => {
  try {
    const { userId, highlightId } = req.body;
    if (!userId || !highlightId) {
      return res.status(400).end('Bad Request');
    }
    const tokenUserId = await authOrHandling(req, res, userId);
    if (!tokenUserId) return;

    await Highlights.destroy({
      where: {
        userId,
        id: highlightId,
      },
    });

    return res.status(200).end('ok');
  } catch (err) {
    console.error(err);
    return res.status(500).end('Server Error');
  }
};
