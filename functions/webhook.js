require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { webHook: true }); // webhook mode!
bot.setWebHook(`${process.env.URL}/api/bot`);

bot.onText(/\/start/, (msg) => {
	bot.sendMessage(msg.chat.id, "Бот успешно запущен на Netlify 🏥");
});

exports.handler = async function (event) {
	if (event.httpMethod !== "POST") {
		return { statusCode: 200, body: "OK" };
	}
	try {
		const body = JSON.parse(event.body);
		await bot.processUpdate(body); // ✨ handle Telegram update
		return { statusCode: 200, body: "" };
	} catch (err) {
		console.error("Webhook error:", err);
		return { statusCode: 500, body: "Webhook error" };
	}
};
