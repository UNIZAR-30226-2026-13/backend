const express = require('express')
const gameRouter = express.Router()
const { DEFAULT_GAME_SETTINGS } = require('../config')
const GamesRepository = require('../repositories/gamesRepository')
const { authenthicateToken } = require('../middleware/auth')
const Game = require('../models/game')
const { GAME_CREATE_ROUTE, GAME_JOIN_ROUTE, GAME_MOVE_ROUTE } = require('./api')


gameRouter.use(authenthicateToken)

gameRouter.post(GAME_CREATE_ROUTE, async (req, res) => {
	const { username } = req.user.username
	const settings = req.body.gameSettings
	if (!settings) {
		res.status(400).json({message: 'No se proporcionaron ajustes de partida'})
		return
	}
	if (settings.ranked) {
		const gameSettings = DEFAULT_GAME_SETTINGS
	}
	else {
		const gameSettings = {
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
		const ownerUsername = await GamesRepository.addGuest(partidaID, username)
		if (!ownerUsername) {
			return res.status(400).json({message: 'Partida no encontrada'})
		}
		else {
			if (io) {
				io.to(ownerUsername).emit('guest_conectado', {username:username})
			}
			return res.status(200).json({message: 'Conexión exitosa', ownerUsername: ownerUsername})
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
		const newGameState = Game.move(gameState, requestedMove)
		if (!newGameState) {
			return res.status(400).json({message: "Movimiento ilegal o mal formado"})
		}

		const finalGameState = await GamesRepository.updateGameState(gameID, newGameState)

		//TODO: Limpiar tableros y estados y enviar respuesta + evento

	} catch (error) {
		return res.status(500).json({message: "Error en el servidor"})
	}
})