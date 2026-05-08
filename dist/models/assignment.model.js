"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentModel = void 0;
const mongoose_1 = require("mongoose");
const AssignmentSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "User" },
    discordUserId: { type: String, required: true },
    roleId: { type: String, required: true },
    taskName: { type: String, required: true },
    description: { type: String, default: "" },
    assignedAt: { type: Date, default: Date.now },
    deadline: { type: Date, required: true },
    status: {
        type: String,
        enum: ["PENDING", "COMPLETED", "LATE", "EXCUSED"],
        default: "PENDING",
    },
    isTimeLimited: { type: Boolean, default: false },
    extensionsGranted: { type: Number, default: 0 },
});
AssignmentSchema.index({ status: 1, deadline: 1 });
AssignmentSchema.index({ discordUserId: 1 });
exports.AssignmentModel = mongoose_1.models.Assignment ??
    (0, mongoose_1.model)("Assignment", AssignmentSchema);
