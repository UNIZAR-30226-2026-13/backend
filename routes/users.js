const express = require('express')
const router = express.Router()
const UsersRepository = require('../repositories/usersRepository')
const { authenticateToken } = require('../middleware/auth')
const { USER_CONFIG_ROUTE } = require('./api')

router.use(authenticateToken)

router.get('/:username', async (req, res) => {
	const { username } = req.params
	try {
		const user = await UsersRepository.getPublicUser(username)
		if (!user) {
			res.status(404).json({ message: 'Usuario no encontrado' })
			return
		}
		res.status(200).json(user)
	} catch (error) {
		console.error('Error al obtener usuario:', error)
		res.status(500).json({ message: 'Error del servidor' })
	}
})

router.put(USER_CONFIG_ROUTE, async (req, res) => {
	const newData = req.body.newData
	const user = req.user
	if (!user) {
		res.status(401).json({ message: 'Usuario no autenticado' })
		return
	}
	try {
		const updatedUser = await UsersRepository.updateUser(user, newData)
		res.status(200).json(updatedUser)
	} catch (error) {
		res.status(453).json({ message: 'Ya existe un usuario con ese nombre de usuario o correo electrónico' })
	}
})

module.exports = router