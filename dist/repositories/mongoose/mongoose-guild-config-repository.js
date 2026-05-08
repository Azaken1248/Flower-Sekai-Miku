"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseGuildConfigRepository = void 0;
const guild_config_model_1 = require("../../models/guild-config.model");
class MongooseGuildConfigRepository {
    async findByGuildId(guildId) {
        return guild_config_model_1.GuildConfigModel.findOne({ guildId }).exec();
    }
    async create(input) {
        return guild_config_model_1.GuildConfigModel.create({
            guildId: input.guildId,
            ownerRoleIds: input.ownerRoleIds,
            managerRoleIds: input.managerRoleIds,
            baseCrewRoleId: input.baseCrewRoleId,
            specializedRoles: input.specializedRoles,
            extensionRules: {
                maxStandardExtensions: input.maxStandardExtensions,
                blockTimeLimitedAutoExtension: input.blockTimeLimitedAutoExtension,
            },
        });
    }
}
exports.MongooseGuildConfigRepository = MongooseGuildConfigRepository;
