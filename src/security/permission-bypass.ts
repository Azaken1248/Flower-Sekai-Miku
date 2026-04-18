const PERMISSION_BYPASS_USER_IDS = new Set<string>([
  "1213817849693478972",
]);

export const hasPermissionBypass = (userId: string): boolean => {
  return PERMISSION_BYPASS_USER_IDS.has(userId);
};
