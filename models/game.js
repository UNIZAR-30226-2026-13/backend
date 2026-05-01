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
			!["boost", "disparo"].includes(requestedMove.type)
		) {
			return null
		}
		if (
			requestedMove.type === "boost" &&
			(typeof requestedMove.boostType !== 'string' ||
			![...BOOST_NAMES, "None"].includes(requestedMove.boostType))
		) {
			return null
		}

		const x = requestedMove.f
		const y = requestedMove.c
		if (x >= gameState.gameSettings.board_size || y >= gameState.gameSettings.board_size || x < 0 || y < 0) {
			return null
		}
		let resultGameState = structuredClone(gameState)
		let hitInfo = null

		if (requestedMove.type === "boost") {
			resultGameState = Boosts.applyBoost(resultGameState, requestedMove)
			return resultGameState
		}
		else if (resultGameState.ownerTurn) {
			const result = Board.shoot(resultGameState.guestBoard, x, y)
			hitInfo = result.info
			resultGameState.guestBoard = result.board
		}
		else {
			const result = Board.shoot(resultGameState.ownerBoard, x, y)
			hitInfo = result.info
			resultGameState.ownerBoard = result.board
		}

		if (hitInfo === "boost") {
			resultGameState = Boosts.grabBoost(resultGameState, x, y)
		}

		if (hitInfo === "mina") {
			 // Nos aseguramos de que se pierde el turno al activar una mina
			resultGameState.turnStreak = -1
		}
		resultGameState.turnStreak--
		if (resultGameState.turnStreak <= 0) {
			resultGameState.ownerTurn = !resultGameState.ownerTurn
			resultGameState.turnStreak = 1
		}
		if (hitInfo === "mina") {
			// Al golpear mina le damos al siguiente jugador dos turnos
			resultGameState.turnStreak = 2
		}

		return resultGameState
	}

	static cleanGameStateForPlayer(gameState, owner) {
		const tablero = owner ? gameState.ownerBoard : gameState.guestBoard
		const tableroRival = owner ? gameState.guestBoard : gameState.ownerBoard
		const inventario = owner ? gameState.ownerInventory : gameState.guestInventory

		return {
			tablero: Board.hideForSelf(tablero),
			inventario: {...inventario},
			tableroRival: Board.hideForOpponent(tableroRival),
			tuTurno: owner ? gameState.ownerTurn : !gameState.ownerTurn
		}
	}
}