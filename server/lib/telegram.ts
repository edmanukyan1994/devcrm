import crypto from "crypto";
import { prisma } from "./prisma";

export function generateTelegramLinkCode(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function ensureTelegramLinkCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramLinkCode: true },
  });

  if (user?.telegramLinkCode) return user.telegramLinkCode;

  const code = generateTelegramLinkCode();
  await prisma.user.update({
    where: { id: userId },
    data: { telegramLinkCode: code },
  });
  return code;
}

export async function linkTelegramByCode(code: string, chatId: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { telegramLinkCode: code },
  });

  if (!user) return false;

  await prisma.user.update({
    where: { id: user.id },
    data: { telegramChatId: chatId, telegramLinkCode: null },
  });

  return true;
}

export function getTelegramBotUsername(): string | null {
  return process.env.TELEGRAM_BOT_USERNAME || null;
}

export async function setupTelegramWebhook(baseUrl: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;
  await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl }),
  });
}
