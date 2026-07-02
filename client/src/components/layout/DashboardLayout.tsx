import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Columns3,
  CalendarDays,
  MessageSquare,
  Settings,
  LogOut,
  Moon,
  Sun,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, cn } from "@/lib/utils";

const mainNavItems = [
  { to: "/", icon: LayoutDashboard, label: "Обзор" },
  { to: "/projects", icon: FolderKanban, label: "Проекты" },
  { to: "/orders", icon: Columns3, label: "Заказы" },
  { to: "/timeline", icon: CalendarDays, label: "Сроки" },
];

const extraNavItems = [
  { to: "/messages", icon: MessageSquare, label: "Чат" },
  { to: "/settings", icon: Settings, label: "Настройки" },
];

const allNavItems = [...mainNavItems, ...extraNavItems];

function NavLink({
  to,
  icon: Icon,
  label,
  active,
  mobile,
  onNavigate,
}: {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  active: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        "transition-all duration-200 cursor-pointer",
        mobile
          ? cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium min-w-[4rem]",
              active ? "text-foreground" : "text-muted-foreground"
            )
          : cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )
      )}
    >
      <Icon className={cn("shrink-0", mobile ? "h-5 w-5" : "h-4 w-4")} />
      <span className={mobile ? "leading-none" : undefined}>{label}</span>
    </Link>
  );
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setMoreOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (to: string) =>
    location.pathname === to || (to !== "/" && location.pathname.startsWith(to));

  const isExtraActive = extraNavItems.some((item) => isActive(item.to));

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-card/50 backdrop-blur-xl md:block">
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
            {allNavItems.map((item) => (
              <NavLink key={item.to} {...item} active={isActive(item.to)} />
            ))}
          </nav>

          <div className="space-y-4 border-t border-border pt-6">
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-accent cursor-pointer"
            >
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
                  {user?.role === "DEVELOPER" ? "Разработчик" : "Заказчик"} · Настройки
                </p>
              </div>
            </button>
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

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl safe-top md:hidden">
        <Link to="/" className="flex items-baseline gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Dev
          </span>
          <span className="text-lg font-bold tracking-tight">CRM</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => navigate("/settings")}
            aria-label="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="cursor-pointer"
            aria-label="Profile settings"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-[10px]">
                {getInitials(user?.profile?.firstName, user?.profile?.lastName)}
              </AvatarFallback>
            </Avatar>
          </button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </header>

      <main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0 md:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-10 md:py-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom navigation — 4 main + More */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-xl safe-bottom md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1">
          {mainNavItems.map((item) => (
            <NavLink key={item.to} {...item} active={isActive(item.to)} mobile />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium min-w-[4rem] cursor-pointer",
              isExtraActive ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="leading-none">Ещё</span>
          </button>
        </div>
      </nav>

      {/* Mobile more menu */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 cursor-pointer"
            onClick={() => setMoreOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-border bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold">Ещё</p>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMoreOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-2">
              {extraNavItems.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium cursor-pointer",
                    isActive(to) ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
