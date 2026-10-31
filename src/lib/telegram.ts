/**
 * Telegram Bot API client for channel posting and admin alerts.
 */

interface TelegramPostOptions {
  htmlContent: string;
  mediaUrl?: string | null;
  botToken?: string;
  channelId?: string;
}

interface TelegramResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function publishToTelegram({
  htmlContent,
  mediaUrl,
  botToken = process.env.TELEGRAM_BOT_TOKEN,
  channelId = process.env.TELEGRAM_CHANNEL_ID,
}: TelegramPostOptions): Promise<TelegramResult> {
  if (!botToken || !channelId) {
    return {
      success: false,
      error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID is not configured in environment variables.',
    };
  }

  try {
    const baseUrl = `https://api.telegram.org/bot${botToken}`;

    if (mediaUrl && mediaUrl.trim() !== '') {
      // Send Photo with caption
      const response = await fetch(`${baseUrl}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channelId,
          photo: mediaUrl,
          caption: htmlContent,
          parse_mode: 'HTML',
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.description || 'Failed to send photo to Telegram');
      }

      return {
        success: true,
        messageId: String(data.result.message_id),
      };
    } else {
      // Send Text Message
      const response = await fetch(`${baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: channelId,
          text: htmlContent,
          parse_mode: 'HTML',
          disable_web_page_preview: false,
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.description || 'Failed to send message to Telegram');
      }

      return {
        success: true,
        messageId: String(data.result.message_id),
      };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Telegram Publish Error]:', message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Sends a private notification to the owner's Telegram account.
 */
export async function sendAdminNotification(
  message: string,
  botToken = process.env.TELEGRAM_BOT_TOKEN,
  adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
): Promise<void> {
  if (!botToken || !adminChatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
  } catch (err) {
    console.error('[Telegram Admin Notification Failed]:', err);
  }
}
