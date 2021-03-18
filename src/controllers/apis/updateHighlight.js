const { Highlights } = require('../../models');
const { authOrHandling } = require('../hellpFunction');

module.exports = async (req, res) => {
  try {
    const { highlightId, userId, colorHex, text } = req.body;
    if (!userId || !highlightId || (!colorHex && !text)) {
      return res.status(400).end('Bad Request');
    }
    const tokenUserId = await authOrHandling(req, res, userId);
    if (!tokenUserId) return;

    const highlight = await Highlights.findOne({
      where: { userId, id: highlightId },
    });

    if (colorHex) highlight.colorHex = colorHex;
    if (text) highlight.text = text;
    await highlight.save();

    return res.status(201).json({
      highlightId: highlight.id,
      userId,
      pageId: highlight.id,
      colorHex: highlight.colorHex,
      text: highlight.text,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).end('Server Error');
  }
};
