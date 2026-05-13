const express = require('express')
const cookieParser = require('cookie-parser')
const pool = require('./db')
const { PORT } = require('./config.js')
const { API_ROUTE, USER_ROUTE, ACTIVE_GAME_ROUTE } = require('./routes/api.js')
const authRoutes = require('./routes/auth')
const usersRoutes = require('./routes/users')
const queueRoutes = require('./routes/queue')
const historyRoutes = require('./routes/history')
const activeGameRoutes = require('./routes/activeGame')
const { authenticateSocket } = require('./middleware/auth')
const cors = require('cors');
const app = express()

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

const http = require('http') // Necesario para Socket.io
const { Server } = require('socket.io') // Socket.io


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // La URL exacta de tu Frontend
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true // Permite recibir las cookies de sesión
    }
});
app.set('io', io)

app.use(express.json())

console.log("Ruta base montada en:", API_ROUTE);

app.use(cookieParser())
app.use(API_ROUTE+USER_ROUTE, authRoutes)
app.use(API_ROUTE+USER_ROUTE, usersRoutes)
app.use('/api/queue', queueRoutes)
app.use(API_ROUTE + '/terminadas', historyRoutes)
app.use(API_ROUTE+ACTIVE_GAME_ROUTE, activeGameRoutes)

app.get('/', (req, res) => {
	res.status(200).send('Hunde la flota Backend API running')
})

app.get('/db-setup', async (req, res) => {
    try {
        await pool.query(`
CREATE TABLE IF NOT EXISTS usuarios (
	id uuid UNIQUE PRIMARY KEY,
	username VARCHAR(255) NOT NULL UNIQUE,
	email VARCHAR(255) NOT NULL UNIQUE,
	password VARCHAR(255) NOT NULL,
	barco TEXT NOT NULL DEFAULT 'default',
	perfil TEXT NOT NULL DEFAULT 'default',
	tablero TEXT NOT NULL DEFAULT 'default',
	elo INTEGER NOT NULL DEFAULT 1000,
	partidas_jugadas INTEGER NOT NULL CHECK (partidas_jugadas >= 0) DEFAULT 0,
	partidas_ganadas INTEGER NOT NULL CHECK (partidas_ganadas >= 0) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS partidas (
	id TEXT PRIMARY KEY NOT NULL,
	estado JSONB,
	owner_username TEXT NOT NULL REFERENCES usuarios(username) ON DELETE CASCADE,
	guest_username TEXT NOT NULL REFERENCES usuarios(username) ON DELETE CASCADE,
	ranked BOOLEAN NOT NULL DEFAULT FALSE,
	fecha_ultimo_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	activa BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS historial_partidas (
	id TEXT PRIMARY KEY NOT NULL,
	owner_username TEXT NOT NULL REFERENCES usuarios(username) ON DELETE CASCADE,
	guest_username TEXT NOT NULL REFERENCES usuarios(username) ON DELETE CASCADE,
	ranked BOOLEAN NOT NULL DEFAULT FALSE,
	ganador_id TEXT NOT NULL REFERENCES usuarios(username) ON DELETE CASCADE,
	fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS queue (
    player_username VARCHAR(255) PRIMARY KEY REFERENCES usuarios(username) ON DELETE CASCADE, --- player_username VARCHAR(255) PRIMARY KEY,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`);
        res.status(200).send("Tablas creadas con éxito");
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});

io.use(authenticateSocket)

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.data.user.username);

    // El cliente se une a una sala privada con su IDjugador para recibir notificaciones
    socket.on('join_room', () => {
        socket.join(socket.data.user.username);
        console.log(`Jugador ${socket.data.user.username} unido a su sala privada`);
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Usamos server.listen en lugar de app.listen
server.listen(PORT, () => {
    console.log(`Servidor con WebSockets escuchando en el puerto ${PORT}`);
});
