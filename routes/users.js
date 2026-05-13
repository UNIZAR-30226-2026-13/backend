const express = require('express')
const router = express.Router()
const UsersRepository = require('../repositories/usersRepository')
const { authenticateToken } = require('../middleware/auth')
const { USER_CONFIG_ROUTE, USER_GET_USER_ROUTE } = require('./api')
const { SECURE_COOKIES } = require('../config.js')

router.get('/email/:email', async (req, res) => {
	const user = await UsersRepository.findUserByEmail(req.params.email)
	if (!user) return res.status(404).json({ message: 'No encontrado' })
	res.status(200).json({ username: user.username })
})

router.use(authenticateToken)

router.get(USER_GET_USER_ROUTE, async (req, res) => {
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

router.delete('/eliminar', async (req, res) => {
	try {
		const result = await UsersRepository.deleteUser(req.user.username)
		if (result === null) {
			return res.status(404).json({message:"Usuario no encontrado"})
		}
		res.clearCookie('auth', {
			httpOnly: true,
			secure: SECURE_COOKIES ? true : false,
			sameSite: SECURE_COOKIES ? 'None' : 'Strict'
		})
		return res.status(200).json({ message: 'Cuenta eliminada' })
	} catch (error) {
		res.status(500).json({ message: 'Error al eliminar la cuenta' })
	}
})


module.exports = router