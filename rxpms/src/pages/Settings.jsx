import { useState, useEffect } from "react";
import { Building2, Bell, Lock, CreditCard, Save, Store, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs";
import api from "../lib/api";

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

export default function Settings() {
  const [activeTab, setActiveTab] = useState("pharmacy");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

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

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/settings", { settings });
      setNotification("Settings saved successfully");
    } catch (err) {
      setNotification("Failed to save settings");
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Settings</h1>
        <p className="text-[13px] text-slate-500">Manage your pharmacy and system preferences.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-fit">
          <TabsTrigger value="pharmacy" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Pharmacy</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pharmacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Pharmacy Information
              </CardTitle>
              <CardDescription>Update your pharmacy details and contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Pharmacy Name</Label>
                  <Input value={settings.pharmacy_name} onChange={(e) => handleChange("pharmacy_name", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>License Number</Label>
                  <Input value={settings.license_number} onChange={(e) => handleChange("license_number", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={settings.pharmacy_email} onChange={(e) => handleChange("pharmacy_email", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={settings.pharmacy_phone} onChange={(e) => handleChange("pharmacy_phone", e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address</Label>
                  <Input value={settings.pharmacy_address} onChange={(e) => handleChange("pharmacy_address", e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>About</Label>
                  <textarea
                    value={settings.pharmacy_about}
                    onChange={(e) => handleChange("pharmacy_about", e.target.value)}
                    className="min-h-[100px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure alerts for inventory, expiry, and sales.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "low_stock_alerts", label: "Low stock alerts", desc: "Get notified when products reach reorder level" },
                { key: "expiry_alerts", label: "Expiry alerts", desc: "Get notified before products expire" },
                { key: "daily_sales_summary", label: "Daily sales summary", desc: "Receive daily sales report via email" },
                { key: "new_user_registration", label: "New user registration", desc: "Notify admins when new users are added" },
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between rounded-lg border border-slate-200 p-4">
                  <div>
                    <p className="font-medium text-slate-800">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings[item.key] === "true"}
                    onChange={(e) => handleChange(item.key, e.target.checked ? "true" : "false")}
                    className="h-5 w-5 accent-primary"
                  />
                </div>
              ))}
              <Button onClick={handleSave} disabled={saving}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage passwords and access control.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" />
                </div>
              </div>
              <Button onClick={handleSave}>Update Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Payments</CardTitle>
              <CardDescription>Configure tax rates and payment methods.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input type="number" value={settings.tax_rate} onChange={(e) => handleChange("tax_rate", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input value={settings.currency} onChange={(e) => handleChange("currency", e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Accepted Payment Methods</Label>
                  <div className="flex gap-4">
                    {["Cash", "Card", "Mobile Money", "Insurance"].map((method) => (
                      <label key={method} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={(settings.payment_methods || "").split(",").includes(method)}
                          onChange={(e) => {
                            const current = (settings.payment_methods || "").split(",").filter(Boolean);
                            const updated = e.target.checked ? [...current, method] : current.filter((m) => m !== method);
                            handleChange("payment_methods", updated.join(","));
                          }}
                          className="h-4 w-4 accent-primary"
                        />
                        {method}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving}>Save Billing Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {notification && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-success px-4 py-3 text-white shadow-lg">
          <div className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            <span className="font-medium">{notification}</span>
          </div>
        </div>
      )}
    </div>
  );
}
