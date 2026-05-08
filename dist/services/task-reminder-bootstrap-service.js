"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskReminderBootstrapService = void 0;
class TaskReminderBootstrapService {
    assignmentRepository;
    taskReminderScheduleService;
    logger;
    constructor(assignmentRepository, taskReminderScheduleService, logger) {
        this.assignmentRepository = assignmentRepository;
        this.taskReminderScheduleService = taskReminderScheduleService;
        this.logger = logger;
    }
    async runStartupSync() {
        const pendingAssignments = await this.assignmentRepository.findAllPending();
        const summary = await this.taskReminderScheduleService.scheduleForAssignments(pendingAssignments);
        this.logger.info("Reminder bootstrap sync complete.", {
            pendingAssignments: summary.processed,
            remindersScheduled: summary.scheduled,
        });
    }
}
exports.TaskReminderBootstrapService = TaskReminderBootstrapService;
