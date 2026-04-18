import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
} from "discord.js";

import { createMikuEmbed } from "../../../presentation/miku-embed";
import type { CommandExecutionContext } from "../../contracts/command-execution-context";
import type { SlashCommand } from "../../contracts/slash-command";

export class HelloCommand implements SlashCommand {
  readonly data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder = new SlashCommandBuilder()
    .setName("hello")
    .setDescription("Say hello to Flower Sekai's Miku.");

  async execute(
    interaction: ChatInputCommandInteraction,
    _context: CommandExecutionContext,
  ): Promise<void> {
    await interaction.reply({
      embeds: [
        createMikuEmbed({
          title: "Miku Greeting",
          description: `Hello, <@${interaction.user.id}>! Flower Sekai Miku is here for you.`,
          tone: "cream",
        }),
      ],
    });
  }
}
