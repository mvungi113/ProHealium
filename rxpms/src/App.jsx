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
import BarcodeGenerator from "./pages/BarcodeGenerator";
import { useStore } from "./store/appStore";
import { hasPermission } from "./lib/rbac";
import api from "./lib/api";
import { RefreshCw, ShieldAlert } from "lucide-react";

function ProtectedRoute({ children, requiredPath }) {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const authLoading = useStore((state) => state.authLoading);
  const currentUser = useStore((state) => state.currentUser);

  if (authLoading) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredPath && !hasPermission(currentUser?.role, requiredPath)) {
    return (
      <Layout>
        <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center text-center px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 mb-4">
            <ShieldAlert className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500 max-w-sm">
            You don't have permission to access this page. Your role (<span className="font-semibold text-primary">{currentUser?.role}</span>) doesn't include this resource.
          </p>
          <Navigate to="/dashboard" replace />
        </div>
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
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
        <Route path="/dashboard" element={<ProtectedRoute requiredPath="/dashboard"><Dashboard /></ProtectedRoute>} />
        <Route path="/pos" element={<ProtectedRoute requiredPath="/pos"><POS /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute requiredPath="/inventory"><Inventory /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute requiredPath="/customers"><Customers /></ProtectedRoute>} />
        <Route path="/expiry-alerts" element={<ProtectedRoute requiredPath="/expiry-alerts"><ExpiryAlerts /></ProtectedRoute>} />
        <Route path="/returns" element={<ProtectedRoute requiredPath="/returns"><Returns /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute requiredPath="/analytics"><Analytics /></ProtectedRoute>} />
        <Route path="/receipts" element={<ProtectedRoute requiredPath="/receipts"><Receipts /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute requiredPath="/users"><Users /></ProtectedRoute>} />
        <Route path="/activity-log" element={<ProtectedRoute requiredPath="/activity-log"><ActivityLog /></ProtectedRoute>} />
        <Route path="/barcodes" element={<ProtectedRoute requiredPath="/barcodes"><BarcodeGenerator /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute requiredPath="/settings"><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
