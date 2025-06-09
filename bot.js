require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const config = require("./bot-config");

// Инициализация бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, config.options);

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
	const chatId = msg.chat.id;
	const { text, buttons } = config.commands.start;

	const opts = {
		reply_markup: {
			inline_keyboard: buttons,
		},
	};

	bot.sendMessage(chatId, text, opts);
});

bot.onText(/\/info (.+)/, async (msg, match) => {
	const chatId = msg.chat.id;
	const userId = match[1];

	try {
		const user = await getUserFromDB(userId); // Ваша асинхронная функция
		bot.sendMessage(chatId, `Информация о пользователе: ${user.name}`);
	} catch (error) {
		bot.sendMessage(chatId, config.messages.error);
	}
});

// Обработчик callback-кнопок
bot.on("callback_query", (query) => {
	const chatId = query.message.chat.id;
	const data = query.data;

	switch (data) {
		case "btn1":
			bot.sendMessage(chatId, "Вы нажали кнопку 1!");
			break;
		case "btn2":
			bot.sendMessage(chatId, "Вы нажали кнопку 2!");
			break;
		default:
			bot.sendMessage(chatId, config.messages.unknown);
	}
});

// Обработчик текстовых сообщений
bot.on("message", (msg) => {
	if (msg.text.toString().toLowerCase().includes("привет")) {
		bot.sendMessage(msg.chat.id, "Привет, человек!");
	} else{
		bot.sendMessage(msg.chat.id, "Message received")
	}
});

// Обработка ошибок
bot.on("polling_error", (error) => {
	console.error(`Polling error: ${error}`);
});

console.log("The bot started successfully");