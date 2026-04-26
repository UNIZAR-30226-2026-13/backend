const express = require('express')
const gameRouter = express.Router()
const { DEFAULT_GAME_SETTINGS } = require('../config')
const GamesRepository = require('../repositories/gamesRepository')
const { authenthicateToken } = require('../middleware/auth')
const { ACTIVE_GAME_ROUTE } = require('./api')


gameRouter.use(authenthicateToken)

gameRouter.post('/crear', async (req, res) => {
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
		const id = await GamesRepository.createGame(username, null, gameSettings)
		res.status(200).json({roomID: id})
	} catch (error) {
		res.status(500).json({message: "Error en el servidor"})
	}


})