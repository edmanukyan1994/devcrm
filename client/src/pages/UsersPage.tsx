import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User } from "@/types";

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);

  const load = () => api.auth.users().then((r) => setUsers(r.users));

  useEffect(() => {
    if (currentUser?.role === "DEVELOPER") load();
  }, [currentUser]);

  const handleRoleChange = async (userId: string, role: "CLIENT" | "DEVELOPER") => {
    await api.auth.updateRole(userId, role);
    load();
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Удалить пользователя ${name}?`)) return;
    await api.auth.deleteUser(userId);
    load();
  };

  if (currentUser?.role !== "DEVELOPER") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page-section">
      <header className="space-y-2">
        <p className="page-subtitle">Администрирование</p>
        <h1 className="page-title">Пользователи</h1>
      </header>

      <div className="space-y-3">
        {users.map((u) => (
          <Card key={u.id}>
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">
                  {u.profile?.firstName} {u.profile?.lastName}
                  {u.id === currentUser?.id && (
                    <span className="ml-2 text-xs text-muted-foreground">(вы)</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                {u.profile?.company && (
                  <p className="text-xs text-muted-foreground">{u.profile.company}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select
                value={u.role}
                onValueChange={(v) => handleRoleChange(u.id, v as "CLIENT" | "DEVELOPER")}
                disabled={u.id === currentUser?.id}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEVELOPER">Исполнитель</SelectItem>
                  <SelectItem value="CLIENT">Заказчик</SelectItem>
                </SelectContent>
              </Select>
              {u.id !== currentUser?.id && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive shrink-0"
                  onClick={() =>
                    handleDelete(u.id, `${u.profile?.firstName} ${u.profile?.lastName}`)
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
