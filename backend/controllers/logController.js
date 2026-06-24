const { ChatLog, User, ChatThread } = require('../models');

exports.getSearchLogs = async (req, res) => {
  try {
    const logs = await ChatLog.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: ChatThread,
          as: 'thread',
          attributes: ['id', 'title']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({ logs });
  } catch (error) {
    console.error('Error saat mengambil log pencarian:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan server saat mengambil log pencarian.' });
  }
};
