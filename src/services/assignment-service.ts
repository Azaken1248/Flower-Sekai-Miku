import type { IAssignment } from "../models/assignment.model";
import type { Logger } from "../core/logger/logger";
import type { AssignmentRepository } from "../repositories/interfaces/assignment-repository";
import type { UserRepository } from "../repositories/interfaces/user-repository";

export interface AssignTaskInput {
  discordUserId: string;
  roleId: string;
  taskName: string;
  description: string;
  deadline: Date;
  isTimeLimited: boolean;
}

export interface ExtensionRequestInput {
  assignmentId: string;
  discordUserId: string;
  newDeadline: Date;
  bypassUserCheck?: boolean;
}

export interface ExtensionRequestResult {
  allowed: boolean;
  reason?: string;
  assignment?: IAssignment;
}

export class AssignmentService {
  constructor(
    private readonly assignmentRepository: AssignmentRepository,
    private readonly userRepository: UserRepository,
    private readonly logger: Logger,
  ) {}

  async assignTask(input: AssignTaskInput): Promise<IAssignment> {
    const user = await this.userRepository.findByDiscordId(input.discordUserId);
    if (!user || user.isDeboarded) {
      throw new Error("Target user is not onboarded as an active crew member.");
    }

    const assignment = await this.assignmentRepository.create({
      userId: user.id,
      discordUserId: input.discordUserId,
      roleId: input.roleId,
      taskName: input.taskName,
      description: input.description,
      deadline: input.deadline,
      isTimeLimited: input.isTimeLimited,
    });

    await this.userRepository.appendAssignment(input.discordUserId, assignment.id);

    this.logger.info("Assignment created.", {
      assignmentId: assignment.id,
      discordUserId: input.discordUserId,
      roleId: input.roleId,
    });

    return assignment;
  }

  async requestExtension(input: ExtensionRequestInput): Promise<ExtensionRequestResult> {
    const assignment = await this.assignmentRepository.findById(input.assignmentId);
    if (!assignment) {
      return {
        allowed: false,
        reason: "Assignment not found.",
      };
    }

    if (!input.bypassUserCheck && assignment.discordUserId !== input.discordUserId) {
      return {
        allowed: false,
        reason: "You can only request extensions for your own assignments.",
      };
    }

    if (assignment.isTimeLimited) {
      return {
        allowed: false,
        reason:
          "This assignment is marked as time-limited and cannot be auto-extended. Ask an owner for manual override.",
      };
    }

    if (input.newDeadline <= assignment.deadline) {
      return {
        allowed: false,
        reason: "The new deadline must be later than the current deadline.",
      };
    }

    const updatedAssignment = await this.assignmentRepository.extendDeadline(
      assignment.id,
      input.newDeadline,
    );

    if (!updatedAssignment) {
      return {
        allowed: false,
        reason: "Unable to apply extension right now.",
      };
    }

    this.logger.info("Assignment deadline extended.", {
      assignmentId: updatedAssignment.id,
      discordUserId: updatedAssignment.discordUserId,
      extensionsGranted: updatedAssignment.extensionsGranted,
    });

    return {
      allowed: true,
      assignment: updatedAssignment,
    };
  }
}
