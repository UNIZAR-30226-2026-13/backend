const jwt = require('jsonwebtoken')

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