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
      WHERE user_id = $1 AND status_id NOT IN (3, 7)
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
    const srvRes = await client.query('SELECT verification_type, default_team_id FROM services WHERE id = $1', [finalServiceId]);
    const needsVerification = srvRes.rows[0]?.verification_type === 'Wajib Verifikasi';
    const defaultTeamId = srvRes.rows[0]?.default_team_id;

    let initialStatusId = 1; // PENDING
    let isAutoAssigned = false;
    
    if (!needsVerification) {
      if (defaultTeamId) {
        initialStatusId = 4; // ASSIGNED directly to team
        isAutoAssigned = true;
      } else {
        initialStatusId = 2; // VERIFIED, waiting for manual assignment
      }
    }

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
    
    // 3. Auto Assign if applicable
    if (isAutoAssigned) {
      await client.query(`
        INSERT INTO ticket_assignments (ticket_id, team_id, assigned_by_user_id)
        VALUES ($1, $2, $3)
      `, [ticketId, defaultTeamId, req.user.id]);
    }

    // 4. Insert History
    let historyTextCreate = 'Tiket berhasil diajukan.';
    if (isAutoAssigned) {
      historyTextCreate = 'Tiket diajukan dan langsung ditugaskan.';
    } else if (initialStatusId === 2) {
      historyTextCreate = 'Tiket otomatis terverifikasi, menunggu penugasan.';
    }
    
    await createHistory(client, ticketId, req.user.id, null, initialStatusId, historyTextCreate);

    // 5. Notifications
    // Notify the user
    await createNotification(client, req.user.id, ticketId, 'INFO', 'Tiket Dibuat', `Tiket ${ticket_number} berhasil diajukan.`);

    // Notify Helpdesk if it needs helpdesk action
    if (!isAutoAssigned) {
      const helpdesks = await client.query("SELECT u.id FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name='HELPDESK'");
      for (let hd of helpdesks.rows) {
        await createNotification(client, hd.id, ticketId, 'ACTION_REQUIRED', 'Tiket Baru', `Tiket baru ${ticket_number} menunggu tindakan Anda.`);
      }
    } else {
      // Notify the Team members that a new ticket was assigned to their team
      const teamMembers = await client.query("SELECT user_id FROM team_members WHERE team_id = $1", [defaultTeamId]);
      for (let member of teamMembers.rows) {
        await createNotification(client, member.user_id, ticketId, 'ASSIGNMENT', 'Penugasan Tiket Baru (Otomatis)', `Tiket ${ticket_number} telah ditugaskan secara otomatis ke tim Anda.`);
      }
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
             u.full_name as pemohon, (CASE WHEN u.department IN ('Masyarakat Umum', 'TND', 'TND User', 'MASYARAKAT', 'Masyarakat') OR u.department IS NULL THEN u.full_name ELSE u.department END) as opd,
             s.service_name as service_name, st.name as status_name, s.required_docs as required_docs, td.form_data, td.title, td.description,
             tf.rating,
             (SELECT file_name FROM ticket_attachments WHERE ticket_id = t.id ORDER BY uploaded_at DESC LIMIT 1) as bast_file_name,
             (SELECT file_url FROM ticket_attachments WHERE ticket_id = t.id ORDER BY uploaded_at DESC LIMIT 1) as bast_file_url
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN services s ON t.service_id = s.id
      JOIN ticket_statuses st ON t.status_id = st.id
      LEFT JOIN ticket_details td ON td.ticket_id = t.id
      LEFT JOIN ticket_feedback tf ON tf.ticket_id = t.id
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
    `, [req.user.id]);
    const mappedRows = result.rows.map(t => ({
      ...t,
      status: t.status_name === 'PENDING' ? 'Verifikasi'
        : t.status_name === 'VERIFIED' ? 'Menunggu Validasi'
          : t.status_name === 'REJECTED' ? 'Pending'
          : t.status_name === 'ASSIGNED' ? 'Diproses'
            : t.status_name === 'IN_PROGRESS' ? 'Diproses'
              : t.status_name === 'WAITING_USER_CONFIRMATION' ? 'Selesai'
                : t.status_name === 'COMPLETED' ? 'Selesai'
                  : t.status_name
    }));
    res.json({ success: true, data: mappedRows, meta: { total: mappedRows.length } });
  } catch (err) {
    console.error('getMyTickets error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateTicketData = async (req, res) => {
  const { id } = req.params;
  const { form_data, logMessage, files, fileUrl } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    let actualTicketId = id;
    if (id && id.startsWith('REQ-')) {
      const tRes = await client.query('SELECT id FROM tickets WHERE ticket_number = $1', [id]);
      if (tRes.rows.length > 0) {
        actualTicketId = tRes.rows[0].id;
      } else {
        throw new Error('Ticket not found');
      }
    }

    // Update the form_data in ticket_details
    await client.query(`
      UPDATE ticket_details SET form_data = $1 WHERE ticket_id = $2
    `, [form_data, actualTicketId]);

    // Check if there was a previous assignment for this ticket
    const assignRes = await client.query(
      'SELECT team_id, assigned_to_user_id FROM ticket_assignments WHERE ticket_id = $1 ORDER BY created_at DESC LIMIT 1',
      [actualTicketId]
    );

    let newStatusId;
    let finalLogMessage;

    if (assignRes.rows.length > 0) {
      // Ticket was previously assigned to a team/pegawai - send directly back to ASSIGNED (4)
      // so it appears in the pegawai's dashboard immediately
      newStatusId = 4;
      finalLogMessage = logMessage || 'Formulir diperbarui. Diteruskan ke Tim Kerja.';
    } else {
      // No previous assignment - send to PENDING (1) for helpdesk verification
      newStatusId = 1;
      finalLogMessage = logMessage || 'Formulir diperbarui. Menunggu verifikasi ulang.';
    }

    // Update status and timestamp
    await client.query(`
      UPDATE tickets SET status_id = $1, updated_at = NOW() WHERE id = $2
    `, [newStatusId, actualTicketId]);

    // Insert history
    await createHistory(client, actualTicketId, req.user.id, 3, newStatusId, finalLogMessage);

    // Notify relevant parties
    if (assignRes.rows.length > 0 && assignRes.rows[0].assigned_to_user_id) {
      // Notify the previously assigned pegawai
      await createNotification(client, assignRes.rows[0].assigned_to_user_id, actualTicketId, 'INFO', 'Revisi Tiket', 'Pemohon telah merevisi pengajuan tiket. Tiket kembali ke tugas Anda.');
    }
    // Always notify Helpdesk
    const helpdesks = await client.query("SELECT u.id FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name='HELPDESK'");
    for (let hd of helpdesks.rows) {
      await createNotification(client, hd.id, actualTicketId, 'INFO', 'Revisi Tiket', `Pemohon telah merevisi pengajuan tiket.`);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Ticket updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('updateTicketData error:', err);
    res.status(500).json({ success: false, message: 'Server error updating ticket' });
  } finally {
    client.release();
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
    const historyText = `Tiket selesai. SKM: ${rating} bintang.` + (comment ? ` Ulasan: "${comment}"` : '');
    await createHistory(client, id, req.user.id, 6, 7, historyText);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Feedback submitted and ticket completed' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

exports.disputeTicket = async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      throw new Error('Alasan sanggah harus diisi.');
    }

    const ticketRes = await client.query('SELECT status_id, ticket_number, progress FROM tickets WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (ticketRes.rows.length === 0) {
      throw new Error('Tiket tidak ditemukan atau Anda tidak berhak.');
    }

    // Hanya bisa disanggah jika status WAITING_USER_CONFIRMATION (6)
    if (ticketRes.rows[0].status_id !== 6) {
      throw new Error('Tiket belum selesai atau sudah dinilai, tidak bisa disanggah.');
    }

    // Set kembali status ke IN_PROGRESS (5) dan kurangi progress ke 90%
    await client.query('UPDATE tickets SET status_id = 5, progress = 90 WHERE id = $1', [id]);

    const historyText = `Hasil disanggah: "${reason}". Dikembalikan ke Tim.`;
    await createHistory(client, id, req.user.id, null, 5, historyText);

    // Dapatkan tim yang bertugas untuk diberi notifikasi
    const assignRes = await client.query('SELECT team_id FROM ticket_assignments WHERE ticket_id = $1', [id]);
    if (assignRes.rows.length > 0) {
      const teamId = assignRes.rows[0].team_id;
      const teamMembers = await client.query("SELECT user_id FROM team_members WHERE team_id = $1", [teamId]);
      for (let member of teamMembers.rows) {
        await createNotification(client, member.user_id, id, 'ACTION_REQUIRED', 'Sanggahan Pemohon', `Tiket ${ticketRes.rows[0].ticket_number} disanggah oleh pemohon. Harap diperbaiki.`);
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Tiket berhasil disanggah dan dikembalikan ke Pegawai.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('disputeTicket error:', err);
    res.status(500).json({ success: false, message: err.message || 'Gagal menyanggah tiket.' });
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
      SELECT t.id, t.ticket_number, t.progress, t.created_at, u.full_name as pemohon, (CASE WHEN u.department IN ('Masyarakat Umum', 'TND', 'TND User', 'MASYARAKAT', 'Masyarakat') OR u.department IS NULL THEN u.full_name ELSE u.department END) as opd,
             s.service_name as service_name, st.name as status_name, s.required_docs as required_docs, td.form_data, td.title, td.description,
             tf.rating
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN services s ON t.service_id = s.id
      JOIN ticket_statuses st ON t.status_id = st.id
      LEFT JOIN ticket_details td ON td.ticket_id = t.id
      LEFT JOIN ticket_feedback tf ON tf.ticket_id = t.id
      ORDER BY t.created_at DESC
    `);
    const mappedRows = result.rows.map(t => ({
      ...t,
      status: t.status_name === 'PENDING' ? 'Verifikasi'
        : t.status_name === 'VERIFIED' ? 'Menunggu Validasi'
          : t.status_name === 'REJECTED' ? 'Pending'
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
    await createHistory(client, id, req.user.id, 1, 2, 'Diverifikasi. Menunggu penugasan tim.');

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

    await createHistory(client, id, req.user.id, 2, 4, 'Ditugaskan ke Tim Kerja.');

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
      SELECT DISTINCT ON (t.id) t.id, t.ticket_number, t.progress, t.created_at, u.full_name as pemohon, (CASE WHEN u.department IN ('Masyarakat Umum', 'TND', 'TND User', 'MASYARAKAT', 'Masyarakat') OR u.department IS NULL THEN u.full_name ELSE u.department END) as opd,
             s.service_name as service_name, st.name as status_name, s.required_docs as required_docs, td.form_data, td.title, td.description,
             tf.rating,
             (SELECT file_name FROM ticket_attachments WHERE ticket_id = t.id ORDER BY uploaded_at DESC LIMIT 1) as bast_file_name,
             (SELECT file_url FROM ticket_attachments WHERE ticket_id = t.id ORDER BY uploaded_at DESC LIMIT 1) as bast_file_url
      FROM tickets t
      JOIN ticket_assignments a ON a.ticket_id = t.id
      JOIN users u ON t.user_id = u.id
      JOIN services s ON t.service_id = s.id
      JOIN ticket_statuses st ON t.status_id = st.id
      LEFT JOIN ticket_details td ON td.ticket_id = t.id
      LEFT JOIN ticket_feedback tf ON tf.ticket_id = t.id
      WHERE a.assigned_to_user_id = $1 OR a.team_id IN (SELECT team_id FROM team_members WHERE user_id = $1)
      ORDER BY t.id, t.created_at DESC
    `, [req.user.id]);
    const mappedRows = result.rows.map(t => ({
      ...t,
      status: t.status_name === 'PENDING' ? 'Verifikasi'
        : t.status_name === 'VERIFIED' ? 'Menunggu Validasi'
          : t.status_name === 'REJECTED' ? 'Pending'
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
  const { progress, note, bastFileName, bastFileBase64, statusAction } = req.body;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const oldRes = await client.query('SELECT progress, status_id FROM tickets WHERE id = $1', [id]);
    const oldStatus = oldRes.rows[0].status_id;
    let newStatus = oldStatus;

    if (statusAction === 'REJECT') {
      newStatus = 3; // REJECTED (Return to User)
    } else {
      if (oldStatus === 4 || oldStatus === 3) newStatus = 5; // IN_PROGRESS
      if (progress === 100) newStatus = 6; // WAITING_USER_CONFIRMATION
    }

    await client.query('UPDATE tickets SET progress = $1, status_id = $2 WHERE id = $3', [progress, newStatus, id]);

    let finalNote = note;
    if (!finalNote && newStatus !== oldStatus) {
      if (newStatus === 5) finalNote = "Mulai dikerjakan oleh Tim.";
      if (newStatus === 6) finalNote = "Selesai dikerjakan. BAST siap.";
      if (newStatus === 3) finalNote = "Dikembalikan ke pemohon untuk revisi.";
    }

    if (finalNote) {
      await createHistory(client, id, req.user.id, oldStatus, newStatus, finalNote);
    }
    
    if (bastFileName) {
      // Ensure the table exists before inserting
      await client.query(`
        CREATE TABLE IF NOT EXISTS ticket_attachments (
          id SERIAL PRIMARY KEY,
          ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
          file_name VARCHAR(255),
          file_url TEXT,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      // Ensure file_url is TEXT (in case it was created as VARCHAR before)
      await client.query(`ALTER TABLE ticket_attachments ALTER COLUMN file_url TYPE TEXT;`);
      await client.query(`
        INSERT INTO ticket_attachments (ticket_id, file_name, file_url)
        VALUES ($1, $2, $3)
      `, [id, bastFileName, bastFileBase64 || '/bast_selesai.pdf']);
    }

    if (progress === 100) {
      const tRes = await client.query('SELECT user_id FROM tickets WHERE id = $1', [id]);
      await createNotification(client, tRes.rows[0].user_id, id, 'INFO', 'Pekerjaan Selesai', 'Tiket Anda telah 100% dikerjakan. Silakan konfirmasi dan berikan rating.');
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Progress updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating progress:', err);
    res.status(500).json({ success: false, message: 'Error updating progress: ' + err.message });
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
      SELECT t.id, t.ticket_number, t.progress, t.created_at, u.full_name as pemohon, (CASE WHEN u.department IN ('Masyarakat Umum', 'TND', 'TND User', 'MASYARAKAT', 'Masyarakat') OR u.department IS NULL THEN u.full_name ELSE u.department END) as opd,
             s.service_name as service_name, st.name as status_name, s.required_docs as required_docs, td.form_data, td.title, td.description,
             tf.rating,
             (SELECT file_name FROM ticket_attachments WHERE ticket_id = t.id ORDER BY uploaded_at DESC LIMIT 1) as bast_file_name,
             (SELECT file_url FROM ticket_attachments WHERE ticket_id = t.id ORDER BY uploaded_at DESC LIMIT 1) as bast_file_url
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN services s ON t.service_id = s.id
      JOIN ticket_statuses st ON t.status_id = st.id
      LEFT JOIN ticket_details td ON td.ticket_id = t.id
      LEFT JOIN ticket_feedback tf ON tf.ticket_id = t.id
      ORDER BY t.created_at DESC
    `);
    const mappedRows = result.rows.map(t => ({
      ...t,
      status: t.status_name === 'PENDING' ? 'Verifikasi'
        : t.status_name === 'VERIFIED' ? 'Menunggu Validasi'
          : t.status_name === 'REJECTED' ? 'Pending'
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
      SELECT h.*, u.full_name as user_name, r.name as user_role, os.name as old_status, ns.name as new_status
      FROM ticket_histories h
      JOIN users u ON h.changed_by_user_id = u.id
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      LEFT JOIN ticket_statuses os ON h.old_status_id = os.id
      LEFT JOIN ticket_statuses ns ON h.new_status_id = ns.id
      WHERE h.ticket_id = $1
      ORDER BY h.created_at ASC
    `, [req.params.id]);
    
    // Deduplicate by history log ID because a user can have multiple roles
    const uniqueLogsMap = new Map();
    
    for (const row of result.rows) {
      if (!uniqueLogsMap.has(row.id)) {
        uniqueLogsMap.set(row.id, row);
      } else {
        // If we already have this log, we can prioritize the role we want to show.
        // For instance, if the new row has 'HELPDESK' role, we might prefer that over 'USER'
        const existing = uniqueLogsMap.get(row.id);
        const priorities = { 'ADMIN': 4, 'HELPDESK': 3, 'PEGAWAI': 2, 'USER': 1, 'MASYARAKAT': 1 };
        const existingPriority = existing.user_role ? priorities[existing.user_role] || 0 : 0;
        const newPriority = row.user_role ? priorities[row.user_role] || 0 : 0;
        
        if (newPriority > existingPriority) {
          existing.user_role = row.user_role;
        }
      }
    }

    const formattedData = Array.from(uniqueLogsMap.values());

    res.json({ success: true, data: formattedData });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.rejectTicket = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    
    // Status 3 is Rejected/Pending/Revision
    const updateRes = await client.query('UPDATE tickets SET status_id = 3, updated_at = NOW() WHERE id = $1 RETURNING status_id', [id]);
    
    if (updateRes.rowCount === 0) throw new Error('Ticket not found');
    
    const userRoles = req.user.roles || [req.user.role];
    const isUser = userRoles.includes('USER') || userRoles.includes('MASYARAKAT');
    
    let finalNote = '';
    if (isUser) {
      finalNote = note 
        ? `Sanggahan: "${note}". Menunggu evaluasi Tim Kerja.`
        : `Sanggahan diajukan. Menunggu evaluasi Tim Kerja.`;
    } else {
      finalNote = note 
        ? `Ditangguhkan. Alasan: "${note}". Mohon revisi.` 
        : `Ditangguhkan. Mohon revisi.`;
    }
    
    await createHistory(client, id, req.user.id, null, 3, finalNote);
    
    // Assuming status 1 is the previous, though we don't know it. Passing null for old_status is handled by db if nullable.
    // Or we could fetch old status first:
    // const tRes = await client.query('SELECT status_id FROM tickets WHERE id = $1', [id]);
    // const oldStatus = tRes.rows[0].status_id;

    await client.query('COMMIT');
    res.json({ success: true, message: 'Ticket rejected' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

