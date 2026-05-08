"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseStrikeRepository = void 0;
const mongoose_1 = require("mongoose");
const strike_model_1 = require("../../models/strike.model");
class MongooseStrikeRepository {
    async create(input) {
        return strike_model_1.StrikeModel.create({
            discordUserId: input.discordUserId,
            issuedBy: input.issuedBy,
            reason: input.reason,
            detail: input.detail ?? null,
        });
    }
    async findAll() {
        return strike_model_1.StrikeModel.find().sort({ issuedAt: -1 }).exec();
    }
    async findByDiscordUserId(discordUserId) {
        return strike_model_1.StrikeModel.find({ discordUserId }).sort({ issuedAt: -1 }).exec();
    }
    async findById(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return null;
        }
        return strike_model_1.StrikeModel.findById(id).exec();
    }
    async updateAppealStatus(id, status, appealReason, resolvedBy) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return null;
        }
        const updatePayload = { appealStatus: status };
        if (appealReason !== undefined) {
            updatePayload.appealReason = appealReason;
        }
        if (resolvedBy !== undefined) {
            updatePayload.appealResolvedBy = resolvedBy;
        }
        return strike_model_1.StrikeModel.findByIdAndUpdate(id, { $set: updatePayload }, { new: true }).exec();
    }
    async deleteById(id) {
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            return false;
        }
        const result = await strike_model_1.StrikeModel.deleteOne({ _id: id }).exec();
        return result.deletedCount > 0;
    }
}
exports.MongooseStrikeRepository = MongooseStrikeRepository;
