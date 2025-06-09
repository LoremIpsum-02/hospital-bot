module.exports = {
	// Основные настройки
	options: {
		polling: true, // Используем polling вместо вебхуков для разработки
	},

	// Команды бота
	commands: {
		start: {
			text: "🌟 Добро пожаловать! Выберите действие:",
			buttons: [
				[{ text: "Кнопка 1", callback_data: "btn1" }],
				[{ text: "Кнопка 2", callback_data: "btn2" }],
			],
		},
		help: {
			text: "📖 Это помощь по боту...",
		},
	},

	// Тексты сообщений
	messages: {
		error: "⚠️ Произошла ошибка",
		unknown: "🤷 Неизвестная команда",
	},
};
