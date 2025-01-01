const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

// Настраиваем HTTP-сервер
const app = express();
const PORT = process.env.PORT || 3000; // Render требует, чтобы приложение слушало порт

app.get('/', (req, res) => {
  res.send('Telegram bot is running!');
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Ваш токен, выданный BotFather
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Ваш код бота
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привет! Я работаю через Render!');
});

if (!token) {
  console.error("Токен бота не найден. Убедитесь, что TELEGRAM_BOT_TOKEN задан в переменных окружения.");
  process.exit(1); // Завершаем процесс, если токен отсутствует
}

// ID или @username канала/группы
const channelId = '@ami_invite_chat';

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
