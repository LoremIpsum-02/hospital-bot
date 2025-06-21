require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.BOT_TOKEN, { webHook: true });
bot.setWebHook(`${process.env.URL}/api/bot`);

// Example command
bot.onText(/\/start/, (ctx) => {
	bot.sendMessage(ctx.chat.id, "Netlify. The bot started successfully.");
});

exports.handler = async (event) => {
	if (event.httpMethod !== "POST") {
		return { statusCode: 200, body: "OK" };
	}
	try {
		const body = JSON.parse(event.body);
		await bot.processUpdate(body);
		return { statusCode: 200, body: "" };
	} catch (err) {
		console.error("Update Error:", err);
		return { statusCode: 500, body: "Webhook error" };
	}
};
