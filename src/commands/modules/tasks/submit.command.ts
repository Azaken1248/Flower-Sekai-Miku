import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
  type TextChannel,
} from "discord.js";

import { SPECIALIZED_ROLE_LABELS, type SpecializedRoleKey } from "../../../config/constants.js";
import { createMikuEmbed } from "../../../presentation/miku-embed.js";
import type { CommandExecutionContext } from "../../contracts/command-execution-context.js";
import type { SlashCommand } from "../../contracts/slash-command.js";

const resolveRoleLabel = (
  roleId: string,
  specializedRoles: Record<string, string>,
): string => {
  for (const [key, id] of Object.entries(specializedRoles)) {
    if (id === roleId) {
      return SPECIALIZED_ROLE_LABELS[key as SpecializedRoleKey] ?? key;
    }
  }

  return "Unknown";
};

export class SubmitCommand implements SlashCommand {
  readonly data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName("submit")
    .setDescription("Submit a pending task for review by an owner or mod.")
    .addStringOption((option) =>
      option
        .setName("assignment_id")
        .setDescription("The ID of the assignment to submit")
        .setRequired(true),
    );

  async execute(
    interaction: ChatInputCommandInteraction,
    context: CommandExecutionContext,
  ): Promise<void> {
    const assignmentId = interaction.options.getString("assignment_id", true);

    const result = await context.assignmentService.submitTask({
      assignmentId,
      discordUserId: interaction.user.id,
    });

    if (result.status !== "submitted" || !result.assignment) {
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Submission Desk",
            description: `> **Submission Failed:** ${result.reason ?? "Unknown reason."}`,
            tone: "wave",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const approvalChannelId = context.config.channels.approvalChannelId;
    if (!approvalChannelId) {
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Submission Desk",
            description: "> No approval channel is configured. Ask an owner to set `APPROVAL_CHANNEL_ID`.",
            tone: "wave",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    let approvalChannel: TextChannel;
    try {
      const fetched = await interaction.client.channels.fetch(approvalChannelId);
      if (!fetched || !fetched.isTextBased() || !("send" in fetched)) {
        throw new Error("Channel is not a sendable text channel.");
      }

      approvalChannel = fetched as TextChannel;
    } catch {
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Submission Desk",
            description: "> I could not reach the approval channel. Please notify an owner.",
            tone: "wave",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const assignment = result.assignment;
    const unixDeadline = Math.floor(assignment.deadline.getTime() / 1000);
    const roleLabel = resolveRoleLabel(assignment.roleId, context.config.roles.specialized);

    const approvalEmbed = createMikuEmbed({
      title: "Miku Submission Desk — Awaiting Review",
      description: `> <@${assignment.discordUserId}> has submitted a task for approval!`,
      tone: "sky",
      voiceWrap: false,
      fields: [
        {
          name: "◈ Task",
          value: `> **${assignment.taskName}**`,
          inline: true,
        },
        {
          name: "◈ Role",
          value: `> \` ${roleLabel} \``,
          inline: true,
        },
        {
          name: "◈ Deadline",
          value: `> <t:${unixDeadline}:F>\n> (<t:${unixDeadline}:R>)`,
          inline: true,
        },
        {
          name: "◈ Description",
          value: `> ${assignment.description || "No additional details provided."}`,
          inline: false,
        },
        {
          name: "◈ Assignment ID",
          value: `> \`${assignment.id}\``,
          inline: false,
        },
      ],
    });

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`submit_approve:${assignment.id}`)
        .setLabel("Approve")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`submit_deny:${assignment.id}`)
        .setLabel("Deny")
        .setStyle(ButtonStyle.Danger),
    );

    try {
      await approvalChannel.send({
        embeds: [approvalEmbed],
        components: [actionRow],
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown send failure.";
      context.logger.error("Failed to send approval embed to channel.", {
        approvalChannelId,
        assignmentId: assignment.id,
        errorMessage,
      });

      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Submission Desk",
            description: "> I could not send the approval request to the review channel. Please try again.",
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
          title: "Miku Submission Desk",
          description: `> Your task **${assignment.taskName}** has been submitted for review! An owner or mod will approve or deny it soon. 🌟`,
          tone: "bloom",
          fields: [
            {
              name: "◈ Assignment ID",
              value: `> \`${assignment.id}\``,
              inline: true,
            },
          ],
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }
}
