import {
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
} from "discord.js";

import { createMikuEmbed } from "../../../presentation/miku-embed";
import type { CommandExecutionContext } from "../../contracts/command-execution-context";
import type { SlashCommand } from "../../contracts/slash-command";

export class RemoveTaskCommand implements SlashCommand {
  readonly data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  readonly requiredRoleIds: readonly string[];

  constructor(adminRoleIds: readonly string[]) {
    this.requiredRoleIds = adminRoleIds;
    this.data = new SlashCommandBuilder()
      .setName("remove-task")
      .setDescription("Remove an existing task entirely from the roster. Admins only.")
      .addStringOption((option) =>
        option
          .setName("assignment_id")
          .setDescription("Assignment Mongo ID")
          .setRequired(true),
      );
  }

  async execute(
    interaction: ChatInputCommandInteraction,
    context: CommandExecutionContext,
  ): Promise<void> {
    const assignmentId = interaction.options.getString("assignment_id", true);
    const result = await context.assignmentService.removeTask(assignmentId);

    if (!result.success || !result.assignment) {
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Assignment Board",
            description: `> ${result.reason ?? "Task could not be removed."}`,
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
          title: "Miku Assignment Board",
          description: `> Task **${result.assignment.taskName}** has been removed entirely from the roster.`,
          tone: "mist",
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }
}