const express = require('express')
const UsersRepository = require('../repositories/usersRepository')
const crypto = require('crypto')
const router = express.Router()

router.use(express.json())

router.post('/registro', (req, res) => {
	const { username, email, password } = req.body
	const newID = crypto.randomUUID()
	try {
		const user = UsersRepository.createUser({ id: newID, username, email, password })
	} catch (error) {
		console.error('Error al registrar usuario:', error)
		if (UsersRepository.findUserById) {
			res.status(513).json({ error: 'Error del servidor' })
		}
	}
	res.status(200).json({ message: 'Usuario registrado exitosamente' })
})