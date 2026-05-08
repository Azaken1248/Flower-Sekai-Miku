"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskReminderScheduleService = void 0;
class TaskReminderScheduleService {
    config;
    taskReminderRepository;
    logger;
    constructor(config, taskReminderRepository, logger) {
        this.config = config;
        this.taskReminderRepository = taskReminderRepository;
        this.logger = logger;
    }
    async scheduleForAssignment(assignment) {
        if (!this.config.reminders.enabled || assignment.status !== "PENDING") {
            return 0;
        }
        const reminders = this.buildReminderInputs(assignment, new Date());
        await this.taskReminderRepository.createMany(reminders);
        if (reminders.length > 0) {
            this.logger.info("Task reminders scheduled.", {
                assignmentId: assignment.id,
                reminderCount: reminders.length,
            });
        }
        return reminders.length;
    }
    async rescheduleForAssignment(assignment) {
        await this.taskReminderRepository.cancelPendingForAssignment(assignment.id);
        return this.scheduleForAssignment(assignment);
    }
    async cancelRemindersForAssignment(assignmentId) {
        await this.taskReminderRepository.cancelPendingForAssignment(assignmentId);
        this.logger.info("Task reminders cancelled.", { assignmentId });
    }
    async scheduleForAssignments(assignments) {
        let scheduledCount = 0;
        for (const assignment of assignments) {
            scheduledCount += await this.scheduleForAssignment(assignment);
        }
        return {
            processed: assignments.length,
            scheduled: scheduledCount,
        };
    }
    buildReminderInputs(assignment, now) {
        const deadlineTimestamp = assignment.deadline.getTime();
        if (deadlineTimestamp <= now.getTime()) {
            return [];
        }
        return this.config.reminders.offsetMinutes
            .map((offsetMinutes) => {
            const scheduledFor = new Date(deadlineTimestamp - offsetMinutes * 60_000);
            return {
                assignmentId: assignment.id,
                discordUserId: assignment.discordUserId,
                taskName: assignment.taskName,
                deadline: assignment.deadline,
                scheduledFor,
                offsetMinutes,
                maxAttempts: this.config.reminders.maxAttempts,
            };
        })
            .filter((reminder) => reminder.scheduledFor.getTime() > now.getTime());
    }
}
exports.TaskReminderScheduleService = TaskReminderScheduleService;
