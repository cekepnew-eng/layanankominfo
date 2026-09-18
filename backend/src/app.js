const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const mobileRoutes = require('./routes/mobileRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Helpdesk API is running' });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Helpdesk API is running' });
});

const userRoutes = require('./routes/userRoutes');

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api', serviceRoutes);
app.use('/api', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/mobile', mobileRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/teams', require('./routes/teamRoutes'));

module.exports = app;
