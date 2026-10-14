const db = require('../config/database');

exports.getMyNotifications = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT n.*, t.status_id AS ticket_status_id, ts.name AS ticket_status_name, t.ticket_number 
       FROM notifications n 
       LEFT JOIN tickets t ON n.ticket_id = t.id 
       LEFT JOIN ticket_statuses ts ON t.status_id = ts.id 
       WHERE n.user_id = $1 
       ORDER BY n.created_at DESC`, 
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.readNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    res.json({ success: true, message: 'Notification read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.readAllNotifications = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ success: true, message: 'All notifications read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
