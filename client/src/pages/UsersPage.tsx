import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { isOwner } from "@/lib/roles";
import { ROLE_LABELS, type Role, type User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);

  const load = () => api.auth.users().then((r) => setUsers(r.users));

  useEffect(() => {
    if (isOwner(currentUser?.role)) load();
  }, [currentUser]);

  const handleRoleChange = async (userId: string, role: Role) => {
    await api.auth.updateRole(userId, role);
    load();
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Удалить пользователя ${name}?`)) return;
    await api.auth.deleteUser(userId);
    load();
  };

  if (!isOwner(currentUser?.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page-section">
      <header className="space-y-2">
        <p className="page-subtitle">Администрирование</p>
        <h1 className="page-title">Пользователи</h1>
        <p className="text-sm text-muted-foreground">
          Управление доступом: роли, удаление аккаунтов.
        </p>
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
                  onValueChange={(v) => handleRoleChange(u.id, v as Role)}
                  disabled={u.id === currentUser?.id}
                >
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
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
