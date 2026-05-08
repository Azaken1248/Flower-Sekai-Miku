"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskReminderModel = void 0;
const mongoose_1 = require("mongoose");
const TaskReminderSchema = new mongoose_1.Schema({
    assignmentId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "Assignment" },
    discordUserId: { type: String, required: true },
    taskName: { type: String, required: true },
    deadline: { type: Date, required: true },
    scheduledFor: { type: Date, required: true },
    offsetMinutes: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: ["PENDING", "PROCESSING", "SENT", "FAILED", "CANCELLED"],
        default: "PENDING",
    },
    attemptCount: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, default: 5, min: 1 },
    lockedBy: { type: String, default: null },
    lockExpiresAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    lastError: { type: String, default: null },
}, {
    timestamps: true,
});
TaskReminderSchema.index({ status: 1, scheduledFor: 1, lockExpiresAt: 1, attemptCount: 1 }, { name: "task_reminder_dispatch_idx" });
TaskReminderSchema.index({ assignmentId: 1, offsetMinutes: 1 }, { unique: true, name: "task_reminder_assignment_offset_unique_idx" });
TaskReminderSchema.index({ discordUserId: 1, status: 1 }, { name: "task_reminder_user_status_idx" });
exports.TaskReminderModel = mongoose_1.models.TaskReminder ??
    (0, mongoose_1.model)("TaskReminder", TaskReminderSchema);
