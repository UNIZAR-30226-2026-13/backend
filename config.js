const { config } = require("dotenv");
const assert = require("assert");

config();

if (!process.env.PORT) console.log(`Using default PORT: 3000`);
if (!process.env.DB_HOST) console.log(`Using default DB_HOST: db`);
if (!process.env.DB_PORT) console.log(`Using default DB_PORT: 5432`);

assert(process.env.JWT_SECRET, "No JWT_SECRET provided");
assert(process.env.DB_USER, "No DB_USER provided");
assert(process.env.DB_PASSWORD, "No DB_PASSWORD provided");
assert(process.env.DB_NAME, "No DB_NAME provided");

module.exports = {
	PORT: process.env.PORT || 3000,
	DB_HOST: process.env.DB_HOST || "db",
	DB_PORT: process.env.DB_PORT || 5432,
	DB_USER: process.env.DB_USER,
	DB_PASSWORD: process.env.DB_PASSWORD,
	DB_NAME: process.env.DB_NAME,
	JWT_SECRET: process.env.JWT_SECRET,
	SECURE_COOKIES: process.env.SECURE_COOKIES
};