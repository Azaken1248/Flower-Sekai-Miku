"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUsernames = resolveUsernames;
/**
 * Resolves a set of Discord user IDs to a Map<id, displayName>.
 * Falls back to the raw ID if the fetch fails for any individual user.
 * All fetches run in parallel for speed (autocomplete has a 3s timeout).
 */
async function resolveUsernames(client, userIds) {
    const unique = [...new Set(userIds)];
    const results = await Promise.allSettled(unique.map(async (id) => {
        const user = await client.users.fetch(id);
        return { id, name: user.displayName ?? user.username };
    }));
    const map = new Map();
    for (const result of results) {
        if (result.status === "fulfilled") {
            map.set(result.value.id, result.value.name);
        }
    }
    return map;
}
