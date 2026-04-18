import {
  type ChatInputCommandInteraction,
  Client,
  Events,
  MessageFlags,
  type Interaction,
} from "discord.js";

import type { Logger } from "../../core/logger/logger";
import { createMikuEmbed } from "../../presentation/miku-embed";
import { hasPermissionBypass } from "../../security/permission-bypass";
import type { CommandExecutionContext } from "../contracts/command-execution-context";
import { CommandRegistry } from "../registry/command-registry";

export class InteractionCreateHandler {
  constructor(
    private readonly commandRegistry: CommandRegistry,
    private readonly commandContext: CommandExecutionContext,
    private readonly logger: Logger,
  ) {}

  attach(client: Client): void {
    client.on(Events.InteractionCreate, async (interaction) => {
      await this.handleInteraction(interaction);
    });
  }

  private async handleInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command = this.commandRegistry.get(interaction.commandName);
    if (!command) {
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Command Desk",
            description: "This command is not available in my current runtime.",
            tone: "mist",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (command.requiredRoleIds?.length && !hasPermissionBypass(interaction.user.id)) {
      const hasPermission = await this.memberHasAnyRole(interaction, command.requiredRoleIds);
      if (!hasPermission) {
        await interaction.reply({
          embeds: [
            createMikuEmbed({
              title: "Miku Access Check",
              description: "You do not have permission to use this command.",
              tone: "wave",
            }),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    try {
      await command.execute(interaction, this.commandContext);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected command failure.";

      this.logger.error("Command execution failed.", {
        commandName: interaction.commandName,
        userId: interaction.user.id,
        message,
      });

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          embeds: [
            createMikuEmbed({
              title: "Miku Error Report",
              description: `Command failed: ${message}`,
              tone: "wave",
            }),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Error Report",
            description: `Command failed: ${message}`,
            tone: "wave",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  private async memberHasAnyRole(
    interaction: ChatInputCommandInteraction,
    requiredRoleIds: readonly string[],
  ): Promise<boolean> {
    if (!interaction.inGuild() || !interaction.guild) {
      return false;
    }

    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      return requiredRoleIds.some((roleId) => member.roles.cache.has(roleId));
    } catch (error) {
      this.logger.warn("Unable to resolve guild member role set.", {
        commandName: interaction.commandName,
        userId: interaction.user.id,
      });
      return false;
    }
  }
}
