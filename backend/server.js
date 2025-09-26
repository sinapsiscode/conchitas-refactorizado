const jsonServer = require('json-server');
const cors = require('cors');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

// Configurar CORS para permitir el frontend
server.use(cors({
  origin: function(origin, callback) {
    // Permitir cualquier origen en desarrollo
    if (process.env.NODE_ENV === 'production') {
      // En producción, ser más restrictivo
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173'
      ];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // En desarrollo, permitir todo
      callback(null, true);
    }
  },
  credentials: true
}));

server.use(jsonServer.bodyParser);
server.use(middlewares);

// Middleware para logging
server.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// =======================
// Rutas Personalizadas
// =======================

// Ruta de login
server.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Email y contraseña son requeridos'
    });
  }

  const users = router.db.get('users').value();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({
      error: 'Credenciales incorrectas'
    });
  }

  if (user.status !== 'approved') {
    return res.status(403).json({
      error: 'Usuario pendiente de aprobación'
    });
  }

  // Eliminar password del response
  const { password: _, ...userWithoutPassword } = user;

  // Generar token simple (en producción usar JWT real)
  const token = Buffer.from(JSON.stringify({
    userId: user.id,
    role: user.role,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 horas
  })).toString('base64');

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      token
    }
  });
});

// Ruta de registro
server.post('/auth/register', (req, res) => {
  const userData = req.body;

  // Validaciones básicas
  if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
    return res.status(400).json({
      error: 'Todos los campos son requeridos'
    });
  }

  const users = router.db.get('users').value();
  const existingUser = users.find(u => u.email === userData.email);

  if (existingUser) {
    return res.status(409).json({
      error: 'El correo ya está registrado'
    });
  }

  // Crear nuevo usuario
  const newUser = {
    id: `user-${Date.now()}`,
    ...userData,
    status: userData.status || 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Guardar en la base de datos
  router.db.get('users').push(newUser).write();

  const { password: _, ...userWithoutPassword } = newUser;

  res.status(201).json({
    success: true,
    data: userWithoutPassword
  });
});

// Middleware para verificar autenticación en rutas protegidas
server.use((req, res, next) => {
  // Permitir rutas públicas
  if (req.path.startsWith('/auth/') || req.method === 'OPTIONS') {
    return next();
  }

  // Verificar token en rutas protegidas (opcional, para simular autenticación real)
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token && req.method !== 'GET') {
    // Solo requerir token para operaciones de escritura
    console.log('⚠️ No token provided for write operation');
  }

  next();
});

// Usar el router de json-server para las demás rutas
server.use(router);

// Puerto y Host
const PORT = process.env.PORT || 4077;
const HOST = '0.0.0.0'; // Escuchar en todas las interfaces

server.listen(PORT, HOST, () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();

  console.log('🚀 Conchitas Backend Server is running');
  console.log('\n📍 Access URLs:');
  console.log(`   Local:      http://localhost:${PORT}`);

  // Mostrar todas las IPs de red
  Object.values(networkInterfaces).forEach(interfaces => {
    interfaces.forEach(interface => {
      if (interface.family === 'IPv4' && !interface.internal) {
        console.log(`   Network:    http://${interface.address}:${PORT}`);
      }
    });
  });

  console.log(`\n📊 Database:   http://localhost:${PORT}/db`);
  console.log('\n📋 Available endpoints:');
  console.log('  POST   /auth/login          - User login');
  console.log('  POST   /auth/register       - User registration');
  console.log('  GET    /users              - Get all users');
  console.log('  GET    /sectors            - Get all sectors');
  console.log('  GET    /batteries          - Get all batteries');
  console.log('  GET    /cultivationLines   - Get all cultivation lines');
  console.log('  GET    /lots               - Get all lots');
  console.log('  GET    /monitoring         - Get all monitoring records');
  console.log('  GET    /expenses           - Get all expenses');
  console.log('  GET    /harvests           - Get all harvests');
  console.log('  GET    /income             - Get all income');
  console.log('  GET    /inventory          - Get all inventory');
  console.log('  GET    /investments        - Get all investments');
  console.log('  GET    /notifications      - Get all notifications');
  console.log('\n🔑 Test credentials:');
  console.log('  maricultor1@conchas.com / password123');
  console.log('  admin@conchas.com / password123');
  console.log('  investor1@conchas.com / password123');
});