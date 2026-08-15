import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Users, X, RefreshCw, Eye, Search, Phone, Mail, MapPin, Calendar, Heart, Star, UserCheck, UserX } from "lucide-react";
import api from "../lib/api";
import { cn } from "../lib/utils";

const empty = { name: "", phone: "", email: "", date_of_birth: "", address: "", medical_notes: "" };

function StatCard({ icon: Icon, label, value, color, bgColor }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 p-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bgColor}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div>
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function CustomerDetails({ customer, onClose }) {
  const [tab, setTab] = useState("info");

  const initials = customer.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="border-b border-slate-100 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white text-lg font-bold">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{customer.name}</h2>
              <p className="text-xs text-slate-400">{customer.email || "No email"}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold",
                  customer.is_active ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"
                )}>
                  {customer.is_active ? "Active" : "Inactive"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  <Star className="h-2.5 w-2.5" /> {customer.loyalty_points} pts
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-100 px-6 shrink-0">
          {["info", "medical"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-4 py-3 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px",
                tab === t ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
              )}>
              {t === "info" ? "Contact Info" : "Medical Notes"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === "info" && (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Personal Details</h4>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-slate-400 shrink-0" />
                    <div><p className="text-[10px] font-semibold text-slate-400 uppercase">Full Name</p><p className="text-sm font-medium text-slate-800">{customer.name}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <div><p className="text-[10px] font-semibold text-slate-400 uppercase">Phone</p><p className="text-sm font-medium text-slate-800">{customer.phone || "—"}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <div><p className="text-[10px] font-semibold text-slate-400 uppercase">Email</p><p className="text-sm font-medium text-slate-800">{customer.email || "—"}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                    <div><p className="text-[10px] font-semibold text-slate-400 uppercase">Date of Birth</p><p className="text-sm font-medium text-slate-800">{customer.date_of_birth ? new Date(customer.date_of_birth).toLocaleDateString() : "—"}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <div><p className="text-[10px] font-semibold text-slate-400 uppercase">Address</p><p className="text-sm font-medium text-slate-800">{customer.address || "—"}</p></div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Loyalty Points</p>
                    <p className="text-2xl font-bold text-primary">{customer.loyalty_points}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "medical" && (
            <div className="space-y-4">
              {customer.medical_notes ? (
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="h-4 w-4 text-red-400" />
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Medical Notes</h4>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{customer.medical_notes}</p>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <Heart className="mx-auto mb-2 h-8 w-8 text-slate-200" />
                  <p className="text-sm">No medical notes recorded</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [notification, setNotification] = useState(null);
  const [viewCustomer, setViewCustomer] = useState(null);

  const fetchCustomers = async () => {
    try { const res = await api.get("/customers", { params: search ? { search } : {} }); setCustomers(res.data.data || res.data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const showNotification = (msg, type = "success") => { setNotification({ msg, type }); setTimeout(() => setNotification(null), 3000); };
  const openAdd = () => { setEditing(null); setForm(empty); setIsDialogOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, phone: c.phone || "", email: c.email || "", date_of_birth: c.date_of_birth || "", address: c.address || "", medical_notes: c.medical_notes || "" }); setIsDialogOpen(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/customers/${editing.id}`, form); showNotification("Customer updated"); }
      else { await api.post("/customers", form); showNotification("Customer added"); }
      await fetchCustomers();
    } catch (err) { showNotification(err.response?.data?.message || "Failed", "error"); }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try { await api.delete(`/customers/${deleteConfirm.id}`); showNotification("Customer deleted"); await fetchCustomers(); } catch { showNotification("Failed", "error"); }
    setDeleteConfirm(null);
  };

  const activeCount = customers.filter((c) => c.is_active).length;
  const inactiveCount = customers.filter((c) => !c.is_active).length;
  const totalPoints = customers.reduce((sum, c) => sum + (c.loyalty_points || 0), 0);

  return (
    <div className="space-y-5">
      {loading && (
        <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading customers...
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Customers</h1>
        <p className="text-[13px] text-slate-500">Manage customer profiles and loyalty.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Customers" value={customers.length} bgColor="bg-primary/10" color="text-primary" />
        <StatCard icon={UserCheck} label="Active" value={activeCount} bgColor="bg-green-50" color="text-green-600" />
        <StatCard icon={UserX} label="Inactive" value={inactiveCount} bgColor="bg-slate-100" color="text-slate-500" />
        <StatCard icon={Star} label="Total Points" value={totalPoints.toLocaleString()} bgColor="bg-amber-50" color="text-amber-600" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90 transition-all active:scale-[0.98]">
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Loyalty Pts</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const initials = c.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {initials}
                        </div>
                        <span className="font-semibold text-slate-800">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.phone ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-600"><Phone className="h-3 w-3 text-slate-400" />{c.phone}</span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {c.email ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-600"><Mail className="h-3 w-3 text-slate-400" />{c.email}</span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                        <Star className="h-3 w-3" /> {c.loyalty_points}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
                        c.is_active ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setViewCustomer(c)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(c)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteConfirm(c)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {customers.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Users className="mb-3 h-12 w-12 text-slate-200" />
            <p className="font-medium">No customers yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your first customer to get started</p>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {viewCustomer && <CustomerDetails customer={viewCustomer} onClose={() => setViewCustomer(null)} />}

      {/* Add/Edit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsDialogOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-800">{editing ? "Edit Customer" : "Add Customer"}</h2>
              <button onClick={() => setIsDialogOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 px-6 py-5 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Date of Birth</label>
                <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Address</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Medical Notes</label>
                <textarea value={form.medical_notes} onChange={(e) => setForm({ ...form, medical_notes: e.target.value })} rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none" />
              </div>
            </form>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button onClick={() => setIsDialogOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-primary/90 transition-all">
                {editing ? "Update" : "Add"} Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-center text-lg font-bold text-slate-800">Delete Customer</h3>
            <p className="mt-2 text-center text-sm text-slate-500">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={cn("fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-5 py-3 text-white shadow-xl",
          notification.type === "success" ? "bg-emerald-600" : "bg-red-600"
        )}>
          <span className="font-medium text-sm">{notification.msg}</span>
          <button onClick={() => setNotification(null)}><X className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}
