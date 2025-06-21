require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { webHook: true }); // webhook mode!
bot.setWebHook(`${process.env.NETLIFY_URL}/api/bot`);

exports.handler = async (event) => {
	if (event.httpMethod !== "POST") {
		return { statusCode: 200, body: "OK" };
	}
	try {
		const update = JSON.parse(event.body);
		await bot.processUpdate(update); // ✅ Correct method
		return { statusCode: 200, body: "" };
	} catch (err) {
		console.error("Webhook error:", err);
		return { statusCode: 500, body: "Webhook error" };
	}
};
