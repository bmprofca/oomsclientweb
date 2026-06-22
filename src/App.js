import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ServiceOptionsProvider } from "./contexts/ConstantOptionsContext";
import { ThemeProvider } from "./contexts/ThemeContext";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import MainLayout from "./components/layout/MainLayout";
import NotFound from "./pages/NotFound";
import ServerUnreachable from "./pages/ServerUnreachable";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ServiceOptionsProvider>
            <ToastProvider>
              <Routes>
                {/* Redirect Root to Login */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Public Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />

                {/* Server Unreachable - Public Route */}
                <Route path="/server-error" element={<ServerUnreachable />} />

                {/* Protected Routes with MainLayout */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                  </Route>
                </Route>

                {/* 404 Not Found Route */}
                <Route path="/404" element={<NotFound />} />

                {/* Catch all route - redirect to 404 */}
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
            </ToastProvider>
          </ServiceOptionsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
