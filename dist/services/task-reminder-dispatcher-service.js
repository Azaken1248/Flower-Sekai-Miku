"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskReminderDispatcherService = void 0;
const crypto_1 = require("crypto");
const miku_embed_1 = require("../presentation/miku-embed");
const ONE_HOUR_MS = 60 * 60 * 1000;
class TaskReminderDispatcherService {
    appConfig;
    taskReminderRepository;
    userRepository;
    discordClient;
    logger;
    workerId = `task-reminder-worker-${(0, crypto_1.randomUUID)()}`;
    intervalHandle = null;
    cycleInProgress = false;
    reminderChannelCache = null;
    constructor(appConfig, taskReminderRepository, userRepository, discordClient, logger) {
        this.appConfig = appConfig;
        this.taskReminderRepository = taskReminderRepository;
        this.userRepository = userRepository;
        this.discordClient = discordClient;
        this.logger = logger;
    }
    start() {
        if (!this.appConfig.reminders.enabled) {
            this.logger.info("Reminder dispatcher is disabled by configuration.");
            return;
        }
        if (this.intervalHandle) {
            return;
        }
        this.intervalHandle = setInterval(() => {
            void this.runDispatchCycle().catch((error) => {
                this.logCycleError(error);
            });
        }, this.appConfig.reminders.pollIntervalMs);
        this.intervalHandle.unref();
        void this.runDispatchCycle().catch((error) => {
            this.logCycleError(error);
        });
        this.logger.info("Reminder dispatcher started.", {
            pollIntervalMs: this.appConfig.reminders.pollIntervalMs,
            workerId: this.workerId,
        });
    }
    stop() {
        if (!this.intervalHandle) {
            return;
        }
        clearInterval(this.intervalHandle);
        this.intervalHandle = null;
        this.logger.info("Reminder dispatcher stopped.", {
            workerId: this.workerId,
        });
    }
    async runDispatchCycle() {
        if (this.cycleInProgress) {
            return;
        }
        this.cycleInProgress = true;
        try {
            const now = new Date();
            const dueReminders = await this.taskReminderRepository.claimDueReminders({
                now,
                workerId: this.workerId,
                batchSize: this.appConfig.reminders.batchSize,
                lockDurationMs: this.appConfig.reminders.lockDurationMs,
            });
            for (const reminder of dueReminders) {
                const user = await this.userRepository.findByDiscordId(reminder.discordUserId);
                if (user?.isOnHiatus) {
                    // Release the lock so it can be re-claimed after hiatus ends
                    await this.taskReminderRepository.markFailed(reminder.id, "User is on hiatus — reminder deferred.");
                    this.logger.info("Skipped reminder for user on hiatus.", {
                        reminderId: reminder.id,
                        discordUserId: reminder.discordUserId,
                    });
                    continue;
                }
                await this.dispatchReminder(reminder.id, {
                    discordUserId: reminder.discordUserId,
                    taskName: reminder.taskName,
                    deadline: reminder.deadline,
                    offsetMinutes: reminder.offsetMinutes,
                });
            }
        }
        catch (error) {
            this.logCycleError(error);
        }
        finally {
            this.cycleInProgress = false;
        }
    }
    logCycleError(error) {
        const message = error instanceof Error ? error.message : "Unknown reminder dispatch cycle failure.";
        this.logger.error("Reminder dispatch cycle failed.", {
            workerId: this.workerId,
            message,
        });
    }
    async dispatchReminder(reminderId, payload) {
        try {
            const reminderChannel = await this.resolveReminderChannel();
            const deadlineUnix = Math.floor(payload.deadline.getTime() / 1000);
            const msRemaining = payload.deadline.getTime() - Date.now();
            const tone = msRemaining <= ONE_HOUR_MS ? "wave" : "sky";
            await reminderChannel.send({
                content: `<@${payload.discordUserId}>`,
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Task Reminder",
                        description: `Task **${payload.taskName}** is waiting for your progress.`,
                        tone,
                        fields: [
                            {
                                name: "Deadline",
                                value: `<t:${deadlineUnix}:f> (<t:${deadlineUnix}:R>)`,
                                inline: false,
                            },
                            {
                                name: "Reminder Offset",
                                value: `${payload.offsetMinutes} minute(s) before deadline`,
                                inline: true,
                            },
                        ],
                    }),
                ],
            });
            await this.taskReminderRepository.markSent(reminderId, new Date());
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown reminder dispatch failure.";
            await this.taskReminderRepository.markFailed(reminderId, message);
            this.logger.warn("Failed to send task reminder.", {
                reminderId,
                discordUserId: payload.discordUserId,
                message,
            });
        }
    }
    async resolveReminderChannel() {
        const reminderChannelId = this.appConfig.channels.remindersChannelId;
        if (!reminderChannelId) {
            throw new Error("Reminders channel is not configured.");
        }
        if (this.reminderChannelCache?.channelId === reminderChannelId) {
            return this.reminderChannelCache.channel;
        }
        const channel = await this.discordClient.channels.fetch(reminderChannelId);
        if (!channel ||
            !channel.isTextBased() ||
            !("send" in channel) ||
            typeof channel.send !== "function") {
            throw new Error("Configured reminders channel is unavailable or not text-based.");
        }
        const sendableChannel = channel;
        this.reminderChannelCache = {
            channelId: reminderChannelId,
            channel: sendableChannel,
        };
        return sendableChannel;
    }
}
exports.TaskReminderDispatcherService = TaskReminderDispatcherService;
