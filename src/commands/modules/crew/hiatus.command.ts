import {
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
} from "discord.js";

import { createMikuEmbed } from "../../../presentation/miku-embed";
import type { CommandExecutionContext } from "../../contracts/command-execution-context";
import type { SlashCommand } from "../../contracts/slash-command";
import type { HiatusStatus } from "../../../services/user-service";

export class HiatusCommand implements SlashCommand {
  readonly data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName("hiatus")
    .setDescription("Go on hiatus — your pending task deadlines will be frozen until you return.")
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Why you're going on hiatus (optional)")
        .setRequired(false),
    );

  async execute(
    interaction: ChatInputCommandInteraction,
    context: CommandExecutionContext,
  ): Promise<void> {
    const reason = interaction.options.getString("reason") ?? undefined;
    const result = await context.userService.startHiatus(interaction.user.id, reason);

    const messages: Record<HiatusStatus, string> = {
      started: `> <@${interaction.user.id}> is now on hiatus. All pending deadlines are frozen until you return. Take care! 🌸`,
      alreadyOnHiatus: `> <@${interaction.user.id}> is already on hiatus. Use \`/endhiatus\` when you're ready to come back!`,
      notFound: `> No crew profile found for <@${interaction.user.id}>. You need to be onboarded first.`,
      deboarded: `> <@${interaction.user.id}> has been deboarded and cannot go on hiatus.`,
      ended: "> Unexpected state.",
      notOnHiatus: "> Unexpected state.",
    };

    const toneByStatus: Record<HiatusStatus, "bloom" | "sky" | "mist" | "wave"> = {
      started: "sky",
      alreadyOnHiatus: "mist",
      notFound: "wave",
      deboarded: "wave",
      ended: "mist",
      notOnHiatus: "mist",
    };

    const fields =
      result.status === "started"
        ? [
            {
              name: "◈ Status",
              value: "> `ON HIATUS`",
              inline: true,
            },
            {
              name: "◈ Deadlines",
              value: "> Frozen ❄️",
              inline: true,
            },
            ...(reason
              ? [
                  {
                    name: "◈ Reason",
                    value: `> ${reason}`,
                    inline: false,
                  },
                ]
              : []),
          ]
        : [];

    await interaction.reply({
      embeds: [
        createMikuEmbed({
          title: "Miku Hiatus Board",
          description: messages[result.status],
          tone: toneByStatus[result.status],
          fields,
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }
}
