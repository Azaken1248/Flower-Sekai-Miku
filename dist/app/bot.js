"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowerSekaiBot = void 0;
const discord_js_1 = require("discord.js");
const logger_1 = require("../core/logger/logger");
const connection_1 = require("../database/connection");
const miku_embed_1 = require("../presentation/miku-embed");
class FlowerSekaiBot {
    client;
    config;
    logger;
    commandLoader;
    commandDeployer;
    interactionCreateHandler;
    configCacheService;
    taskReminderBootstrapService;
    taskReminderDispatcherService;
    logsChannelCache = null;
    constructor(client, config, logger, commandLoader, commandDeployer, interactionCreateHandler, configCacheService, taskReminderBootstrapService, taskReminderDispatcherService) {
        this.client = client;
        this.config = config;
        this.logger = logger;
        this.commandLoader = commandLoader;
        this.commandDeployer = commandDeployer;
        this.interactionCreateHandler = interactionCreateHandler;
        this.configCacheService = configCacheService;
        this.taskReminderBootstrapService = taskReminderBootstrapService;
        this.taskReminderDispatcherService = taskReminderDispatcherService;
    }
    async start() {
        await (0, connection_1.connectToDatabase)(this.config.mongo.uri, this.logger);
        const startupGuildId = process.env.GUILD_ID?.trim() || this.config.discord.guildId;
        await this.configCacheService.loadConfig(startupGuildId);
        try {
            await this.taskReminderBootstrapService.runStartupSync();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown reminder bootstrap failure.";
            this.logger.error("Reminder bootstrap sync failed. Continuing startup.", {
                message,
            });
        }
        const commands = this.commandLoader.load();
        this.interactionCreateHandler.attach(this.client);
        this.client.once(discord_js_1.Events.ClientReady, async (readyClient) => {
            this.logger.info("Discord client ready.", {
                botTag: readyClient.user.tag,
            });
            await this.enableDiscordLogForwarding();
            this.taskReminderDispatcherService.start();
            void this.commandDeployer.deploy(commands).catch((error) => {
                const message = error instanceof Error ? error.message : "Unknown deploy failure.";
                this.logger.error("Failed to deploy slash commands.", { message });
            });
        });
        await this.client.login(this.config.discord.token);
    }
    async enableDiscordLogForwarding() {
        const logsChannelId = this.config.channels.logsChannelId;
        if (!logsChannelId) {
            this.logger.info("Discord log forwarding disabled. LOGS_CHANNEL_ID is not configured.");
            return;
        }
        if (!(0, logger_1.isLogSinkRegistrar)(this.logger)) {
            this.logger.warn("Discord log forwarding unavailable. Logger does not support sink registration.");
            return;
        }
        const logsChannel = await this.resolveLogsChannel(logsChannelId);
        if (!logsChannel) {
            return;
        }
        this.logger.registerSink(async (entry) => {
            await this.sendLogEntryToChannel(logsChannel, entry);
        });
        this.logger.info("Discord log forwarding enabled.", {
            logsChannelId,
        });
    }
    async resolveLogsChannel(channelId) {
        if (this.logsChannelCache?.channelId === channelId) {
            return this.logsChannelCache.channel;
        }
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel ||
                !channel.isTextBased() ||
                !("send" in channel) ||
                typeof channel.send !== "function") {
                this.logger.error("Configured logs channel is unavailable or not text-based.", {
                    logsChannelId: channelId,
                });
                return null;
            }
            const sendableChannel = channel;
            this.logsChannelCache = {
                channelId,
                channel: sendableChannel,
            };
            return sendableChannel;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown logs channel resolution failure.";
            this.logger.error("Failed to resolve configured logs channel.", {
                logsChannelId: channelId,
                message,
            });
            return null;
        }
    }
    async sendLogEntryToChannel(channel, entry) {
        const toneByLevel = {
            INFO: "sky",
            WARN: "mist",
            ERROR: "wave",
        };
        const titleByLevel = {
            INFO: "Miku System Status 🌟",
            WARN: "Miku System Notice ⚠️",
            ERROR: "Miku System Alert 🚨",
        };
        const tone = toneByLevel[entry.level];
        const title = titleByLevel[entry.level];
        const unixTime = Math.floor(new Date(entry.timestamp).getTime() / 1000);
        const fields = [
            {
                name: "◈ Scope",
                value: `\`${entry.scope}\``,
                inline: true,
            },
            {
                name: "◈ Timestamp",
                value: `<t:${unixTime}:T>`,
                inline: true,
            },
        ];
        if (entry.metadata && Object.keys(entry.metadata).length > 0) {
            const metadataText = this.safeStringify(entry.metadata);
            const safeMetadata = metadataText.length > 1000
                ? `${metadataText.slice(0, 1000)}\n  ...[truncated]`
                : metadataText;
            fields.push({
                name: "◈ Context Metadata",
                value: `\`\`\`json\n${safeMetadata}\n\`\`\``,
                inline: false,
            });
        }
        const embed = (0, miku_embed_1.createMikuEmbed)({
            title,
            description: `> **${entry.message}**`,
            tone,
            fields,
            voiceWrap: false,
        });
        try {
            await channel.send({ embeds: [embed] });
        }
        catch (error) {
            this.logger.error("Failed to forward Miku log embed to Discord.", {
                errorMessage: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }
    safeStringify(metadata) {
        try {
            return JSON.stringify(metadata, null, 2);
        }
        catch {
            return "{\n  \"error\": \"serialization-failed\"\n}";
        }
    }
}
exports.FlowerSekaiBot = FlowerSekaiBot;
