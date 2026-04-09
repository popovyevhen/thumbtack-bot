export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;

    // Извлечение данных на основе реальной структуры Thumbtack
    const firstName = payload.data?.customer?.firstName || '';
    const lastName = payload.data?.customer?.lastName || '';
    const name = `${firstName} ${lastName}`.trim() || 'Неизвестно';
    
    const jobType = payload.data?.request?.category?.name || 'Неизвестно';
    const city = payload.data?.request?.location?.city || '';
    const state = payload.data?.request?.location?.state || '';
    const location = `${city}, ${state}`.trim() || 'Неизвестно';
    
    const estimate = payload.data?.estimate?.total || 'Не указан';
    const leadPrice = payload.data?.leadPrice || 'Не указана';

    const text = `Новый лид Thumbtack!\nИмя: ${name}\nРабота: ${jobType}\nЛокация: ${location}\nОценка: ${estimate}\nСписано за лид: ${leadPrice}`;

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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.description || 'Telegram API Error');
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({ error: error.message });
  }
}
