const express = require('express')
const cookieParser = require('cookie-parser')
const pool = require('./db')
const { PORT } = require('./config.js')
const { API_ROUTE, USER_ROUTE } = require('./routes/api.js')
const authRoutes = require('./routes/auth')
const usersRoutes = require('./routes/users')
const queueRoutes = require('./routes/queue')
const historyRoutes = require('./routes/history')
const app = express()

const http = require('http') // Necesario para Socket.io
const { Server } = require('socket.io') // Socket.io


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Cambiar por URL de Vercel
        methods: ["GET", "POST"]
    }
});
app.set('io', io)

app.use(express.json())

console.log("Ruta base montada en:", API_ROUTE + USER_ROUTE);

app.use(cookieParser())
app.use(API_ROUTE+USER_ROUTE, authRoutes)
app.use(API_ROUTE+USER_ROUTE, usersRoutes)
app.use('/api/queue', queueRoutes)
app.use(API_ROUTE + '/terminadas', historyRoutes)

app.get('/', (req, res) => {
	res.status(200).send('Hunde la flota Backend API running')
})

app.get('/db-setup', async (req, res) => {
	try {
		const result = await pool.query('SELECT * FROM usuarios;')
		res.status(200).send({
			message: 'Conexión a la base de datos exitosa',
			tables: result.rows
		})
	} catch (err) {
		console.error('Error al conectar a la base de datos:', err)
		res.status(500).json({ error: 'Error al conectar a la base de datos' })
	}
})

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    // El cliente se une a una sala privada con su IDjugador para recibir notificaciones
    socket.on('join_room', (playerID) => {
        socket.join(playerID);
        console.log(`Jugador ${playerID} unido a su sala privada`);
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Usamos server.listen en lugar de app.listen
server.listen(PORT, () => {
    console.log(`Servidor con WebSockets escuchando en el puerto ${PORT}`);
});
