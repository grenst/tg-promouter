const TelegramBot = require('node-telegram-bot-api');

// Ваш токен, выданный BotFather
const token = 'YOUR_TELEGRAM_BOT_TOKEN';

// ID или @username канала/группы, где проверяем подписку.
// Например: const channelId = '@my_channel';
const channelId = '@your_channel_or_group';

// Создаем экземпляр бота
const bot = new TelegramBot(token, { polling: true });

// Функция-помощник для проверки "дольше года"
function isSubscribedOverYear(joinedDateTimestamp) {
  // joinedDateTimestamp чаще всего идет в секундах, конвертируем в миллисекунды
  const joinedDate = new Date(joinedDateTimestamp * 1000);

  // Если joinedDate = 0 или не пришёл – считаем, что данных нет
  if (joinedDate.getTime() === 0) {
    return false;
  }

  // Точка отсчёта – один год назад от сейчас
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return joinedDate < oneYearAgo;
}

// Слушаем все входящие сообщения
bot.on('message', async (msg) => {
  try {
    const chatId = msg.chat.id;
    const text = msg.text || '';

    // Ищем упоминания вида @username
    // При желании можно усложнить логику парсинга, если Rose присылает другой формат.
    const mentionRegex = /@(\w+)/g;
    const mentions = text.matchAll(mentionRegex);

    for (const match of mentions) {
      const username = match[1]; // строка без @
      
      // Попробуем получить информацию о пользователе в канале/группе
      // Внимание: getChatMember обычно требует numeric user_id, а не username.
      // Однако, если бот уже "знает" пользователя (он писал боту/в группу), то иногда можно указать строку с @.
      // Гарантированный способ – иметь user_id, например, из других сообщений/контекста.
      let chatMember;
      try {
        chatMember = await bot.getChatMember(channelId, username);
      } catch (err) {
        console.log('Не удалось получить getChatMember по username:', username, err);
        continue;
      }

      // В chatMember может быть поле `joined_date`, но в некоторых случаях оно пустое (0 или undefined).
      // Часто у каналов эта информация недоступна. Для супергрупп есть шансы :)
      const joinedDateTimestamp = chatMember.joined_date || 0;

      // Проверяем, что подписан дольше года
      if (isSubscribedOverYear(joinedDateTimestamp)) {
        // Отправляем в чат команду /approve @username
        await bot.sendMessage(chatId, `/approve @${username}`);
      }
    }
  } catch (error) {
    console.error('Ошибка при обработке сообщения:', error);
  }
});
