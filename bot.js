// Essentials
require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const config = require("./bot-config");
const fs = require("fs");
const path = require("path");

// Инициализация бота
const agent = new require("https").Agent({ keepAlive: true });
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
	polling: true,
	request: {
		agent,
	},
});

async function startBot() {
	while (true) {
		try {
			bot.startPolling({ restart: true });
			console.log("Bot started.");
			break;
		} catch (err) {
			console.error("Start failed:", err);
			await new Promise((r) => setTimeout(r, 5000));
		}
	}

	bot.on("error", async (err) => {
		console.error("Polling error:", err);
		if (err.code === "ECONNRESET") {
			bot.stopPolling();
			startBot(); // restart loop
		}
	});
}

const messagesStore = new Map();

// Команды бота
bot.setMyCommands(config.commands);

const awaitingQuestion = new Map();
const pendingReplies = new Map();

// async function safeSend(fn) {
// 	try {
// 		return await fn();
// 	} catch (err) {
// 		if (err.code === "ECONNRESET") {
// 			console.warn("Connection reset — retrying...");
// 			return await fn();
// 		}
// 		throw err;
// 	}
// }

// Clear chat
async function clearChat(chatID) {
	const allBotMessages = messagesStore.get(chatID) || [];
	messagesStore.delete(chatID);

	for (const messageID of allBotMessages) {
		try {
			await bot.deleteMessage(chatID, messageID);
		} catch (error) {
			console.error(`Couldn't delete message ${messageID}:`, error);
		}
	}
}

// Send text function
async function sendText(chatID, text, params) {
	const sent = await bot.sendMessage(chatID, text, {
		parse_mode: "Markdown",
		disable_web_page_preview: true,
		...params,
	});

	const IDs = messagesStore.get(chatID) || [];
	messagesStore.set(chatID, [...IDs, sent.message_id]);
}

// Send image function
async function sendImage(chatID, image, params) {
	const sent = await bot
		.sendPhoto(chatID, image, {
			disable_web_page_preview: true,
			...params,
		})
		.catch((error) => {
			console.error("Error sending image : ", error);
		});

	const IDs = messagesStore.get(chatID) || [];
	messagesStore.set(chatID, [...IDs, sent.message_id]);
}

// Сообщения
async function sendMainMenu(chatID) {
	return await sendText(
		chatID,
		`Что вас интересует?`,
		config.mainMenu.inlineButtons
	);
}
async function sendUnknownCommand(chatID) {
	return await sendText(chatID, "Неизвестная команда");
}

async function sendSchedule(chatID) {
	await sendText(chatID, config.textsList.schedule, {
		reply_markup: config.mainMenu.backButton.reply_markup,
	});

	await sendImage(chatID, image_map);
}

async function sendContacts(chatID) {
	return await sendText(chatID, config.textsList.contacts, {
		reply_markup: config.mainMenu.backButton.reply_markup,
	});
}

async function sendAppointment(chatID) {
	return await sendText(chatID, config.textsList.appointment, {
		reply_markup: config.mainMenu.backButton.reply_markup,
	});
}

async function sendExamination(chatID) {
	return await sendText(chatID, config.textsList.appointment, {
		reply_markup: config.mainMenu.backButton.reply_markup,
	});
}

async function sendResearches(chatID) {
	await sendText(chatID, config.textsList.researches.mainText, {
		reply_markup: {
			inline_keyboard: [
				...config.researchesTypes.reply_markup.inline_keyboard,
				...config.mainMenu.backButton.reply_markup.inline_keyboard,
			],
		},
	});
}

async function sendFAQ(chatID) {
	return await sendText(chatID, config.textsList.faq, {
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: "Задать вопрос",
						callback_data: "question",
					},
				],
				...config.mainMenu.backButton.reply_markup.inline_keyboard,
			],
		},
	});
}

async function confirmQuestion(chatID) {
	await sendText(
		chatID,
		"Ваш вопрос будет передан операторам. Уверены, что хотите продолжить?",
		config.confirmQuestion
	);
}

// Pictures
const image_label = "./media/images/label.jpg";
const image_map = "./media/images/map.jpg";

// Receive message
bot.on("message", async (msg) => {
	const nameOfUser = msg.chat.first_name;
	const chatID = msg.chat.id;
	const messageText = msg?.text;

	console.log(msg);

	const senderID = msg.chat.id;
	const text = msg.text;

	// Operator's reply
	if (pendingReplies.has(senderID)) {
		const targetUserID = pendingReplies.get(senderID);
		pendingReplies.delete(senderID); // clear after one reply

		await sendText(targetUserID, `💬 Ответ от оператора:\n\n${text}`);
		await sendText(senderID, `✅ Ответ отправлен.`);
		return;
	}

	// Awaiting question
	if (awaitingQuestion.has(chatID)) {
		awaitingQuestion.delete(chatID); // remove them from awaiting list

		// Forward to operator
		const operatorsChatIDs = config.operatorsIDs;
		for (const id of operatorsChatIDs) {
			try {
				await sendText(
					id,
					`📩 Вопрос от ${nameOfUser} (@${
						msg.chat.username || "нет username"
					}):\n\n${messageText}`,
					{
						parse_mode: "HTML",
						reply_markup: {
							inline_keyboard: [
								[
									{
										text: "✉️ Ответить",
										callback_data: `replyTo_${chatID}`,
									},
								],
							],
						},
					}
				);
			} catch (err) {
				console.error(`Error forwarding to operator ${id}:`, err);
				// optionally notify someone or log into file/db
			}
		}

		await sendText(chatID, "✅ Ваш вопрос передан операторам. Спасибо!");
		await sendMainMenu(chatID);
		return;
	}

	if (messageText.toLowerCase() == "/start") {
		clearChat(chatID);

		await sendText(chatID, `Приветствую, ${nameOfUser} \n \nЭто бот ЦРБ`);

		await sendImage(chatID, image_label);

		await sendMainMenu(chatID);
	} else if (messageText.toLowerCase() == "/faq") {
		sendFAQ(chatID);
	} else if (messageText.toLowerCase() == "/schedule") {
		sendSchedule(chatID);
	} else {
		sendUnknownCommand(chatID);
	}
});

