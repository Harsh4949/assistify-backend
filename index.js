const express = require('express');
const mongoose = require('mongoose');
const config = require('./config/config');
const deviceRoutes = require('./routes/device');
const sessionRoutes = require('./routes/session');
const messageRoutes = require('./routes/message');
const adminRoutes = require('./routes/admin');
const dotenv = require('dotenv');
const cors = require('cors');

const morgan = require('morgan');
const helmet = require('helmet');
const app = express();

dotenv.config();
app.use(express.json());
app.use(cors());

app.use(helmet());           // Security headers
app.use(morgan('combined')); // Logging

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
  
// Route mounting
app.use('/api/v1/devices', deviceRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/admin', adminRoutes);

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
