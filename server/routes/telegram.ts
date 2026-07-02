import { Router } from "express";
import { linkTelegramByCode } from "../lib/telegram";

const router = Router();

router.post("/webhook", async (req, res) => {
  try {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secret && req.headers["x-telegram-bot-api-secret-token"] !== secret) {
      res.status(403).json({ ok: false });
      return;
    }

    const update = req.body;
    const message = update?.message;
    const text: string | undefined = message?.text;
    const chatId = message?.chat?.id?.toString();

    if (text?.startsWith("/start ") && chatId) {
      const code = text.replace("/start ", "").trim();
      const linked = await linkTelegramByCode(code, chatId);
      if (linked) {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "✅ DevCRM подключён. Вы будете получать уведомления здесь.",
          }),
        });
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    res.json({ ok: true });
  }
});

export default router;
