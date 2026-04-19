const pool = require('../db')

class UsersRepository {
	async createUser(id, username, email, password) {

		const idExists = await this.findUserById(id)
		const emailExists = await this.findUserByEmail(email)
		const usernameExists = await this.findUserByUsername(username)

		if (idExists || emailExists || usernameExists) {
			throw new Error('El ID, email o el username ya están en uso')
		}

		const query = 'INSERT INTO users (id, username, email, password) VALUES ($1, $2, $3, $4) RETURNING *'
		const values = [newID, username, email, password]
		try {
			const result = await pool.query(query, values)
			return result.rows[0]
		} catch (err) {
			console.error('Error al crear usuario:', err)
			throw err
		}
	}

	async findUserByEmail(email) {
		const query = 'SELECT * FROM users WHERE email = $1'
		const values = [email]
		try {
			const result = await pool.query(query, values)
			return result.rows[0]
		} catch (err) {
			console.error('Error al buscar usuario por email:', err)
			throw err
		}
	}

	async findUserById(id) {
		const query = 'SELECT * FROM users WHERE id = $1'
		const values = [id]
		try {
			const result = await pool.query(query, values)
			return result.rows[0]
		} catch (err) {
			console.error('Error al buscar usuario por ID:', err)
			throw err
		}
	}

	async findUserByUsername(username) {
		const query = 'SELECT * FROM users WHERE username = $1'
		const values = [username]
		try {
			const result = await pool.query(query, values)
			return result.rows[0]
		} catch (err) {
			console.error('Error al buscar usuario por username:', err)
			throw err
		}
	}
}

module.exports = new UsersRepository()