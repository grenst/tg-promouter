const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Уведомление, что сервер работает
app.get('/', (req, res) => {
  res.send('Telegram bot is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Ваш токен бота из переменной окружения
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// ID закрытой группы
const groupId = -1002490477834;

// Функция для проверки срока подписки
function isSubscribedOverYear(joinedDateTimestamp) {
  const joinedDate = new Date(joinedDateTimestamp * 1000);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return joinedDate < oneYearAgo;
}

// Слушаем сообщения в группе
bot.on('message', async (msg) => {
  const moderatorBotUsername = 'Rose'; // Имя модераторского бота
  const text = msg.text || '';
  const chatId = msg.chat.id;

  // Проверяем, что сообщение из нужной группы
  if (chatId !== groupId) return;

  // Проверяем, что сообщение пришло от модераторского бота
  if (msg.from && msg.from.username === moderatorBotUsername) {
    console.log(`Сообщение от модератора ${moderatorBotUsername}:`, text);

    // Ищем упоминания пользователей в тексте сообщения
    const mentionRegex = /@(\w+)/g;
    const mentions = [...text.matchAll(mentionRegex)];

    for (const match of mentions) {
      const username = match[1]; // Имя пользователя без @

      try {
        // Получаем информацию о пользователе в группе
        const chatMember = await bot.getChatMember(groupId, username);

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
