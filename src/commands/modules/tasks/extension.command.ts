import {
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
} from "discord.js";

import { createMikuEmbed } from "../../../presentation/miku-embed";
import { parseNaturalDate } from "../../../utils/date-parser";
import type { CommandExecutionContext } from "../../contracts/command-execution-context";
import type { SlashCommand } from "../../contracts/slash-command";

export class ExtensionCommand implements SlashCommand {
  readonly data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName("extend")
    .setDescription("Request a deadline extension for one of your pending tasks.")
    .addStringOption((option) =>
      option
        .setName("assignment_id")
        .setDescription("The ID of the assignment to extend")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("new_deadline")
        .setDescription('e.g., "tomorrow", "in 3 days", "Oct 24", "next friday"')
        .setRequired(true),
    );

  async execute(
    interaction: ChatInputCommandInteraction,
    context: CommandExecutionContext,
  ): Promise<void> {
    const assignmentId = interaction.options.getString("assignment_id", true);
    const deadlineInput = interaction.options.getString("new_deadline", true);

    const newDeadline = parseNaturalDate(deadlineInput);

    if (!newDeadline || newDeadline.getTime() <= Date.now()) {
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Extension Board",
            description: `> I couldn't understand the date \`${deadlineInput}\`, or it's in the past. Try something like \`"in 3 days"\`!`,
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
            title: "Miku Extension Board",
            description: `> **Extension Denied:** ${result.reason ?? "Unknown reason."}`,
            tone: "wave",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const unixDeadline = Math.floor(result.assignment.deadline.getTime() / 1000);

    await interaction.reply({
      embeds: [
        createMikuEmbed({
          title: "Miku Extension Board",
          description: `> Miku approved the extension! Keep your momentum going! 🌟`,
          tone: "bloom",
          fields: [
            {
              name: "◈ New Deadline",
              value: `> <t:${unixDeadline}:F>\n> (<t:${unixDeadline}:R>)`,
              inline: true,
            },
            {
              name: "◈ Extensions Used",
              value: `> \` ${result.assignment.extensionsGranted} \``,
              inline: true,
            },
          ],
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }
}