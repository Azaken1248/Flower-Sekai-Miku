import { Client, Events, type TextBasedChannel } from "discord.js";

import type { InteractionCreateHandler } from "../commands/handlers/interaction-create-handler";
import type { CommandLoader } from "../commands/loader/command-loader";
import type { AppConfig } from "../config/env";
import {
  isLogSinkRegistrar,
  type LogEntry,
  type Logger,
} from "../core/logger/logger";
import { connectToDatabase } from "../database/connection";
import type { CommandDeployer } from "../discord/command-deployer";
import type { ConfigCacheService } from "../services/config-cache-service";
import type { TaskReminderBootstrapService } from "../services/task-reminder-bootstrap-service";
import type { TaskReminderDispatcherService } from "../services/task-reminder-dispatcher-service";

type SendableLogChannel = {
  send(payload: { content: string }): Promise<unknown>;
};

export class FlowerSekaiBot {
  private logsChannelCache: { channelId: string; channel: SendableLogChannel } | null = null;

  constructor(
    private readonly client: Client,
    private readonly config: AppConfig,
    private readonly logger: Logger,
    private readonly commandLoader: CommandLoader,
    private readonly commandDeployer: CommandDeployer,
    private readonly interactionCreateHandler: InteractionCreateHandler,
    private readonly configCacheService: ConfigCacheService,
    private readonly taskReminderBootstrapService: TaskReminderBootstrapService,
    private readonly taskReminderDispatcherService: TaskReminderDispatcherService,
  ) {}

  async start(): Promise<void> {
    await connectToDatabase(this.config.mongo.uri, this.logger);

    const startupGuildId = process.env.GUILD_ID?.trim() || this.config.discord.guildId;
    await this.configCacheService.loadConfig(startupGuildId);
    try {
      await this.taskReminderBootstrapService.runStartupSync();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown reminder bootstrap failure.";
      this.logger.error("Reminder bootstrap sync failed. Continuing startup.", {
        message,
      });
    }

    const commands = this.commandLoader.load();
    this.interactionCreateHandler.attach(this.client);

    this.client.once(Events.ClientReady, async (readyClient) => {
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

  private async enableDiscordLogForwarding(): Promise<void> {
    const logsChannelId = this.config.channels.logsChannelId;

    if (!logsChannelId) {
      this.logger.info("Discord log forwarding disabled. LOGS_CHANNEL_ID is not configured.");
      return;
    }

    if (!isLogSinkRegistrar(this.logger)) {
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

private async resolveLogsChannel(channelId: string): Promise<SendableLogChannel | null> {
    if (this.logsChannelCache?.channelId === channelId) {
      return this.logsChannelCache.channel;
    }

    try {
      const channel = await this.client.channels.fetch(channelId);

      if (
        !channel || 
        !channel.isTextBased() || 
        !("send" in channel) || 
        typeof channel.send !== "function"
      ) {
        this.logger.error("Configured logs channel is unavailable or not text-based.", {
          logsChannelId: channelId,
        });
        return null;
      }

      const sendableChannel = channel as SendableLogChannel;

      this.logsChannelCache = {
        channelId,
        channel: sendableChannel,
      };

      return sendableChannel;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown logs channel resolution failure.";
      this.logger.error("Failed to resolve configured logs channel.", {
        logsChannelId: channelId,
        message,
      });
      return null;
    }
  }

  private async sendLogEntryToChannel(
    channel: SendableLogChannel,
    entry: LogEntry,
  ): Promise<void> {
    const metadataText = entry.metadata ? this.safeStringify(entry.metadata) : "";
    const line = `[${entry.timestamp}] [${entry.scope}] [${entry.level}] ${entry.message}${metadataText ? ` ${metadataText}` : ""}`;

    const maxLineLength = 1900;
    const truncated =
      line.length > maxLineLength ? `${line.slice(0, maxLineLength - 3)}...` : line;

    await channel.send({
      content: `\`\`\`log\n${truncated}\n\`\`\``,
    });
  }

  private safeStringify(metadata: Record<string, unknown>): string {
    try {
      return JSON.stringify(metadata);
    } catch {
      return "{\"metadata\":\"serialization-failed\"}";
    }
  }
}
