const pool = require('../db')
const { DEFAULT_GAME_SETTINGS } = require('../config')
const Game = require('../models/game')

class GamesRepository {
	static async createGame(ownerUsername, guestUsername, gameSettings) {
		if (gameSettings.ranked) {
			gameSettings = DEFAULT_GAME_SETTINGS
		}

		const id = this.newID()

		const gameState = Game.newGameState(gameSettings)

		const query = 'INSERT INTO partidas (id, estado, owner_username, guest_username, ranked, activa) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *'
		const values = [id, gameState, ownerUsername, guestUsername, gameSettings.ranked, true]

		try {
			const result = await pool.query(query, values)
			return id
		} catch (error) {
			console.error('Error en la base de datos: ', error)
			throw new Error('Error in database.')
		}
	}

	static async addGuest(gameID, guestUsername) {
		const query = 'UPDATE partidas SET guest_username = $1, activa = true WHERE id = $2 RETURNING owner_username'
		const values = [guestUsername, gameID]
		try {
			const result = await pool.query(query, values)
			if (result.rowCount !== 0) {
				return result.rows[0].owner_username
			}
			else {
				return null
			}
		} catch (error) {
			console.error('Error en la base de datos: ', error)
			throw error
		}
	}

	static newID() {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
		const array = new Uint8Array(8)
		crypto.getRandomValues(array)
		let id = ""
		array.forEach((number) => {
			id += chars[number % chars.length]
		})
		return id
	}

	static async findGameByPlayer(username) {
		const query = 'SELECT id FROM partidas WHERE (owner_username = $1 OR guest_username = $1) AND activa = true'
		const values = [username]

		try {
			const result = await pool.query(query, values)
			if (result.rowCount !== 0) {
				return result.rows[0].id
			}
			else {
				return null
			}
		} catch (error) {
			console.error('Error en la base de datos: ', error);
			throw error
		}
	}

	static async findGameOwner(partidaID) {
		const query = 'SELECT owner_username FROM partidas WHERE id = $1'
		const values = [partidaID]
		try {
			const result = await pool.query(query, values)
			if (result.rowCount !== 0) {
				return result.rows[0].owner_username
			}
			else {
				return null
			}
		} catch (error) {
			console.error('Error en la base de datos: ', error);
			throw error
		}
	}

	static async getGameState(partidaID) {
		const query = 'SELECT estado FROM partidas WHERE id = $1'
		const values = [partidaID]
		try {
			const result = await pool.query(query, values)
			if (result.rowCount === 0) return null
			return result.rows[0].estado
		} catch (error) {
			console.error('Error en la base de datos: ', error);
			throw error
		}
	}

	static async getGame(partidaID) {
		const query = 'SELECT * FROM partidas WHERE id = $1'
		const values = [partidaID]
		try {
			const result = await pool.query(query, values)
			if (result.rowCount === 0) return null
			return result.rows[0]
		} catch (error) {
			console.error('Error en la base de datos: ', error);
			throw error
		}
	}

	static async updateGameState(partidaID, newGameState) {
		const query = 'UPDATE partidas SET estado = $1 WHERE id = $2'
		const values = [newGameState, partidaID]
		try {
			const result = await pool.query(query, values)
			if (result.rowCount !== 0) {
				return newGameState
			}
			return null
		} catch (error) {
			console.error('Error en la base de datos: ', error);
			throw error
		}
	}
}

module.exports = GamesRepository