const { BOOST_NAMES } = require('../config')
const { Board } = require('./board');

class Boosts {
	static placeBoosts(board, ratio) {
		let resultBoard = structuredClone(board)
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

	static newInventory() {
		const inventory = {}
		BOOST_NAMES.forEach((name) => inventory[name] = 0)
		return inventory
	}

	static grabBoost(gameState, x, y) {
		const resultGameState = structuredClone(gameState)
		if (resultGameState.ownerTurn) {
			const boost = resultGameState.guestBoard[x][y]

			if (BOOST_NAMES.includes(boost)) {
			resultGameState.ownerInventory[boost]++
			resultGameState.guestBoard[x][y] = "nada"
			}
		} else {
			const boost = resultGameState.ownerBoard[x][y]

			if (BOOST_NAMES.includes(boost)) {
			resultGameState.guestInventory[boost]++
			resultGameState.ownerBoard[x][y] = "nada"
			}
		}
		return resultGameState
	}

	static applyBoost(gameState, requestedMove) {
		// TODO: aplicar boost del requested move a gamestate
		let resultGameState = structuredClone(gameState)
		const targetInventory = (
			resultGameState.ownerTurn
			? resultGameState.ownerInventory
			: resultGameState.guestInventory
		)
		if (targetInventory[requestedMove.boostType] <= 0) {
			return null
		}
		targetInventory[requestedMove.boostType]--
		switch (requestedMove.boostType) {
			case "deflagrador":
				resultGameState = this.deflagrador(resultGameState, requestedMove)
				break
			case "doble":
				resultGameState = this.doble(resultGameState, requestedMove)
				break
			case "tornado":
				resultGameState = this.tornado(resultGameState, requestedMove)
				break
			case "escudo":
				resultGameState = this.escudo(resultGameState, requestedMove)
				break
			case "mina":
				resultGameState = this.mina(resultGameState, requestedMove)
				break
			case "radar":
				resultGameState = this.radar(resultGameState, requestedMove)
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
			x < 0
			|| y < 0
			|| x >= targetBoard.length
			|| y >= targetBoard[x].length
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

		if (x-1 >= 0) {
			result = Board.shoot(targetBoard, x-1, y)
			targetBoard = result.board
			if (result.info === "boost") {
				resultGameState = this.grabBoost(resultGameState, x-1, y)
			}
			if (result.info === "mina") {
				mina = true
			}
			targetBoard = Board.checkForSunk(targetBoard, x-1, y)
		}

		if (x+1 < targetBoard.length) {
			result = Board.shoot(targetBoard, x+1, y)
			targetBoard = result.board
			if (result.info === "boost") {
				resultGameState = this.grabBoost(resultGameState, x+1, y)
			}
			if (result.info === "mina") {
				mina = true
			}
			targetBoard = Board.checkForSunk(targetBoard, x+1, y)
		}

		if (y-1 >= 0) {
			result = Board.shoot(targetBoard, x, y-1)
			targetBoard = result.board
			if (result.info === "boost") {
				resultGameState = this.grabBoost(resultGameState, x, y-1)
			}
			if (result.info === "mina") {
				mina = true
			}
			targetBoard = Board.checkForSunk(targetBoard, x, y-1)
		}

		if (y+1 < targetBoard[x].length) {
			result = Board.shoot(targetBoard, x, y+1)
			targetBoard = result.board
			if (result.info === "boost") {
				resultGameState = this.grabBoost(resultGameState, x, y+1)
			}
			if (result.info === "mina") {
				mina = true
			}
			targetBoard = Board.checkForSunk(targetBoard, x, y+1)
		}

		if (resultGameState.ownerTurn) {
			resultGameState.guestBoard = targetBoard
		}
		else {
			resultGameState.ownerBoard = targetBoard
		}

		if (mina) {
			// Al golpear mina le damos al siguiente jugador dos turnos
			resultGameState.ownerTurn = !resultGameState.ownerTurn
			resultGameState.turnStreak = 2
		}
		else {
			resultGameState.turnStreak--
			if (resultGameState.turnStreak <= 0) {
				resultGameState.ownerTurn = !resultGameState.ownerTurn
				resultGameState.turnStreak = 1
			}
		}

		// El deflagrador consume el turno
		resultGameState.ownerTurn = !resultGameState.ownerTurn;
		resultGameState.turnStreak = 1;
		return resultGameState;
    }

	static doble(gameState, requestedMove){
		let resultGameState = structuredClone(gameState);
		let targetBoard = (
			resultGameState.ownerTurn
			? resultGameState.guestBoard
			: resultGameState.ownerBoard
		)
		const x = requestedMove.f
		const y = requestedMove.c
		if (
			x < 0
			|| y < 0
			|| x >= targetBoard.length
			|| y >= targetBoard[x].length
		) {
			return null
		}
		const result = Board.shoot(targetBoard, x, y)
		targetBoard = result.board
		if (result.info === "boost") {
			resultGameState = this.grabBoost(resultGameState, x, y)
		}
		targetBoard = Board.checkForSunk(targetBoard, x, y)

		if (resultGameState.ownerTurn) {
			resultGameState.guestBoard = targetBoard
		}
		else {
			resultGameState.ownerBoard = targetBoard
		}

		if (result.info === "mina") {
			resultGameState.ownerTurn = !resultGameState.ownerTurn
			resultGameState.turnStreak = 2
		}
		return resultGameState;
	}

	static tornado(gameState, requestedMove) {
		const x = requestedMove.f
		const y = requestedMove.c
		let resultGameState = structuredClone(gameState);

		let targetBoard = resultGameState.ownerTurn ? resultGameState.guestBoard : resultGameState.ownerBoard;
		const tam = targetBoard.length;
		const mitad = Math.floor(tam / 2);

		// Definir límites del cuadrante
		const filaMin = x < mitad ? 0 : mitad;
		const filaMax = x < mitad ? mitad : tam;
		const colMin = y < mitad ? 0 : mitad;
		const colMax = y < mitad ? mitad : tam;

		// Recoger todas las celdas del cuadrante
		let celdasCuadrante = [];
		for (let i = filaMin; i < filaMax; i++) {
			for (let j = colMin; j < colMax; j++) {
				celdasCuadrante.push({ x: i, y: j });
			}
		}

		let mina = false
		// Seleccionar 5 aleatorias
		for (let i = 0; i < 5; i++) {
			if (celdasCuadrante.length === 0) break;
			const index = Math.floor(Math.random() * celdasCuadrante.length);
			const { x: tx, y: ty } = celdasCuadrante.splice(index, 1)[0];

			const result = Board.shoot(targetBoard, tx, ty);
			targetBoard = result.board;
			if (result.info === "boost") resultGameState = Boosts.grabBoost(resultGameState, tx, ty);
			if (result.info === "mina") mina = true
			targetBoard = Board.checkForSunk(targetBoard, tx, ty);
		}

		if (resultGameState.ownerTurn) resultGameState.guestBoard = targetBoard;
		else resultGameState.ownerBoard = targetBoard;

		if (mina) {
			resultGameState.ownerTurn = !resultGameState.ownerTurn;
			resultGameState.turnStreak = 2
		}
		else {
			resultGameState.turnStreak--
			if (resultGameState.turnStreak <= 0) {
				resultGameState.ownerTurn = !resultGameState.ownerTurn
				resultGameState.turnStreak = 1
			}
		}
		return resultGameState;
	}

	static escudo(gameState, requestedMove){
		const x = requestedMove.f
		const y = requestedMove.c
		let resultGameState = structuredClone(gameState);

		const shooterInventory = resultGameState.ownerTurn ? resultGameState.ownerInventory : resultGameState.guestInventory;
		let myBoard = resultGameState.ownerTurn ? resultGameState.ownerBoard : resultGameState.guestBoard;
		if (
			x < 0
			|| y < 0
			|| x >= myBoard.length
			|| y >= myBoard[x].length
		) {
			return null
		}



		if (myBoard[x][y] === "barco") {
			myBoard[x][y] = "escudo(barco)";
		} else if (myBoard[x][y] === "agua") {
			myBoard[x][y] = "escudo(agua)";
		}
		else if (BOOST_NAMES.includes(myBoard[x][y])) {
			shooterInventory[myBoard[x][y]]++
			myBoard[x][y] = "escudo(agua)"
		}

		resultGameState.turnStreak--

		if (resultGameState.turnStreak <= 0) {
			resultGameState.ownerTurn = !resultGameState.ownerTurn
			resultGameState.turnStreak = 1
		}


		return resultGameState;
	}

	static mina(gameState, requestedMove){
		let resultGameState = structuredClone(gameState)
		let targetBoard = (
			resultGameState.ownerTurn
			? resultGameState.ownerBoard
			: resultGameState.guestBoard
		)
		const targetInventory = (
			resultGameState.ownerTurn
			? resultGameState.ownerInventory
			: resultGameState.guestInventory
		)
		const x = requestedMove.f
		const y = requestedMove.c
		if (
			x < 0
			|| y < 0
			|| x >= targetBoard.length
			|| y >= targetBoard[x].length
		) {
			return null
		}

		const result = Board.placeMine(targetBoard, x, y)
		if (resultGameState.ownerTurn) {
			resultGameState.ownerBoard = result.board
		} else {
			resultGameState.guestBoard = result.board
		}
		if (result.boost) {
			targetInventory[result.boost]++
		}

		resultGameState.ownerTurn = !resultGameState.ownerTurn
		resultGameState.turnStreak = 1

		return resultGameState
	}

	static radar(gameState, requestedMove){
		let resultGameState = structuredClone(gameState);
		const x = requestedMove.f
		const y = requestedMove.c


		let targetBoard = resultGameState.ownerTurn ? resultGameState.guestBoard : resultGameState.ownerBoard;
		const tam = targetBoard.length;
		const mitad = Math.floor(tam / 2);

		const filaMin = x < mitad ? 0 : mitad;
		const filaMax = x < mitad ? mitad : tam;
		const colMin = y < mitad ? 0 : mitad;
		const colMax = y < mitad ? mitad : tam;

		let barcosEncontrados = 0;
		for (let i = filaMin; i < filaMax; i++) {
			for (let j = colMin; j < colMax; j++) {
				const celda = targetBoard[i][j];
				// Contamos barcos intactos, con escudo o ya tocados
				if (["barco", "escudo(barco)", "escudoRoto(barco)"].includes(celda)) {
					barcosEncontrados++;
				}
			}
		}

		// Guardamos el resultado del radar en el estado para que el cliente lo lea
		if (resultGameState.ownerTurn) {
			resultGameState.ownerLastRadarResult = barcosEncontrados
		} else {
			resultGameState.guestLastRadarResult = barcosEncontrados
		}

		resultGameState.turnStreak--
		if (resultGameState.turnStreak <= 0) {
			resultGameState.ownerTurn = !resultGameState.ownerTurn
			resultGameState.turnStreak = 1
		}


		return resultGameState;
	}
}

module.exports = { Boosts, BOOST_NAMES };
