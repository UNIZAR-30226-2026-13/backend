const { BOOST_NAMES } = require('../config')


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
		let newBoard = board.map(row => [...row])
		let hitInfo = null
		let cell = newBoard[x][y];

		// 1. Si golpeamos un barco con matrícula (ej. "barco_2")
		if (typeof cell === 'string' && cell.startsWith("barco")) {
			newBoard[x][y] = cell.replace("barco", "tocado"); // Lo convertimos en "tocado_2"
			this.checkForSunk(newBoard, x, y);
			hitInfo = "barco";
			return {board: newBoard, info: hitInfo};
		}

		// 2. Si golpeamos cualquier otra cosa
		switch (cell) {
			case "agua":
				newBoard[x][y] = "nada"
				hitInfo = "agua"
				break
			case "minaActiva":
				newBoard[x][y] = "minaDetonada"
				hitInfo = "mina"
				break
			case "escudo(barco)":
				newBoard[x][y] = "escudoRoto(barco)"
				hitInfo = "escudo"
				break
			case "escudo(agua)":
				newBoard[x][y] = "escudoRoto(agua)"
				hitInfo = "escudo"
				break
			default:
				hitInfo = "boost"
		}
		return {board: newBoard, info: hitInfo}
	}

	static checkForSunk(board, x, y) {
		const newBoard = board.map(row => [...row])
		const size = newBoard.length;
		const targetTocado = newBoard[x][y];

		if (!targetTocado.startsWith("tocado")) return newBoard;

		const targetBarco = targetTocado.replace("tocado", "barco");
		let tieneBarcoSano = false;
		const celdasTocado = [];

		// Escaneamos el tablero buscando si queda alguna parte de ESTE barco específico
		for (let r = 0; r < size; r++) {
			for (let c = 0; c < size; c++) {
				if (newBoard[r][c] === targetBarco) tieneBarcoSano = true;
				if (newBoard[r][c] === targetTocado) celdasTocado.push({r, c});
			}
		}

		// Si no queda barco sano de esta matrícula, hundimos todas sus partes
		if (!tieneBarcoSano) {
			for (const celda of celdasTocado) {
				newBoard[celda.r][celda.c] = "hundido";
			}
		}
		return newBoard;
	}

	static hideForSelf(board) {
		const hiddenBoard = structuredClone(board)
		for (let x = 0; x < hiddenBoard.length; x++) {
			for (let y = 0; y < hiddenBoard[x].length; y++) {
				let cell = hiddenBoard[x][y];
				if (cell.startsWith("barco") || cell.startsWith("tocado") ||
					["nada", "hundido", "escudo(agua)", "escudo(barco)", "escudoRoto(agua)", "escudoRoto(barco)", "minaActiva", "minaDetonada"].includes(cell)) {
					continue; // Mantenemos nuestra información visible
				} else {
					hiddenBoard[x][y] = "agua";
				}
			}
		}
		return hiddenBoard
	}

	static hideForOpponent(board){
		const hiddenBoard = structuredClone(board)
		for (let x = 0; x < hiddenBoard.length; x++) {
			for (let y = 0; y < hiddenBoard[x].length; y++) {
				let cell = hiddenBoard[x][y];
				if (cell.startsWith("tocado") || ["nada", "hundido", "minaDetonada"].includes(cell)) {
					continue; // Mantenemos visible lo que ya ha descubierto
				} else if (cell === "escudoRoto(agua)" || cell === "escudoRoto(barco)") {
					hiddenBoard[x][y] = "escudoRoto";
				} else {
					hiddenBoard[x][y] = "agua"; // Ocultamos TODO lo demás
				}
			}
		}
		return hiddenBoard
	}

	static placeMine(board, x, y){
		const newBoard = board.map(row => [...row])

		switch (newBoard[x][y]) {
			case "barco":
			case "tocado":
			case "hundido":
			case "nada":
			case "minaDetonada":
			case "escudoRoto(barco)":
			case "escudoRoto(agua)":
			case "minaActiva":
				return null
				break
			default:
				let boost = null
				if (BOOST_NAMES.includes(newBoard[x][y])) {
					boost = newBoard[x][y]
				}
				newBoard[x][y] = "minaActiva"
				return { board:newBoard, boost:boost }
		}
	}

	static losingBoard(board) {
		for (let x = 0; x < board.length; x++) {
			for (let y = 0; y < board[x].length; y++) {
				if (board[x][y].includes("barco")) {
					return false
				}
			}
		}
		return true
	}

}

module.exports = { Board: BoardModel };