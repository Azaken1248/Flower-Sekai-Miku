import {
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
} from "discord.js";

import { createMikuEmbed } from "../../../presentation/miku-embed";
import type { CommandExecutionContext } from "../../contracts/command-execution-context";
import type { SlashCommand } from "../../contracts/slash-command";

export class ExtensionCommand implements SlashCommand {
  readonly data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName("extension")
    .setDescription("Request a deadline extension for one of your assignments.")
    .addStringOption((option) =>
      option
        .setName("assignment_id")
        .setDescription("Assignment Mongo id")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("new_deadline")
        .setDescription("New deadline in ISO format, e.g. 2026-06-01T12:00:00Z")
        .setRequired(true),
    );

  async execute(
    interaction: ChatInputCommandInteraction,
    context: CommandExecutionContext,
  ): Promise<void> {
    const assignmentId = interaction.options.getString("assignment_id", true);
    const newDeadlineRaw = interaction.options.getString("new_deadline", true);
    const newDeadline = new Date(newDeadlineRaw);

    if (Number.isNaN(newDeadline.getTime())) {
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Extension Desk",
            description: "Invalid date format. Use an ISO date like 2026-06-01T12:00:00Z.",
            tone: "wave",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const result = await context.assignmentService.requestExtension({
      assignmentId,
      discordUserId: interaction.user.id,
      newDeadline,
    });

    if (!result.allowed || !result.assignment) {
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Extension Desk",
            description: result.reason ?? "Extension request denied.",
            tone: "mist",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const deadlineUnix = Math.floor(result.assignment.deadline.getTime() / 1000);

    await interaction.reply({
      embeds: [
        createMikuEmbed({
          title: "Miku Extension Desk",
          description: `Miku approved the extension. New deadline: <t:${deadlineUnix}:f>.`,
          tone: "sky",
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }
}
