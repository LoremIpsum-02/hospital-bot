const bot = require("../bot.js")

exports.handler = async (event) => {
	if (event.httpMethod !== "POST") {
		return { statusCode: 200, body: "OK" };
	}
	try {
		const update = JSON.parse(event.body);
		await bot.handleUpdate(update); // ✅ Correct method
		return { statusCode: 200, body: "" };
	} catch (err) {
		console.error("Webhook error:", err);
		return { statusCode: 500, body: "Webhook error" };
	}
};
