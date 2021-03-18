const { Highlights, Pages } = require('../../models');
const { authOrHandling } = require('../hellpFunction');

module.exports = async (req, res) => {
  try {
    const { userId, pageUrl, colorHex, text } = req.body;
    if (!userId || !pageUrl || !colorHex || !text) {
      return res.status(400).end('Bad Request');
    }
    const tokenUserId = await authOrHandling(req, res, userId);
    if (!tokenUserId) return;

    const [page] = await Pages.findOrCreate({
      where: { pageUrl },
    });

    const highlight = await Highlights.create({
      userId,
      pageUrl,
      colorHex,
      text,
      pageId: page.id,
    });

    return res.status(201).json({
      highlightId: highlight.id,
      userId,
      pageId: page.id,
      colorHex,
      text,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).end('Server Error');
  }
};
