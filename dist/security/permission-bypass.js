"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermissionBypass = void 0;
const PERMISSION_BYPASS_USER_IDS = new Set([
    "1213817849693478972",
]);
const hasPermissionBypass = (userId) => {
    return PERMISSION_BYPASS_USER_IDS.has(userId);
};
exports.hasPermissionBypass = hasPermissionBypass;
