export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;

    // Пути к полям могут отличаться в зависимости от версии API Thumbtack.
    // При необходимости скорректируй ключи (payload.customerName и т.д.).
    const name = payload.customer?.name || payload.contact?.name || 'Неизвестно';
    const jobType = payload.category || payload.job?.type || 'Неизвестно';
    const location = payload.location || payload.job?.location || 'Неизвестно';
    const chatLink = payload.link || payload.url || 'Нет ссылки';

    const text = `🔔 <b>Новый лид Thumbtack!</b>\n\n<b>Имя:</b> ${name}\n<b>Работа:</b> ${jobType}\n<b>Локация:</b> ${location}\n<b>Чат:</b> <a href="${chatLink}">Открыть диалог</a>`;

    const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    if (!response.ok) {
      throw new Error(`Telegram API Error: ${response.statusText}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
