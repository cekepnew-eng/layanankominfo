const db = require('../config/database');

// -----------------------------------------
// PUBLIC API (For Users creating tickets)
// -----------------------------------------
exports.getPublicServices = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const catsRes = await db.query('SELECT id, category_name as name FROM service_categories ORDER BY id ASC');
    const servicesRes = await db.query(`
      SELECT s.*, s.service_name as name, c.category_name as category
      FROM services s
      JOIN service_categories c ON s.category_id = c.id
    `);
    
    // Get requirements for each service
    const reqsRes = await db.query('SELECT * FROM service_requirements');
    
    const services = servicesRes.rows.map(s => {
      s.requirements = reqsRes.rows.filter(r => r.service_id === s.id);
      return s;
    });

    // Real ticket stats matching the admin dashboard exactly
    let stats = {
      totalSubServices: services.length,
      totalCategories: catsRes.rows.length,
      totalTickets: null,
      slaCompliance: null,
      topCategories: null,
      avgRating: null
    };

    try {
      const ticketsRes = await db.query(`
        SELECT t.id, t.progress, st.name as status_name, s.service_name, c.category_name
        FROM tickets t
        LEFT JOIN services s ON t.service_id = s.id
        LEFT JOIN service_categories c ON s.category_id = c.id
        LEFT JOIN ticket_statuses st ON t.status_id = st.id
      `);

      const allTickets = ticketsRes.rows;
      const completedOrWaiting = allTickets.filter(t => t.status_name === 'COMPLETED' || t.status_name === 'WAITING_USER_CONFIRMATION');
      const inSlaTickets = completedOrWaiting.filter(t => t.progress === 100);
      const slaCompliancePct = completedOrWaiting.length > 0
        ? ((inSlaTickets.length / completedOrWaiting.length) * 100).toFixed(1) + '%'
        : null;

      const categoryCountsMap = {};
      catsRes.rows.forEach(c => { categoryCountsMap[c.name] = 0; });
      allTickets.forEach(t => {
        const cat = t.category_name || 'Lain-lain';
        if (categoryCountsMap[cat] !== undefined) {
          categoryCountsMap[cat]++;
        } else {
          categoryCountsMap[cat] = 1;
        }
      });

      const categoryCounts = Object.entries(categoryCountsMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      const ratingsRes = await db.query('SELECT rating FROM ticket_feedback');
      const allRatings = ratingsRes.rows.map(r => r.rating).filter(Boolean);
      const avgRating = allRatings.length > 0
        ? (allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length).toFixed(2)
        : '5.00';

      stats = {
        totalSubServices: services.length,
        totalCategories: catsRes.rows.length,
        totalTickets: allTickets.length,
        slaCompliance: slaCompliancePct,
        topCategories: categoryCounts.slice(0, 3),
        avgRating
      };
    } catch (statsErr) {
      console.error('Error fetching public stats:', statsErr.message);
    }

    res.json({ success: true, data: services, categories: catsRes.rows, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching services' });
  }
};

// -----------------------------------------
// ADMIN API: Categories
// -----------------------------------------
exports.getCategories = async (req, res) => {
  try {
    const cats = await db.query('SELECT id, category_name as name FROM service_categories ORDER BY id ASC');
    res.json({ success: true, data: cats.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const result = await db.query('INSERT INTO service_categories (category_name) VALUES ($1) RETURNING id, category_name as name', [name]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await db.query('UPDATE service_categories SET category_name = $1 WHERE id = $2 RETURNING id, category_name as name', [name, id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM service_categories WHERE id = $1', [id]);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// -----------------------------------------
// ADMIN API: Services
// -----------------------------------------
exports.getAdminServices = async (req, res) => {
  try {
    const servicesRes = await db.query(`
      SELECT s.*, s.service_name as name, s.status = 'Aktif' as is_active, 
             c.category_name as category_name, t.team_name as default_team_name
      FROM services s
      JOIN service_categories c ON s.category_id = c.id
      LEFT JOIN teams t ON s.default_team_id = t.id
      ORDER BY s.id ASC
    `);
    
    let reqsRes = { rows: [] };
    try {
      reqsRes = await db.query('SELECT * FROM service_requirements');
    } catch (e) {
      console.warn('service_requirements table might be missing', e.message);
    }
    
    const services = servicesRes.rows.map(s => {
      s.requirements = reqsRes.rows.filter(r => r.service_id === s.id);
      return s;
    });

    res.json({ success: true, data: services });
  } catch (err) {
    console.error('getAdminServices error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

exports.createService = async (req, res) => {
  const { category_name, category_id, name, target_sla, verification_type, sop_link, status, form_schema, required_docs, default_team_id } = req.body;
  try {
    let finalCatId = category_id;
    if (!finalCatId && category_name) {
      const catRes = await db.query('SELECT id FROM service_categories WHERE category_name = $1', [category_name]);
      if (catRes.rows.length > 0) finalCatId = catRes.rows[0].id;
    }
    if (!finalCatId) {
      const catRes = await db.query('SELECT id FROM service_categories LIMIT 1');
      finalCatId = catRes.rows[0]?.id || 1;
    }
    const finalDefTeam = verification_type === 'Otomatis' && default_team_id ? parseInt(default_team_id, 10) : null;
    const result = await db.query(`
      INSERT INTO services (category_id, service_name, target_sla, verification_type, sop_link, status, form_schema, required_docs, default_team_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, [finalCatId, name, target_sla || '7 Hari', verification_type || 'Wajib Verifikasi', sop_link || null, status || 'Aktif', JSON.stringify(form_schema || []), required_docs || '', finalDefTeam]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

exports.updateService = async (req, res) => {
  const { id } = req.params;
  const { category_name, category_id, name, target_sla, verification_type, sop_link, status, form_schema, required_docs, default_team_id, is_active } = req.body;
  try {
    let finalCatId = category_id;
    if (!finalCatId && category_name) {
      const catRes = await db.query('SELECT id FROM service_categories WHERE category_name = $1', [category_name]);
      if (catRes.rows.length > 0) finalCatId = catRes.rows[0].id;
    }
    const finalStatus = status || (is_active ? 'Aktif' : 'Tahap Pengembangan');
    const finalDefTeam = verification_type === 'Otomatis' && default_team_id ? parseInt(default_team_id, 10) : null;
    const result = await db.query(`
      UPDATE services 
      SET category_id = COALESCE($1, category_id), 
          service_name = COALESCE($2, service_name), 
          target_sla = COALESCE($3, target_sla), 
          verification_type = $4, 
          sop_link = COALESCE($5, sop_link), 
          status = COALESCE($6, status), 
          form_schema = COALESCE($7, form_schema), 
          required_docs = COALESCE($8, required_docs), 
          default_team_id = $9
      WHERE id = $10 RETURNING *
    `, [finalCatId || null, name || null, target_sla || null, verification_type || 'Wajib Verifikasi', sop_link || null, finalStatus, form_schema ? JSON.stringify(form_schema) : null, required_docs !== undefined ? required_docs : null, finalDefTeam, id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    await db.query('DELETE FROM services WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// -----------------------------------------
// ADMIN API: Requirements
// -----------------------------------------
exports.addRequirement = async (req, res) => {
  const { id } = req.params; // service_id
  const { document_name, is_mandatory } = req.body;
  try {
    const result = await db.query(`
      INSERT INTO service_requirements (service_id, document_name, is_mandatory)
      VALUES ($1, $2, $3) RETURNING *
    `, [id, document_name, is_mandatory ?? true]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteRequirement = async (req, res) => {
  try {
    await db.query('DELETE FROM service_requirements WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Requirement deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
