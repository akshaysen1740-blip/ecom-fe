export const isAdminRole = (role?: string | null) =>
  role?.toLowerCase() === "admin";
