import type { AppConfig } from "../../config/env";
import type { SlashCommand } from "../contracts/slash-command";
import { OnboardCommand } from "./crew/onboard.command";
import { AssignCommand } from "./tasks/assign.command";
import { ExtensionCommand } from "./tasks/extension.command";
import { HelloCommand } from "./utility/hello.command";
import { PingCommand } from "./utility/ping.command";
import { UptimeCommand } from "./utility/uptime.command";

export const buildCommandModules = (config: AppConfig): SlashCommand[] => {
  const adminRoleIds = [config.roles.owners, config.roles.mods];

  return [
    new OnboardCommand(),
    new AssignCommand(adminRoleIds, config.roles.specialized),
    new ExtensionCommand(),
    new PingCommand(),
    new UptimeCommand(),
    new HelloCommand(),
  ];
};
