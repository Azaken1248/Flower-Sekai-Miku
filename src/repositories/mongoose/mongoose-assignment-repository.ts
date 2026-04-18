import { Types } from "mongoose";

import {
  AssignmentModel,
  type AssignmentStatus,
  type IAssignment,
} from "../../models/assignment.model";
import type {
  AssignmentRepository,
  CreateAssignmentInput,
} from "../interfaces/assignment-repository";

export class MongooseAssignmentRepository implements AssignmentRepository {
  async create(input: CreateAssignmentInput): Promise<IAssignment> {
    return AssignmentModel.create({
      userId: new Types.ObjectId(input.userId),
      discordUserId: input.discordUserId,
      roleId: input.roleId,
      taskName: input.taskName,
      description: input.description,
      deadline: input.deadline,
      isTimeLimited: input.isTimeLimited,
    });
  }

  async findById(id: string): Promise<IAssignment | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return AssignmentModel.findById(id).exec();
  }

  async extendDeadline(id: string, newDeadline: Date): Promise<IAssignment | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return AssignmentModel.findByIdAndUpdate(
      id,
      {
        $set: {
          deadline: newDeadline,
        },
        $inc: {
          extensionsGranted: 1,
        },
      },
      { new: true },
    ).exec();
  }

  async updateStatus(id: string, status: AssignmentStatus): Promise<IAssignment | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return AssignmentModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
        },
      },
      { new: true },
    ).exec();
  }

  async findPendingByDiscordUserId(discordUserId: string): Promise<IAssignment[]> {
    return AssignmentModel.find({
      discordUserId,
      status: "PENDING",
    }).exec();
  }
}
