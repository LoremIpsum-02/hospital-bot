require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const config = require("./bot-config");
const { inlineKeyboard } = require("telegraf/markup");

// Инициализация бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, config.options);

// Команды боты
bot.setMyCommands([
	{
		command: "/start",
		description: "Запустить/перезапустить бота",
	},
	{
		command: "/faq",
		description: "Частые вопросы",
	},
])

const startOptions = {
	reply_markup: JSON.stringify({
		inline_keyboard:[
			[
				{
					text: "Button 1",
					callback_data: "callback_query",
				},
				{
					text: "Button 2",
					callback_data: "callback_query",
				},
			],
			[
				{
					text: "Button 3",
					callback_data: "callback_query",
				},
				{
					text: "Button 4",
					callback_data: "callback_query",
				},
			],
		]
	})
}

// Получение сообщения
bot.on("message", async (msg) => {
	const nameOfUser = msg.chat.first_name
	const chatId = msg.chat.id
	const messageText = msg?.text

	console.log(msg)

	if(messageText.toLowerCase() == "/start"){
		return bot.sendMessage(chatId, 
			`Приветствую, ${nameOfUser} \n \nЭто бот ЦРБ`, startOptions).then((sentMessage) => {
				bot.once("callback_query", (query) => {
					bot.deleteMessage(chatId, sentMessage.message_id)
				})
			})
	}
	else{
		return await bot.sendMessage(chatId, "Неизвестная команда")
	}
})

// bot.on("callback_query", async (msg) => {
// 	const chatId = msg.message.chat.id
// 	const data = msg.data
// 	console.log("Message : ", msg)

// 	return await bot.sendMessage(chatId, `Data : ${data}`)
// })

console.log("The bot started successfully");