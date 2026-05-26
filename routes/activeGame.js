const express = require('express')
const gameRouter = express.Router()
const { DEFAULT_GAME_SETTINGS } = require('../config')
const GamesRepository = require('../repositories/gamesRepository')
const auth = require('../middleware/auth')
const Game = require('../models/game')
const { GAME_CREATE_ROUTE, GAME_JOIN_ROUTE, GAME_MOVE_ROUTE, GAME_BOATS_ROUTE, GAME_PAUSE_ROUTE, GAME_UNPAUSE_ROUTE } = require('./api')

gameRouter.use(auth.authenticateToken)

gameRouter.post(GAME_CREATE_ROUTE, async (req, res) => {
	const username = req.user.username
	const settings = req.body.gameSettings
	if (!settings) {
		res.status(400).json({message: 'No se proporcionaron ajustes de partida'})
		return
	}
	let gameSettings
	if (settings.ranked) {
		gameSettings = DEFAULT_GAME_SETTINGS
	}
	else {
		gameSettings = {
			ranked : false,
			board_size: settings.size,
			two_count: settings.boats[0],
			three_count: settings.boats[1],
			four_count: settings.boats[2],
			five_count: settings.boats[3],
			boost_ratio: settings.boost_ratio
		}
	}

	try {
		const id = await GamesRepository.createGame(username, username, gameSettings)
		res.status(200).json({roomID: id})
	} catch (error) {
		res.status(500).json({message: "Error en el servidor"})
	}
})

gameRouter.post(GAME_JOIN_ROUTE, async (req, res) => {
	const username = req.user.username
	const partidaID = req.params.id_partida
	const io = req.app.get('io')
	try {
		const result = await GamesRepository.addGuest(partidaID, username)
		if (!result) {
			return res.status(400).json({message: 'Partida no encontrada'})
		}
		else {
			if (io) {
				io.to(result.ownerUsername).emit('guest_conectado', {username:username})
			}
			return res.status(200).json(
				{
					message: 'Conexión exitosa',
					ownerUsername: result.ownerUsername,
					gameSettings: result.gameSettings,
					estado: Game.cleanGameStateForPlayer(result.estado, false)
				}
			)
		}
	} catch (error) {
		return res.status(500).json({message: "Error en el servidor"})
	}
})

gameRouter.put(GAME_MOVE_ROUTE, async (req, res) => {
	const username = req.user.username
	const gameID = req.params.gameID
	const requestedMove = req.body
	const io = req.app.get('io')
	try {
		const game = await GamesRepository.getGame(gameID)
		if (!game) {
			return res.status(404).json({message: "Partida no encontrada"})
		}
		const gameState = structuredClone(game.estado)
		if (gameState.ownerTurn && username !== game.owner_username || !gameState.ownerTurn && username !== game.guest_username) {
			return res.status(409).json({message: "No es tu turno"})
		}

		const ownerMove = gameState.ownerTurn

		const moveResult = Game.move(gameState, requestedMove)
		if (!moveResult) {
			return res.status(400).json({message: "Movimiento ilegal o mal formado"})
		}

		const newGameState = moveResult.gameState

		const finalGameState = await GamesRepository.updateGameState(gameID, newGameState)

		if (moveResult.winner !== null) {
			//PARTIDA TERMINADA
			const winner = moveResult.winner
			const ganadorUsername = winner ? game.owner_username : game.guest_username
			const perdedorUsername = (!winner) ? game.owner_username : game.guest_username
			const result = await GamesRepository.consolidarPartida(gameID, ganadorUsername)
			if(io) {
				io.to(ganadorUsername).emit(
					'partida_finalizada',
					{
						ganador: ganadorUsername,
						elo: result.ganados,
						estadoFinal: Game.cleanGameStateForPlayer(finalGameState, winner)
					}
				)
				io.to(perdedorUsername).emit(
					'partida_finalizada',
					{
						ganador: ganadorUsername,
						elo: result.perdidos,
						estadoFinal: Game.cleanGameStateForPlayer(finalGameState, !winner)
					}
				)
			}
			return res.status(200).json(Game.cleanStateForPlayer(finalGameState, ownerMove))
		}


		if (io) {
			const turnUsername = finalGameState.ownerTurn ? game.owner_username : game.guest_username
			const otherPlayerUsername = finalGameState.ownerTurn ? game.guest_username : game.owner_username
			io.to(turnUsername).emit(
				'tu_turno',
				Game.cleanStateForPlayer(finalGameState, finalGameState.ownerTurn)
			)
			io.to(otherPlayerUsername).emit(
				'actualizar_tablero',
				Game.cleanStateForPlayer(finalGameState, !finalGameState.ownerTurn)
			)
		}

		return res.status(200).json(Game.cleanStateForPlayer(finalGameState, ownerMove))


	} catch (error) {
		return res.status(500).json({message: "Error en el servidor"})
	}
})

