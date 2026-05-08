"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuildConfigModel = void 0;
const mongoose_1 = require("mongoose");
const GuildConfigSchema = new mongoose_1.Schema({
    guildId: { type: String, required: true, unique: true },
    ownerRoleIds: { type: [String], default: [] },
    managerRoleIds: { type: [String], default: [] },
    baseCrewRoleId: { type: String, required: true },
    specializedRoles: { type: Map, of: String, default: {} },
    extensionRules: {
        maxStandardExtensions: { type: Number, default: null, min: 0 },
        blockTimeLimitedAutoExtension: { type: Boolean, default: true },
    },
}, {
    timestamps: true,
});
exports.GuildConfigModel = mongoose_1.models.GuildConfig ??
    (0, mongoose_1.model)("GuildConfig", GuildConfigSchema);
