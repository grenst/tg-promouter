const TelegramBot = require('node-telegram-bot-api');

// Ваш токен, выданный BotFather
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("Токен бота не найден. Убедитесь, что TELEGRAM_BOT_TOKEN задан в переменных окружения.");
  process.exit(1); // Завершаем процесс, если токен отсутствует
}

// ID или @username канала/группы
const channelId = '@ami_invite_chat';

// Создаем экземпляр бота
const bot = new TelegramBot(token, { polling: true });

// Функция для проверки срока подписки
function isSubscribedOverYear(joinedDateTimestamp) {
  const joinedDate = new Date(joinedDateTimestamp * 1000);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return joinedDate < oneYearAgo;
}

// Слушаем сообщения
bot.on('message', async (msg) => {
  const moderatorBotUsername = 'Rose'; // Имя модераторского бота
  const text = msg.text || '';
  const chatId = msg.chat.id;

  // Проверяем, что сообщение пришло от модераторского бота
  if (msg.from && msg.from.username === moderatorBotUsername) {
    // Ищем упоминания пользователей в тексте сообщения
    const mentionRegex = /@(\w+)/g;
    const mentions = [...text.matchAll(mentionRegex)];

    for (const match of mentions) {
      const username = match[1]; // Имя пользователя без @

      try {
        // Получаем информацию о пользователе в группе
        const chatMember = await bot.getChatMember(channelId, username);

        // Проверяем дату подписки
        const joinedDateTimestamp = chatMember.joined_date || 0;

        if (isSubscribedOverYear(joinedDateTimestamp)) {
          // Отправляем команду /approve
          await bot.sendMessage(chatId, `/approve @${username}`);
          console.log(`Пользователь @${username} одобрен.`);
        } else {
          console.log(`Пользователь @${username} подписан менее года.`);
        }
      } catch (err) {
        console.error(`Ошибка при проверке @${username}:`, err.message);
      }
    }
  }
});
