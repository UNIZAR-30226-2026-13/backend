const Board = require('./board')
const { Boosts, BOOST_NAMES } = require('./boosts')

class Game {
	static newGameState(gameSettings) {
		const board = Board.emptyBoard(gameSettings.board_size)
		const gameState = {
			ownerBoard : Boosts.placeBoosts(board, gameSettings.boost_ratio),
			guestBoard : Boosts.placeBoosts(board, gameSettings.boost_ratio),
			ownerInventory : Boosts.newInventory(),
			guestInventory : Boosts.newInventory(),
			ownerTurn : true,
			turnStreak : 1,
			gameSettings : gameSettings
		}
		return gameState
	}

	static move(gameState, requestedMove) {
		if (
			typeof requestedMove.f !== 'number' ||
			typeof requestedMove.c !== 'number' ||
			typeof requestedMove.type !== 'string' ||
			!["boost", "disparo"].includes(requestedMove.type) ||
			typeof requestedMove.boostType !== 'string' ||
			![...BOOST_NAMES, "None"].includes(requestedMove.boostType)
		) {
			return null
		}
		const x = requestedMove.f
		const y = requestedMove.c
		if (x >= gameState.gameSettings.board_size || y >= gameState.gameSettings.board_size) {
			return null
		}
		const resultGameState = structuredClone(gameState)

		if (requestedMove.type == "boost") {
			resultGameState = Boosts.applyBoost(resultGameState, requestedMove)
			return resultGameState
		}
		else if (resultGameState.ownerTurn) {
			const {board: shootResult, info: hitInfo} = Board.shoot(resultGameState.guestBoard, x, y)
			resultGameState.guestBoard = shootResult
		}
		else {
			const {board: shootResult, info: hitInfo} = Board.shoot(resultGameState.ownerBoard, x, y)
			resultGameState.ownerBoard = shootResult
		}

		if (hitInfo == "boost") {
			const resultGameState = Boosts.grabBoost(resultGameState, x, y)
		}

		if (hitInfo == "mina") {
			 // Nos aseguramos de que se pierde el turno al activar una mina
			resultGameState.turnStreak = -1
		}
		resultGameState.turnStreak--
		if (resultGameState.turnStreak <= 0) {
			resultGameState.ownerTurn = !resultGameState.ownerTurn
			resultGameState.turnStreak = 1
		}
		if (hitInfo == "mina") {
			// Al golpear mina le damos al siguiente jugador dos turnos
			resultGameState.turnStreak = 2
		}
	}

	static cleanGameStateForPlayer(gameState, owner) {
		//TODO
		let cleanGameState = {}
		if (owner) {
			cleanGameState["tablero"]
		}
	}
}