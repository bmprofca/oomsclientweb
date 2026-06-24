import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";

import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import ServerUnreachable from "./pages/ServerUnreachable";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Task from "./pages/Task";
import Profile from "./pages/Profile";
import Firms from "./pages/Firms";
import Documents from "./pages/Documents";
import Ledger from "./pages/Ledger";
import TaskDetails from "./pages/TaskDetails";
import FirmDetails from "./pages/FirmDetails";
import ServiceDetails from "./pages/ServiceDetails";
import ServiceRequests from "./pages/ServiceRequests";
import ServiceRequestDetails from "./pages/ServiceRequestDetails";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
            {/* Redirect Root to Login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/login" element={<Login />} />

            {/* Server Unreachable Route */}
            <Route path="/server-error" element={<ServerUnreachable />} />

            {/* Routes with MainLayout protected by auth */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/services" element={<Services />} />
              <Route path="/service/:service_id" element={<ServiceDetails />} />
              <Route path="/service-requests" element={<ServiceRequests />} />
              <Route path="/service-request/:request_id" element={<ServiceRequestDetails />} />
              <Route path="/tasks" element={<Task />} />
              <Route path="/tasks/ongoing" element={<Task />} />
              <Route path="/tasks/completed" element={<Task />} />
              <Route path="/task/:task_id" element={<TaskDetails />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/firms" element={<Firms />} />
              <Route path="/firm/:firm_id" element={<FirmDetails />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/ledger" element={<Ledger />} />
                <Route path="/updates" element={<Updates />} />
              </Route>
            </Route>

            {/* 404 Not Found Route */}
            <Route path="/404" element={<NotFound />} />

            {/* Catch all route - redirect to 404 */}
            <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
