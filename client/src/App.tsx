import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { OrderDetailPage } from "@/pages/OrderDetailPage";
import { TaskDetailPage } from "@/pages/TaskDetailPage";
import { MessagesPage } from "@/pages/MessagesPage";
import { TimelinePage } from "@/pages/TimelinePage";
import { FinancePage } from "@/pages/FinancePage";
import { UsersPage } from "@/pages/UsersPage";
import { SearchPage } from "@/pages/SearchPage";
import { HelpPage } from "@/pages/HelpPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <PwaInstallPrompt />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="tasks/:id" element={<TaskDetailPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="messages/:id" element={<MessagesPage />} />
              <Route path="timeline" element={<TimelinePage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="help" element={<HelpPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
