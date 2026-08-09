import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Inventory from "./pages/Inventory";
import Analytics from "./pages/Analytics";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import ActivityLog from "./pages/ActivityLog";
import Customers from "./pages/Customers";
import ExpiryAlerts from "./pages/ExpiryAlerts";
import Returns from "./pages/Returns";
import Receipts from "./pages/Receipts";
import Notifications from "./pages/Notifications";
import BarcodeGenerator from "./pages/BarcodeGenerator";
import { useStore } from "./store/appStore";
import api from "./lib/api";
import { RefreshCw } from "lucide-react";

function ProtectedRoute({ children }) {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const authLoading = useStore((state) => state.authLoading);

  if (authLoading) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/" replace />;
}

function App() {
  const token = localStorage.getItem("rxpm_token");
  const login = useStore((state) => state.login);
  const setAuthLoading = useStore((state) => state.setAuthLoading);

  useEffect(() => {
    if (token) {
      api.get("/user")
        .then((res) => login(res.data, token))
        .catch(() => {
          localStorage.removeItem("rxpm_token");
          setAuthLoading(false);
        });
    } else {
      setAuthLoading(false);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/expiry-alerts" element={<ProtectedRoute><ExpiryAlerts /></ProtectedRoute>} />
        <Route path="/returns" element={<ProtectedRoute><Returns /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/receipts" element={<ProtectedRoute><Receipts /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/activity-log" element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
        <Route path="/barcodes" element={<ProtectedRoute><BarcodeGenerator /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
