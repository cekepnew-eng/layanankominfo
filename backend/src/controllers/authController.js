const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-kominfo-2026';

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRes = await db.query(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.email = $1 AND u.is_active = true`, 
      [email]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role_name, name: user.full_name, teamId: user.team_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role_name,
        teamId: user.team_id
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

exports.register = async (req, res) => {
  const { email, password, fullName, phone } = req.body;
  try {
    // Basic user is always 'USER' (role_id 1)
    const roleRes = await db.query("SELECT id FROM roles WHERE name = 'USER'");
    const roleId = roleRes.rows[0].id;

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const insertRes = await db.query(
      `INSERT INTO users (email, password_hash, full_name, phone_number, role_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name`,
      [email, hash, fullName, phone, roleId]
    );

    res.status(201).json({ success: true, message: 'Registration successful', user: insertRes.rows[0] });
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const userRes = await db.query(
      `SELECT u.id, u.email, u.full_name, u.phone_number, u.team_id, r.name as role_name 
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
      [req.user.id]
    );
    if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
    
    res.json({ success: true, user: userRes.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
};

exports.logout = async (req, res) => {
  // Stateless JWT doesn't need strict logout unless handling refresh tokens or blacklisting.
  // Returning success is enough for client to drop the token.
  res.json({ success: true, message: 'Logged out successfully' });
};
