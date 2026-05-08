"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCommandModules = void 0;
const appealstrike_command_1 = require("./crew/appealstrike.command");
const deboard_command_1 = require("./crew/deboard.command");
const endhiatus_command_1 = require("./crew/endhiatus.command");
const hiatus_command_1 = require("./crew/hiatus.command");
const onboard_command_1 = require("./crew/onboard.command");
const removestrike_command_1 = require("./crew/removestrike.command");
const strike_command_1 = require("./crew/strike.command");
const assign_command_1 = require("./tasks/assign.command");
const extension_command_1 = require("./tasks/extension.command");
const remove_command_1 = require("./tasks/remove.command");
const submit_command_1 = require("./tasks/submit.command");
const transfer_command_1 = require("./tasks/transfer.command");
const tasks_command_1 = require("./tasks/tasks.command");
const checkfree_command_1 = require("./utility/checkfree.command");
const hello_command_1 = require("./utility/hello.command");
const history_command_1 = require("./utility/history.command");
const ping_command_1 = require("./utility/ping.command");
const profile_command_1 = require("./utility/profile.command");
const uptime_command_1 = require("./utility/uptime.command");
const buildCommandModules = (config) => {
    const adminRoleIds = [config.roles.owners, config.roles.mods];
    return [
        new onboard_command_1.OnboardCommand(),
        new deboard_command_1.DeboardCommand(),
        new hiatus_command_1.HiatusCommand(),
        new endhiatus_command_1.EndHiatusCommand(),
        new assign_command_1.AssignCommand(adminRoleIds, config.roles.specialized),
        new extension_command_1.ExtensionCommand(),
        new submit_command_1.SubmitCommand(),
        new remove_command_1.RemoveTaskCommand(adminRoleIds),
        new transfer_command_1.TransferTaskCommand(adminRoleIds),
        new tasks_command_1.TasksCommand(adminRoleIds),
        new checkfree_command_1.CheckFreeCommand(),
        new history_command_1.HistoryCommand(adminRoleIds, config.roles.specialized),
        new profile_command_1.ProfileCommand(),
        new ping_command_1.PingCommand(),
        new uptime_command_1.UptimeCommand(),
        new hello_command_1.HelloCommand(),
        new strike_command_1.StrikeCommand(),
        new removestrike_command_1.RemoveStrikeCommand(),
        new appealstrike_command_1.AppealStrikeCommand(),
    ];
};
exports.buildCommandModules = buildCommandModules;
