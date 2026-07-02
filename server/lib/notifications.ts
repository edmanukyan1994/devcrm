import webpush from "web-push";
import { prisma } from "./prisma";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@devcrm.app";
  if (!publicKey || !privateKey) return;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || null;
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  ensureConfigured();
  if (!configured) return;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  const data = JSON.stringify(payload);

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          data
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      }
    })
  );
}

export async function createInAppNotification(
  userId: string,
  title: string,
  body: string,
  link?: string
) {
  return prisma.notification.create({
    data: { userId, title, body, link },
  });
}

export async function notifyUser(
  userId: string,
  title: string,
  body: string,
  link?: string
) {
  await createInAppNotification(userId, title, body, link);
  await sendPushToUser(userId, { title, body, url: link });
  await sendTelegramToUser(userId, `${title}\n${body}${link ? `\n${link}` : ""}`);
}

async function sendTelegramToUser(userId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { telegramChatId: true },
  });

  if (!user?.telegramChatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: user.telegramChatId,
      text,
      parse_mode: "HTML",
    }),
  });
}

export { sendTelegramToUser };
