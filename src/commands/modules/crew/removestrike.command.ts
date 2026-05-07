import {
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
} from "discord.js";

import { createMikuEmbed } from "../../../presentation/miku-embed";
import type { CommandExecutionContext } from "../../contracts/command-execution-context";
import type { SlashCommand } from "../../contracts/slash-command";
import { ensureOwnerAccess } from "./owner-access";

export class RemoveStrikeCommand implements SlashCommand {
  readonly data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName("removestrike")
    .setDescription("Remove a strike from a crew member. Owners only.")
    .addStringOption((option) =>
      option.setName("strike_id").setDescription("ID of the strike to remove").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Reason for removing the strike").setRequired(true),
    );

  async execute(
    interaction: ChatInputCommandInteraction,
    context: CommandExecutionContext,
  ): Promise<void> {
    const hasAccess = await ensureOwnerAccess(interaction, context);
    if (!hasAccess) return;

    const strikeId = interaction.options.getString("strike_id", true);
    const reason = interaction.options.getString("reason", true);

    const result = await context.strikeService.removeStrike(strikeId);

    if (result.status === "strikeNotFound") {
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Strike Board",
            description: `> No strike found with ID \`${strikeId}\`. Double-check the ID and try again!`,
            tone: "mist",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (result.status === "userNotFound") {
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Strike Board",
            description: "> The user associated with this strike could not be found.",
            tone: "mist",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [
        createMikuEmbed({
          title: "Miku Strike Board — Strike Removed ✅",
          description: `> Strike \`${strikeId}\` has been removed by <@${interaction.user.id}>.`,
          tone: "bloom",
          fields: [
            {
              name: "◈ New Strike Count",
              value: `> \`${result.newStrikeCount}/3\``,
              inline: true,
            },
            {
              name: "◈ Removal Reason",
              value: `> ${reason}`,
              inline: false,
            },
          ],
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });

    // Log to the logs channel
    const channelId = context.config.channels.logsChannelId;
    if (channelId) {
      try {
        const channel = await interaction.client.channels.fetch(channelId);
        if (channel && "send" in channel) {
          await (channel as { send: (opts: unknown) => Promise<unknown> }).send({
            embeds: [
              createMikuEmbed({
                title: "Miku Strike Log — Strike Removed",
                description: `> <@${interaction.user.id}> removed strike \`${strikeId}\`.`,
                tone: "bloom",
                voiceWrap: false,
                fields: [
                  { name: "◈ Strikes Now", value: `> \`${result.newStrikeCount}/3\``, inline: true },
                  { name: "◈ Reason", value: `> ${reason}`, inline: false },
                ],
              }),
            ],
          });
        }
      } catch {
        // Logging failures should not break the command
      }
    }
  }
}