// Callback query
bot.on("callback_query", async (msg) => {
	const chatID = msg.message.chat.id;
	const messageID = msg.message.message_id;
	const data = msg.data;

	console.log(msg);

	try {
		await bot.deleteMessage(chatID, messageID);
	} catch (error) {
		console.error("Failed to delete previous menu message:", error);
	}

	if (data == "main") {
		await sendMainMenu(chatID);
	}
	if (data == "schedule") {
		await sendSchedule(chatID);
	}
	if (data == "contacts") {
		await sendContacts(chatID);
	}
	if (data == "appointment") {
		await sendAppointment(chatID);
	}
	if (data == "examination") {
		await sendExamination(chatID);
	}
	if (data == "researches") {
		await sendResearches(chatID);
	}
	if (data == "faq") {
		await sendFAQ(chatID);
	}

	// Question
	if (data == "question") {
		await confirmQuestion(chatID);
	}
	if (data == "question_cancel") {
		await bot.sendMessage(chatID, "Отмена");
		await sendMainMenu(chatID);
	}
	if (data == "question_yes") {
		await bot.sendMessage(
			chatID,
			"✍️ Напишите ваш вопрос, и он будет передан операторам."
		);
		awaitingQuestion.set(chatID, true);
	}

	// Researches
	if (data == "research_lab") {
		await sendText(chatID, config.textsList.researches.lab_research, {
			reply_markup: config.mainMenu.backButton.reply_markup,
		});
	}
	if (data == "research_ultrasound") {
		await sendText(chatID, `Подготовка к УЗИ...`, {
			reply_markup: {
				inline_keyboard: [
					...config.ultrasoundResearchesButtons.reply_markup
						.inline_keyboard,
					...config.mainMenu.backButton.reply_markup.inline_keyboard,
				],
			},
		});
	}
	if (data == "abdominal_cavity") {
		await sendText(
			chatID,
			config.textsList.researches.ultrasound_research.abdominal_cavity,
			{
				reply_markup: config.mainMenu.backButton.reply_markup,
			}
		);
	}
	if (data == "abdominal_cavity_pregnancy") {
		await sendText(
			chatID,
			config.textsList.researches.ultrasound_research
				.abdominal_cavity_pregnancy,
			{
				reply_markup: config.mainMenu.backButton.reply_markup,
			}
		);
	}
	if (data == "small_pelvis") {
		await sendText(
			chatID,
			config.textsList.researches.ultrasound_research.small_pelvis,
			{
				reply_markup: config.mainMenu.backButton.reply_markup,
			}
		);
	}
	if (data == "prostate_gland") {
		await sendText(
			chatID,
			config.textsList.researches.ultrasound_research.prostate_gland,
			{
				reply_markup: config.mainMenu.backButton.reply_markup,
			}
		);
	}
	if (data == "bladder") {
		await sendText(
			chatID,
			config.textsList.researches.ultrasound_research.bladder,
			{
				reply_markup: config.mainMenu.backButton.reply_markup,
			}
		);
	}
	if (data == "mammary_glands") {
		await sendText(
			chatID,
			config.textsList.researches.ultrasound_research.mammary_glands,
			{
				reply_markup: config.mainMenu.backButton.reply_markup,
			}
		);
	}
});

bot.on("callback_query", async (query) => {
	const data = query.data;
	const operatorID = query.from.id;

	if (data.startsWith("replyTo_")) {
		const userChatID = data.split("_")[1];

		// Save that operator is now replying to this user
		pendingReplies.set(operatorID, userChatID);

		await sendText(
			operatorID,
			`✍️ Напишите сообщение, которое будет отправлено пользователю.`
		);
		await bot.answerCallbackQuery(query.id);
	}
});

// Error log
bot.on("polling_error", (error) => {
	console.error(error);

	// Stop and restart after a delay
	bot.stopPolling();
	setTimeout(() => bot.startPolling(), 5000);
});

// module.exports = bot

startBot();

setInterval(async () => {
	try {
		await bot.getMe();
	} catch (err) {
		console.warn("Health check failed:", err);
		bot.stopPolling();
		startBot();
	}
}, 5 * 60 * 1000);

console.log("The bot started successfully");
