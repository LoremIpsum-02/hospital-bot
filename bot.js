require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const config = require("./bot-config");

// Инициализация бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
	polling: true,
});

const messagesStore = new Map();

// Команды бота
bot.setMyCommands(config.commands);

const awaitingQuestion = new Map();
const pendingReplies = new Map();

// Texts
const FAQ_text = `
*❓ Частые вопросы*

*Как записаться к детскому стоматологу?*
└ Запись к детскому стоматологу открывается по понедельникам каждую неделю, запись через call-центр: +7(301)237-99-38

*Как записаться к врачу офтальмологу?*
└ Запись к врачу офтальмологу открывается каждую пятницу, записаться можно по телефону +7(301)237-99-38

*Нужно ли беременным записываться к терапевту для подписания осмотра?*
└ Да, нужно

*Где можно поставить печать о прохождении ФЛГ?*
└ Результаты ФЛГ готовы на следующий день, после прохождения ФЛГ

*Сколько стоит водительская справка?*
└ Категория В - 915 рублей, категория С - 1130 рублей

*Для прохождения маммография нужно направление?*
└ Да

*Как позвонить в терапевтическое отделение?*
└ +7(301)237-99-63, доб 106

*Как узнать о поступлении льготного лекарственного препарата?*
└ Пройдите по ссылке https://t.me/petrcrb  в телеграмм канал Здоровье Джиды в теме "Аптека ГБУЗ Петропавловская ЦРБ" можете задать вопрос об интересующимся лекарственном препарате

*В какой день недели можно пройти диспансеризацию определенных групп  взрослого населения?*
└ В любой день, в кабинете профилактики
`;

const schedule_text = `
*🕒 Информация о режиме работы*

*Администрация :* Пн-Пт: 08:00 - 17:00

*Стационар :* круглосуточно

*Поликлиника :* Пн-Пт: 08:00 - 16:12

*Рентген кабинет :* 08:00-15:00

*Касса платных услуг :* 
Пн: 08:00-12:00 
Ср: 08:00-12:00, 13:00-16:00 
Пт: 08:00-12:00 
Вт, Чт: каса не работает

*Приём лабораторных анализов :* 
Пн-Пт: 08:00 - 10:00, выдача результатов с 15:00

*Регистратура поликлиники :* 
Пн-Пт: 08:00 - 16:12 
Тел: +7-301-237-11-26



*Горячая линия по обращению граждан :* 
Тел: +7-301-243-50-38

*Приёмная главного врача :* 
Тел: +7(3012)37-99-63
`;

// Clear chat function
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

// Сообщения
async function sendUnknownCommand(chatID) {
	return await bot.sendMessage(chatID, "Неизвестная команда");
}

async function sendFAQ(chatID) {
	return await bot.sendMessage(chatID, FAQ_text, {
		parse_mode: "Markdown",
		disable_web_page_preview: true,
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

async function sendSchedule(chatID) {
	return await bot.sendMessage(chatID, schedule_text, {
		parse_mode: "Markdown",
		disable_web_page_preview: true,
		reply_markup: config.mainMenu.backButton.reply_markup,
	});
}

async function sendMainMenu(chatID) {
	const sent = await bot.sendMessage(
		chatID,
		`Что вас интересует?`,
		config.mainMenu.inlineButtons
	);

	const IDs = messagesStore.get(chatID) || [];
	messagesStore.set(chatID, [...IDs, sent.message_id]);
}

async function confirmQuestion(chatID) {
	await bot.sendMessage(
		chatID,
		"Ваш вопрос будет передан операторам. Уверены, что хотите продолжить?",
		config.confirmQuestion
	);
}

async function forwardQuestion(chatID) {
	await bot.sendMessage(chatID, "Ваш вопрос передан");
}

// Receive message
bot.on("message", async (msg) => {
	const nameOfUser = msg.chat.first_name;
	const chatID = msg.chat.id;
	const messageText = msg?.text;

	console.log(msg);

	const senderID = msg.chat.id;
	const text = msg.text;

	// Is this operator replying to someone?
	if (pendingReplies.has(senderID)) {
		const targetUserID = pendingReplies.get(senderID);
		pendingReplies.delete(senderID); // clear after one reply

		await bot.sendMessage(targetUserID, `💬 Ответ от оператора:\n\n${text}`);
		await bot.sendMessage(senderID, `✅ Ответ отправлен.`);
		return;
	}

	// Awaiting question
	if (awaitingQuestion.has(chatID)) {
		awaitingQuestion.delete(chatID); // remove them from awaiting list

		// Forward to operator
		const operatorsChatIDs = config.operatorsIDs;
		operatorsChatIDs.forEach(async (id) => {
			await bot.sendMessage(
				id,
				`📩 Вопрос от ${nameOfUser} (@${
					msg.chat.username || "нет username"
				}):\n\n${messageText}`,
				{
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: "✉️ Ответить",
									callback_data: `replyTo_${chatID}`, // contains the user’s ID
								},
							],
						],
					},
				}
			);
		});

		await bot.sendMessage(
			chatID,
			"✅ Ваш вопрос передан операторам. Спасибо!"
		);
		await sendMainMenu(chatID);
		return;
	}

	if (messageText.toLowerCase() == "/start") {
		clearChat(chatID);

		await bot.sendMessage(
			chatID,
			`Приветствую, ${nameOfUser} \n \nЭто бот ЦРБ`
		);

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

	if (data == "schedule") {
		await sendSchedule(chatID);
	}
	if (data == "faq") {
		await sendFAQ(chatID);
	}
	if (data == "main") {
		await sendMainMenu(chatID);
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
});

bot.on("callback_query", async (query) => {
	const data = query.data;
	const operatorID = query.from.id;

	if (data.startsWith("replyTo_")) {
		const userChatID = data.split("_")[1];

		// Save that operator is now replying to this user
		pendingReplies.set(operatorID, userChatID);

		await bot.sendMessage(operatorID, `✍️ Напишите сообщение, которое будет отправлено пользователю.`);
		await bot.answerCallbackQuery(query.id);
	}
});

console.log("The bot started successfully");
