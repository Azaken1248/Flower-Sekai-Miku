import type { Client } from "discord.js";

import type { FlowerSekaiBot } from "../../app/bot";
import type { CommandLoader } from "../../commands/loader/command-loader";
import type { InteractionCreateHandler } from "../../commands/handlers/interaction-create-handler";
import type { SlashCommand } from "../../commands/contracts/slash-command";
import type { CommandRegistry } from "../../commands/registry/command-registry";
import type { AppConfig } from "../../config/env";
import type { CommandDeployer } from "../../discord/command-deployer";
import type { AssignmentRepository } from "../../repositories/interfaces/assignment-repository";
import type { GuildConfigRepository } from "../../repositories/interfaces/guild-config-repository";
import type { TaskReminderRepository } from "../../repositories/interfaces/task-reminder-repository";
import type { UserRepository } from "../../repositories/interfaces/user-repository";
import type { AssignmentService } from "../../services/assignment-service";
import type { ConfigCacheService } from "../../services/config-cache-service";
import type { TaskReminderBootstrapService } from "../../services/task-reminder-bootstrap-service";
import type { TaskReminderDispatcherService } from "../../services/task-reminder-dispatcher-service";
import type { TaskReminderScheduleService } from "../../services/task-reminder-schedule-service";
import type { UserService } from "../../services/user-service";
import type { Logger } from "../logger/logger";
import type { ServiceToken } from "./container";

const createToken = <T>(description: string): ServiceToken<T> => {
  return Symbol(description) as ServiceToken<T>;
};

export const TOKENS = {
  config: createToken<AppConfig>("config"),
  logger: createToken<Logger>("logger"),
  discordClient: createToken<Client>("discordClient"),
  userRepository: createToken<UserRepository>("userRepository"),
  assignmentRepository: createToken<AssignmentRepository>("assignmentRepository"),
  guildConfigRepository: createToken<GuildConfigRepository>("guildConfigRepository"),
  taskReminderRepository: createToken<TaskReminderRepository>("taskReminderRepository"),
  userService: createToken<UserService>("userService"),
  taskReminderScheduleService: createToken<TaskReminderScheduleService>("taskReminderScheduleService"),
  taskReminderBootstrapService: createToken<TaskReminderBootstrapService>("taskReminderBootstrapService"),
  taskReminderDispatcherService: createToken<TaskReminderDispatcherService>("taskReminderDispatcherService"),
  assignmentService: createToken<AssignmentService>("assignmentService"),
  configCacheService: createToken<ConfigCacheService>("configCacheService"),
  commands: createToken<SlashCommand[]>("commands"),
  commandRegistry: createToken<CommandRegistry>("commandRegistry"),
  commandLoader: createToken<CommandLoader>("commandLoader"),
  commandDeployer: createToken<CommandDeployer>("commandDeployer"),
  interactionCreateHandler: createToken<InteractionCreateHandler>("interactionCreateHandler"),
  bot: createToken<FlowerSekaiBot>("bot"),
} as const;
