import type { AssignmentStatus, IAssignment } from "../../models/assignment.model";

export interface CreateAssignmentInput {
  userId: string;
  discordUserId: string;
  roleId: string;
  taskName: string;
  description: string;
  deadline: Date;
  isTimeLimited: boolean;
}

export interface AssignmentRepository {
  create(input: CreateAssignmentInput): Promise<IAssignment>;
  findById(id: string): Promise<IAssignment | null>;
  extendDeadline(id: string, newDeadline: Date): Promise<IAssignment | null>;
  updateStatus(id: string, status: AssignmentStatus): Promise<IAssignment | null>;
  findPendingByDiscordUserId(discordUserId: string): Promise<IAssignment[]>;
  findAllPending(): Promise<IAssignment[]>;
}
