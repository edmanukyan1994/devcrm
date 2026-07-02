import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api";

export function RegisterPage() {
  const { register, user } = useAuth();
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    company: "",
    inviteCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({
        ...form,
        role: isDeveloper ? "DEVELOPER" : "CLIENT",
        inviteCode: isDeveloper ? form.inviteCode : undefined,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 py-8 safe-top safe-bottom">
      <div className="w-full max-w-md space-y-8 sm:space-y-10">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">DevCRM</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Регистрация</h1>
        </div>

        <Card className="border-border/60">
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex gap-2 p-1 rounded-xl bg-muted">
                <button
                  type="button"
                  onClick={() => setIsDeveloper(false)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all cursor-pointer ${!isDeveloper ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                >
                  Заказчик
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeveloper(true)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all cursor-pointer ${isDeveloper ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                >
                  Исполнитель
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              {isDeveloper && (
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Код приглашения</Label>
                  <Input
                    id="inviteCode"
                    value={form.inviteCode}
                    onChange={(e) => setForm({ ...form, inviteCode: e.target.value })}
                    required
                    placeholder="Код от администратора"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="company">Компания</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "..." : "Создать аккаунт"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
