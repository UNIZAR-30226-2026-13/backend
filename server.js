const express = require('express')
const cookieParser = require('cookie-parser')
const pool = require('./db')
const { PORT } = require('./config.js')
const { API_ROUTE, USER_ROUTE } = require('./routes/api.js')
const authRoutes = require('./routes/auth')
const usersRoutes = require('./routes/users')
const app = express()

app.use(express.json())
app.use(cookieParser())

app.get('/', (req, res) => {
	res.status(200).send('Hello, World!')
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

app.use(API_ROUTE+USER_ROUTE, authRoutes)
app.use(API_ROUTE+USER_ROUTE, usersRoutes)

app.listen(PORT, () => {
	console.log(`Servidor escuchando en el puerto ${PORT}`)
})