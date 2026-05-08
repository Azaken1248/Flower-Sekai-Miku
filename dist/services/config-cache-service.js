"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigCacheService = void 0;
const constants_1 = require("../config/constants");
const isDuplicateKeyError = (error) => {
    if (!error || typeof error !== "object") {
        return false;
    }
    const maybeCode = error.code;
    return typeof maybeCode === "number" && maybeCode === 11000;
};
class ConfigCacheService {
    guildConfigRepository;
    appConfig;
    logger;
    cache = new Map();
    constructor(guildConfigRepository, appConfig, logger) {
        this.guildConfigRepository = guildConfigRepository;
        this.appConfig = appConfig;
        this.logger = logger;
    }
    async loadConfig(guildId) {
        const normalizedGuildId = guildId.trim();
        const existingConfig = await this.guildConfigRepository.findByGuildId(normalizedGuildId);
        if (existingConfig) {
            this.cache.set(normalizedGuildId, existingConfig);
            return existingConfig;
        }
        const seededConfig = await this.seedDefaultConfig(normalizedGuildId);
        this.cache.set(normalizedGuildId, seededConfig);
        this.logger.info("Guild config cache seeded with defaults.", {
            guildId: normalizedGuildId,
        });
        return seededConfig;
    }
    getConfig(guildId) {
        const normalizedGuildId = guildId.trim();
        const cachedConfig = this.cache.get(normalizedGuildId);
        if (!cachedConfig) {
            throw new Error(`Guild config for '${normalizedGuildId}' is not loaded. Call loadConfig() first.`);
        }
        return cachedConfig;
    }
    async refreshConfig(guildId) {
        const normalizedGuildId = guildId.trim();
        const latestConfig = await this.guildConfigRepository.findByGuildId(normalizedGuildId);
        if (!latestConfig) {
            return this.loadConfig(normalizedGuildId);
        }
        this.cache.set(normalizedGuildId, latestConfig);
        this.logger.info("Guild config cache refreshed.", {
            guildId: normalizedGuildId,
        });
        return latestConfig;
    }
    async seedDefaultConfig(guildId) {
        const defaultInput = this.buildDefaultConfigInput(guildId);
        try {
            return await this.guildConfigRepository.create(defaultInput);
        }
        catch (error) {
            if (isDuplicateKeyError(error)) {
                const existingConfig = await this.guildConfigRepository.findByGuildId(guildId);
                if (existingConfig) {
                    return existingConfig;
                }
            }
            throw error;
        }
    }
    buildDefaultConfigInput(guildId) {
        const specializedRoles = Object.entries(this.appConfig.roles.specialized).reduce((accumulator, [roleKey, roleId]) => {
            const typedKey = roleKey;
            const roleName = constants_1.SPECIALIZED_ROLE_LABELS[typedKey];
            accumulator[roleName] = roleId;
            return accumulator;
        }, {});
        return {
            guildId,
            ownerRoleIds: [this.appConfig.roles.owners],
            managerRoleIds: [this.appConfig.roles.mods],
            baseCrewRoleId: this.appConfig.roles.crew,
            specializedRoles,
            maxStandardExtensions: this.appConfig.extensionRules.maxStandardExtensions,
            blockTimeLimitedAutoExtension: this.appConfig.extensionRules.blockTimeLimitedAutoExtension,
        };
    }
}
exports.ConfigCacheService = ConfigCacheService;
