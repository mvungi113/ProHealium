import { useEffect, useState } from "react";
import { RefreshCw, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { formatCurrency } from "../lib/utils";
import api from "../lib/api";

const ACTION_BADGE = {
  login: { label: "Login", variant: "info" },
  logout: { label: "Logout", variant: "secondary" },
  product_created: { label: "Product Created", variant: "success" },
  product_updated: { label: "Product Updated", variant: "warning" },
  product_deleted: { label: "Product Deleted", variant: "danger" },
  sale_created: { label: "Sale Created", variant: "success" },
  sale_updated: { label: "Sale Updated", variant: "warning" },
  sale_deleted: { label: "Sale Deleted", variant: "danger" },
  user_created: { label: "User Created", variant: "success" },
  user_updated: { label: "User Updated", variant: "warning" },
  user_deleted: { label: "User Deleted", variant: "danger" },
};

export default function ActivityLog() {
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const fetchLogs = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p };
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      const response = await api.get("/activity-logs", { params });
      setLogs(response.data.data);
      setPage(response.data.current_page);
      setLastPage(response.data.last_page);
    } catch (err) {
      console.error("Failed to load activity logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const formatAction = (action) => {
    return ACTION_BADGE[action] || { label: action.replace(/_/g, " "), variant: "secondary" };
  };

  const getChangesSummary = (log) => {
    if (!log.old_values && !log.new_values) return null;
    if (log.action.includes("deleted")) return null;

    const changes = [];
    if (log.new_values) {
      const keys = Object.keys(log.new_values).filter((k) => !["id", "created_at", "updated_at", "password"].includes(k));
      for (const key of keys.slice(0, 3)) {
        const val = log.new_values[key];
        if (val !== null && val !== undefined && val !== "") {
          changes.push(`${key}: ${typeof val === "number" ? formatCurrency(val) : val}`);
        }
      }
    }
    return changes.length > 0 ? changes.join(" | ") : null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Activity Log</h1>
        <p className="text-[13px] text-slate-500">Track all actions performed on the system.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>System Activity</CardTitle>
            <div className="flex gap-2">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-48"
                />
                <Button type="submit" variant="outline" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-primary-500"
              >
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="product_created">Product Created</option>
                <option value="product_updated">Product Updated</option>
                <option value="product_deleted">Product Deleted</option>
                <option value="sale_created">Sale Created</option>
                <option value="sale_updated">Sale Updated</option>
                <option value="sale_deleted">Sale Deleted</option>
                <option value="user_created">User Created</option>
                <option value="user_updated">User Updated</option>
                <option value="user_deleted">User Deleted</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : logs && logs.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const badge = formatAction(log.action);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-xs text-slate-500">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {log.user?.name || "System"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant} className="text-[10px] px-2 py-0.5">
                            {badge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{log.description}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-slate-400">
                          {getChangesSummary(log)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Page {page} of {lastPage}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => fetchLogs(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= lastPage}
                    onClick={() => fetchLogs(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-64 items-center justify-center text-slate-400">
              No activity logs found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
