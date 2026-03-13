const { Pool } = require('pg')
const pool = new Pool({
	host: 'db', //	Estos parametros son para desarrollo local
	port: 5432,	//	TODO:Usar .env para entorno de producción
	user: 'devuser',
	password: 'devpass',
	database: 'battleshipDEV'
})

module.exports = pool