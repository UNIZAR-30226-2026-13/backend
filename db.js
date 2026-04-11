const { Pool } = require('pg')
const { DB_HOST, DB_PORT } = require('./config.js')

const pool = new Pool({
	host: DB_HOST,
	port: DB_PORT
});

module.exports = pool