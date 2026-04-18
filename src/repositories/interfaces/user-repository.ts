import type { IUser } from "../../models/user.model";

export interface CreateUserInput {
  discordId: string;
  username: string;
}

export interface UserRepository {
  findByDiscordId(discordId: string): Promise<IUser | null>;
  create(input: CreateUserInput): Promise<IUser>;
  reactivate(discordId: string, username: string): Promise<IUser | null>;
  markDeboarded(discordId: string, message?: string): Promise<IUser | null>;
  setHiatus(discordId: string, isOnHiatus: boolean): Promise<IUser | null>;
  appendAssignment(discordId: string, assignmentId: string): Promise<void>;
}
