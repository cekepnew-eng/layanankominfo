const db = require('../config/database');

// -----------------------------------------
// PUBLIC API (For Users creating tickets)
// -----------------------------------------
exports.getPublicServices = async (req, res) => {
  try {
    const servicesRes = await db.query(`
      SELECT s.*, c.name as category_name
      FROM services s
      JOIN service_categories c ON s.category_id = c.id
      WHERE s.is_active = true
    `);
    
    // Get requirements for each service
    const reqsRes = await db.query('SELECT * FROM service_requirements');
    
    const services = servicesRes.rows.map(s => {
      s.requirements = reqsRes.rows.filter(r => r.service_id === s.id);
      return s;
    });

    res.json({ success: true, data: services });
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
    const cats = await db.query('SELECT * FROM service_categories ORDER BY id ASC');
    res.json({ success: true, data: cats.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const result = await db.query('INSERT INTO service_categories (name) VALUES ($1) RETURNING *', [name]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await db.query('UPDATE service_categories SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
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
      SELECT s.*, c.name as category_name
      FROM services s
      JOIN service_categories c ON s.category_id = c.id
      ORDER BY s.id ASC
    `);
    
    const reqsRes = await db.query('SELECT * FROM service_requirements');
    
    const services = servicesRes.rows.map(s => {
      s.requirements = reqsRes.rows.filter(r => r.service_id === s.id);
      return s;
    });

    res.json({ success: true, data: services });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createService = async (req, res) => {
  const { category_id, name, target_sla, verification_type, sop_link, is_active } = req.body;
  try {
    const result = await db.query(`
      INSERT INTO services (category_id, name, target_sla, verification_type, sop_link, is_active)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [category_id, name, target_sla, verification_type, sop_link, is_active ?? true]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateService = async (req, res) => {
  const { id } = req.params;
  const { category_id, name, target_sla, verification_type, sop_link, is_active } = req.body;
  try {
    const result = await db.query(`
      UPDATE services 
      SET category_id=$1, name=$2, target_sla=$3, verification_type=$4, sop_link=$5, is_active=$6, updated_at=CURRENT_TIMESTAMP
      WHERE id = $7 RETURNING *
    `, [category_id, name, target_sla, verification_type, sop_link, is_active, id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
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
