

class BoardModel {

	static emptyBoard(size) {
		let board = []
		for (let i = 0; i < size; i++) {
			let row = []
			for (let j = 0; j < size; j++) {
				row.push("agua")
			}
			board.push(row)
		}
		return board
	}

	static shoot(board, x, y) {
		const newBoard = board.map(row => [...row])
		const hitInfo = null
		switch (newBoard[x][y]) {
			case "agua":
				newBoard[x][y] = "nada"
				hitInfo = "agua"
				break
			case "barco":
				newBoard[x][y] = "tocado"
				this.checkForSunk(newBoard, x, y)
				hitInfo = "barco"
				break
			case "escudo(barco)":
				newBoard[x][y] = "barco"
				hitInfo = "escudo"
				break
			case "escudo(agua)":
				newBoard[x][y] = "agua"
				hitInfo = "escudo"
				break
			case "minaActiva":
				newBoard[x][y] = "minaDetonada"
				hitInfo = "mina"
				break
			default:
				// Caso en el que le de a un boost escondido para recoger.
				// Dejamos el tablero igual para poder saber el boost a recoger.
				hitInfo = "boost"
		}
		return {board: newBoard, info: hitInfo}
	}

	static checkForSunk(board, x, y) {
		const newBoard = board.map(row => [...row])
		let min
		let max
		const size = newBoard.length
		let minWater = false
		let maxWater = false
		if (x > 0 && newBoard[x-1][y] == "tocado" || x < size-1 && newBoard[x+1][y] == "tocado") {
			min = x
			max = x
			for (; min > 0 && newBoard[min-1][y] == "tocado"; min--);
			minWater = (min == 0 || newBoard[min-1][y] == "agua")
			for (; max < size-1 && newBoard[max+1][y] == "tocado"; max++);
			maxWater = (max == size-1 || newBoard[max+1][y] == "agua")
			if (minWater && maxWater) {
				for (let i = min; i <= max; i++) {
					newBoard[i][y] = "hundido"
				}
			}
		}
		if (y > 0 && newBoard[x][y-1] == "tocado" || y < size-1 && newBoard[x][y+1] == "tocado") {
			min = y
			max = y
			for (; min > 0 && newBoard[x][min-1] == "tocado"; min--);
			minWater = (min == 0 || newBoard[x][min-1] == "agua")
			for (; max < size-1 && newBoard[x][max+1] == "tocado"; max++);
			maxWater = (max == size-1 || newBoard[x][max+1] == "agua")
			if (minWater && maxWater) {
				for (let i = min; i <= max; i++) {
					newBoard[x][i] = "hundido"
				}
			}
		}
		return newBoard
	}

	static hideForSelf(board) {
		const hiddenBoard = structuredClone(board)
		for (let x = 0; x < hiddenBoard.length; x++) {
			for (let y = 0; y < hiddenBoard[x].length; y++) {
				switch (hiddenBoard[x][y]) {
					case "barco":
					case "nada":
					case "tocado":
					case "hundido":
					case "escudo(agua)":
					case "escudo(barco)":
					case "minaActiva":
					case "minaDetonada":
						break
					default:
						hiddenBoard[x][y] = "agua"
				}
			}
		}
		return hiddenBoard
	}

	static hideForOpponent(board){
		const hiddenBoard = structuredClone(board)
		for (let x = 0; x < hiddenBoard.length; x++) {
			for (let y = 0; y < hiddenBoard[x].length; y++) {
				switch (hiddenBoard[x][y]) {
					case "nada":
					case "tocado":
					case "hundido":
					case "minaDetonada":
						break
					default:
						hiddenBoard[x][y] = "agua"
				}
			}
		}
		return hiddenBoard
	}
}

module.exports = BoardModel;