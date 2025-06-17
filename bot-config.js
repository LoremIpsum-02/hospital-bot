module.exports = {
	commands: [
		{
			command: "/start",
			description: "Перезапустить бота | Главное меню",
		},
		{
			command: "/faq",
			description: "Частые вопросы",
		},
		{
			command: "/schedule",
			description: "Информация о режиме работы",
		},
	],

	mainMenu: {
		inlineButtons: {
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: "Информация о режиме работы",
							callback_data: "schedule",
						},
					],
					[
						{
							text: "Частые вопросы",
							callback_data: "faq",
						},
					],
				],
			},
		},

		backButton: {
			reply_markup: {
				inline_keyboard: [
					[
						{
							text: "Назад",
							callback_data: "main",
						},
					],
				],
			},
		},
	},

	confirmQuestion: {
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: "Да",
						callback_data: "question_yes",
					},
					{
						text: "Отмена",
						callback_data: "question_cancel",
					},
				],
			],
		},
	},

	operatorsIDs: [1443379546]
};
