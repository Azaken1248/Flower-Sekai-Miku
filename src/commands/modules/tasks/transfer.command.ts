import {
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
} from "discord.js";

import { createMikuEmbed } from "../../../presentation/miku-embed";
import type { CommandExecutionContext } from "../../contracts/command-execution-context";
import type { SlashCommand } from "../../contracts/slash-command";

export class TransferTaskCommand implements SlashCommand {
  readonly data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  readonly requiredRoleIds: readonly string[];

  constructor(adminRoleIds: readonly string[]) {
    this.requiredRoleIds = adminRoleIds;
    this.data = new SlashCommandBuilder()
      .setName("transfer-task")
      .setDescription("Transfer a task to another active crew member. Admins only.")
      .addStringOption((option) =>
        option
          .setName("assignment_id")
          .setDescription("Assignment Mongo ID")
          .setRequired(true),
      )
      .addUserOption((option) =>
        option
          .setName("new_member")
          .setDescription("Crew member to receive the task")
          .setRequired(true),
      );
  }

  async execute(
    interaction: ChatInputCommandInteraction,
    context: CommandExecutionContext,
  ): Promise<void> {
    const assignmentId = interaction.options.getString("assignment_id", true);
    const newMember = interaction.options.getUser("new_member", true);

    const result = await context.assignmentService.transferTask(assignmentId, newMember.id);

    if (!result.success || !result.assignment) {
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Assignment Board",
            description: `> ${result.reason ?? "Task could not be transferred."}`,
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
          description: `> Task **${result.assignment.taskName}** has been successfully transferred.`,
          tone: "sky",
          fields: [
            {
              name: "◈ Previous Assignee",
              value: `> <@${result.oldDiscordUserId}>`,
              inline: true,
            },
            {
              name: "◈ New Assignee",
              value: `> <@${newMember.id}>`,
              inline: true,
            },
          ],
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }
}