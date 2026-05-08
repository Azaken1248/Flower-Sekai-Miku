"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseTaskReminderRepository = void 0;
const mongoose_1 = require("mongoose");
const task_reminder_model_1 = require("../../models/task-reminder.model");
const MAX_ERROR_LENGTH = 1024;
class MongooseTaskReminderRepository {
    async createMany(reminders) {
        if (reminders.length === 0) {
            return;
        }
        const validReminders = reminders.filter((reminder) => mongoose_1.Types.ObjectId.isValid(reminder.assignmentId));
        await Promise.all(validReminders.map(async (reminder) => {
            const assignmentObjectId = new mongoose_1.Types.ObjectId(reminder.assignmentId);
            await task_reminder_model_1.TaskReminderModel.updateOne({
                assignmentId: assignmentObjectId,
                offsetMinutes: reminder.offsetMinutes,
            }, {
                $setOnInsert: {
                    assignmentId: assignmentObjectId,
                    discordUserId: reminder.discordUserId,
                    taskName: reminder.taskName,
                    deadline: reminder.deadline,
                    scheduledFor: reminder.scheduledFor,
                    offsetMinutes: reminder.offsetMinutes,
                    maxAttempts: reminder.maxAttempts,
                    status: "PENDING",
                    attemptCount: 0,
                    lockedBy: null,
                    lockExpiresAt: null,
                    sentAt: null,
                    lastError: null,
                },
            }, {
                upsert: true,
            }).exec();
        }));
    }
    async claimDueReminders(input) {
        const claimedReminders = [];
        for (let index = 0; index < input.batchSize; index += 1) {
            const lockExpiry = new Date(input.now.getTime() + input.lockDurationMs);
            const claimedReminder = await task_reminder_model_1.TaskReminderModel.findOneAndUpdate({
                status: { $in: ["PENDING", "FAILED"] },
                scheduledFor: { $lte: input.now },
                $expr: { $lt: ["$attemptCount", "$maxAttempts"] },
                $or: [{ lockExpiresAt: null }, { lockExpiresAt: { $lte: input.now } }],
            }, {
                $set: {
                    status: "PROCESSING",
                    lockedBy: input.workerId,
                    lockExpiresAt: lockExpiry,
                    lastError: null,
                },
                $inc: {
                    attemptCount: 1,
                },
            }, {
                new: true,
                sort: {
                    scheduledFor: 1,
                },
            }).exec();
            if (!claimedReminder) {
                break;
            }
            claimedReminders.push(claimedReminder);
        }
        return claimedReminders;
    }
    async markSent(reminderId, sentAt) {
        if (!mongoose_1.Types.ObjectId.isValid(reminderId)) {
            return;
        }
        await task_reminder_model_1.TaskReminderModel.updateOne({ _id: reminderId }, {
            $set: {
                status: "SENT",
                sentAt,
                lockExpiresAt: null,
                lockedBy: null,
                lastError: null,
            },
        }).exec();
    }
    async markFailed(reminderId, errorMessage) {
        if (!mongoose_1.Types.ObjectId.isValid(reminderId)) {
            return;
        }
        await task_reminder_model_1.TaskReminderModel.updateOne({ _id: reminderId }, {
            $set: {
                status: "FAILED",
                lockExpiresAt: null,
                lockedBy: null,
                lastError: errorMessage.slice(0, MAX_ERROR_LENGTH),
            },
        }).exec();
    }
    async cancelPendingForAssignment(assignmentId) {
        if (!mongoose_1.Types.ObjectId.isValid(assignmentId)) {
            return;
        }
        await task_reminder_model_1.TaskReminderModel.updateMany({
            assignmentId: new mongoose_1.Types.ObjectId(assignmentId),
            status: {
                $in: ["PENDING", "FAILED", "PROCESSING"],
            },
        }, {
            $set: {
                status: "CANCELLED",
                lockExpiresAt: null,
                lockedBy: null,
            },
        }).exec();
    }
}
exports.MongooseTaskReminderRepository = MongooseTaskReminderRepository;
