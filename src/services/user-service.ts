import type { IUser } from "../models/user.model";
import type { UserRepository } from "../repositories/interfaces/user-repository";
import type { Logger } from "../core/logger/logger";

export type OnboardStatus = "created" | "reactivated" | "alreadyActive";

export interface OnboardResult {
  status: OnboardStatus;
  user: IUser;
}

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
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

  async deboard(discordId: string, message?: string): Promise<IUser | null> {
    const deboardedUser = await this.userRepository.markDeboarded(discordId, message);
    if (deboardedUser) {
      this.logger.info("Crew member deboarded.", { discordId });
    }

    return deboardedUser;
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
}
