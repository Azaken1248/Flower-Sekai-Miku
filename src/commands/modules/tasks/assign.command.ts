import {
  type ApplicationCommandOptionChoiceData,
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
} from "discord.js";

import {
  SPECIALIZED_ROLE_LABELS,
  type SpecializedRoleKey,
} from "../../../config/constants";
import { createMikuEmbed } from "../../../presentation/miku-embed";
import type { CommandExecutionContext } from "../../contracts/command-execution-context";
import type { SlashCommand } from "../../contracts/slash-command";

export class AssignCommand implements SlashCommand {
  readonly data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  readonly requiredRoleIds: readonly string[];

  constructor(
    adminRoleIds: readonly string[],
    private readonly specializedRoleIds: Record<SpecializedRoleKey, string>,
  ) {
    this.requiredRoleIds = adminRoleIds;
    this.data = this.createSlashData();
  }

  async execute(
    interaction: ChatInputCommandInteraction,
    context: CommandExecutionContext,
  ): Promise<void> {
    const targetUser = interaction.options.getUser("member", true);
    const roleId = interaction.options.getString("role", true);
    const taskName = interaction.options.getString("task", true);
    const description = interaction.options.getString("description") ?? "";
    const deadlineRaw = interaction.options.getString("deadline", true);
    const isTimeLimited = interaction.options.getBoolean("is_time_limited", true);

    const deadline = new Date(deadlineRaw);
    if (Number.isNaN(deadline.getTime())) {
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Assignment Board",
            description:
              "Invalid deadline format. Use an ISO date like 2026-05-01T18:00:00Z.",
            tone: "wave",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const assignment = await context.assignmentService.assignTask({
      discordUserId: targetUser.id,
      roleId,
      taskName,
      description,
      deadline,
      isTimeLimited,
    });

    const deadlineUnix = Math.floor(assignment.deadline.getTime() / 1000);
    const fields = [
      {
        name: "Assigned Member",
        value: `<@${targetUser.id}>`,
        inline: true,
      },
      {
        name: "Deadline",
        value: `<t:${deadlineUnix}:f>`,
        inline: true,
      },
      {
        name: "Time Limited",
        value: isTimeLimited ? "Yes" : "No",
        inline: true,
      },
    ];

    if (description.length > 0) {
      fields.push({
        name: "Task Notes",
        value: description.slice(0, 1024),
        inline: false,
      });
    }

    await interaction.reply({
      embeds: [
        createMikuEmbed({
          title: "Miku Assignment Board",
          description: `Miku assigned **${assignment.taskName}** successfully.`,
          tone: "bloom",
          fields,
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }

  private createSlashData(): SlashCommandBuilder | SlashCommandOptionsOnlyBuilder {
    const roleChoices: ApplicationCommandOptionChoiceData<string>[] = Object.entries(
      this.specializedRoleIds,
    ).map(([key, roleId]) => ({
      name: SPECIALIZED_ROLE_LABELS[key as SpecializedRoleKey],
      value: roleId,
    }));

    return new SlashCommandBuilder()
      .setName("assign")
      .setDescription("Assign a task to an onboarded crew member.")
      .addUserOption((option) =>
        option.setName("member").setDescription("Crew member to assign").setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("role")
          .setDescription("Specialized crew role for this assignment")
          .setRequired(true)
          .addChoices(...roleChoices),
      )
      .addStringOption((option) =>
        option
          .setName("task")
          .setDescription("Short task title")
          .setRequired(true)
          .setMaxLength(100),
      )
      .addStringOption((option) =>
        option
          .setName("deadline")
          .setDescription("Deadline in ISO format, e.g. 2026-05-01T18:00:00Z")
          .setRequired(true),
      )
      .addBooleanOption((option) =>
        option
          .setName("is_time_limited")
          .setDescription("True for strict assignments that should not auto-extend")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("description")
          .setDescription("Task details")
          .setRequired(false)
          .setMaxLength(1000),
      );
  }
}
