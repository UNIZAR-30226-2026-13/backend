const { config } = require("dotenv");
const assert = require("assert");

config();
config({path: ".env.game"})

if (!process.env.PORT) console.log(`Using default PORT: 3000`);
if (!process.env.DB_HOST) console.log(`Using default DB_HOST: db`);
if (!process.env.DB_PORT) console.log(`Using default DB_PORT: 5432`);

assert(process.env.JWT_SECRET, "No JWT_SECRET provided");
assert(process.env.DB_USER, "No DB_USER provided");
assert(process.env.DB_PASSWORD, "No DB_PASSWORD provided");
assert(process.env.DB_NAME, "No DB_NAME provided");

const DEFAULT_GAME_SETTINGS = {
	board_size : process.env.BOARD_SIZE || 10,
	two_count : process.env.TWO_COUNT || 1,
	three_count : process.env.THREE_COUNT || 2,
	four_count : process.env.FOUR_COUNT || 1,
	five_count : process.env.FIVE_COUNT || 1,
	boost_ratio : process.env.BOOST_RATIO || 0.1,
	ranked : true
};

const BOOST_NAMES = (process.env.BOOST_NAMES || "deflagrador doble tor esc mine rad").split(" ");

module.exports = {
	PORT: process.env.PORT || 3000,
	DB_HOST: process.env.DB_HOST || "db",
	DB_PORT: process.env.DB_PORT || 5432,
	DB_USER: process.env.DB_USER,
	DB_PASSWORD: process.env.DB_PASSWORD,
	DB_NAME: process.env.DB_NAME,
	JWT_SECRET: process.env.JWT_SECRET,
	SECURE_COOKIES: process.env.SECURE_COOKIES,
	DEFAULT_GAME_SETTINGS: DEFAULT_GAME_SETTINGS,
	BOOST_NAMES: BOOST_NAMES
};