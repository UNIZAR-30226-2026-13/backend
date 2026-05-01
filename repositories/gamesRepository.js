const pool = require('../db')
const { DEFAULT_GAME_SETTINGS } = require('../config')
const Game = require('../models/game')

class GamesRepository {
	static async createGame(ownerUsername, guest_username, gameSettings) {
		if (gameSettings.ranked) {
			gameSettings = DEFAULT_GAME_SETTINGS
		}

		const id = this.newID()

		const gameState = Game.newGameState(gameSettings)

		const query = 'INSERT INTO partidas (id, estado, owner_username, guest_username, ranked, activa) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *'
		const values = [id, gameState, ownerUsername, guest_username, gameSettings.ranked, true]

		try {
			const result = await pool.query(query, values)
			return id
		} catch (error) {
			console.error('Error en la base de datos: ', error)
			throw new Error('Error in database.')
		}
	}

	static async addGuest(gameID, guestUsername) {
		const query = 'UPDATE partidas SET guest_username = $1, activa = true WHERE id = $2'
		const values = [guestUsername, gameID]
		try {
			const result = await pool.query(query, values)
			return result.rowCount !== 0
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
				return false
			}
		} catch (error) {
			console.error('Error en la base de datos: ', error);
			throw error
		}
	}

	static async consolidarPartida(partidaID, ganadorUsername) {
		const client = await pool.connect();
		try {
			await client.query('BEGIN');
			
			const resPartida = await client.query('SELECT * FROM partidas WHERE id = $1', [partidaID]);
			const p = resPartida.rows[0];
			
			
			// Cálculo del elo
			// Mínimo ganar 3 pts y perder 27 pts, se ganan 20% más de puntos que se pierden
			// Por ejemplo: j1 200 pts, j2 300 pts; gana j1 24 pts y pierde j2 20 pts
			const resUsers = await client.query(
				'SELECT username, elo FROM usuarios WHERE username IN ($1, $2)',
                [p.owner_username, p.guest_username]
            );
            
            const user1 = resUsers.rows.find(u => u.username === p.owner_username);
            const user2 = resUsers.rows.find(u => u.username === p.guest_username);
            const perdedorUsername = (ganadorUsername === p.owner_username) ? p.guest_username : p.owner_username;
            
            const ganadorObj = (ganadorUsername === user1.username) ? user1 : user2;
			const eloMayor = Math.max(user1.elo, user2.elo);
            const eloMenor = Math.min(user1.elo, user2.elo);

            const diff = ((eloMayor - eloMenor) * 0.0033 * 15) + 15;

            let puntosGanados = 0;
            let puntosPerdidos = 0;

            if (ganadorObj.elo === eloMenor) {
                puntosGanados = Math.min(diff * 1.2, 27); // Multiplicador de 20% puntos ganados
				puntosPerdidos = Math.min(diff, 27); // Pts perdidos por el jugador de elo mayor
            } else {
                // Ganó el de mayor ELO
				let elo2 = 30 - diff
                puntosGanados = Math.max(elo2 * 1.2, 3); // Mínimo 3 puntos
                puntosPerdidos = Math.max(elo2, 3);
            }
			
			// Insertar en historial
			await client.query(
				`INSERT INTO historial_partidas (id, owner_username, guest_username, ranked, ganador_id) 
					VALUES ($1, $2, $3, $4, $5)`,
				[p.id, p.owner_username, p.guest_username, p.ranked, ganadorUsername]
			);

            if (p.ranked) {
                // Actualizar Ganador
                await client.query(
                    `UPDATE usuarios SET 
                        partidas_jugadas = partidas_jugadas + 1, 
                        partidas_ganadas = partidas_ganadas + 1, 
                        elo = elo + $2 
                     WHERE username = $1`,
                    [ganadorUsername, Math.round(puntosGanados)]
                );

                // Actualizar Perdedor
                await client.query(
                    `UPDATE usuarios SET 
                        partidas_jugadas = partidas_jugadas + 1, 
                        elo = GREATEST(0, elo - $2) 
                     WHERE username = $1`,
                    [perdedorUsername, Math.round(puntosPerdidos)]
                );
            } else {
                // Si no es ranked, solo sumamos partida jugada
                await client.query('UPDATE usuarios SET partidas_jugadas = partidas_jugadas + 1 WHERE username IN ($1, $2)', [p.owner_username, p.guest_username]);
            }

            // Borrar partida activa
            await client.query('DELETE FROM partidas WHERE id = $1', [partidaID]);

            await client.query('COMMIT');
			return { ganados: Math.round(puntosGanados), perdidos: Math.round(puntosPerdidos) };

        } catch (e) {
            await client.query('ROLLBACK');
            console.error("Error en consolidación:", e);
            throw e;
        } finally {
            client.release();
        }
    }
}

module.exports = GamesRepository
