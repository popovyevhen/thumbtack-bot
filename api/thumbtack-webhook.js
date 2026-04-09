export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const payload = req.body;
    const d = payload.data;

    // Парсинг данных
    const firstName = d?.customer?.firstName || '';
    const lastName = d?.customer?.lastName || '';
    const name = `${firstName} ${lastName}`.trim() || 'Unknown';
    const rawPhone = d?.customer?.phone || '';
    const jobType = d?.request?.category?.name || 'Unknown';
    const leadPrice = d?.leadPrice || 'Not specified';
    const estimate = d?.estimate?.total || 'Not specified';
    
    const address = `${d?.request?.location?.address1 || ''} ${d?.request?.location?.address2 || ''}`.trim();
    const city = d?.request?.location?.city || '';
    const state = d?.request?.location?.state || '';
    const zipCode = d?.request?.location?.zipCode || '';
    const fullLocation = `${address}, ${city}, ${state} ${zipCode}`.replace(/^, /, '').trim() || 'Unknown';

    const description = d?.request?.description || 'No description';
    
    let detailsText = 'No details';
    if (d?.request?.details && Array.isArray(d.request.details)) {
      detailsText = d.request.details.map(q => `• ${q.question}: ${q.answer}`).join('\n');
    }

    // Переводчик
    const translateToRu = async (text) => {
      if (!text || text === 'No description' || text === 'No details') return text;
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        return data[0].map(item => item[0]).join('');
      } catch (e) {
        return text + '\n(Translation error)';
      }
    };

    const translatedDescription = await translateToRu(description);
    const translatedDetails = await translateToRu(detailsText);

    const attachmentUrl = d?.request?.attachments?.[0]?.url 
      ? `\n<b>Photo:</b> <a href="${d.request.attachments[0].url}">View</a>` 
      : '';

    // Блок 1: Отправка в Telegram
    const telegramText = `🔔 <b>New Thumbtack Lead!</b>\n\n` +
                 `<b>Name:</b> ${name}\n` +
                 `<b>Phone:</b> ${rawPhone || 'Not provided'}\n` +
                 `<b>Job:</b> ${jobType}\n` +
                 `<b>Location:</b> ${fullLocation}\n` +
                 `<b>Price:</b> ${leadPrice} (Estimate: ${estimate})\n\n` +
                 `<b>Description (RU):</b>\n${translatedDescription}\n\n` +
                 `<b>Details (RU):</b>\n${translatedDetails}` +
                 attachmentUrl;

    const telegramPromise = fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: telegramText,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      })
    });

    // Блок 2: Отправка скрытого вебхука на твой телефон (MacroDroid)
    let macroPromise = Promise.resolve();
    if (rawPhone && process.env.MACRODROID_ID) {
      const cleanPhone = rawPhone.replace(/\D/g, ''); // Оставляем только цифры
      const macroUrl = `https://trigger.macrodroid.com/${process.env.MACRODROID_ID}/thumbtack?name=${encodeURIComponent(firstName)}&phone=${encodeURIComponent(cleanPhone)}&job=${encodeURIComponent(jobType)}`;
      macroPromise = fetch(macroUrl);
    }

    await Promise.allSettled([telegramPromise, macroPromise]);

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
