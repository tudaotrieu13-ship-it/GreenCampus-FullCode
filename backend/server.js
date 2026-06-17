const express = require('express'); // trigger restart 2
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const categoryRoutes = require('./src/routes/categoryRoutes');
const itemRoutes     = require('./src/routes/itemRoutes');
const authRoutes     = require('./src/routes/authRoutes');
const postRoutes     = require('./src/routes/postRoutes');
const userRoutes     = require('./src/routes/userRoutes');
const chatRoutes     = require('./src/routes/chatRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const ratingRoutes     = require('./src/routes/ratingRoutes');
const wishlistRoutes      = require('./src/routes/wishlistRoutes');
const notificationRoutes  = require('./src/routes/notificationRoutes');
const adminRoutes         = require('./src/routes/adminRoutes');
const aiRoutes            = require('./src/routes/aiRoutes');
const reportRoutes        = require('./src/routes/reportRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_room', (userId) => {
    socket.join(`user_${userId}`);
    io.emit('user_online', userId);
  });

  socket.on('typing', ({ senderId, receiverId, isTyping }) => {
    io.to(`user_${receiverId}`).emit('typing', { senderId, isTyping });
  });

  socket.on('message_read', ({ senderId, receiverId }) => {
    io.to(`user_${receiverId}`).emit('message_read', { senderId });
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
app.get('/', (req, res) => {
  res.send('Server Green Campus is running!');
});

app.get('/debug-db', async (req, res) => {
  try {
    const db = require('./src/config/db');
    const [tables] = await db.query('SHOW TABLES');
    
    let notifCols = [];
    try {
      const [cols] = await db.query('SHOW COLUMNS FROM notifications');
      notifCols = cols;
    } catch (e) {
      notifCols = { error: e.message };
    }
    
    res.json({ tables, notifCols });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API Routes
app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/items',      itemRoutes);
app.use('/api/posts',      postRoutes);
app.use('/api/chat',       chatRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ratings',      ratingRoutes);
app.use('/api/wishlist',       wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/ai',            aiRoutes);
app.use('/api/reports',       reportRoutes);

// Start server
const PORT = process.env.PORT || 5000;
require('./migrate')().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
