export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    console.log("1. Данные от Thumbtack:", JSON.stringify(payload));

    const name = payload.customer?.name || payload.contact?.name || 'Неизвестно';
    const jobType = payload.category || payload.job?.type || 'Неизвестно';
    const location = payload.location || payload.job?.location || 'Неизвестно';
    const chatLink = payload.link || payload.url || 'Нет ссылки';

    const text = `Новый лид Thumbtack!\nИмя: ${name}\nРабота: ${jobType}\nЛокация: ${location}\nЧат: ${chatLink}`;

    console.log("2. Проверка CHAT_ID:", process.env.TELEGRAM_CHAT_ID);
    console.log("3. Проверка TOKEN (начало):", process.env.TELEGRAM_BOT_TOKEN ? process.env.TELEGRAM_BOT_TOKEN.substring(0, 5) : 'ОТСУТСТВУЕТ');

    const telegramPayload = {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: text
    };

    
    const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telegramPayload)
    });

    const errorData = await response.json();
    console.log("4. Ответ от Telegram:", JSON.stringify(errorData));

    if (!response.ok) {
      throw new Error(errorData.description || 'Unknown Telegram Error');
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({ error: error.message });
  }
}
