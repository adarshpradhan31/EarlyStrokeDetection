import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'strokeguard_super_secret';
const DB_FILE = path.join(process.cwd(), 'backend', 'db.json');

app.use(cors());
app.use(express.json());

// Initialize flat file DB if missing
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2));
}

const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
const writeDB = (data: any) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// ── In-memory latest sensor reading (from Raspberry Pi) ──────────
let latestSensorData: any = null;

// ── Sensor Data Endpoint (called by Raspberry Pi) ─────────────────
app.post('/api/sensor-data', (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'Invalid sensor payload' });
  }
  latestSensorData = { ...data, receivedAt: Date.now() };

  // Broadcast to all connected browser clients
  io.emit('sensor_update', latestSensorData);

  // Log diagnostic info from Pi to help debug SpO2 issues
  const diag    = data._diag    ?? 'n/a';
  const avgIR   = data._avgIR   ?? '?';
  const bufFill = data._bufFill ?? '?';
  console.log(
    `[Sensor] HR:${data.heartRate} SpO2:${data.spo2}% Mov:${data.movement} ` +
    `| IR:${avgIR} Buf:${bufFill}/400 | ${diag}`
  );
  res.json({ ok: true, clients: io.engine.clientsCount });
});

// ── Polling fallback (GET) ────────────────────────────────────────
app.get('/api/sensor-data/latest', (req, res) => {
  if (latestSensorData) {
    res.json(latestSensorData);
  } else {
    res.status(404).json({ error: 'No sensor data received yet' });
  }
});

// ── Auth: Register ────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide all required fields' });
  }

  const db = readDB();
  const existingUser = db.users.find((u: any) => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists with this email' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDB(db);

    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Server error during registration', details: err.message });
  }
});

// ── Auth: Login ───────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  try {
    const db = readDB();
    const user = db.users.find((u: any) => u.email === email);

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Server error during login', details: err.message });
  }
});

// ── Socket.IO connection log ──────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id} (total: ${io.engine.clientsCount})`);
  // Send latest reading immediately on connect
  if (latestSensorData) socket.emit('sensor_update', latestSensorData);
  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`✅ StrokeGuard backend running on http://localhost:${PORT}`);
  console.log(`   POST /api/sensor-data  ← Raspberry Pi`);
  console.log(`   GET  /api/sensor-data/latest  ← polling fallback`);
});
