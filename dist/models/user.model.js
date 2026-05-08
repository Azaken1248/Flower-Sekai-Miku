"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    discordId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    strikes: { type: Number, default: 0, min: 0, max: 3 },
    isOnHiatus: { type: Boolean, default: false },
    hiatusStartedAt: { type: Date, default: null },
    hiatusReason: { type: String, default: null },
    isDeboarded: { type: Boolean, default: false },
    deboardedAt: { type: Date, default: null },
    deboardedMessage: { type: String, default: "Moved to a different team" },
    joinedAt: { type: Date, default: Date.now },
    assignments: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Assignment" }],
});
exports.UserModel = mongoose_1.models.User ?? (0, mongoose_1.model)("User", UserSchema);
