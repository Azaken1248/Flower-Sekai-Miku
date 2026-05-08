"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
class UserService {
    userRepository;
    assignmentRepository;
    taskReminderScheduleService;
    logger;
    constructor(userRepository, assignmentRepository, taskReminderScheduleService, logger) {
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
        this.taskReminderScheduleService = taskReminderScheduleService;
        this.logger = logger;
    }
    async onboard(discordId, username) {
        const existing = await this.userRepository.findByDiscordId(discordId);
        if (!existing) {
            const createdUser = await this.userRepository.create({ discordId, username });
            this.logger.info("Crew member onboarded.", { discordId });
            return {
                status: "created",
                user: createdUser,
            };
        }
        if (existing.isDeboarded) {
            const reactivatedUser = await this.userRepository.reactivate(discordId, username);
            if (!reactivatedUser) {
                throw new Error("Failed to reactivate deboarded user.");
            }
            this.logger.info("Deboarded crew member reactivated.", { discordId });
            return {
                status: "reactivated",
                user: reactivatedUser,
            };
        }
        return {
            status: "alreadyActive",
            user: existing,
        };
    }
    async deboard(discordId, message) {
        const existingUser = await this.userRepository.findByDiscordId(discordId);
        if (!existingUser) {
            return {
                status: "notFound",
                user: null,
            };
        }
        if (existingUser.isDeboarded) {
            return {
                status: "alreadyDeboarded",
                user: existingUser,
            };
        }
        const deboardedUser = await this.userRepository.markDeboarded(discordId, message);
        if (!deboardedUser) {
            throw new Error("Failed to deboard crew member.");
        }
        this.logger.info("Crew member deboarded.", { discordId });
        return {
            status: "deboarded",
            user: deboardedUser,
        };
    }
    async startHiatus(discordId, reason) {
        const user = await this.userRepository.findByDiscordId(discordId);
        if (!user) {
            return { status: "notFound", user: null, deadlinesAffected: 0 };
        }
        if (user.isDeboarded) {
            return { status: "deboarded", user, deadlinesAffected: 0 };
        }
        if (user.isOnHiatus) {
            return { status: "alreadyOnHiatus", user, deadlinesAffected: 0 };
        }
        const now = new Date();
        const updatedUser = await this.userRepository.setHiatus(discordId, true, now, reason ?? null);
        if (!updatedUser) {
            throw new Error("Failed to set hiatus status.");
        }
        // Cancel pending reminders — deadlines are frozen while on hiatus
        const pendingAssignments = await this.assignmentRepository.findPendingByDiscordUserId(discordId);
        for (const assignment of pendingAssignments) {
            try {
                await this.taskReminderScheduleService.cancelRemindersForAssignment(assignment.id);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Unknown reminder cancellation error.";
                this.logger.warn("Hiatus reminder cancellation failed for assignment.", {
                    assignmentId: assignment.id,
                    message,
                });
            }
        }
        this.logger.info("Crew member hiatus started.", { discordId, reason: reason ?? null });
        return { status: "started", user: updatedUser, deadlinesAffected: 0 };
    }
    async endHiatus(discordId) {
        const user = await this.userRepository.findByDiscordId(discordId);
        if (!user) {
            return { status: "notFound", user: null, deadlinesAffected: 0 };
        }
        if (!user.isOnHiatus) {
            return { status: "notOnHiatus", user, deadlinesAffected: 0 };
        }
        const hiatusStart = user.hiatusStartedAt;
        const now = new Date();
        const updatedUser = await this.userRepository.setHiatus(discordId, false, null, null);
        if (!updatedUser) {
            throw new Error("Failed to clear hiatus status.");
        }
        let deadlinesAffected = 0;
        if (hiatusStart) {
            const hiatusDurationMs = now.getTime() - hiatusStart.getTime();
            if (hiatusDurationMs > 0) {
                deadlinesAffected = await this.assignmentRepository.pushDeadlinesByDiscordUserId(discordId, hiatusDurationMs);
                this.logger.info("Pending deadlines unfrozen after hiatus.", {
                    discordId,
                    hiatusDurationMs,
                    deadlinesAffected,
                });
            }
        }
        // Reschedule reminders for the adjusted deadlines
        const pendingAssignments = await this.assignmentRepository.findPendingByDiscordUserId(discordId);
        for (const assignment of pendingAssignments) {
            try {
                await this.taskReminderScheduleService.rescheduleForAssignment(assignment);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Unknown reminder rescheduling error.";
                this.logger.warn("Hiatus reminder rescheduling failed for assignment.", {
                    assignmentId: assignment.id,
                    message,
                });
            }
        }
        this.logger.info("Crew member hiatus ended.", { discordId });
        return { status: "ended", user: updatedUser, deadlinesAffected };
    }
    async getProfile(discordId) {
        const user = await this.userRepository.findByDiscordId(discordId);
        if (!user) {
            return null;
        }
        const [total, pending, completed, late, excused] = await Promise.all([
            this.assignmentRepository.countByDiscordUserId(discordId),
            this.assignmentRepository.countByDiscordUserId(discordId, "PENDING"),
            this.assignmentRepository.countByDiscordUserId(discordId, "COMPLETED"),
            this.assignmentRepository.countByDiscordUserId(discordId, "LATE"),
            this.assignmentRepository.countByDiscordUserId(discordId, "EXCUSED"),
        ]);
        return {
            user,
            assignmentStats: {
                total,
                pending,
                completed,
                late,
                excused,
            },
        };
    }
    async getAvailableMembers() {
        const allActive = await this.userRepository.findAllActive();
        const pendingCounts = await Promise.all(allActive.map(async (user) => ({
            user,
            pending: await this.assignmentRepository.countByDiscordUserId(user.discordId, "PENDING"),
        })));
        const free = pendingCounts.filter((entry) => entry.pending === 0);
        const active = [];
        const hiatus = [];
        for (const entry of free) {
            if (entry.user.isOnHiatus) {
                hiatus.push(entry.user);
            }
            else {
                active.push(entry.user);
            }
        }
        return { active, hiatus };
    }
}
exports.UserService = UserService;
