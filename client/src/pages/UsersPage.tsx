import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
