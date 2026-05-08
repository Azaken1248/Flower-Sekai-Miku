"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildContainer = void 0;
const discord_js_1 = require("discord.js");
const bot_1 = require("../app/bot");
const interaction_create_handler_1 = require("../commands/handlers/interaction-create-handler");
const strike_appeal_handler_1 = require("../commands/handlers/strike-appeal-handler");
const submit_approval_handler_1 = require("../commands/handlers/submit-approval-handler");
const command_loader_1 = require("../commands/loader/command-loader");
const modules_1 = require("../commands/modules");
const help_command_1 = require("../commands/modules/utility/help.command");
const command_registry_1 = require("../commands/registry/command-registry");
const env_1 = require("../config/env");
const container_1 = require("../core/di/container");
const tokens_1 = require("../core/di/tokens");
const logger_1 = require("../core/logger/logger");
const command_deployer_1 = require("../discord/command-deployer");
const mongoose_assignment_repository_1 = require("../repositories/mongoose/mongoose-assignment-repository");
const mongoose_guild_config_repository_1 = require("../repositories/mongoose/mongoose-guild-config-repository");
const mongoose_strike_repository_1 = require("../repositories/mongoose/mongoose-strike-repository");
const mongoose_task_reminder_repository_1 = require("../repositories/mongoose/mongoose-task-reminder-repository");
const mongoose_user_repository_1 = require("../repositories/mongoose/mongoose-user-repository");
const assignment_service_1 = require("../services/assignment-service");
const config_cache_service_1 = require("../services/config-cache-service");
const strike_service_1 = require("../services/strike-service");
const task_reminder_bootstrap_service_1 = require("../services/task-reminder-bootstrap-service");
const task_reminder_dispatcher_service_1 = require("../services/task-reminder-dispatcher-service");
const task_reminder_schedule_service_1 = require("../services/task-reminder-schedule-service");
const user_service_1 = require("../services/user-service");
const buildContainer = () => {
    const container = new container_1.ServiceContainer();
    container.registerSingleton(tokens_1.TOKENS.config, () => (0, env_1.loadAppConfig)());
    container.registerSingleton(tokens_1.TOKENS.logger, () => (0, logger_1.createLogger)("FlowerSekaiMiku"));
    container.registerSingleton(tokens_1.TOKENS.discordClient, () => new discord_js_1.Client({
        intents: [discord_js_1.GatewayIntentBits.Guilds],
    }));
    container.registerSingleton(tokens_1.TOKENS.userRepository, () => new mongoose_user_repository_1.MongooseUserRepository());
    container.registerSingleton(tokens_1.TOKENS.assignmentRepository, () => new mongoose_assignment_repository_1.MongooseAssignmentRepository());
    container.registerSingleton(tokens_1.TOKENS.guildConfigRepository, () => new mongoose_guild_config_repository_1.MongooseGuildConfigRepository());
    container.registerSingleton(tokens_1.TOKENS.taskReminderRepository, () => new mongoose_task_reminder_repository_1.MongooseTaskReminderRepository());
    container.registerSingleton(tokens_1.TOKENS.strikeRepository, () => new mongoose_strike_repository_1.MongooseStrikeRepository());
    container.registerSingleton(tokens_1.TOKENS.userService, (resolver) => new user_service_1.UserService(resolver.resolve(tokens_1.TOKENS.userRepository), resolver.resolve(tokens_1.TOKENS.assignmentRepository), resolver.resolve(tokens_1.TOKENS.taskReminderScheduleService), resolver.resolve(tokens_1.TOKENS.logger)));
    container.registerSingleton(tokens_1.TOKENS.taskReminderScheduleService, (resolver) => new task_reminder_schedule_service_1.TaskReminderScheduleService(resolver.resolve(tokens_1.TOKENS.config), resolver.resolve(tokens_1.TOKENS.taskReminderRepository), resolver.resolve(tokens_1.TOKENS.logger)));
    container.registerSingleton(tokens_1.TOKENS.taskReminderBootstrapService, (resolver) => new task_reminder_bootstrap_service_1.TaskReminderBootstrapService(resolver.resolve(tokens_1.TOKENS.assignmentRepository), resolver.resolve(tokens_1.TOKENS.taskReminderScheduleService), resolver.resolve(tokens_1.TOKENS.logger)));
    container.registerSingleton(tokens_1.TOKENS.taskReminderDispatcherService, (resolver) => new task_reminder_dispatcher_service_1.TaskReminderDispatcherService(resolver.resolve(tokens_1.TOKENS.config), resolver.resolve(tokens_1.TOKENS.taskReminderRepository), resolver.resolve(tokens_1.TOKENS.userRepository), resolver.resolve(tokens_1.TOKENS.discordClient), resolver.resolve(tokens_1.TOKENS.logger)));
    container.registerSingleton(tokens_1.TOKENS.assignmentService, (resolver) => new assignment_service_1.AssignmentService(resolver.resolve(tokens_1.TOKENS.assignmentRepository), resolver.resolve(tokens_1.TOKENS.userRepository), resolver.resolve(tokens_1.TOKENS.taskReminderScheduleService), resolver.resolve(tokens_1.TOKENS.logger)));
    container.registerSingleton(tokens_1.TOKENS.configCacheService, (resolver) => new config_cache_service_1.ConfigCacheService(resolver.resolve(tokens_1.TOKENS.guildConfigRepository), resolver.resolve(tokens_1.TOKENS.config), resolver.resolve(tokens_1.TOKENS.logger)));
    container.registerSingleton(tokens_1.TOKENS.strikeService, (resolver) => new strike_service_1.StrikeService(resolver.resolve(tokens_1.TOKENS.strikeRepository), resolver.resolve(tokens_1.TOKENS.userRepository), resolver.resolve(tokens_1.TOKENS.logger)));
    container.registerSingleton(tokens_1.TOKENS.commands, (resolver) => {
        const registry = resolver.resolve(tokens_1.TOKENS.commandRegistry);
        return [
            ...(0, modules_1.buildCommandModules)(resolver.resolve(tokens_1.TOKENS.config)),
            new help_command_1.HelpCommand(registry),
        ];
    });
    container.registerSingleton(tokens_1.TOKENS.commandRegistry, () => new command_registry_1.CommandRegistry());
    container.registerSingleton(tokens_1.TOKENS.commandLoader, (resolver) => new command_loader_1.CommandLoader(resolver.resolve(tokens_1.TOKENS.commandRegistry), resolver.resolve(tokens_1.TOKENS.commands)));
    container.registerSingleton(tokens_1.TOKENS.commandDeployer, (resolver) => new command_deployer_1.CommandDeployer(resolver.resolve(tokens_1.TOKENS.config), resolver.resolve(tokens_1.TOKENS.logger)));
    container.registerSingleton(tokens_1.TOKENS.submitApprovalHandler, (resolver) => new submit_approval_handler_1.SubmitApprovalHandler(resolver.resolve(tokens_1.TOKENS.assignmentService), resolver.resolve(tokens_1.TOKENS.config), resolver.resolve(tokens_1.TOKENS.logger)));
    container.registerSingleton(tokens_1.TOKENS.strikeAppealHandler, (resolver) => new strike_appeal_handler_1.StrikeAppealHandler(resolver.resolve(tokens_1.TOKENS.strikeService), resolver.resolve(tokens_1.TOKENS.config), resolver.resolve(tokens_1.TOKENS.logger)));
    container.registerSingleton(tokens_1.TOKENS.interactionCreateHandler, (resolver) => new interaction_create_handler_1.InteractionCreateHandler(resolver.resolve(tokens_1.TOKENS.commandRegistry), {
        config: resolver.resolve(tokens_1.TOKENS.config),
        logger: resolver.resolve(tokens_1.TOKENS.logger),
        userService: resolver.resolve(tokens_1.TOKENS.userService),
        assignmentService: resolver.resolve(tokens_1.TOKENS.assignmentService),
        strikeService: resolver.resolve(tokens_1.TOKENS.strikeService),
        configCacheService: resolver.resolve(tokens_1.TOKENS.configCacheService),
    }, resolver.resolve(tokens_1.TOKENS.submitApprovalHandler), resolver.resolve(tokens_1.TOKENS.strikeAppealHandler), resolver.resolve(tokens_1.TOKENS.userRepository), resolver.resolve(tokens_1.TOKENS.logger)));
    container.registerSingleton(tokens_1.TOKENS.bot, (resolver) => new bot_1.FlowerSekaiBot(resolver.resolve(tokens_1.TOKENS.discordClient), resolver.resolve(tokens_1.TOKENS.config), resolver.resolve(tokens_1.TOKENS.logger), resolver.resolve(tokens_1.TOKENS.commandLoader), resolver.resolve(tokens_1.TOKENS.commandDeployer), resolver.resolve(tokens_1.TOKENS.interactionCreateHandler), resolver.resolve(tokens_1.TOKENS.configCacheService), resolver.resolve(tokens_1.TOKENS.taskReminderBootstrapService), resolver.resolve(tokens_1.TOKENS.taskReminderDispatcherService)));
    return container;
};
exports.buildContainer = buildContainer;
