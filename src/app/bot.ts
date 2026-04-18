import { Client, Events } from "discord.js";

import type { InteractionCreateHandler } from "../commands/handlers/interaction-create-handler";
import type { CommandLoader } from "../commands/loader/command-loader";
import type { AppConfig } from "../config/env";
import type { Logger } from "../core/logger/logger";
import { connectToDatabase } from "../database/connection";
import type { CommandDeployer } from "../discord/command-deployer";
import type { ConfigCacheService } from "../services/config-cache-service";

export class FlowerSekaiBot {
  constructor(
    private readonly client: Client,
    private readonly config: AppConfig,
    private readonly logger: Logger,
    private readonly commandLoader: CommandLoader,
    private readonly commandDeployer: CommandDeployer,
    private readonly interactionCreateHandler: InteractionCreateHandler,
    private readonly configCacheService: ConfigCacheService,
  ) {}

  async start(): Promise<void> {
    await connectToDatabase(this.config.mongo.uri, this.logger);

    const startupGuildId = process.env.GUILD_ID?.trim() || this.config.discord.guildId;
    await this.configCacheService.loadConfig(startupGuildId);

    const commands = this.commandLoader.load();
    this.interactionCreateHandler.attach(this.client);

    this.client.once(Events.ClientReady, (readyClient) => {
      this.logger.info("Discord client ready.", {
        botTag: readyClient.user.tag,
      });

      void this.commandDeployer.deploy(commands).catch((error) => {
        const message = error instanceof Error ? error.message : "Unknown deploy failure.";
        this.logger.error("Failed to deploy slash commands.", { message });
      });
    });

    await this.client.login(this.config.discord.token);
  }
}
