import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = new (await import('http')).Server(app);
const { Server } = await import('socket.io');
const io = new Server(server, {
  cors: { origin: '*' },
});
app.use(cors());
app.use(express.json());

// In-memory whiteboard actions per room
const whiteboards = new Map();

const classes = [
  { id: 1, title: 'English Language & Advanced Grammar', username: 'Mr Abu', teacher: 'Mr Abu', students: 124, live: true, startsAt: '18:00', status: 'Live now' },
  { id: 2, title: 'React & Next.js Masterclass', username: 'Dr. Sarah Lin', teacher: 'Dr. Sarah Lin', students: 86, live: false, startsAt: '20:00', status: 'Scheduled' },
  { id: 3, title: 'AI Engineering Bootcamp', username: 'Prof. Alan Turing', teacher: 'Prof. Alan Turing', students: 92, live: true, startsAt: '16:30', status: 'Live now' },
];

const classrooms = [
  { id: 'room-1', title: 'English Language & Advanced Grammar', username: 'Sarah Lin', teacher: 'Sarah Lin', subject: 'English', startsAt: 'Now', description: 'Live grammar workshop', attendees: 124, joinCode: 'ENG42', accessMode: 'public', status: 'Live now', participants: [{ id: 'p-1', user: 'Alex', joinedAt: new Date().toISOString(), role: 'student' }] },
  { id: 'room-2', title: 'AI Neural Networks & Python', username: 'Marcus Sterling', teacher: 'Marcus Sterling', subject: 'AI', startsAt: 'Today · 2:00 PM', description: 'Hands-on machine learning lab', attendees: 84, joinCode: 'AI101', accessMode: 'link', status: 'Scheduled', participants: [] },
];

const assignments = [
  { id: 1, title: 'Grammar Practice Quiz', course: 'English Language', due: '2026-08-10', status: 'Pending', score: '-' },
  { id: 2, title: 'React Hooks Sprint', course: 'React Masterclass', due: '2026-08-12', status: 'Submitted', score: 'Pending Review' },
];

const messages = [
  { id: 1, user: 'Mr Abu', text: 'Welcome back! Share your questions in the live room.', time: '9:10 AM' },
  { id: 2, user: 'Alex', text: 'I am ready for the lesson and the AI tutor.', time: '9:12 AM' },
];

const analytics = {
  attendance: 94,
  revenue: 18240,
  completion: 87,
  activeStudents: 1240,
};

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/classes', (_req, res) => res.json(classes));
app.get('/api/classrooms', (_req, res) => res.json(classrooms));
app.post('/api/classrooms', (req, res) => {
  const username = req.body.username || req.body.teacher || 'Mr Abu';
  const room = {
    id: `room-${Date.now()}`,
    title: req.body.title || 'New Live Classroom',
    username,
    teacher: username,
    subject: req.body.subject || 'Live Class',
    startsAt: req.body.startsAt || 'Now',
    description: req.body.description || '',
    attendees: 1,
    joinCode: req.body.joinCode || 'CLSS1',
    accessMode: req.body.accessMode || 'public',
    status: 'Live now',
  };
  classrooms.push(room);
  res.json(room);
});
app.post('/api/classrooms/:id/join', (req, res) => {
  const room = classrooms.find(item => item.id === req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const providedCode = (req.body.joinCode || '').trim().toUpperCase();
  if (room.accessMode === 'link' && providedCode !== room.joinCode) {
    return res.status(403).json({ error: 'Join link or code required' });
  }

  const user = req.body.user || 'Guest';
  room.participants = room.participants || [];
  const existingParticipant = room.participants.find(p => p.user === user);
  if (!existingParticipant) {
    room.participants.push({ id: `p-${Date.now()}`, user, joinedAt: new Date().toISOString(), role: 'student' });
  }
  room.attendees = room.participants.length;
  res.json(room);
});
app.get('/api/assignments', (_req, res) => res.json(assignments));
app.get('/api/messages', (_req, res) => res.json(messages));
app.get('/api/analytics', (_req, res) => res.json(analytics));
app.get('/api/analytics/dashboard', (_req, res) => res.json({
  students: 1240,
  teachers: 86,
  revenue: 18240,
  liveClasses: 12,
  pendingApprovals: 7,
  attendance: 94,
  payments: 148,
}));

app.post('/api/messages', (req, res) => {
  const message = { id: Date.now(), user: req.body.user || 'Student', text: req.body.text || '', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
  messages.push(message);
  io.emit('newMessage', message);
  res.json(message);
});

// LiveKit token generation endpoint
app.post('/api/livekit/token', async (req, res) => {
  try {
    const { identity = `user-${Date.now()}`, room = req.body.room || 'default' } = req.body || {};
    const { AccessToken, VideoGrant } = await import('livekit-server-sdk');
    const apiKey = process.env.LIVEKIT_API_KEY || 'APItUofrmpEDijJ';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'YmtuYuGFyhABcOk5CQcD0rDTaUfKdY6Iee1uMD0wKeND';
    const url = process.env.LIVEKIT_URL || 'wss://dcons-9d0tismg.livekit.cloud';

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: 'LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set in environment' });
    }

    const at = new AccessToken(apiKey, apiSecret, { identity });
    const grant = new VideoGrant({ room });
    at.addGrant(grant);
    const token = at.toJwt();
    res.json({ token, url, identity });
  } catch (err) {
    console.warn('LiveKit token generation error', err?.message || err);
    res.status(500).json({ error: 'LiveKit server SDK not available. Install livekit-server-sdk.' });
  }
});

