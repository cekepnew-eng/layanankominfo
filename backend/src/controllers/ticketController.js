const db = require('../config/database');

const createHistory = async (client, ticketId, userId, oldStatusId, newStatusId, description) => {
  await client.query(`
    INSERT INTO ticket_histories (ticket_id, changed_by_user_id, old_status_id, new_status_id, log_description)
    VALUES ($1, $2, $3, $4, $5)
  `, [ticketId, userId, oldStatusId, newStatusId, description]);
};

const createNotification = async (client, userId, ticketId, type, title, message) => {
  await client.query(`
    INSERT INTO notifications (user_id, ticket_id, type, title, message)
    VALUES ($1, $2, $3, $4, $5)
  `, [userId, ticketId, type, title, message]);
};

// ==========================================
// USER API
// ==========================================
exports.createTicket = async (req, res) => {
  const { service_name, title, description, details, priority, service_id } = req.body;
  
  // Use details as form_data. If not present, default to empty object.
  const form_data = details || {};
  
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    
    // Check if user already has an active ticket
    const activeRes = await client.query(`
      SELECT id FROM tickets 
      WHERE user_id = $1 AND status_id < 7
    `, [req.user.id]);
    
    if (activeRes.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Anda masih memiliki tiket yang sedang aktif. Silakan selesaikan tiket sebelumnya terlebih dahulu.' });
    }
    
    let finalServiceId = service_id;
    if (!finalServiceId && service_name) {
      const svLookup = await client.query('SELECT id FROM services WHERE service_name = $1', [service_name]);
      if (svLookup.rows.length > 0) {
        finalServiceId = svLookup.rows[0].id;
      }
    }

    if (!finalServiceId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Layanan tidak ditemukan atau ID layanan tidak valid.' });
    }

    // Check if service needs verification
    const srvRes = await client.query('SELECT verification_type FROM services WHERE id = $1', [finalServiceId]);
    const needsVerification = srvRes.rows[0]?.verification_type === 'Wajib Verifikasi';
    const initialStatusId = needsVerification ? 1 : 2; // 1: PENDING, 2: VERIFIED

    // Generate Ticket Number
    const countRes = await client.query('SELECT COUNT(*) FROM tickets');
    const ticket_number = `REQ-${new Date().getFullYear()}-${(parseInt(countRes.rows[0].count) + 1).toString().padStart(4, '0')}`;

    // 1. Insert Ticket
    const ticketRes = await client.query(`
      INSERT INTO tickets (ticket_number, user_id, service_id, status_id, priority)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [ticket_number, req.user.id, finalServiceId, initialStatusId, priority || 'MEDIUM']);
    const ticketId = ticketRes.rows[0].id;

    // 2. Insert Ticket Details
    await client.query(`
      INSERT INTO ticket_details (ticket_id, title, description, form_data)
      VALUES ($1, $2, $3, $4)
    `, [ticketId, title, description, form_data]);

    // 3. Insert History
    await createHistory(client, ticketId, req.user.id, null, initialStatusId, 'Tiket berhasil dibuat oleh pemohon.');

    // 4. Notifications
    // Notify the user
    await createNotification(client, req.user.id, ticketId, 'INFO', 'Tiket Dibuat', `Tiket ${ticket_number} berhasil diajukan.`);
    
    // Notify Helpdesk
    const helpdesks = await client.query("SELECT u.id FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name='HELPDESK'");
    for (let hd of helpdesks.rows) {
      await createNotification(client, hd.id, ticketId, 'ACTION_REQUIRED', 'Tiket Baru', `Tiket baru ${ticket_number} menunggu verifikasi.`);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Ticket created', data: { ticket_id: ticketId, ticket_number } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error creating ticket' });
  } finally {
    client.release();
  }
};

exports.getMyTickets = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.id, t.ticket_number, t.progress, t.priority, t.created_at,
             s.service_name as service_name, st.name as status_name, td.form_data, td.title, td.description
      FROM tickets t
      JOIN services s ON t.service_id = s.id
      JOIN ticket_statuses st ON t.status_id = st.id
      LEFT JOIN ticket_details td ON td.ticket_id = t.id
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
    `, [req.user.id]);
    const mappedRows = result.rows.map(t => ({
      ...t,
      status: t.status_name === 'PENDING' ? 'Verifikasi' 
            : t.status_name === 'VERIFIED' ? 'Menunggu Validasi'
            : t.status_name === 'ASSIGNED' ? 'Diproses'
            : t.status_name === 'IN_PROGRESS' ? 'Diproses'
            : t.status_name === 'WAITING_USER_CONFIRMATION' ? 'Selesai'
            : t.status_name === 'COMPLETED' ? 'Selesai'
            : t.status_name
    }));
    res.json({ success: true, data: mappedRows, meta: { total: mappedRows.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.submitFeedback = async (req, res) => {
  const { id } = req.params; // ticket_id
  const { rating, comment } = req.body;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    
    // Verify ownership and status
    const tRes = await client.query('SELECT status_id FROM tickets WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (tRes.rows.length === 0) throw new Error('Ticket not found or unauthorized');
    if (tRes.rows[0].status_id !== 6) throw new Error('Ticket is not awaiting feedback'); // 6 = WAITING_USER_CONFIRMATION

    // Insert Feedback
    await client.query(`
      INSERT INTO ticket_feedback (ticket_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
    `, [id, req.user.id, rating, comment]);

    // Update Ticket Status to COMPLETED (7)
    await client.query('UPDATE tickets SET status_id = 7 WHERE id = $1', [id]);

    // History
    await createHistory(client, id, req.user.id, 6, 7, `Pemohon memberikan rating ${rating} Bintang. Pekerjaan Selesai.`);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Feedback submitted and ticket completed' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

// ==========================================
// HELPDESK API
// ==========================================
exports.getHelpdeskTickets = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.id, t.ticket_number, t.created_at, u.full_name as pemohon,
             s.service_name as service_name, st.name as status_name, td.form_data, td.title, td.description
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN services s ON t.service_id = s.id
      JOIN ticket_statuses st ON t.status_id = st.id
      LEFT JOIN ticket_details td ON td.ticket_id = t.id
      ORDER BY t.created_at DESC
    `);
    const mappedRows = result.rows.map(t => ({
      ...t,
      status: t.status_name === 'PENDING' ? 'Verifikasi' 
            : t.status_name === 'VERIFIED' ? 'Menunggu Validasi'
            : t.status_name === 'ASSIGNED' ? 'Diproses'
            : t.status_name === 'IN_PROGRESS' ? 'Diproses'
            : t.status_name === 'WAITING_USER_CONFIRMATION' ? 'Selesai'
            : t.status_name === 'COMPLETED' ? 'Selesai'
            : t.status_name
    }));
    res.json({ success: true, data: mappedRows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.verifyTicket = async (req, res) => {
  const { id } = req.params;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE tickets SET status_id = 2 WHERE id = $1', [id]); // 2: VERIFIED
    await createHistory(client, id, req.user.id, 1, 2, 'Tiket diverifikasi oleh Helpdesk.');
    
    // Notify User
    const tRes = await client.query('SELECT user_id FROM tickets WHERE id = $1', [id]);
    await createNotification(client, tRes.rows[0].user_id, id, 'INFO', 'Tiket Diverifikasi', 'Tiket Anda telah diverifikasi dan menunggu penugasan.');

    await client.query('COMMIT');
    res.json({ success: true, message: 'Ticket verified' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Error verifying ticket' });
  } finally {
    client.release();
  }
};

exports.assignTicket = async (req, res) => {
  const { id } = req.params;
  const { team_id, user_id } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE tickets SET status_id = 4 WHERE id = $1', [id]); // 4: ASSIGNED
    await client.query(`
      INSERT INTO ticket_assignments (ticket_id, team_id, assigned_to_user_id, assigned_by_user_id)
      VALUES ($1, $2, $3, $4)
    `, [id, team_id, user_id, req.user.id]);

    await createHistory(client, id, req.user.id, 2, 4, 'Tiket ditugaskan ke Tim Teknis.');
    
    // Notify Assigned Pegawai
    if (user_id) {
      await createNotification(client, user_id, id, 'ASSIGNMENT', 'Penugasan Baru', 'Anda ditugaskan mengerjakan tiket baru.');
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Ticket assigned' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Error assigning ticket' });
  } finally {
    client.release();
  }
};

// ==========================================
// EMPLOYEE API
// ==========================================
exports.getEmployeeTickets = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.id, t.ticket_number, t.progress, t.created_at, u.full_name as pemohon,
             s.service_name as service_name, st.name as status_name, td.form_data, td.title, td.description
      FROM tickets t
      JOIN ticket_assignments a ON a.ticket_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN services s ON t.service_id = s.id
      JOIN ticket_statuses st ON t.status_id = st.id
      LEFT JOIN ticket_details td ON td.ticket_id = t.id
      WHERE a.assigned_to_user_id = $1 OR a.team_id IN (SELECT team_id FROM team_members WHERE user_id = $1)
      ORDER BY t.created_at DESC
    `, [req.user.id]);
    const mappedRows = result.rows.map(t => ({
      ...t,
      status: t.status_name === 'PENDING' ? 'Verifikasi' 
            : t.status_name === 'VERIFIED' ? 'Menunggu Validasi'
            : t.status_name === 'ASSIGNED' ? 'Diproses'
            : t.status_name === 'IN_PROGRESS' ? 'Diproses'
            : t.status_name === 'WAITING_USER_CONFIRMATION' ? 'Menunggu Konfirmasi User'
            : t.status_name === 'COMPLETED' ? 'Selesai'
            : t.status_name
    }));
    res.json({ success: true, data: mappedRows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateProgress = async (req, res) => {
  const { id } = req.params;
  const { progress } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const oldRes = await client.query('SELECT progress, status_id FROM tickets WHERE id = $1', [id]);
    const oldStatus = oldRes.rows[0].status_id;
    let newStatus = oldStatus;

    if (oldStatus === 4) newStatus = 5; // IN_PROGRESS
    if (progress === 100) newStatus = 6; // WAITING_USER_CONFIRMATION

    await client.query('UPDATE tickets SET progress = $1, status_id = $2 WHERE id = $3', [progress, newStatus, id]);
    
    await createHistory(client, id, req.user.id, oldStatus, newStatus, `Update Pekerjaan: Progress menjadi ${progress}%`);

    if (progress === 100) {
      const tRes = await client.query('SELECT user_id FROM tickets WHERE id = $1', [id]);
      await createNotification(client, tRes.rows[0].user_id, id, 'INFO', 'Pekerjaan Selesai', 'Tiket Anda telah 100% dikerjakan. Silakan konfirmasi dan berikan rating.');
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Progress updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Error updating progress' });
  } finally {
    client.release();
  }
};

// ==========================================
// ADMIN API
// ==========================================
exports.getAdminTickets = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.id, t.ticket_number, t.progress, t.created_at, u.full_name as pemohon,
             s.service_name as service_name, st.name as status_name, td.form_data, td.title, td.description
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN services s ON t.service_id = s.id
      JOIN ticket_statuses st ON t.status_id = st.id
      LEFT JOIN ticket_details td ON td.ticket_id = t.id
      ORDER BY t.created_at DESC
    `);
    const mappedRows = result.rows.map(t => ({
      ...t,
      status: t.status_name === 'PENDING' ? 'Verifikasi' 
            : t.status_name === 'VERIFIED' ? 'Menunggu Validasi'
            : t.status_name === 'ASSIGNED' ? 'Diproses'
            : t.status_name === 'IN_PROGRESS' ? 'Diproses'
            : t.status_name === 'WAITING_USER_CONFIRMATION' ? 'Selesai'
            : t.status_name === 'COMPLETED' ? 'Selesai'
            : t.status_name
    }));
    res.json({ success: true, data: mappedRows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==========================================
// HISTORY & GENERAL
// ==========================================
exports.getHistory = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT h.*, u.full_name as user_name, os.name as old_status, ns.name as new_status
      FROM ticket_histories h
      JOIN users u ON h.changed_by_user_id = u.id
      LEFT JOIN ticket_statuses os ON h.old_status_id = os.id
      LEFT JOIN ticket_statuses ns ON h.new_status_id = ns.id
      WHERE h.ticket_id = $1
      ORDER BY h.created_at ASC
    `, [req.params.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
