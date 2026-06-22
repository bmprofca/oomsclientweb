import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider } from "./contexts/ThemeContext";

import MainLayout from "./components/layout/MainLayout";
import NotFound from "./pages/NotFound";
import ServerUnreachable from "./pages/ServerUnreachable";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Task from "./pages/Task";
import Firms from "./pages/Firms";
import Ledger from "./pages/Ledger";
import Updates from "./pages/updates";
import Chat from "./pages/Chat";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <Routes>
            {/* Redirect Root to Login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/login" element={<Login />} />

            {/* Server Unreachable Route */}
            <Route path="/server-error" element={<ServerUnreachable />} />

            {/* Routes with MainLayout */}
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/services" element={<Services />} />
              <Route path="/tasks" element={<Task />} />
              <Route path="/tasks/ongoing" element={<Task />} />
              <Route path="/tasks/completed" element={<Task />} />
              <Route path="/firms" element={<Firms />} />
              <Route path="/ledger" element={<Ledger />} />
              <Route path="/updates" element={<Updates />} />
              <Route path="/chat" element={<Chat />} />
            </Route>

            {/* 404 Not Found Route */}
            <Route path="/404" element={<NotFound />} />

            {/* Catch all route - redirect to 404 */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
