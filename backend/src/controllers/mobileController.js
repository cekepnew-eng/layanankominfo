const db = require('../config/database');

const mapStatus = (statusName) => {
  const statuses = {
    PENDING: 'Verifikasi',
    VERIFIED: 'Menunggu Validasi',
    ASSIGNED: 'Diproses',
    IN_PROGRESS: 'Diproses',
    WAITING_USER_CONFIRMATION: 'Menunggu Konfirmasi User',
    COMPLETED: 'Selesai'
  };
  return statuses[statusName] || statusName;
};

exports.getSyncData = async (req, res) => {
  try {
    const rolesResult = await db.query(
      `SELECT r.name
       FROM roles r
       JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [req.user.id]
    );
    const roles = rolesResult.rows.map(row => String(row.name).toUpperCase());
    const isOpd = roles.includes('OPD') || roles.includes('PEGAWAI');

    const userResult = await db.query(
      `SELECT id, email, full_name as name, phone_number as phone, department
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const ticketQuery = isOpd
      ? `SELECT DISTINCT t.id, t.ticket_number, t.progress, t.created_at,
                u.full_name as pemohon, s.service_name, st.name as status_name,
                td.title, td.description, td.form_data
         FROM tickets t
         JOIN ticket_assignments a ON a.ticket_id = t.id
         JOIN users u ON u.id = t.user_id
         JOIN services s ON s.id = t.service_id
         JOIN ticket_statuses st ON st.id = t.status_id
         LEFT JOIN ticket_details td ON td.ticket_id = t.id
         WHERE a.assigned_to_user_id = $1
            OR a.team_id IN (SELECT team_id FROM team_members WHERE user_id = $1)
         ORDER BY t.created_at DESC`
      : `SELECT t.id, t.ticket_number, t.progress, t.created_at,
                s.service_name, st.name as status_name,
                td.title, td.description, td.form_data
         FROM tickets t
         JOIN services s ON s.id = t.service_id
         JOIN ticket_statuses st ON st.id = t.status_id
         LEFT JOIN ticket_details td ON td.ticket_id = t.id
         WHERE t.user_id = $1
         ORDER BY t.created_at DESC`;

    const [ticketsResult, notificationsResult] = await Promise.all([
      db.query(ticketQuery, [req.user.id]),
      db.query(
        `SELECT id, ticket_id, type, title, message, is_read, created_at
         FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
        [req.user.id]
      )
    ]);

    const tickets = ticketsResult.rows.map(ticket => ({
      ...ticket,
      status: mapStatus(ticket.status_name)
    }));

    res.json({
      success: true,
      data: {
        user: { ...userResult.rows[0], role: isOpd ? 'OPD' : 'MASYARAKAT', roles },
        tickets,
        notifications: notificationsResult.rows,
        meta: {
          totalTickets: tickets.length,
          unreadNotifications: notificationsResult.rows.filter(item => !item.is_read).length,
          syncedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Mobile sync error:', error);
    res.status(500).json({ success: false, message: 'Server error loading mobile data' });
  }
};