app.post('/api/attendance', (req, res) => {
  res.json({ success: true, checkedIn: req.body.checkedIn ?? true });
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    // Support payload { roomId, user } or legacy string roomId
    const payload = typeof roomId === 'string' ? { roomId } : roomId || {};
    const rid = payload.roomId || payload.room || roomId;
    const user = payload.user || 'Anonymous';
    socket.data.user = user;
    socket.join(rid);
    socket.to(rid).emit('participantJoined', { id: socket.id, user, time: new Date().toISOString() });
    // Send existing whiteboard state to the newly joined socket
    const existing = whiteboards.get(rid) || [];
    if (existing && existing.length) {
      socket.emit('whiteboardInit', existing);
    }
  });

  socket.on('leaveRoom', (roomId) => {
    const payload = typeof roomId === 'string' ? { roomId } : roomId || {};
    const rid = payload.roomId || payload.room || roomId;
    const user = socket.data.user || 'Anonymous';
    socket.leave(rid);
    socket.to(rid).emit('participantLeft', { id: socket.id, user, time: new Date().toISOString() });
  });

  socket.on('sendMessage', (message) => {
    io.to(message.roomId).emit('receiveMessage', message);
  });

  socket.on('updateName', (payload) => {
    const roomId = payload?.roomId;
    const name = payload?.name || 'Anonymous';
    socket.data.user = name;
    if (roomId) {
      socket.to(roomId).emit('participantUpdated', { id: socket.id, user: name });
    }
  });

  // Simple WebRTC signaling relay: forward 'signal' messages to a specific peer or to the room
  socket.on('signal', (payload) => {
    try {
      const to = payload?.to;
      const roomId = payload?.roomId;
      const data = payload?.data;
      if (to) {
        io.to(to).emit('signal', { from: socket.id, data });
      } else if (roomId) {
        socket.to(roomId).emit('signal', { from: socket.id, data });
      }
    } catch (err) {
      console.warn('Signal relay error', err);
    }
  });

  // Whiteboard actions: store and broadcast to room
  socket.on('whiteboardAction', (payload) => {
    try {
      const roomId = payload?.roomId;
      const action = payload?.action;
      if (!roomId || !action) return;
      const arr = whiteboards.get(roomId) || [];
      arr.push(action);
      whiteboards.set(roomId, arr);
      // Broadcast to others in the room
      socket.to(roomId).emit('whiteboardAction', action);
    } catch (err) {
      console.warn('whiteboardAction error', err);
    }
  });

  socket.on('whiteboardClear', (payload) => {
    try {
      const roomId = payload?.roomId;
      if (!roomId) return;
      whiteboards.set(roomId, []);
      socket.to(roomId).emit('whiteboardClear');
    } catch (err) {
      console.warn('whiteboardClear error', err);
    }
  });

  // Student requests permission to enable camera/screen; teacher can approve
  socket.on('requestMedia', (payload) => {
    try {
      const roomId = payload?.roomId;
      const type = payload?.type || 'camera';
      const user = socket.data.user || 'Anonymous';
      if (roomId) {
        socket.to(roomId).emit('mediaRequest', { from: socket.id, user, type });
      }
    } catch (err) {
      console.warn('requestMedia error', err);
    }
  });

  socket.on('approveMedia', (payload) => {
    try {
      const to = payload?.to;
      const type = payload?.type || 'camera';
      if (to) {
        io.to(to).emit('mediaApproved', { from: socket.id, type });
      }
    } catch (err) {
      console.warn('approveMedia error', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});


app.post('/api/payments', (req, res) => {
  res.json({ success: true, invoiceId: `INV-${Date.now()}` });
});

app.use(express.static(path.join(__dirname, '..', 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

const PORT = Number(process.env.PORT) || 4000;
server.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
