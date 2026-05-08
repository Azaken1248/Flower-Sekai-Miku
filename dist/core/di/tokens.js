"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKENS = void 0;
const createToken = (description) => {
    return Symbol(description);
};
exports.TOKENS = {
    config: createToken("config"),
    logger: createToken("logger"),
    discordClient: createToken("discordClient"),
    userRepository: createToken("userRepository"),
    assignmentRepository: createToken("assignmentRepository"),
    guildConfigRepository: createToken("guildConfigRepository"),
    taskReminderRepository: createToken("taskReminderRepository"),
    userService: createToken("userService"),
    taskReminderScheduleService: createToken("taskReminderScheduleService"),
    taskReminderBootstrapService: createToken("taskReminderBootstrapService"),
    taskReminderDispatcherService: createToken("taskReminderDispatcherService"),
    assignmentService: createToken("assignmentService"),
    configCacheService: createToken("configCacheService"),
    commands: createToken("commands"),
    commandRegistry: createToken("commandRegistry"),
    commandLoader: createToken("commandLoader"),
    commandDeployer: createToken("commandDeployer"),
    interactionCreateHandler: createToken("interactionCreateHandler"),
    submitApprovalHandler: createToken("submitApprovalHandler"),
    strikeRepository: createToken("strikeRepository"),
    strikeService: createToken("strikeService"),
    strikeAppealHandler: createToken("strikeAppealHandler"),
    bot: createToken("bot"),
};
