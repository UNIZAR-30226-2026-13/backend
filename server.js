const express = require('express')
const pool = require('./db')
// const port = 1337	// TODO:Usar .env para entorno de producción
const { PORT } = require('./config.js')
const app = express()

app.use(express.json())

app.get('/', (req, res) => {
	res.status(200).send('Hello, World!')
})

app.get('/db-setup', async (req, res) => {
	try {
		const result = await pool.query('SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\';')
		res.status(200).send({
			message: 'Conexión a la base de datos exitosa',
			tables: result.rows
		})
	} catch (err) {
		console.error('Error al conectar a la base de datos:', err)
		res.status(500).json({ error: 'Error al conectar a la base de datos' })
	}
})

app.listen(PORT, () => {
	console.log(`Servidor escuchando en el puerto ${PORT}`)
})