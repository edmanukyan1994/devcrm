import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Columns3,
  CalendarDays,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Обзор" },
  { to: "/projects", icon: FolderKanban, label: "Проекты" },
  { to: "/orders", icon: Columns3, label: "Заказы" },
  { to: "/timeline", icon: CalendarDays, label: "Сроки" },
];

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card/50 backdrop-blur-xl">
        <div className="flex h-full flex-col px-6 py-8">
          <div className="mb-12">
            <Link to="/" className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Dev
              </span>
              <span className="block text-2xl font-bold tracking-tight">CRM</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => {
              const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-4 border-t border-border pt-6">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {getInitials(user?.profile?.firstName, user?.profile?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.role === "DEVELOPER" ? "Разработчик" : "Заказчик"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={handleLogout} aria-label="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <main className="pl-64">
        <div className="mx-auto max-w-7xl px-10 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
