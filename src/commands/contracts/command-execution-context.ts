import type { AppConfig } from "../../config/env";
import type { Logger } from "../../core/logger/logger";
import type { AssignmentService } from "../../services/assignment-service";
import type { ConfigCacheService } from "../../services/config-cache-service";
import type { StrikeService } from "../../services/strike-service";
import type { UserService } from "../../services/user-service";

export interface CommandExecutionContext {
  config: AppConfig;
  logger: Logger;
  userService: UserService;
  assignmentService: AssignmentService;
  strikeService: StrikeService;
  configCacheService: ConfigCacheService;
}
