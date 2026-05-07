const { BOOST_NAMES } = require('../config')
const { Board } = require('./board')

class Boosts {
	static placeBoosts(board, ratio) {
		let resultBoard = board
		const size = resultBoard.length
		const numBoosts = Math.floor(size * size * ratio)
		for (let i = 0; i < numBoosts;) {
			let x = Math.floor(Math.random() * size)
			let y = Math.floor(Math.random() * size)
			if (resultBoard[x][y] == "agua") {
				i++
				resultBoard[x][y] = BOOST_NAMES[Math.floor(Math.random() * BOOST_NAMES.length)]
			}
		}
		return resultBoard
	}

	static newInvetory() {
		const inventory = {}
		BOOST_NAMES.forEach((name) => inventory[name] = 0)
		return inventory
	}

	static grabBoost(gameState, x, y) {
		const resultGameState = structuredClone(gameState)
		const grabbedBoost = null
		if (resultGameState.ownerTurn) {
			if (resultGameState.guestBoard[x][y] in resultGameState.ownerInventory) {
				resultGameState.ownerInventory[resultGameState.guestBoard[x][y]]++
				grabbedBoost = resultGameState.guestBoard[x][y]
				resultGameState.guestBoard[x][y] = "nada"
			}
		}
		else {
			if (resultGameState.ownerBoard[x][y] in resultGameState.guestInventory) {
				resultGameState.guestInventory[resultGameState.ownerBoard[x][y]]++
				grabbedBoost = resultGameState.ownerBoard[x][y]
				resultGameState.guestInventory[x][y] = "nada"
			}
		}
		if (grabbedBoost != null) {
			return resultGameState
		}
		return null
	}

	static applyBoost(gameState, requestedMove) {
		// TODO: aplicar boost del requested move a gamestate
		let resultGameState = structuredClone(gameState)
		switch (requestedMove.boostType) {
			case "deflagrador":
				resultGameState = deflagrador(gameState, requestedMove)
				break
			case "doble":
				resultGameState = doble(gameState, requestedMove)
				break
			case "tornado":
				resultGameState = tornado(gameState, requestedMove)
				break
			case "escudo":
				resultGameState = escudo(gameState, requestedMove)
				break
			case "mina":
				resultGameState = mina(gameState, requestedMove)
				break
			case "radar":
				resultGameState = radar(gameState, requestedMove)
				break

		}
		return resultGameState
	}

	static deflagrador(gameState, requestedMove){
		let resultGameState = structuredClone(gameState)
		let targetBoard = (
			resultGameState.ownerTurn
			? resultGameState.guestBoard
			: resultGameState.ownerBoard
		)
		const x = requestedMove.f
		const y = requestedMove.c
		if (
			x <= 0
			|| y <= 0
			|| x >= targetBoard[y].length-1
			|| y >= targetBoard.length-1
		) {
			return null
		}
		let result
		let mina = false
		result = Board.shoot(targetBoard, x, y)
		targetBoard = result.board
		if (result.info === "boost") {
			resultGameState = this.grabBoost(resultGameState, x, y)
		}
		if (result.info === "mina") {
			mina = true
		}
		targetBoard = Board.checkForSunk(targetBoard, x, y)

		result = Board.shoot(targetBoard, x-1, y)
		targetBoard = result.board
		if (result.info === "boost") {
			resultGameState = this.grabBoost(resultGameState, x-1, y)
		}
		if (result.info === "mina") {
			mina = true
		}
		targetBoard = Board.checkForSunk(targetBoard, x-1, y)

		result = Board.shoot(targetBoard, x+1, y)
		targetBoard = result.board
		if (result.info === "boost") {
			resultGameState = this.grabBoost(resultGameState, x+1, y)
		}
		if (result.info === "mina") {
			mina = true
		}
		targetBoard = Board.checkForSunk(targetBoard, x+1, y)

		result = Board.shoot(targetBoard, x, y-1)
		targetBoard = result.board
		if (result.info === "boost") {
			resultGameState = this.grabBoost(resultGameState, x, y-1)
		}
		if (result.info === "mina") {
			mina = true
		}
		targetBoard = Board.checkForSunk(targetBoard, x, y-1)

		result = Board.shoot(targetBoard, x, y+1)
		targetBoard = result.board
		if (result.info === "boost") {
			resultGameState = this.grabBoost(resultGameState, x, y+1)
		}
		if (result.info === "mina") {
			mina = true
		}
		targetBoard = Board.checkForSunk(targetBoard, x, y+1)

		resultGameState.ownerTurn = !resultGameState.ownerTurn
		resultGameState.turnStreak = 1

		if (mina) {
			// Al golpear mina le damos al siguiente jugador dos turnos
			resultGameState.turnStreak = 2
		}

		return resultGameState
	}

	static doble(gameState, requestedMove){
		const resultGameState = structuredClone(gameState)
		//	TODO
	}

	static tornado(gameState, requestedMove){
		const resultGameState = structuredClone(gameState)
		//	TODO
	}

	static escudo(gameState, requestedMove){
		const resultGameState = structuredClone(gameState)
		//	TODO
	}

	static mina(gameState, requestedMove){
		const resultGameState = structuredClone(gameState)
		//	TODO
	}

	static radar(gameState, requestedMove){
		const resultGameState = structuredClone(gameState)
		//	TODO
	}
}

exports = BOOST_NAMES
exports = Boosts
