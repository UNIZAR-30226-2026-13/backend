const pool = require('../db')

class UsersRepository {
	async createUser(id, username, email, password) {

		const idExists = await this.findUserById(id)
		const emailExists = await this.findUserByEmail(email)
		const usernameExists = await this.findUserByUsername(username)

		if (idExists || emailExists || usernameExists) {
			throw new Error('Existe user')
		}

		const query = 'INSERT INTO usuarios (id, username, email, password) VALUES ($1, $2, $3, $4) RETURNING *'
		const values = [id, username, email, password]
		try {
			const result = await pool.query(query, values)
			return result.rows[0]
		} catch (err) {
			console.error('Error al crear usuario:', err)
			throw err
		}
	}

	async findUserByEmail(email) {
		const query = 'SELECT * FROM usuarios WHERE email = $1'
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
		const query = 'SELECT * FROM usuarios WHERE id = $1'
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
		const query = 'SELECT * FROM usuarios WHERE username = $1'
		const values = [username]
		try {
			const result = await pool.query(query, values)
			return result.rows[0]
		} catch (err) {
			console.error('Error al buscar usuario por username:', err)
			throw err
		}
	}

	async getPublicUser(username) {
		const user = await this.findUserByUsername(username)
		if (!user) {
			return null
		}
		const { password, ...publicUser } = user
		return publicUser
	}

	async updateUser(user, newData) {
		const id = user.id

		const updatedUser = { ...user, ...newData }
		const query = 'UPDATE usuarios SET username = $1, email = $2, password = $3 WHERE id = $4'
		const values = [updatedUser.username, updatedUser.email, updatedUser.password, id]
		try {
			const result = await pool.query(query, values)
			if (result.rowCount !== 0) {
				const { password, ...publicUser } = updatedUser
				return publicUser
			} else {
				throw new Error('Usuario no encontrado')
			}
		} catch (err) {
			console.error('Error al actualizar usuario:', err)
			throw err
		}
	}


}

module.exports = new UsersRepository()