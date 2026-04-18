import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";

import type { CommandExecutionContext } from "./command-execution-context";

export interface SlashCommand {
  readonly data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  readonly requiredRoleIds?: readonly string[];
  execute(
    interaction: ChatInputCommandInteraction,
    context: CommandExecutionContext,
  ): Promise<void>;
}
