"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrikeModel = void 0;
const mongoose_1 = require("mongoose");
const StrikeSchema = new mongoose_1.Schema({
    discordUserId: { type: String, required: true, index: true },
    issuedBy: { type: String, required: true },
    reason: { type: String, required: true, enum: ["late", "misc"] },
    detail: { type: String, default: null },
    issuedAt: { type: Date, default: Date.now },
    appealStatus: { type: String, default: "none", enum: ["none", "pending", "accepted", "denied"] },
    appealReason: { type: String, default: null },
    appealResolvedBy: { type: String, default: null },
});
exports.StrikeModel = mongoose_1.models.Strike ?? (0, mongoose_1.model)("Strike", StrikeSchema);
