const jwt = require('jsonwebtoken')
const cookie = require('cookie')

const { JWT_SECRET } = require('../config.js')

exports.authenticateToken = (req, res, next) => {
	const token = req.cookies.auth
	if (!token) {
		return res.status(401).json({ error: 'Token no proporcionado' })
	}
	try {
		const user = jwt.verify(token, JWT_SECRET)
		req.user = user
		next()
	} catch (err) {
		return res.status(403).json({ error: 'Token inválido' })
	}
}

exports.authenticateSocket = (socket, next) => {
	const cookies = socket.handshake.headers.cookie
	if (!cookies) return next(new Error('No auth cookie'))

	const { auth: token } = cookie.parse(cookies)
	if (!token) return next(new Error('No auth token'))

	try {
		socket.data.user = jwt.verify(token, JWT_SECRET)
		next()
	} catch (err) {
		next(new Error('Token inválido'))
	}
}