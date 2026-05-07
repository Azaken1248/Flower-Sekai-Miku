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

export class EndHiatusCommand implements SlashCommand {
  readonly data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName("endhiatus")
    .setDescription("End your hiatus — your frozen deadlines will be recalculated and resumed.");

  async execute(
    interaction: ChatInputCommandInteraction,
    context: CommandExecutionContext,
  ): Promise<void> {
    const result = await context.userService.endHiatus(interaction.user.id);

    const messages: Record<HiatusStatus, string> = {
      ended: `> Welcome back, <@${interaction.user.id}>! 🌟 Your deadlines have been unfrozen and pushed forward to account for your hiatus.`,
      notOnHiatus: `> <@${interaction.user.id}> is not currently on hiatus.`,
      notFound: `> No crew profile found for <@${interaction.user.id}>. You need to be onboarded first.`,
      deboarded: "> Unexpected state.",
      started: "> Unexpected state.",
      alreadyOnHiatus: "> Unexpected state.",
    };

    const toneByStatus: Record<HiatusStatus, "bloom" | "sky" | "mist" | "wave"> = {
      ended: "bloom",
      notOnHiatus: "mist",
      notFound: "wave",
      deboarded: "wave",
      started: "mist",
      alreadyOnHiatus: "mist",
    };

    const fields =
      result.status === "ended"
        ? [
            {
              name: "◈ Status",
              value: "> `ACTIVE`",
              inline: true,
            },
            {
              name: "◈ Deadlines Adjusted",
              value: `> \` ${result.deadlinesAffected} \` task${result.deadlinesAffected === 1 ? "" : "s"}`,
              inline: true,
            },
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
