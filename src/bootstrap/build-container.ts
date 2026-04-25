import { Client, GatewayIntentBits } from "discord.js";

import { FlowerSekaiBot } from "../app/bot";
import { InteractionCreateHandler } from "../commands/handlers/interaction-create-handler";
import { CommandLoader } from "../commands/loader/command-loader";
import { buildCommandModules } from "../commands/modules";
import { CommandRegistry } from "../commands/registry/command-registry";
import { loadAppConfig } from "../config/env";
import { ServiceContainer } from "../core/di/container";
import { TOKENS } from "../core/di/tokens";
import { createLogger } from "../core/logger/logger";
import { CommandDeployer } from "../discord/command-deployer";
import { MongooseAssignmentRepository } from "../repositories/mongoose/mongoose-assignment-repository";
import { MongooseGuildConfigRepository } from "../repositories/mongoose/mongoose-guild-config-repository";
import { MongooseTaskReminderRepository } from "../repositories/mongoose/mongoose-task-reminder-repository";
import { MongooseUserRepository } from "../repositories/mongoose/mongoose-user-repository";
import { AssignmentService } from "../services/assignment-service";
import { ConfigCacheService } from "../services/config-cache-service";
import { TaskReminderBootstrapService } from "../services/task-reminder-bootstrap-service";
import { TaskReminderDispatcherService } from "../services/task-reminder-dispatcher-service";
import { TaskReminderScheduleService } from "../services/task-reminder-schedule-service";
import { UserService } from "../services/user-service";

export const buildContainer = (): ServiceContainer => {
  const container = new ServiceContainer();

  container.registerSingleton(TOKENS.config, () => loadAppConfig());
  container.registerSingleton(TOKENS.logger, () => createLogger("FlowerSekaiMiku"));

  container.registerSingleton(
    TOKENS.discordClient,
    () =>
      new Client({
        intents: [GatewayIntentBits.Guilds],
      }),
  );

  container.registerSingleton(TOKENS.userRepository, () => new MongooseUserRepository());
  container.registerSingleton(
    TOKENS.assignmentRepository,
    () => new MongooseAssignmentRepository(),
  );
  container.registerSingleton(
    TOKENS.guildConfigRepository,
    () => new MongooseGuildConfigRepository(),
  );
  container.registerSingleton(
    TOKENS.taskReminderRepository,
    () => new MongooseTaskReminderRepository(),
  );

  container.registerSingleton(
    TOKENS.userService,
    (resolver) =>
      new UserService(
        resolver.resolve(TOKENS.userRepository),
        resolver.resolve(TOKENS.assignmentRepository),
        resolver.resolve(TOKENS.logger),
      ),
  );

  container.registerSingleton(
    TOKENS.taskReminderScheduleService,
    (resolver) =>
      new TaskReminderScheduleService(
        resolver.resolve(TOKENS.config),
        resolver.resolve(TOKENS.taskReminderRepository),
        resolver.resolve(TOKENS.logger),
      ),
  );

  container.registerSingleton(
    TOKENS.taskReminderBootstrapService,
    (resolver) =>
      new TaskReminderBootstrapService(
        resolver.resolve(TOKENS.assignmentRepository),
        resolver.resolve(TOKENS.taskReminderScheduleService),
        resolver.resolve(TOKENS.logger),
      ),
  );

  container.registerSingleton(
    TOKENS.taskReminderDispatcherService,
    (resolver) =>
      new TaskReminderDispatcherService(
        resolver.resolve(TOKENS.config),
        resolver.resolve(TOKENS.taskReminderRepository),
        resolver.resolve(TOKENS.discordClient),
        resolver.resolve(TOKENS.logger),
      ),
  );

  container.registerSingleton(
    TOKENS.assignmentService,
    (resolver) =>
      new AssignmentService(
        resolver.resolve(TOKENS.assignmentRepository),
        resolver.resolve(TOKENS.userRepository),
        resolver.resolve(TOKENS.taskReminderScheduleService),
        resolver.resolve(TOKENS.logger),
      ),
  );

  container.registerSingleton(
    TOKENS.configCacheService,
    (resolver) =>
      new ConfigCacheService(
        resolver.resolve(TOKENS.guildConfigRepository),
        resolver.resolve(TOKENS.config),
        resolver.resolve(TOKENS.logger),
      ),
  );

  container.registerSingleton(TOKENS.commands, (resolver) => {
    return buildCommandModules(resolver.resolve(TOKENS.config));
  });

  container.registerSingleton(TOKENS.commandRegistry, () => new CommandRegistry());

  container.registerSingleton(
    TOKENS.commandLoader,
    (resolver) =>
      new CommandLoader(
        resolver.resolve(TOKENS.commandRegistry),
        resolver.resolve(TOKENS.commands),
      ),
  );

  container.registerSingleton(
    TOKENS.commandDeployer,
    (resolver) =>
      new CommandDeployer(resolver.resolve(TOKENS.config), resolver.resolve(TOKENS.logger)),
  );

  container.registerSingleton(
    TOKENS.interactionCreateHandler,
    (resolver) =>
      new InteractionCreateHandler(
        resolver.resolve(TOKENS.commandRegistry),
        {
          config: resolver.resolve(TOKENS.config),
          logger: resolver.resolve(TOKENS.logger),
          userService: resolver.resolve(TOKENS.userService),
          assignmentService: resolver.resolve(TOKENS.assignmentService),
          configCacheService: resolver.resolve(TOKENS.configCacheService),
        },
        resolver.resolve(TOKENS.logger),
      ),
  );

  container.registerSingleton(
    TOKENS.bot,
    (resolver) =>
      new FlowerSekaiBot(
        resolver.resolve(TOKENS.discordClient),
        resolver.resolve(TOKENS.config),
        resolver.resolve(TOKENS.logger),
        resolver.resolve(TOKENS.commandLoader),
        resolver.resolve(TOKENS.commandDeployer),
        resolver.resolve(TOKENS.interactionCreateHandler),
        resolver.resolve(TOKENS.configCacheService),
        resolver.resolve(TOKENS.taskReminderBootstrapService),
        resolver.resolve(TOKENS.taskReminderDispatcherService),
      ),
  );

  return container;
};
