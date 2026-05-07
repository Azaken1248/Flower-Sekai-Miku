import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
} from "discord.js";

import { createMikuEmbed } from "../../../presentation/miku-embed";
import type { CommandExecutionContext } from "../../contracts/command-execution-context";
import type { SlashCommand } from "../../contracts/slash-command";

const REASON_LABELS: Record<string, string> = {
  late: "Late Submission",
  misc: "Miscellaneous",
};

export class AppealStrikeCommand implements SlashCommand {
  readonly data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName("appealstrike")
    .setDescription("Appeal a strike you received. An owner or mod will review it.")
    .addStringOption((option) =>
      option.setName("strike_id").setDescription("ID of the strike to appeal").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("Why you believe this strike should be removed").setRequired(true),
    );

  async execute(
    interaction: ChatInputCommandInteraction,
    context: CommandExecutionContext,
  ): Promise<void> {
    const strikeId = interaction.options.getString("strike_id", true);
    const reason = interaction.options.getString("reason", true);

    const result = await context.strikeService.fileAppeal(strikeId, interaction.user.id, reason);

    if (result.status === "strikeNotFound") {
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Appeal Desk",
            description: `> No strike found with ID \`${strikeId}\`. Check your strike IDs with \`/profile\` and try again!`,
            tone: "mist",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (result.status === "notOwner") {
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Appeal Desk",
            description: "> You can only appeal strikes that were issued to you.",
            tone: "wave",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (result.status === "alreadyPending") {
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Appeal Desk",
            description: "> This strike already has a pending appeal. Hang tight — someone will review it soon!",
            tone: "mist",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (result.status === "alreadyResolved") {
      const statusText = result.strike?.appealStatus === "accepted" ? "accepted" : "denied";
      await interaction.reply({
        embeds: [
          createMikuEmbed({
            title: "Miku Appeal Desk",
            description: `> This strike's appeal has already been **${statusText}**. No further appeals can be filed.`,
            tone: "mist",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Success — post the appeal with Accept/Deny buttons
    const strike = result.strike!;
    const reasonLabel = REASON_LABELS[strike.reason] ?? strike.reason;

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`appeal_accept:${strikeId}`)
        .setLabel("Accept Appeal")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`appeal_deny:${strikeId}`)
        .setLabel("Deny Appeal")
        .setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({
      embeds: [
        createMikuEmbed({
          title: "Miku Appeal Desk — Appeal Filed 📋",
          description: `> <@${interaction.user.id}> is appealing a strike. Owners and mods — please review!`,
          tone: "sky",
          voiceWrap: false,
          fields: [
            {
              name: "◈ Strike ID",
              value: `> \`${strikeId}\``,
              inline: true,
            },
            {
              name: "◈ Strike Reason",
              value: `> ${reasonLabel}`,
              inline: true,
            },
            ...(strike.detail
              ? [
                  {
                    name: "◈ Strike Detail",
                    value: `> ${strike.detail}`,
                    inline: false,
                  },
                ]
              : []),
            {
              name: "◈ Appeal Reason",
              value: `> ${reason}`,
              inline: false,
            },
          ],
        }),
      ],
      components: [row],
    });
  }
}
