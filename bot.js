require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const config = require("./bot-config");

// Инициализация бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
	polling: true,
});

// Команды бота
bot.setMyCommands(config.commands);

const startOptions = {
	reply_markup: {
		inline_keyboard: [
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
		],
	},
};

// Texts
const FAQ_text = `
*❓ Частые вопросы*

*Как записаться к детскому стоматологу?*
└ Запись к детскому стоматологу открывается по понедельникам каждую неделю, запись через call-центр: 83012379938

*Как записаться к врачу офтальмологу?*
└ Запись к врачу офтальмологу открывается каждую пятницу, записаться можно по телефону 83012379938

*Нужно ли беременным записываться к терапевту для подписания осмотра?*
└ Да, нужно

*Где можно поставить печать о прохождении ФЛГ?*
└ Результаты ФЛГ готовы на следующий день, после прохождения ФЛГ

*Сколько стоит водительская справка?*
└ Категория В-915 рублей, категория С-1130 рублей

*Для прохождения маммография нужно направление?*
└ Да

*Как позвонить в терапевтическое отделение?*
└ 83012379963, доб 106

*Как узнать о поступлении льготного лекарственного препарата?*
└ Пройдите по ссылке https://t.me/petrcrb  в телеграмм канал Здоровье Джиды в теме "Аптека ГБУЗ Петропавловская ЦРБ" можете задать вопрос об интересующимся лекарственном препарате

*В какой день недели можно пройти диспансеризацию определенных групп  взрослого населения?*
└ В любой день, в кабинете профилактики
`;

const schedule_text = `
*🕒 Информация о режиме работы*

*Администрация:* Пн-Пт: 08-00 - 17:00

*Стационар:* круглосуточно

*Поликлиника:* Пн-Пт: 08-00 - 16:12

*Рентген кабинет:* 08:00-15:00

*Касса платных услуг:* 
Пн: 08:00-12:00 
Ср: 08:00-12:00, 13:00-16:00 
Пт: 08-00 - 12:00 
Вт, Чт: каса не работает

*Приём лабораторных анализов:* 
Пн-Пт: 08-00 - 10:00, выдача результатов с 15:00

*Регистратура поликлиники:* 
Пн-Пт: 08-00 - 16:12, Тел: 8-301-237-11-26



*Горячая линия по обращению граждан:* 
Тел: 8-301-243-50-38

*Приёмная главного врача:* 
Тел: 8(3012)37-99-63
`

// Сообщения
bot.on("message", async (msg) => {
	const nameOfUser = msg.chat.first_name;
	const chatId = msg.chat.id;
	const messageText = msg?.text;

	console.log(msg);

	if (messageText.toLowerCase() == "/start") {
		return await bot
			.sendMessage(
				chatId,
				`Приветствую, ${nameOfUser} \n \nЭто бот ЦРБ`,
				startOptions
			)
			.then((sentMessage) => {
				bot.once("callback_query", (query) => {
					bot.deleteMessage(chatId, sentMessage.message_id);
				});
			});
	} 
	else if (messageText.toLowerCase() == "/faq") {
		return await bot.sendMessage(chatId, FAQ_text, {
			parse_mode: "Markdown",
			disable_web_page_preview: true,
		});
	} 
	else if (messageText.toLowerCase() == "/schedule") {
		return await bot.sendMessage(chatId, schedule_text, {
			parse_mode: "Markdown",
			disable_web_page_preview: true,
		});
	} 
	else {
		return await bot.sendMessage(chatId, "Неизвестная команда");
	}
});

// Callback query
bot.on("callback_query", async (msg) => {
	const chatId = msg.message.chat.id;
	const data = msg.data;
	console.log("Message : ", msg);

	return await bot.sendMessage(chatId, `Data : ${data}`);
});

console.log("The bot started successfully");
