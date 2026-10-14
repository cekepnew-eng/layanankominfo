const db = require('../config/database');

exports.getMyNotifications = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT n.*, t.status_id AS ticket_status_id, ts.name AS ticket_status_name, t.ticket_number 
       FROM notifications n 
       LEFT JOIN tickets t ON n.ticket_id = t.id 
       LEFT JOIN ticket_statuses ts ON t.status_id = ts.id 
       WHERE n.user_id = $1 
          OR n.user_id IN (
            SELECT id FROM users 
            WHERE (email IS NOT NULL AND email = (SELECT email FROM users WHERE id = $1))
               OR (nip IS NOT NULL AND nip = (SELECT nip FROM users WHERE id = $1))
          )
       ORDER BY n.created_at DESC
       LIMIT 30`, 
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
      'UPDATE notifications SET is_read = true WHERE id::text = $1',
      [id]
    );
    res.json({ success: true, message: 'Notification read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.readAllNotifications = async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = true 
       WHERE user_id = $1 
          OR user_id IN (
            SELECT id FROM users 
            WHERE (email IS NOT NULL AND email = (SELECT email FROM users WHERE id = $1))
               OR (nip IS NOT NULL AND nip = (SELECT nip FROM users WHERE id = $1))
          )`,
      [req.user.id]
    );
    res.json({ success: true, message: 'All notifications read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.readTicketNotifications = async (req, res) => {
  try {
    const { ticketId } = req.params;
    await db.query(
      `UPDATE notifications SET is_read = true 
       WHERE ticket_id::text = $1 
          OR ticket_id IN (SELECT id FROM tickets WHERE ticket_number ILIKE $1 OR id::text = $1)`,
      [ticketId]
    );
    res.json({ success: true, message: 'Ticket notifications read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
