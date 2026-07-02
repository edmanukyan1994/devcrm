import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api, setToken } from "@/lib/api";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";

export function SettingsPage() {
  const { user, refresh } = useAuth();
  const { supported, subscribed, subscribe } = usePushNotifications();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.notifications.telegramLink().then((r) => setTelegramLink(r.link));
  }, []);

  const handleBecomeDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const { user: updated, token } = await api.auth.becomeDeveloper(inviteCode);
      setToken(token);
      await refresh();
      setSuccess(`Роль обновлена: ${updated.role === "DEVELOPER" ? "Разработчик" : updated.role}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    const ok = await subscribe();
    setSuccess(ok ? "Push-уведомления включены" : "Не удалось включить уведомления");
  };

  return (
    <div className="page-section max-w-xl">
      <header className="space-y-2">
        <p className="page-subtitle">Настройки</p>
        <h1 className="page-title">Профиль</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{user?.profile?.firstName} {user?.profile?.lastName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>{user?.email}</p>
          <p>Роль: {user?.role === "DEVELOPER" ? "Разработчик" : "Заказчик"}</p>
        </CardContent>
      </Card>

      {user?.role === "CLIENT" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Стать исполнителем</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Если вы разработчик, введите код приглашения для доступа к созданию проектов.
            </p>
            <form onSubmit={handleBecomeDeveloper} className="space-y-4">
              <div className="space-y-2">
                <Label>Код приглашения</Label>
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="devcrm-dev-2026"
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>Активировать</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Push-уведомления (PWA)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Уведомления на телефон и компьютер через установленное PWA-приложение.
          </p>
          {!supported && (
            <p className="text-sm text-muted-foreground">Браузер не поддерживает push-уведомления.</p>
          )}
          {supported && !subscribed && (
            <Button onClick={handlePush}>Включить уведомления</Button>
          )}
          {subscribed && <p className="text-sm text-success">Уведомления включены</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Telegram</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Дублирование уведомлений в Telegram (опционально).
          </p>
          {telegramLink ? (
            <Button asChild variant="outline">
              <a href={telegramLink} target="_blank" rel="noopener noreferrer">Подключить Telegram</a>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Telegram-бот не настроен на сервере.</p>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-success">{success}</p>}
    </div>
  );
}
