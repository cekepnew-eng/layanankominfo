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
  const { service_name, title, description, details, priority, service_id, target_user_id } = req.body;

  // Use details as form_data. If not present, default to empty object.
  const form_data = details || {};

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Resolve user roles first
    let isHelpdeskOrAdmin = false;
    let isHelpdesk = false;
    try {
      const userRolesQuery = await client.query(`
        SELECT r.name FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1
      `, [req.user.id]);
      const roles = userRolesQuery.rows.map(row => row.name.toUpperCase());
      isHelpdesk = roles.includes('HELPDESK');
      isHelpdeskOrAdmin = isHelpdesk || roles.includes('ADMIN');
    } catch (e) {
      console.error('Role resolution error in createTicket:', e);
    }

    // 2. Check active ticket ONLY for standard users (USER / MASYARAKAT)
    // Helpdesk and Admin are authorized to create multiple tickets to assist applicants / citizens
    const isSubmittedByHelpdesk = Boolean(form_data.submitted_by_helpdesk === true || form_data.submitted_by_helpdesk === 'true');
    if (!isSubmittedByHelpdesk && !isHelpdeskOrAdmin) {
      const activeRes = await client.query(`
        SELECT t.id, t.ticket_number FROM tickets t
        LEFT JOIN ticket_details td ON td.ticket_id = t.id
        WHERE (
          t.user_id = $1 
          OR t.user_id IN (
            SELECT id FROM users 
            WHERE (email IS NOT NULL AND email = (SELECT email FROM users WHERE id = $1))
               OR (nip IS NOT NULL AND nip = (SELECT nip FROM users WHERE id = $1))
          )
        ) 
        AND t.status_id != 7
        AND (td.form_data->>'submitted_by_helpdesk' IS NULL OR td.form_data->>'submitted_by_helpdesk' != 'true')
        AND (td.form_data->>'Nama Pemohon' IS NULL OR td.form_data->>'Nama Pemohon' NOT ILIKE '%via Helpdesk%')
      `, [req.user.id]);

      if (activeRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: `Anda masih memiliki tiket permohonan yang belum selesai (${activeRes.rows[0].ticket_number || 'aktif'}). Harap selesaikan tiket sebelumnya terlebih dahulu sebelum mengajukan tiket baru.` 
        });
      }
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
    const rawVerifType = String(srvRes.rows[0]?.verification_type || '').trim().toLowerCase();
    const isAuto = rawVerifType === 'otomatis' || rawVerifType === 'auto' || rawVerifType === 'false';
    const needsVerification = !isAuto;
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
    } else {
      initialStatusId = 1; // PENDING: Menunggu verifikasi berkas
    }

    // Resolve final ticket owner (Target OPD user or Helpdesk)
    let finalTicketUserId = req.user.id;
    let targetOpdUser = null;

    if (isHelpdeskOrAdmin && target_user_id) {
      const opdLookup = await client.query(`
        SELECT id, full_name, email, nip, department FROM users WHERE id = $1
      `, [target_user_id]);

      if (opdLookup.rows.length > 0) {
        targetOpdUser = opdLookup.rows[0];
        finalTicketUserId = targetOpdUser.id;
      }
    }

    // Generate Ticket Number
    const countRes = await client.query('SELECT COUNT(*) FROM tickets');
    const ticket_number = `REQ-${new Date().getFullYear()}-${(parseInt(countRes.rows[0].count) + 1).toString().padStart(4, '0')}`;

    // 1. Insert Ticket
    const ticketRes = await client.query(`
      INSERT INTO tickets (ticket_number, user_id, service_id, status_id, priority)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [ticket_number, finalTicketUserId, finalServiceId, initialStatusId, priority || 'MEDIUM']);
    const ticketId = ticketRes.rows[0].id;

    // 2. Insert Ticket Details
    if (isSubmittedByHelpdesk) {
      form_data.submitted_by_helpdesk = true;
      form_data.helpdesk_user_id = req.user.id;
      if (targetOpdUser) {
        form_data.target_opd_user_id = targetOpdUser.id;
        form_data['Nama Pemohon'] = form_data['Nama Pemohon'] || targetOpdUser.full_name;
        form_data['Instansi / Asal Pemohon'] = form_data['Instansi / Asal Pemohon'] || targetOpdUser.department;
        if (targetOpdUser.email) form_data['Email Pemohon'] = targetOpdUser.email;
        if (targetOpdUser.nip) form_data['NIP'] = targetOpdUser.nip;
      } else {
        if (!form_data['Instansi / Asal Pemohon'] && form_data['Instansi']) {
          form_data['Instansi / Asal Pemohon'] = form_data['Instansi'];
        }
      }
    } else {
      delete form_data.submitted_by_helpdesk;
    }

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
      historyTextCreate = 'Tiket diajukan dan langsung ditugaskan ke tim teknis.';
    } else if (initialStatusId === 1) {
      if (isSubmittedByHelpdesk) {
        if (targetOpdUser) {
          historyTextCreate = `Tiket diajukan oleh Helpdesk untuk ${targetOpdUser.full_name} (${targetOpdUser.department || 'OPD'}). Menunggu proses verifikasi Helpdesk.`;
        } else {
          historyTextCreate = 'Tiket diajukan oleh Helpdesk untuk pemohon. Menunggu proses verifikasi Helpdesk.';
        }
      } else {
        historyTextCreate = 'Tiket berhasil diajukan. Menunggu verifikasi berkas oleh Helpdesk.';
      }
    } else if (initialStatusId === 2) {
      historyTextCreate = 'Tiket otomatis terverifikasi, menunggu penugasan.';
    }

    await createHistory(client, ticketId, req.user.id, null, initialStatusId, historyTextCreate);

    // 5. Notifications
    // Notify the creator
    await createNotification(client, req.user.id, ticketId, 'INFO', 'Tiket Dibuat', `Tiket ${ticket_number} berhasil diajukan.`);

    // If submitted by Helpdesk for an OPD user, also notify the OPD user!
    if (targetOpdUser && targetOpdUser.id !== req.user.id) {
      await createNotification(client, targetOpdUser.id, ticketId, 'INFO', 'Tiket Diajukan', `Tiket permohonan ${ticket_number} telah diajukan untuk akun Anda oleh Helpdesk.`);
    }

    // If it needs helpdesk action (status 1 PENDING or status 2 VERIFIED without auto-assign)
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
      SELECT t.id, t.ticket_number, t.service_id, t.progress, t.priority, t.created_at, t.status_id as status_id,
             COALESCE(NULLIF(td.form_data->>'Nama Pemohon', ''), u.full_name) as pemohon,
             (CASE 
               WHEN td.form_data->>'Instansi / Asal Pemohon' IS NOT NULL AND TRIM(td.form_data->>'Instansi / Asal Pemohon') != '' 
                 THEN td.form_data->>'Instansi / Asal Pemohon'
               WHEN td.form_data->>'Instansi' IS NOT NULL AND TRIM(td.form_data->>'Instansi') != '' 
                 THEN td.form_data->>'Instansi'
               WHEN u.department IS NOT NULL AND TRIM(u.department) != '' 
                 THEN u.department 
               ELSE 'Masyarakat Umum'
             END) as opd,
             s.service_name as service_name, s.target_sla as target_sla, st.name as status_name, s.required_docs as required_docs, s.verification_type as requires_helpdesk, td.form_data, td.title, td.description,
             tf.rating,
             (SELECT file_name FROM ticket_attachments WHERE ticket_id = t.id AND file_url IS NOT NULL AND TRIM(file_url) != '' AND file_url != '/bast_selesai.pdf' ORDER BY uploaded_at DESC LIMIT 1) as bast_file_name,
             (SELECT file_url FROM ticket_attachments WHERE ticket_id = t.id AND file_url IS NOT NULL AND TRIM(file_url) != '' AND file_url != '/bast_selesai.pdf' ORDER BY uploaded_at DESC LIMIT 1) as bast_file_url,
             (SELECT COALESCE(json_agg(json_build_object('id', sub.id, 'task_name', sub.task_name, 'assigned_to_name', su.full_name, 'status', sub.status)), '[]'::json) FROM subtasks sub LEFT JOIN users su ON sub.assigned_to = su.id WHERE sub.ticket_id = t.id) as subtasks
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      JOIN services s ON t.service_id = s.id
      JOIN ticket_statuses st ON t.status_id = st.id
      LEFT JOIN ticket_details td ON td.ticket_id = t.id
      LEFT JOIN ticket_feedback tf ON tf.ticket_id = t.id
      WHERE (
        -- 1. Tiket yang diajukan mandiri oleh user (bukan bantuan helpdesk untuk pihak lain)
        (
          (td.form_data->>'submitted_by_helpdesk' IS NULL OR (td.form_data->>'submitted_by_helpdesk' != 'true' AND td.form_data->>'submitted_by_helpdesk' != '1'))
          AND (td.form_data->>'Nama Pemohon' IS NULL OR td.form_data->>'Nama Pemohon' NOT ILIKE '%via Helpdesk%')
          AND (td.form_data->>'Instansi / Asal Pemohon' IS NULL OR td.form_data->>'Instansi / Asal Pemohon' NOT ILIKE '%Helpdesk%')
          AND (
            t.user_id = $1 
            OR t.user_id IN (
              SELECT id FROM users 
              WHERE (email IS NOT NULL AND email = (SELECT email FROM users WHERE id = $1))
                 OR (nip IS NOT NULL AND nip = (SELECT nip FROM users WHERE id = $1))
            )
          )
        )
        -- 2. ATAU tiket bantuan helpdesk yang memang ditujukan untuk akun user ini
        OR (
          (td.form_data->>'submitted_by_helpdesk' = 'true' OR td.form_data->>'submitted_by_helpdesk' = '1')
          AND (
            (t.user_id = $1 AND (td.form_data->>'helpdesk_user_id' IS NULL OR t.user_id != (td.form_data->>'helpdesk_user_id')::uuid))
            OR (td.form_data->>'Email Pemohon' IS NOT NULL AND td.form_data->>'Email Pemohon' = (SELECT email FROM users WHERE id = $1))
            OR (td.form_data->>'NIP' IS NOT NULL AND td.form_data->>'NIP' = (SELECT nip FROM users WHERE id = $1))
          )
        )
      )
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

    // Validasi kepemilikan tiket (IDOR Protection)
    const ticketOwnerRes = await client.query('SELECT user_id FROM tickets WHERE id = $1', [actualTicketId]);
    if (ticketOwnerRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan.' });
    }

    const ticketOwnerId = ticketOwnerRes.rows[0].user_id;
    const userRoles = (req.user.roles || [req.user.role] || []).map(r => String(r).toUpperCase());
    const isHelpdeskOrAdmin = userRoles.includes('HELPDESK') || userRoles.includes('ADMIN');

    if (ticketOwnerId !== req.user.id && !isHelpdeskOrAdmin) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Akses ditolak: Anda bukan pemilik tiket ini.' });
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

    // Reset rejected subtasks for re-evaluation
    await client.query(`
      UPDATE subtasks SET status = 'PENDING', notes = NULL 
      WHERE ticket_id = $1 AND status = 'REJECTED'
    `, [actualTicketId]);

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

exports.createSubtask = async (req, res) => {
  const { id } = req.params; // ticket_id
  const { task_name, assigned_to_name } = req.body;
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Find the assigned_to user id
    const userRes = await client.query('SELECT id FROM users WHERE full_name = $1', [assigned_to_name]);
    let assigned_to = null;
    if (userRes.rows.length > 0) assigned_to = userRes.rows[0].id;

    const result = await client.query(`
      INSERT INTO subtasks (ticket_id, assigned_to, task_name, status)
      VALUES ($1, $2, $3, 'PENDING')
      RETURNING *
    `, [id, assigned_to, task_name]);

    await client.query('COMMIT');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
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
    const tRes = await client.query(`
      SELECT t.status_id, t.user_id, td.form_data 
      FROM tickets t
      LEFT JOIN ticket_details td ON td.ticket_id = t.id
      WHERE t.id = $1
    `, [id]);
    if (tRes.rows.length === 0) throw new Error('Tiket tidak ditemukan.');
    if (tRes.rows[0].status_id !== 6) throw new Error('Tiket belum menunggu survei SKM / konfirmasi.'); // 6 = WAITING_USER_CONFIRMATION

    const ticketOwnerId = tRes.rows[0].user_id;

    // Check if caller is ticket owner OR Helpdesk/Admin
    const userRolesRes = await client.query(`
      SELECT r.name FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `, [req.user.id]);
    const userRoles = userRolesRes.rows.map(r => r.name.toUpperCase());
    const isHelpdeskOrAdmin = userRoles.includes('HELPDESK') || userRoles.includes('ADMIN');
    const isOwner = ticketOwnerId === req.user.id;

    if (!isOwner && !isHelpdeskOrAdmin) {
      throw new Error('Akses ditolak: Anda tidak memiliki wewenang untuk mengisi penilaian tiket ini.');
    }

    // Insert Feedback
    await client.query(`
      INSERT INTO ticket_feedback (ticket_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
    `, [id, req.user.id, rating, comment]);

    // Update Ticket Status to COMPLETED (7)
    await client.query('UPDATE tickets SET status_id = 7 WHERE id = $1', [id]);

    // History
    let historyText = `Tiket selesai. SKM: ${rating} bintang.` + (comment ? ` Ulasan: "${comment}"` : '');
    if (isHelpdeskOrAdmin && !isOwner) {
      historyText = `Tiket selesai. SKM diisi oleh Helpdesk/Petugas atas persetujuan pemohon (${rating} bintang).` + (comment ? ` Ulasan: "${comment}"` : '');
    }
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

    const ticketRes = await client.query(
      `SELECT t.id, t.status_id, t.ticket_number, t.progress, t.user_id 
       FROM tickets t 
       WHERE t.id = $1 
         AND (
           t.user_id = $2 
           OR EXISTS (
             SELECT 1 FROM users u 
             WHERE u.id = $2 
               AND (u.role_id = (SELECT id FROM roles WHERE name = 'ADMIN')
                    OR (u.email IS NOT NULL AND u.email = (SELECT email FROM users WHERE id = t.user_id))
                    OR (u.nip IS NOT NULL AND u.nip = (SELECT nip FROM users WHERE id = t.user_id)))
           )
         )`,
      [id, req.user.id]
    );
    if (ticketRes.rows.length === 0) {
      throw new Error('Tiket tidak ditemukan atau Anda tidak berhak menyanggah tiket ini.');
    }

    const currentStatus = Number(ticketRes.rows[0].status_id);
    // Tiket bisa disanggah jika dalam status selesai/menunggu konfirmasi (status 6 atau 7)
    if (currentStatus !== 6 && currentStatus !== 7) {
      throw new Error('Tiket belum selesai, tidak bisa disanggah.');
    }

    // Hapus ulasan/rating jika sudah ada agar tiket benar-benar kembali bersih ke status proses
    await client.query('DELETE FROM ticket_feedback WHERE ticket_id = $1', [id]);

    // Set kembali status ke IN_PROGRESS (5) dan kurangi progress ke 85%
    await client.query('UPDATE tickets SET status_id = 5, progress = 85, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

    const historyText = `Hasil disanggah: "${reason}". Tiket dialihkan kembali ke status Diproses untuk perbaikan oleh Tim Pelaksana.`;
    await createHistory(client, id, req.user.id, currentStatus, 5, historyText);

    // Dapatkan tim dan pegawai yang bertugas untuk diberi notifikasi agar langsung muncul di dashboard pegawai
    const assignRes = await client.query('SELECT team_id, assigned_to_user_id FROM ticket_assignments WHERE ticket_id = $1', [id]);
    if (assignRes.rows.length > 0) {
      const { team_id, assigned_to_user_id } = assignRes.rows[0];
      if (assigned_to_user_id) {
        await createNotification(client, assigned_to_user_id, id, 'ACTION_REQUIRED', 'Sanggahan Pemohon', `Tiket ${ticketRes.rows[0].ticket_number} disanggah oleh pemohon: "${reason}". Harap diperbaiki.`);
      }
      if (team_id) {
        const teamMembers = await client.query("SELECT user_id FROM team_members WHERE team_id = $1", [team_id]);
        for (let member of teamMembers.rows) {
          if (member.user_id !== assigned_to_user_id) {
            await createNotification(client, member.user_id, id, 'ACTION_REQUIRED', 'Sanggahan Pemohon', `Tiket ${ticketRes.rows[0].ticket_number} disanggah oleh pemohon: "${reason}". Harap diperbaiki.`);
          }
        }
      }
    }

    // Beri notifikasi ke Helpdesk
    const helpdesks = await client.query("SELECT u.id FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name='HELPDESK'");
    for (let hd of helpdesks.rows) {
      await createNotification(client, hd.id, id, 'ACTION_REQUIRED', 'Sanggahan Pemohon', `Tiket ${ticketRes.rows[0].ticket_number} disanggah oleh pemohon.`);
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Tiket berhasil disanggah dan dialihkan kembali ke status Diproses.' });
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
      SELECT t.id, t.ticket_number, t.service_id, t.progress, t.created_at, t.status_id as status_id,
             COALESCE(NULLIF(td.form_data->>'Nama Pemohon', ''), u.full_name) as pemohon, 
             (CASE 
               WHEN td.form_data->>'Instansi / Asal Pemohon' IS NOT NULL AND TRIM(td.form_data->>'Instansi / Asal Pemohon') != '' 
                 THEN td.form_data->>'Instansi / Asal Pemohon'
               WHEN td.form_data->>'Instansi' IS NOT NULL AND TRIM(td.form_data->>'Instansi') != '' 
                 THEN td.form_data->>'Instansi'
               WHEN u.department IS NOT NULL AND TRIM(u.department) != '' 
                 THEN u.department 
               ELSE 'Masyarakat Umum'
             END) as opd,
             s.service_name as service_name, s.target_sla as target_sla, st.name as status_name, s.required_docs as required_docs, s.verification_type as requires_helpdesk, td.form_data, td.title, td.description,
             tf.rating,
             (SELECT file_name FROM ticket_attachments WHERE ticket_id = t.id AND file_url IS NOT NULL AND TRIM(file_url) != '' AND file_url != '/bast_selesai.pdf' ORDER BY uploaded_at DESC LIMIT 1) as bast_file_name,
             (SELECT file_url FROM ticket_attachments WHERE ticket_id = t.id AND file_url IS NOT NULL AND TRIM(file_url) != '' AND file_url != '/bast_selesai.pdf' ORDER BY uploaded_at DESC LIMIT 1) as bast_file_url,
             (SELECT COALESCE(json_agg(json_build_object('id', sub.id, 'task_name', sub.task_name, 'assigned_to_name', su.full_name, 'status', sub.status)), '[]'::json) FROM subtasks sub LEFT JOIN users su ON sub.assigned_to = su.id WHERE sub.ticket_id = t.id) as subtasks
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
    const curRes = await client.query('SELECT status_id, user_id, ticket_number FROM tickets WHERE id = $1', [id]);
    if (curRes.rows.length === 0) throw new Error('Ticket not found');
    const oldStatus = curRes.rows[0].status_id;
    const ticketOwnerId = curRes.rows[0].user_id;
    const ticketNumber = curRes.rows[0].ticket_number;

    await client.query('UPDATE tickets SET status_id = 2, updated_at = NOW() WHERE id = $1', [id]); // 2: VERIFIED
    await createHistory(client, id, req.user.id, oldStatus, 2, 'Diverifikasi oleh Helpdesk. Berkas dinyatakan lengkap dan valid. Menunggu penugasan tim kerja.');

    // Notify User
    await createNotification(client, ticketOwnerId, id, 'INFO', 'Tiket Diverifikasi', `Tiket ${ticketNumber} telah diverifikasi oleh Helpdesk dan menunggu penugasan.`);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Ticket verified' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Error verifying ticket: ' + err.message });
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
    const curRes = await client.query('SELECT status_id, user_id, ticket_number FROM tickets WHERE id = $1', [id]);
    if (curRes.rows.length === 0) throw new Error('Ticket not found');
    const oldStatus = curRes.rows[0].status_id;

    await client.query('UPDATE tickets SET status_id = 4, updated_at = NOW() WHERE id = $1', [id]); // 4: ASSIGNED
    await client.query(`
      INSERT INTO ticket_assignments (ticket_id, team_id, assigned_to_user_id, assigned_by_user_id)
      VALUES ($1, $2, $3, $4)
    `, [id, team_id, user_id, req.user.id]);

    let teamName = '';
    if (team_id) {
      const tmRes = await client.query('SELECT team_name FROM teams WHERE id = $1', [team_id]);
      if (tmRes.rows.length > 0) teamName = tmRes.rows[0].team_name;
    }

    let assignedPegawaiName = '';
    if (user_id) {
      const uRes = await client.query('SELECT full_name FROM users WHERE id = $1', [user_id]);
      if (uRes.rows.length > 0) assignedPegawaiName = uRes.rows[0].full_name;
    }

    const assignLog = teamName 
      ? `Ditugaskan ke Tim Kerja ${teamName}${assignedPegawaiName ? ' (' + assignedPegawaiName + ')' : ''}.`
      : 'Ditugaskan ke Tim Kerja.';

    await createHistory(client, id, req.user.id, oldStatus, 4, assignLog);

    // Notify Assigned Pegawai
    if (user_id) {
      await createNotification(client, user_id, id, 'ASSIGNMENT', 'Penugasan Baru', 'Anda ditugaskan mengerjakan tiket baru.');
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Ticket assigned' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Error assigning ticket: ' + err.message });
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
      SELECT DISTINCT ON (t.id) t.id, t.ticket_number, t.service_id, t.progress, t.created_at, t.status_id as status_id,
             tm.team_name as team, tm.team_name as team_name, 
             COALESCE(NULLIF(td.form_data->>'Nama Pemohon', ''), u.full_name) as pemohon, 
             (CASE 
               WHEN td.form_data->>'Instansi / Asal Pemohon' IS NOT NULL AND TRIM(td.form_data->>'Instansi / Asal Pemohon') != '' 
                 THEN td.form_data->>'Instansi / Asal Pemohon'
               WHEN td.form_data->>'Instansi' IS NOT NULL AND TRIM(td.form_data->>'Instansi') != '' 
                 THEN td.form_data->>'Instansi'
               WHEN u.department IS NOT NULL AND TRIM(u.department) != '' 
                 THEN u.department 
               ELSE 'Masyarakat Umum'
             END) as opd,
             s.service_name as service_name, s.target_sla as target_sla, st.name as status_name, s.required_docs as required_docs, s.verification_type as requires_helpdesk, td.form_data, td.title, td.description,
             tf.rating,
             (SELECT file_name FROM ticket_attachments WHERE ticket_id = t.id AND file_url IS NOT NULL AND TRIM(file_url) != '' AND file_url != '/bast_selesai.pdf' ORDER BY uploaded_at DESC LIMIT 1) as bast_file_name,
             (SELECT file_url FROM ticket_attachments WHERE ticket_id = t.id AND file_url IS NOT NULL AND TRIM(file_url) != '' AND file_url != '/bast_selesai.pdf' ORDER BY uploaded_at DESC LIMIT 1) as bast_file_url,
             (SELECT COALESCE(json_agg(json_build_object('id', sub.id, 'task_name', sub.task_name, 'assigned_to_name', su.full_name, 'status', sub.status)), '[]'::json) FROM subtasks sub LEFT JOIN users su ON sub.assigned_to = su.id WHERE sub.ticket_id = t.id) as subtasks
      FROM tickets t
      JOIN ticket_assignments a ON a.ticket_id = t.id
      LEFT JOIN teams tm ON a.team_id = tm.id
      JOIN users u ON t.user_id = u.id
      JOIN services s ON t.service_id = s.id
      JOIN ticket_statuses st ON t.status_id = st.id
      LEFT JOIN ticket_details td ON td.ticket_id = t.id
      LEFT JOIN ticket_feedback tf ON tf.ticket_id = t.id
      WHERE (
        a.assigned_to_user_id = $1 
        OR a.assigned_to_user_id IN (
          SELECT id FROM users 
          WHERE (email IS NOT NULL AND email = (SELECT email FROM users WHERE id = $1))
             OR (nip IS NOT NULL AND nip = (SELECT nip FROM users WHERE id = $1))
        )
        OR a.team_id IN (
          SELECT team_id FROM team_members 
          WHERE user_id = $1 
             OR user_id IN (SELECT id FROM users WHERE (email IS NOT NULL AND email = (SELECT email FROM users WHERE id = $1)) OR (nip IS NOT NULL AND nip = (SELECT nip FROM users WHERE id = $1)))
        )
        OR a.team_id IN (
          SELECT team_id FROM users 
          WHERE id = $1 
             OR (email IS NOT NULL AND email = (SELECT email FROM users WHERE id = $1))
             OR (nip IS NOT NULL AND nip = (SELECT nip FROM users WHERE id = $1))
        )
        OR t.id IN (
          SELECT ticket_id FROM subtasks 
          WHERE assigned_to = $1 
             OR assigned_to IN (SELECT id FROM users WHERE (email IS NOT NULL AND email = (SELECT email FROM users WHERE id = $1)) OR (nip IS NOT NULL AND nip = (SELECT nip FROM users WHERE id = $1)))
        )
      )
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

    const numProgress = parseInt(progress, 10);
    if (statusAction === 'REJECT') {
      newStatus = 3; // REJECTED (Return to User)
    } else {
      if (oldStatus === 4 || oldStatus === 3) newStatus = 5; // IN_PROGRESS
      if (numProgress === 100) newStatus = 6; // WAITING_USER_CONFIRMATION
    }

    await client.query('UPDATE tickets SET progress = $1, status_id = $2 WHERE id = $3', [numProgress, newStatus, id]);

    const hasBast = Boolean(bastFileName && bastFileBase64 && bastFileBase64.trim() !== '' && bastFileBase64 !== '/bast_selesai.pdf');
    let finalNote = note;
    if (!finalNote && newStatus !== oldStatus) {
      if (newStatus === 5) finalNote = "Mulai dikerjakan oleh Tim.";
      if (newStatus === 6) finalNote = hasBast ? "Selesai dikerjakan. Dokumen BAST siap." : "Selesai dikerjakan.";
      if (newStatus === 3) finalNote = "Dikembalikan ke pemohon untuk revisi.";
    }

    if (!hasBast && finalNote) {
      finalNote = finalNote.replace(/Selesai dikerjakan\.\s*BAST siap\.?/gi, 'Selesai dikerjakan.');
      finalNote = finalNote.replace(/\.?\s*BAST siap\.?/gi, '');
    }

    if (finalNote) {
      await createHistory(client, id, req.user.id, oldStatus, newStatus, finalNote);
    }

    if (bastFileName && bastFileBase64 && bastFileBase64.trim() !== '' && bastFileBase64 !== '/bast_selesai.pdf') {
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
      `, [id, bastFileName, bastFileBase64]);
    }

    if (numProgress === 100) {
      const tRes = await client.query('SELECT user_id, ticket_number FROM tickets WHERE id = $1', [id]);
      if (tRes.rows.length > 0) {
        await createNotification(client, tRes.rows[0].user_id, id, 'INFO', 'Pekerjaan Selesai', `Tiket ${tRes.rows[0].ticket_number} telah 100% dikerjakan. Silakan konfirmasi dan berikan rating.`);
      }
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
      SELECT t.id, t.ticket_number, t.service_id, t.progress, t.created_at, t.status_id as status_id,
             COALESCE(NULLIF(td.form_data->>'Nama Pemohon', ''), u.full_name) as pemohon, 
             (CASE 
               WHEN td.form_data->>'Instansi / Asal Pemohon' IS NOT NULL AND TRIM(td.form_data->>'Instansi / Asal Pemohon') != '' 
                 THEN td.form_data->>'Instansi / Asal Pemohon'
               WHEN td.form_data->>'Instansi' IS NOT NULL AND TRIM(td.form_data->>'Instansi') != '' 
                 THEN td.form_data->>'Instansi'
               WHEN u.department IS NOT NULL AND TRIM(u.department) != '' 
                 THEN u.department 
               ELSE 'Masyarakat Umum'
             END) as opd,
             s.service_name as service_name, s.target_sla as target_sla, st.name as status_name, s.required_docs as required_docs, s.verification_type as requires_helpdesk, td.form_data, td.title, td.description,
             tf.rating,
             (SELECT file_name FROM ticket_attachments WHERE ticket_id = t.id AND file_url IS NOT NULL AND TRIM(file_url) != '' AND file_url != '/bast_selesai.pdf' ORDER BY uploaded_at DESC LIMIT 1) as bast_file_name,
             (SELECT file_url FROM ticket_attachments WHERE ticket_id = t.id AND file_url IS NOT NULL AND TRIM(file_url) != '' AND file_url != '/bast_selesai.pdf' ORDER BY uploaded_at DESC LIMIT 1) as bast_file_url,
             (SELECT COALESCE(json_agg(json_build_object('id', sub.id, 'task_name', sub.task_name, 'assigned_to_name', su.full_name, 'status', sub.status)), '[]'::json) FROM subtasks sub LEFT JOIN users su ON sub.assigned_to = su.id WHERE sub.ticket_id = t.id) as subtasks
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

    const attachRes = await db.query(
      `SELECT id FROM ticket_attachments WHERE ticket_id = $1 AND file_url IS NOT NULL AND TRIM(file_url) != '' AND file_url != '/bast_selesai.pdf' LIMIT 1`,
      [req.params.id]
    );
    const hasBast = attachRes.rows.length > 0;

    const formattedData = Array.from(uniqueLogsMap.values()).map(log => {
      let desc = log.log_description || '';
      if (!hasBast) {
        desc = desc.replace(/Selesai dikerjakan\.\s*BAST siap\.?/gi, 'Selesai dikerjakan.');
        desc = desc.replace(/\.?\s*Berkas dokumen Berita Acara Serah Terima \(BAST\) telah siap untuk diunduh dan dikonfirmasi\.?/gi, '');
        desc = desc.replace(/\.?\s*BAST siap\.?/gi, '');
      }

      let detectedRole = log.user_role;
      const lowerDesc = desc.toLowerCase();
      if (
        lowerDesc.includes('skm') ||
        lowerDesc.includes('bintang') ||
        lowerDesc.includes('ulasan') ||
        lowerDesc.includes('rating') ||
        lowerDesc.includes('disanggah') ||
        lowerDesc.includes('sanggahan') ||
        (lowerDesc.includes('diajukan') && !lowerDesc.includes('helpdesk'))
      ) {
        detectedRole = 'USER';
      } else if (
        lowerDesc.includes('helpdesk') || 
        lowerDesc.includes('diverifikasi') || 
        lowerDesc.includes('ditugaskan ke tim') || 
        lowerDesc.includes('penugasan tim') ||
        lowerDesc.includes('ditangguhkan')
      ) {
        detectedRole = 'HELPDESK';
      } else if (
        lowerDesc.includes('mulai') ||
        lowerDesc.includes('pengerjaan') ||
        lowerDesc.includes('teknis') ||
        lowerDesc.includes('selesai dikerjakan') ||
        lowerDesc.includes('progress') ||
        lowerDesc.includes('bast')
      ) {
        detectedRole = 'PEGAWAI';
      }

      return {
        ...log,
        user_role: detectedRole,
        log_description: desc
      };
    });

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

    const curRes = await client.query('SELECT status_id, user_id, ticket_number FROM tickets WHERE id = $1', [id]);
    if (curRes.rows.length === 0) throw new Error('Ticket not found');
    const oldStatus = curRes.rows[0].status_id;
    const ticketOwnerId = curRes.rows[0].user_id;
    const ticketNumber = curRes.rows[0].ticket_number;

    // Status 3 is Rejected/Pending/Revision
    await client.query('UPDATE tickets SET status_id = 3, updated_at = NOW() WHERE id = $1', [id]);

    const activeRole = String(req.user.role || '').toUpperCase();
    const isPetugas = activeRole === 'HELPDESK' || activeRole === 'PEGAWAI' || activeRole === 'ADMIN';

    let finalNote = '';
    if (isPetugas) {
      finalNote = note
        ? `Verifikasi berkas ditangguhkan oleh Helpdesk. Catatan: "${note}". Mohon revisi berkas.`
        : `Verifikasi berkas ditangguhkan oleh Helpdesk. Mohon periksa dan lengkapi berkas permohonan.`;
    } else {
      finalNote = note
        ? `Sanggahan: "${note}". Menunggu evaluasi Tim Kerja.`
        : `Sanggahan diajukan. Menunggu evaluasi Tim Kerja.`;
    }

    await createHistory(client, id, req.user.id, oldStatus, 3, finalNote);

    await createNotification(
      client, 
      ticketOwnerId, 
      id, 
      'ACTION_REQUIRED', 
      'Verifikasi Ditangguhkan', 
      `Tiket ${ticketNumber} membutuhkan revisi berkas. Alasan: ${note || 'Berkas belum lengkap/sesuai'}.`
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Ticket rejected' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

exports.updateSubtaskStatus = async (req, res) => {
  const { id, subtaskId } = req.params;
  const { status, comment } = req.body;
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query(`
      UPDATE subtasks SET status = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND ticket_id = $4
    `, [status, comment, subtaskId, id]);

    if (status === 'REJECTED') {
      await client.query('UPDATE tickets SET status_id = 3, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
      const historyText = `Dokumen ditolak oleh evaluator. Alasan: "${comment || 'Tidak Sesuai'}". Menunggu revisi pemohon.`;
      await createHistory(client, id, req.user.id, null, 3, historyText);

      
      const tRes = await client.query('SELECT user_id FROM tickets WHERE id = $1', [id]);
      await createNotification(client, tRes.rows[0].user_id, id, 'ACTION_REQUIRED', 'Dokumen Ditolak', 'Salah satu dokumen Anda ditolak dan memerlukan revisi.');
    }
    
    await client.query('COMMIT');
    res.json({ success: true, message: 'Subtask updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};

