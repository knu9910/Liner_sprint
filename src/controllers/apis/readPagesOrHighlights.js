const { Highlights, Pages } = require('../../models');
const { authOrHandling } = require('../hellpFunction');

module.exports = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).end('Bad Request');
    }
    const tokenUserId = await authOrHandling(req, res, userId);
    if (!tokenUserId) return;

    const PagesOrHighlights = await Pages.findAll({
      offset: 0,
      limit: 50,
      include: {
        model: Highlights,
        as: 'highlights',
        attributes: [
          ['id', 'highlightId'],
          'userId',
          'pageId',
          'colorHex',
          'text',
        ],
        where: { userId },
      },
      order: [['highlights', 'updatedAt', 'DESC']],
      attributes: [['id', 'pageId'], 'pageUrl'],
    });
    return res.status(200).json(PagesOrHighlights);
  } catch (err) {
    console.error(err);
    return res.status(500).end('Server Error');
  }
};
