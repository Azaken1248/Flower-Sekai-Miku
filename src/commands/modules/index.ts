import type { AppConfig } from "../../config/env";
import { DeboardCommand } from "./crew/deboard.command";
import type { SlashCommand } from "../contracts/slash-command";
import { OnboardCommand } from "./crew/onboard.command";
import { AssignCommand } from "./tasks/assign.command";
import { ExtensionCommand } from "./tasks/extension.command";
import { RemoveTaskCommand } from "./tasks/remove.command";
import { TransferTaskCommand } from "./tasks/transfer.command";
import { TasksCommand } from "./tasks/tasks.command";
import { HelloCommand } from "./utility/hello.command";
import { PingCommand } from "./utility/ping.command";
import { ProfileCommand } from "./utility/profile.command";
import { UptimeCommand } from "./utility/uptime.command";

export const buildCommandModules = (config: AppConfig): SlashCommand[] => {
  const adminRoleIds = [config.roles.owners, config.roles.mods];

  return [
    new OnboardCommand(),
    new DeboardCommand(),
    new AssignCommand(adminRoleIds, config.roles.specialized),
    new ExtensionCommand(),
    new RemoveTaskCommand(adminRoleIds),
    new TransferTaskCommand(adminRoleIds),
    new TasksCommand(adminRoleIds),
    new ProfileCommand(),
    new PingCommand(),
    new UptimeCommand(),
    new HelloCommand(),
  ];
};