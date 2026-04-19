const express = require('express')
const UsersRepository = require('../repositories/usersRepository')
const crypto = require('crypto')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { JWT_SECRET, SECURE_COOKIES } = require('../config.js')
const { LOGIN_ROUTE, REGISTER_ROUTE, LOGOUT_ROUTE } = require('./api.js')

router.post(REGISTER_ROUTE, async (req, res) => {
	const { username, email, password } = req.body
	const newID = crypto.randomUUID()
	try {
		const user = await UsersRepository.createUser(newID, username, email, password)
		const publicUser = await UsersRepository.getPublicUser(username)
		const token = jwt.sign(publicUser, JWT_SECRET, { expiresIn: '1h' })
		res.status(200)
			.cookie('auth', token, {
				httpOnly: true,
				secure: SECURE_COOKIES ? true : false,
				sameSite: SECURE_COOKIES ? 'None' : 'Strict',
				maxAge: 1000 * 60 * 60
			})
			.json({ message: 'Usuario registrado exitosamente' })
	} catch (error) {
		console.error('Error al registrar usuario:', error)
		if (error.message === 'Existe user') {
			res.status(453).json({ message: 'El ID, email o el username ya están en uso' })
		} else {
			res.status(500).json({ message: 'Error del servidor' })
		}
	}
})

router.post(LOGIN_ROUTE, async (req, res) => {
	const { username, password } = req.body
	try {
		const user = await UsersRepository.findUserByUsername(username)
		if (!user) {
			res.status(453).json({ message: 'Usuario no encontrado' })
			return
		}
		if (user.password !== password) {
			res.status(453).json({ message: 'Contraseña incorrecta' })
			return
		}
		const publicUser = await UsersRepository.getPublicUser(username)
		const token = jwt.sign(publicUser, JWT_SECRET, { expiresIn: '1h' })
		res.status(200)
			.cookie('auth', token, {
				httpOnly: true,
				secure: SECURE_COOKIES ? true : false,
				sameSite: SECURE_COOKIES ? 'None' : 'Strict',
				maxAge: 1000 * 60 * 60
			})
			.json({ message: 'Inicio de sesión exitoso' })
	} catch (error) {
		console.error('Error al iniciar sesión:', error)
		res.status(513).json({ message: 'Error del servidor' })
	}
})

router.post(LOGOUT_ROUTE, (_, res) => {
	res.clearCookie('auth', {
				httpOnly: true,
				secure: SECURE_COOKIES ? true : false,
				sameSite: SECURE_COOKIES ? 'None' : 'Strict'
			})
	res.status(200).json({ message: 'Cierre de sesión exitoso' })
})

module.exports = router