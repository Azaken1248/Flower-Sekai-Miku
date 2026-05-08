"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseUserRepository = void 0;
const mongoose_1 = require("mongoose");
const user_model_1 = require("../../models/user.model");
class MongooseUserRepository {
    async findByDiscordId(discordId) {
        return user_model_1.UserModel.findOne({ discordId }).exec();
    }
    async findAllActive() {
        return user_model_1.UserModel.find({ isDeboarded: false }).exec();
    }
    async create(input) {
        return user_model_1.UserModel.create({
            discordId: input.discordId,
            username: input.username,
        });
    }
    async reactivate(discordId, username) {
        return user_model_1.UserModel.findOneAndUpdate({ discordId }, {
            $set: {
                username,
                isDeboarded: false,
                isOnHiatus: false,
                deboardedAt: null,
            },
        }, { new: true }).exec();
    }
    async markDeboarded(discordId, message) {
        const setPayload = {
            isDeboarded: true,
            deboardedAt: new Date(),
        };
        if (message) {
            setPayload.deboardedMessage = message;
        }
        return user_model_1.UserModel.findOneAndUpdate({ discordId }, { $set: setPayload }, { new: true }).exec();
    }
    async setHiatus(discordId, isOnHiatus, hiatusStartedAt, hiatusReason) {
        return user_model_1.UserModel.findOneAndUpdate({ discordId }, { $set: { isOnHiatus, hiatusStartedAt, hiatusReason } }, { new: true }).exec();
    }
    async incrementStrikes(discordId, amount) {
        return user_model_1.UserModel.findOneAndUpdate({ discordId }, { $inc: { strikes: amount } }, { new: true }).exec();
    }
    async appendAssignment(discordId, assignmentId) {
        if (!mongoose_1.Types.ObjectId.isValid(assignmentId)) {
            throw new Error("Invalid assignment id.");
        }
        await user_model_1.UserModel.updateOne({ discordId }, {
            $addToSet: {
                assignments: new mongoose_1.Types.ObjectId(assignmentId),
            },
        }).exec();
    }
    async removeAssignment(discordId, assignmentId) {
        if (!mongoose_1.Types.ObjectId.isValid(assignmentId)) {
            throw new Error("Invalid assignment id.");
        }
        await user_model_1.UserModel.updateOne({ discordId }, {
            $pull: {
                assignments: new mongoose_1.Types.ObjectId(assignmentId),
            },
        }).exec();
    }
}
exports.MongooseUserRepository = MongooseUserRepository;
