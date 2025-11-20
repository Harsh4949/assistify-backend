const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const WebSocket = require("ws");
const config = require('./config/config');

// Routes
const deviceRoutes = require('./routes/device');
const sessionRoutes = require('./routes/session');
const messageRoutes = require('./routes/message');
const adminRoutes = require('./routes/admin');
const incomingSmsRoutes = require('./routes/incomingSms');
const pairRouter = require('./routes/pair');
const devicesRouter = require('./routes/assistifyDevices');

// Background jobs
const { releaseExpiredSessions } = require('./jobs/sessionCleanup');

// Middleware
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const app = express();

// Core middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));


// ------------------------
//   API ROUTES
// ------------------------

// Assistify Relay (device mirroring system)
app.use('/api/v1/devices', deviceRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/incoming-sms', incomingSmsRoutes);

// Mobile app API
app.use('/api/pair', pairRouter);
app.use('/api/devices', devicesRouter);


app.get('/', (req, res) => {
  res.send('Welcome to the API server');
});


// ------------------------
//   START SERVER
// ------------------------
const server = app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});


// ------------------------
//   WEBSOCKET RELAY SERVER
// ------------------------
const wss = new WebSocket.Server({ noServer: true });

server.on("upgrade", (req, socket, head) => {
    if (req.url === "/relay") {
        wss.handleUpgrade(req, socket, head, ws => {
            wss.emit("connection", ws, req);
        });
    } else {
        socket.destroy();
    }
});

wss.on("connection", ws => {
    console.log("WS client connected to /relay");

    ws.on("message", msg => {
        console.log("WS message:", msg.toString());
    });

    ws.on("close", () => {
        console.log("WS client disconnected");
    });
});


// ------------------------
//   SMART SESSION CLEANUP
// ------------------------
let intervalMs = 60_000; // default 1 minute

async function smartCleanup() {
  const expired = await releaseExpiredSessions();
  intervalMs = expired > 0 ? 10_000 : 60_000; // faster when work is needed
  setTimeout(smartCleanup, intervalMs);
}

smartCleanup();
