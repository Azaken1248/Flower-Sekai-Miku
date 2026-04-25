import type { IUser } from "../models/user.model";
import type { AssignmentRepository } from "../repositories/interfaces/assignment-repository";
import type { UserRepository } from "../repositories/interfaces/user-repository";
import type { Logger } from "../core/logger/logger";

export type OnboardStatus = "created" | "reactivated" | "alreadyActive";

export interface OnboardResult {
  status: OnboardStatus;
  user: IUser;
}

export type DeboardStatus = "deboarded" | "alreadyDeboarded" | "notFound";

export interface DeboardResult {
  status: DeboardStatus;
  user: IUser | null;
}

export interface UserProfileAssignmentStats {
  total: number;
  pending: number;
  completed: number;
  late: number;
  excused: number;
}

export interface UserProfileResult {
  user: IUser;
  assignmentStats: UserProfileAssignmentStats;
}

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly assignmentRepository: AssignmentRepository,
    private readonly logger: Logger,
  ) {}

  async onboard(discordId: string, username: string): Promise<OnboardResult> {
    const existing = await this.userRepository.findByDiscordId(discordId);

    if (!existing) {
      const createdUser = await this.userRepository.create({ discordId, username });
      this.logger.info("Crew member onboarded.", { discordId });
      return {
        status: "created",
        user: createdUser,
      };
    }

    if (existing.isDeboarded) {
      const reactivatedUser = await this.userRepository.reactivate(discordId, username);
      if (!reactivatedUser) {
        throw new Error("Failed to reactivate deboarded user.");
      }

      this.logger.info("Deboarded crew member reactivated.", { discordId });
      return {
        status: "reactivated",
        user: reactivatedUser,
      };
    }

    return {
      status: "alreadyActive",
      user: existing,
    };
  }

  async deboard(discordId: string, message?: string): Promise<DeboardResult> {
    const existingUser = await this.userRepository.findByDiscordId(discordId);
    if (!existingUser) {
      return {
        status: "notFound",
        user: null,
      };
    }

    if (existingUser.isDeboarded) {
      return {
        status: "alreadyDeboarded",
        user: existingUser,
      };
    }

    const deboardedUser = await this.userRepository.markDeboarded(discordId, message);
    if (!deboardedUser) {
      throw new Error("Failed to deboard crew member.");
    }

    this.logger.info("Crew member deboarded.", { discordId });

    return {
      status: "deboarded",
      user: deboardedUser,
    };
  }

  async setHiatus(discordId: string, isOnHiatus: boolean): Promise<IUser | null> {
    const updatedUser = await this.userRepository.setHiatus(discordId, isOnHiatus);
    if (updatedUser) {
      this.logger.info("Crew member hiatus status updated.", {
        discordId,
        isOnHiatus,
      });
    }

    return updatedUser;
  }

  async getProfile(discordId: string): Promise<UserProfileResult | null> {
    const user = await this.userRepository.findByDiscordId(discordId);
    if (!user) {
      return null;
    }

    const [total, pending, completed, late, excused] = await Promise.all([
      this.assignmentRepository.countByDiscordUserId(discordId),
      this.assignmentRepository.countByDiscordUserId(discordId, "PENDING"),
      this.assignmentRepository.countByDiscordUserId(discordId, "COMPLETED"),
      this.assignmentRepository.countByDiscordUserId(discordId, "LATE"),
      this.assignmentRepository.countByDiscordUserId(discordId, "EXCUSED"),
    ]);

    return {
      user,
      assignmentStats: {
        total,
        pending,
        completed,
        late,
        excused,
      },
    };
  }
}
