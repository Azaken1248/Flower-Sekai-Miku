import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
} from "discord.js";

import { createMikuEmbed } from "../../../presentation/miku-embed";
import type { CommandExecutionContext } from "../../contracts/command-execution-context";
import type { SlashCommand } from "../../contracts/slash-command";

const normalizeDeboardMessage = (message: string): string => {
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return "No farewell note was recorded.";
  }

  if (/different\s+sekai/i.test(trimmed)) {
    return "Moved to a different team.";
  }

  return trimmed;
};

export class ProfileCommand implements SlashCommand {
  readonly data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View a crew profile and assignment statistics.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to inspect (defaults to yourself)")
        .setRequired(false),
    );

  async execute(
    interaction: ChatInputCommandInteraction,
    context: CommandExecutionContext,
  ): Promise<void> {
    const targetUser = interaction.options.getUser("user") ?? interaction.user;
    const profile = await context.userService.getProfile(targetUser.id);

    if (!profile) {
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Profile Board",
            description: `I could not find a crew profile for <@${targetUser.id}> yet. Ask an owner to onboard them first.`,
            tone: "mist",
          }),
        ],
      });
      return;
    }

    const joinedUnix = Math.floor(profile.user.joinedAt.getTime() / 1000);
    const deboardedUnix = profile.user.deboardedAt
      ? Math.floor(profile.user.deboardedAt.getTime() / 1000)
      : null;
    const tone = profile.user.isDeboarded ? "mist" : "bloom";

    const embed = createMikuEmbed({
      title: "Miku Profile Board",
      description: `Here is the latest profile snapshot for <@${targetUser.id}>.`,
      tone,
      fields: [
        {
          name: "Member",
          value: `<@${targetUser.id}>`,
          inline: true,
        },
        {
          name: "Status",
          value: profile.user.isDeboarded ? "Deboarded" : "Active",
          inline: true,
        },
        {
          name: "Hiatus",
          value: profile.user.isOnHiatus ? "Yes" : "No",
          inline: true,
        },
        {
          name: "Strikes",
          value: String(profile.user.strikes),
          inline: true,
        },
        {
          name: "Joined",
          value: `<t:${joinedUnix}:f>`,
          inline: true,
        },
        {
          name: "Total Assignments",
          value: String(profile.assignmentStats.total),
          inline: true,
        },
        {
          name: "Pending",
          value: String(profile.assignmentStats.pending),
          inline: true,
        },
        {
          name: "Completed",
          value: String(profile.assignmentStats.completed),
          inline: true,
        },
        {
          name: "Late",
          value: String(profile.assignmentStats.late),
          inline: true,
        },
        {
          name: "Excused",
          value: String(profile.assignmentStats.excused),
          inline: true,
        },
      ],
    });

    if (deboardedUnix !== null) {
      embed.addFields({
        name: "Deboarded At",
        value: `<t:${deboardedUnix}:f>`,
        inline: true,
      });
      embed.addFields({
        name: "Deboard Note",
        value: normalizeDeboardMessage(profile.user.deboardedMessage).slice(0, 1024),
        inline: false,
      });
    }

    embed.setThumbnail(targetUser.displayAvatarURL({ size: 256 }));

    await interaction.reply({
      embeds: [embed],
    });
  }
}
