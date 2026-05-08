"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseAssignmentRepository = void 0;
const mongoose_1 = require("mongoose");
const assignment_model_1 = require("../../models/assignment.model");
class MongooseAssignmentRepository {
    async create(input) {
        return assignment_model_1.AssignmentModel.create({
            userId: new mongoose_1.Types.ObjectId(input.userId),
            discordUserId: input.discordUserId,
            roleId: input.roleId,
            taskName: input.taskName,
            description: input.description,
            deadline: input.deadline,
            isTimeLimited: input.isTimeLimited,
        });
    }
    async findById(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return null;
        }
        return assignment_model_1.AssignmentModel.findById(id).exec();
    }
    async extendDeadline(id, newDeadline) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return null;
        }
        return assignment_model_1.AssignmentModel.findByIdAndUpdate(id, {
            $set: { deadline: newDeadline },
            $inc: { extensionsGranted: 1 },
        }, { new: true }).exec();
    }
    async updateStatus(id, status) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return null;
        }
        return assignment_model_1.AssignmentModel.findByIdAndUpdate(id, { $set: { status } }, { new: true }).exec();
    }
    async findPendingByDiscordUserId(discordUserId) {
        return assignment_model_1.AssignmentModel.find({
            discordUserId,
            status: "PENDING",
        }).exec();
    }
    async findAllPending() {
        return assignment_model_1.AssignmentModel.find({
            status: "PENDING",
        }).exec();
    }
    async findByDiscordUserId(discordUserId, filter) {
        const query = { discordUserId };
        if (filter?.status) {
            query.status = filter.status;
        }
        if (filter?.roleId) {
            query.roleId = filter.roleId;
        }
        if (filter?.taskName) {
            query.taskName = { $regex: filter.taskName, $options: "i" };
        }
        return assignment_model_1.AssignmentModel.find(query)
            .sort({ deadline: -1 })
            .limit(25)
            .exec();
    }
    async countByDiscordUserId(discordUserId, status) {
        const query = status ? { discordUserId, status } : { discordUserId };
        return assignment_model_1.AssignmentModel.countDocuments(query).exec();
    }
    async deleteById(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return false;
        }
        const result = await assignment_model_1.AssignmentModel.deleteOne({ _id: id }).exec();
        return result.deletedCount === 1;
    }
    async transfer(id, newUserId, newDiscordUserId) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return null;
        }
        return assignment_model_1.AssignmentModel.findByIdAndUpdate(id, {
            $set: {
                userId: new mongoose_1.Types.ObjectId(newUserId),
                discordUserId: newDiscordUserId,
            },
        }, { new: true }).exec();
    }
    async pushDeadlinesByDiscordUserId(discordUserId, offsetMs) {
        const result = await assignment_model_1.AssignmentModel.updateMany({ discordUserId, status: "PENDING" }, [
            {
                $set: {
                    deadline: {
                        $toDate: { $add: [{ $toLong: "$deadline" }, offsetMs] },
                    },
                },
            },
        ]).exec();
        return result.modifiedCount;
    }
}
exports.MongooseAssignmentRepository = MongooseAssignmentRepository;