gameRouter.post(GAME_BOATS_ROUTE, async (req, res) => {
	const username = req.user.username
	const gameID = req.params.gameID
	const boats = req.body.barcos
	try {
		const game = await GamesRepository.getGame(gameID)
		if (game === null) {
			return res.status(404).json({message: "Partida no encontrada"})
		}
		if (![game.owner_username, game.guest_username].includes(username)) {
			return res.status(403).json({message: "No formas parte de esta partida"})
		}
		const isOwner = username === game.owner_username
		const newGameState = Game.placeBoats(game.estado, boats, isOwner)
		if (newGameState === null) {
			return res.status(400).json({message: "Disposición de barcos mal formada o ilegal"})
		}
		const finalGameState = await GamesRepository.updateGameState(gameID, newGameState)
		if (finalGameState === null) {
			return res.status(404).json({message: "Partida no encontrada"})
		}
		return res.status(200).json(Game.cleanStateForPlayer(finalGameState, isOwner))
	} catch (error) {
		return res.status(500).json({message: "Error en el servidor"})
	}
})

gameRouter.put(GAME_PAUSE_ROUTE, async (req, res) => {
	const username = req.user.username
	const gameID = req.params.gameID
	const io = req.app.get('io')
	try {
		const game = await GamesRepository.getGame(gameID)
		if (game === null) {
			return res.status(404).json({message: "Partida no encontrada"})
		}
		if (![game.owner_username, game.guest_username].includes(username)) {
			return res.status(403).json({message: "No formas parte de esta partida"})
		}
		const result = await GamesRepository.pausarPartida(gameID)
		if (result !== null) {
			if (io) {
				io.to(game.owner_username).emit('partida_pausada')
				io.to(game.guest_username).emit('partida_pausada')
			}
			return res.sendStatus(200)
		}
		return res.status(500).json({message: "Error en el servidor"})
	} catch (error) {
		return res.status(500).json({message: "Error en el servidor"})
	}
})

gameRouter.post(GAME_UNPAUSE_ROUTE, async (req, res) => {
	const username = req.user.username
	const gameID = req.params.gameID
	const io = req.app.get('io')
	try {
		const game = await GamesRepository.getGame(gameID)
		if (game === null) {
			return res.status(404).json({message: "Partida no encontrada"})
		}
		if (![game.owner_username, game.guest_username].includes(username)) {
            return res.status(403).json({message: "No formas parte de esta partida"})
        }
		const result = await GamesRepository.reanudarPartida(gameID)
		if (result !== null) {

			if (io) {
                io.to(game.owner_username).emit('partida_reanudada', {
                    gameID: game.id,
                    estado: Game.cleanGameStateForPlayer(result.estado, true)
                })
                io.to(game.guest_username).emit('partida_reanudada', {
                    gameID: game.id,
                    estado: Game.cleanGameStateForPlayer(result.estado, false)
                })
            }

			const isOwner = username === game.owner_username
			return res.status(200).json({
				message:"Partida reanudada correctamente",
				estado:Game.cleanGameStateForPlayer(result.estado, isOwner)
			})
		}
		return res.status(500).json({message: "Error en el servidor"})
	} catch (error) {
			return res.status(500).json({message: "Error en el servidor"})
	}
})

gameRouter.get('/pausada', async (req, res) => {
    const username = req.user.username
    try {
        const game = await GamesRepository.findPausedGameByPlayer(username)
        if (game) return res.status(200).json({ gameID: game.id })
        return res.status(200).json({ gameID: null })
    } catch (error) {
        return res.status(500).json({ message: 'Error en el servidor' })
    }
})

module.exports = gameRouter
