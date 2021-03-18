const { Highlights, Pages } = require('../../models');
const { authOrHandling } = require('../hellpFunction');

module.exports = async (req, res) => {
  try {
    const { userId, pageUrl, pageId } = req.body;
    if (!userId || (!pageUrl && !pageId)) {
      return res.status(400).end('Bad Request');
    }
    const tokenUserId = await authOrHandling(req, res, userId);
    if (!tokenUserId) return;

    let page_id = pageId;
    if (!pageId) {
      const page = await Pages.findOne({ where: { pageUrl } });
      page_id = page.id;
    }

    const pageInHighlights = await Highlights.findAll({
      where: { pageId: page_id },
      offset: 0,
      limit: 100,
      order: [['updatedAt', 'DESC']], //내림차순 정렬 : 제일 최근의 수정된 것이 위로
      attributes: [
        ['id', 'highlightId'],
        'userId',
        'pageId',
        'colorHex',
        'text',
      ],
    });

    return res.status(200).json(pageInHighlights);
  } catch (err) {
    console.error(err);
    return res.status(500).end('Server Error');
  }
};
