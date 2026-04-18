import {
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
} from "discord.js";

import { createMikuEmbed } from "../../../presentation/miku-embed";
import { hasPermissionBypass } from "../../../security/permission-bypass";
import type { CommandExecutionContext } from "../../contracts/command-execution-context";
import type { SlashCommand } from "../../contracts/slash-command";
import type { OnboardStatus } from "../../../services/user-service";

export class OnboardCommand implements SlashCommand {
  readonly data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName("onboard")
    .setDescription("Onboard a member as active crew in the bot database.")
    .addUserOption((option) =>
      option.setName("member").setDescription("Member to onboard").setRequired(true),
    );

  async execute(
    interaction: ChatInputCommandInteraction,
    context: CommandExecutionContext,
  ): Promise<void> {
    if (!interaction.inGuild() || !interaction.guild || !interaction.guildId) {
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Crew Registry",
            description: "This command can only be used inside a server.",
            tone: "mist",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const isBypassUser = hasPermissionBypass(interaction.user.id);

    if (!isBypassUser) {
      const guildConfig = context.configCacheService.getConfig(interaction.guildId);
      const allowedRoleIds = [...guildConfig.ownerRoleIds, ...guildConfig.managerRoleIds];
      const invokingMember = await interaction.guild.members.fetch(interaction.user.id);
      const hasPermission = allowedRoleIds.some((roleId) =>
        invokingMember.roles.cache.has(roleId),
      );

      if (!hasPermission) {
        await interaction.reply({
          embeds: [
            createMikuEmbed({
              title: "Miku Crew Registry",
              description: "You do not have permission to use this command.",
              tone: "wave",
            }),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    const targetUser = interaction.options.getUser("member", true);
    const result = await context.userService.onboard(targetUser.id, targetUser.username);

    const messages: Record<OnboardStatus, string> = {
      created: `Miku has onboarded <@${targetUser.id}> into the active crew registry.`,
      reactivated: `Miku has reactivated <@${targetUser.id}> in the crew registry.`,
      alreadyActive: `<@${targetUser.id}> is already active in Miku's crew registry.`,
    };

    await interaction.reply({
      embeds: [
        createMikuEmbed({
          title: "Miku Crew Registry",
          description: messages[result.status],
          tone: "sky",
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }
}
