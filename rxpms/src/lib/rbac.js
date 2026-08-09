const ROLE_PERMISSIONS = {
  Admin: [
    "/dashboard",
    "/pos",
    "/inventory",
    "/customers",
    "/expiry-alerts",
    "/returns",
    "/analytics",
    "/receipts",
    "/users",
    "/activity-log",
    "/barcodes",
    "/settings",
  ],
  Pharmacist: [
    "/dashboard",
    "/pos",
    "/inventory",
    "/customers",
    "/expiry-alerts",
    "/returns",
    "/analytics",
    "/receipts",
    "/barcodes",
  ],
  Cashier: [
    "/dashboard",
    "/pos",
    "/returns",
    "/receipts",
  ],
  "Inventory Manager": [
    "/dashboard",
    "/inventory",
    "/expiry-alerts",
    "/barcodes",
  ],
};

export function hasPermission(role, path) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(path);
}

export function getAllowedRoutes(role) {
  return ROLE_PERMISSIONS[role] || [];
}

export { ROLE_PERMISSIONS };
