import { useState, useEffect } from "react";
import {
  Building2, Bell, Lock, CreditCard, Save, Store, RefreshCw, User,
  Mail, Phone, MapPin, FileText, Shield, Eye, EyeOff, Check, X,
  Download, Trash2, AlertTriangle, ReceiptText, Globe,
} from "lucide-react";
import api from "../lib/api";
import { useStore } from "../store/appStore";
import { cn } from "../lib/utils";

const DEFAULT_SETTINGS = {
  pharmacy_name: "ProHealium Pharmacy",
  license_number: "PH-2025-001234",
  pharmacy_email: "info@prohealium.com",
  pharmacy_phone: "+233 20 123 4567",
  pharmacy_address: "123 Health Avenue, Accra, Ghana",
  pharmacy_about: "ProHealium Pharmacy provides quality healthcare products and professional pharmaceutical services.",
  low_stock_alerts: "true",
  expiry_alerts: "true",
  daily_sales_summary: "false",
  new_user_registration: "true",
  tax_rate: "10",
  currency: "USD ($)",
  payment_methods: "Cash,Card",
};

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
        checked ? "bg-primary" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export default function Settings() {
  const user = useStore((s) => s.currentUser);
  const [activeSection, setActiveSection] = useState("pharmacy");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get("/settings");
        setSettings((prev) => ({ ...prev, ...response.data }));
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSettingsChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.put("/settings", { settings });
      showToast("Settings saved successfully");
    } catch (err) {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast("Please fill in all password fields", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    setChangingPw(true);
    try {
      await api.put("/user/password", {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      showToast("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change password", "error");
    } finally {
      setChangingPw(false);
    }
  };

  const sections = [
    { id: "pharmacy", label: "Pharmacy Info", icon: Store },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "billing", label: "Billing & Payments", icon: CreditCard },
    { id: "data", label: "Data & Privacy", icon: FileText },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Settings</h1>
        <p className="text-[13px] text-slate-500">Manage your pharmacy and system preferences.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            {/* User Card */}
            <div className="border-b border-slate-100 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white font-bold text-sm">
                  {user?.name?.charAt(0) || "A"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || "Admin"}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || "admin@prohealium.com"}</p>
                  <span className="inline-flex mt-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase">
                    {user?.role || "admin"}
                  </span>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="p-2">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      activeSection === s.id
                        ? "bg-primary/10 text-primary"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-5">
          {/* Pharmacy Info */}
          {activeSection === "pharmacy" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Pharmacy Information</h3>
                      <p className="text-[11px] text-slate-500">Update your pharmacy details and contact information</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Pharmacy Name</label>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={settings.pharmacy_name}
                          onChange={(e) => handleSettingsChange("pharmacy_name", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">License Number</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={settings.license_number}
                          onChange={(e) => handleSettingsChange("license_number", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={settings.pharmacy_email}
                          onChange={(e) => handleSettingsChange("pharmacy_email", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={settings.pharmacy_phone}
                          onChange={(e) => handleSettingsChange("pharmacy_phone", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-600">Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={settings.pharmacy_address}
                          onChange={(e) => handleSettingsChange("pharmacy_address", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-600">About</label>
                      <textarea
                        value={settings.pharmacy_about}
                        onChange={(e) => handleSettingsChange("pharmacy_about", e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition-all",
                    saving
                      ? "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
                      : "bg-primary text-white shadow-primary/25 hover:bg-primary/90"
                  )}
                >
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                      <Bell className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Notification Preferences</h3>
                      <p className="text-[11px] text-slate-500">Configure alerts for inventory, expiry, and sales</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {[
                    { key: "low_stock_alerts", label: "Low Stock Alerts", desc: "Get notified when products reach reorder level", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-100" },
                    { key: "expiry_alerts", label: "Expiry Alerts", desc: "Get notified before products expire", icon: Trash2, color: "text-red-600", bg: "bg-red-100" },
                    { key: "daily_sales_summary", label: "Daily Sales Summary", desc: "Receive daily sales report via email", icon: ReceiptText, color: "text-green-600", bg: "bg-green-100" },
                    { key: "new_user_registration", label: "New User Registration", desc: "Notify admins when new users are added", icon: User, color: "text-blue-600", bg: "bg-blue-100" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.key} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", item.bg)}>
                            <Icon className={cn("h-5 w-5", item.color)} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                            <p className="text-[11px] text-slate-500">{item.desc}</p>
                          </div>
                        </div>
                        <Toggle
                          checked={settings[item.key] === "true"}
                          onChange={(val) => handleSettingsChange(item.key, val ? "true" : "false")}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition-all",
                    saving
                      ? "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
                      : "bg-primary text-white shadow-primary/25 hover:bg-primary/90"
                  )}
                >
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </div>
          )}

          {/* Security */}
          {activeSection === "security" && (
            <div className="space-y-5">
              {/* Password */}
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                      <Lock className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Change Password</h3>
                      <p className="text-[11px] text-slate-500">Update your account password regularly</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">New Password</label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showNewPw ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Confirm New Password</label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <X className="h-3 w-3" /> Passwords do not match
                    </p>
                  )}
                  {newPassword && newPassword.length >= 8 && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Strong password
                    </p>
                  )}
                </div>
              </div>

              {/* Session Info */}
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                      <Globe className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Active Session</h3>
                      <p className="text-[11px] text-slate-500">Your current login session details</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid gap-4 sm:grid-cols-2 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Device</p>
                      <p className="font-medium text-slate-800">{navigator.userAgent.includes("Windows") ? "Windows PC" : "Unknown Device"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Browser</p>
                      <p className="font-medium text-slate-800">{navigator.userAgent.split(" ").pop()?.split("/")[0] || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Logged in as</p>
                      <p className="font-medium text-slate-800">{user?.email || "admin@prohealium.com"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Role</p>
                      <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">{user?.role || "admin"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleChangePassword}
                  disabled={changingPw}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition-all",
                    changingPw
                      ? "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
                      : "bg-primary text-white shadow-primary/25 hover:bg-primary/90"
                  )}
                >
                  {changingPw ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {changingPw ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          )}

          {/* Billing */}
          {activeSection === "billing" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Billing & Payments</h3>
                      <p className="text-[11px] text-slate-500">Configure tax rates and payment methods</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Tax Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={settings.tax_rate}
                        onChange={(e) => handleSettingsChange("tax_rate", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Currency</label>
                      <select
                        value={settings.currency}
                        onChange={(e) => handleSettingsChange("currency", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      >
                        <option>USD ($)</option>
                        <option>EUR (&euro;)</option>
                        <option>GBP (&pound;)</option>
                        <option>GHS (&#8373;)</option>
                        <option>NGN (&#8358;)</option>
                        <option>KES (KSh)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Accepted Payment Methods</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {["Cash", "Card", "Mobile Money", "Insurance"].map((method) => {
                        const isActive = (settings.payment_methods || "").split(",").includes(method);
                        return (
                          <button
                            key={method}
                            onClick={() => {
                              const current = (settings.payment_methods || "").split(",").filter(Boolean);
                              const updated = isActive ? current.filter((m) => m !== method) : [...current, method];
                              handleSettingsChange("payment_methods", updated.join(","));
                            }}
                            className={cn(
                              "flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-all",
                              isActive
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                            )}
                          >
                            {isActive && <Check className="h-4 w-4" />}
                            {method}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition-all",
                    saving
                      ? "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed"
                      : "bg-primary text-white shadow-primary/25 hover:bg-primary/90"
                  )}
                >
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save Billing Settings"}
                </button>
              </div>
            </div>
          )}

          {/* Data & Privacy */}
          {activeSection === "data" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <FileText className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Data & Privacy</h3>
                      <p className="text-[11px] text-slate-500">Manage your data and export options</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <Download className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Export All Data</p>
                        <p className="text-[11px] text-slate-500">Download a copy of all pharmacy data</p>
                      </div>
                    </div>
                    <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                      Export CSV
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                        <ReceiptText className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Print Receipts History</p>
                        <p className="text-[11px] text-slate-500">Print all receipts from local storage</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const receipts = JSON.parse(localStorage.getItem("pos_receipts") || "[]");
                        if (receipts.length === 0) {
                          showToast("No receipts in local storage", "error");
                          return;
                        }
                        const w = window.open("", "_blank");
                        w.document.write("<html><head><title>Receipts</title><style>body{font-family:monospace;padding:20px;font-size:12px;} .receipt{border:1px solid #ccc;padding:10px;margin-bottom:10px;}</style></head><body>");
                        receipts.forEach((r) => {
                          w.document.write('<div class="receipt"><strong>' + r.invoice + '</strong> - ' + r.date + '<br>Total: $' + r.total + '<br>Items: ' + r.items.length + '</div>');
                        });
                        w.document.write("</body></html>");
                        w.document.close();
                        w.print();
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Print
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                        <Globe className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Clear Local Storage</p>
                        <p className="text-[11px] text-slate-500">Clear cached products, cart, and offline data</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("This will clear all offline data. Continue?")) {
                          localStorage.removeItem("pos_products");
                          localStorage.removeItem("pos_cart");
                          localStorage.removeItem("pos_receipts");
                          showToast("Local storage cleared");
                        }
                      }}
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all",
          toast.type === "error" ? "bg-red-500" : "bg-green-500"
        )}>
          {toast.type === "error" ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
