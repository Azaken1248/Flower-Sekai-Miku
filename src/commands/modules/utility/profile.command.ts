import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
} from "discord.js";

import { SPECIALIZED_ROLE_LABELS, type SpecializedRoleKey } from "../../../config/constants";
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
            description: `> I could not find a crew profile for <@${targetUser.id}> yet. Ask an owner to onboard them first.`,
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

    const statusText = profile.user.isDeboarded ? "Deboarded" : "Active";
    const hiatusText = profile.user.isOnHiatus ? "Yes" : "No";
    const strikeText = `${profile.user.strikes}/3`;

    const assignedRoles: string[] = [];

    if (interaction.inGuild() && interaction.guild) {
      try {
        const member = await interaction.guild.members.fetch(targetUser.id);
        
        if (member.roles.cache.has(context.config.roles.owners)) {
          assignedRoles.push("Owner");
        }
        if (member.roles.cache.has(context.config.roles.mods)) {
          assignedRoles.push("Manager");
        }

        for (const [key, roleId] of Object.entries(context.config.roles.specialized)) {
          if (member.roles.cache.has(roleId)) {
            assignedRoles.push(SPECIALIZED_ROLE_LABELS[key as SpecializedRoleKey]);
          }
        }
      } catch {
      }
    }

    const rolesText = assignedRoles.length > 0 ? assignedRoles.join(", ") : "Standard Crew";

    const embed = createMikuEmbed({
      title: "Miku Profile Board",
      description: `Here is the latest profile snapshot for <@${targetUser.id}>.`,
      tone,
      fields: [
        {
          name: "◈ Crew Identity",
          value: `> **Member:** <@${targetUser.id}>\n> **Joined:** <t:${joinedUnix}:D> (<t:${joinedUnix}:R>)`,
          inline: true,
        },
        {
          name: "◈ Roster Status",
          value: `> **Status:** \` ${statusText} \`\n> **Roles:** \` ${rolesText} \`\n> **Hiatus:** \` ${hiatusText} \`\n> **Strikes:** \` ${strikeText} \``,
          inline: true,
        },
        {
          name: "◈ Assignment Record",
          value: "```yaml\n" +
            `Total     : ${profile.assignmentStats.total}\n` +
            `Pending   : ${profile.assignmentStats.pending}\n` +
            `Completed : ${profile.assignmentStats.completed}\n` +
            `Late      : ${profile.assignmentStats.late}\n` +
            `Excused   : ${profile.assignmentStats.excused}\n` +
            "```",
          inline: false,
        },
      ],
    });

    if (deboardedUnix !== null) {
      embed.addFields({
        name: "◈ Deboarded At",
        value: `> <t:${deboardedUnix}:f>`,
        inline: true,
      });
      embed.addFields({
        name: "◈ Deboard Note",
        value: `> ${normalizeDeboardMessage(profile.user.deboardedMessage).slice(0, 1024)}`,
        inline: false,
      });
    }

    embed.setThumbnail(targetUser.displayAvatarURL({ size: 256 }));

    await interaction.reply({
      embeds: [embed],
    });
  }
}