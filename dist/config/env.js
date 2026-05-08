"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAppConfig = void 0;
const constants_1 = require("./constants");
const readRequiredEnv = (name) => {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};
const readOptionalEnv = (name) => {
    const value = process.env[name]?.trim();
    return value && value.length > 0 ? value : null;
};
const readWithDefault = (name, fallback) => {
    const value = process.env[name]?.trim();
    return value && value.length > 0 ? value : fallback;
};
const readOptionalNonNegativeInteger = (name) => {
    const value = readOptionalEnv(name);
    if (value === null) {
        return null;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error(`${name} must be a non-negative integer when provided.`);
    }
    return parsed;
};
const readBooleanWithDefault = (name, fallback) => {
    const value = readOptionalEnv(name);
    if (value === null) {
        return fallback;
    }
    if (value.toLowerCase() === "true") {
        return true;
    }
    if (value.toLowerCase() === "false") {
        return false;
    }
    throw new Error(`${name} must be either 'true' or 'false' when provided.`);
};
const readPositiveIntegerWithDefault = (name, fallback) => {
    const value = readOptionalEnv(name);
    if (value === null) {
        return fallback;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`${name} must be a positive integer when provided.`);
    }
    return parsed;
};
const readReminderOffsetsWithDefault = (name, fallback) => {
    const value = readOptionalEnv(name);
    if (value === null) {
        return [...fallback];
    }
    const offsets = value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .map((item) => {
        const parsed = Number(item);
        if (!Number.isInteger(parsed) || parsed < 0) {
            throw new Error(`${name} must be a comma-separated list of non-negative integers.`);
        }
        return parsed;
    });
    if (offsets.length === 0) {
        throw new Error(`${name} must include at least one non-negative integer.`);
    }
    return [...new Set(offsets)].sort((a, b) => b - a);
};
const buildSpecializedRoleConfig = () => {
    return {
        voiceActor: readWithDefault("ROLE_VOICE_ACTOR_ID", constants_1.DEFAULT_SPECIALIZED_ROLE_IDS.voiceActor),
        sva: readWithDefault("ROLE_SVA_ID", constants_1.DEFAULT_SPECIALIZED_ROLE_IDS.sva),
        bva: readWithDefault("ROLE_BVA_ID", constants_1.DEFAULT_SPECIALIZED_ROLE_IDS.bva),
        artist: readWithDefault("ROLE_ARTIST_ID", constants_1.DEFAULT_SPECIALIZED_ROLE_IDS.artist),
        editor: readWithDefault("ROLE_EDITOR_ID", constants_1.DEFAULT_SPECIALIZED_ROLE_IDS.editor),
        designer: readWithDefault("ROLE_DESIGNER_ID", constants_1.DEFAULT_SPECIALIZED_ROLE_IDS.designer),
        gfx: readWithDefault("ROLE_GFX_ID", constants_1.DEFAULT_SPECIALIZED_ROLE_IDS.gfx),
        cardEditor: readWithDefault("ROLE_CARD_EDITOR_ID", constants_1.DEFAULT_SPECIALIZED_ROLE_IDS.cardEditor),
        translyricist: readWithDefault("ROLE_TRANSLYRICIST_ID", constants_1.DEFAULT_SPECIALIZED_ROLE_IDS.translyricist),
        vocalGuide: readWithDefault("ROLE_VOCAL_GUIDE_ID", constants_1.DEFAULT_SPECIALIZED_ROLE_IDS.vocalGuide),
    };
};
const loadAppConfig = () => {
    const guildId = readOptionalEnv("DISCORD_GUILD_ID") ?? readRequiredEnv("GUILD_ID");
    return {
        discord: {
            token: readRequiredEnv("DISCORD_TOKEN"),
            applicationId: readRequiredEnv("DISCORD_APPLICATION_ID"),
            guildId,
        },
        mongo: {
            uri: readRequiredEnv("MONGODB_URI"),
        },
        channels: {
            approvalChannelId: readOptionalEnv("APPROVAL_CHANNEL_ID"),
            remindersChannelId: readOptionalEnv("REMINDERS_CHANNEL_ID"),
            logsChannelId: readOptionalEnv("LOGS_CHANNEL_ID"),
        },
        roles: {
            owners: readWithDefault("ROLE_OWNER_ID", constants_1.DEFAULT_ROLE_IDS.owners),
            mods: readWithDefault("ROLE_MOD_ID", constants_1.DEFAULT_ROLE_IDS.mods),
            crew: readWithDefault("ROLE_CREW_ID", constants_1.DEFAULT_ROLE_IDS.crew),
            specialized: buildSpecializedRoleConfig(),
        },
        extensionRules: {
            maxStandardExtensions: readOptionalNonNegativeInteger("MAX_STANDARD_EXTENSIONS"),
            blockTimeLimitedAutoExtension: readBooleanWithDefault("BLOCK_TIME_LIMITED_AUTO_EXTENSION", true),
        },
        reminders: {
            enabled: readBooleanWithDefault("REMINDERS_ENABLED", true),
            offsetMinutes: readReminderOffsetsWithDefault("REMINDER_OFFSETS_MINUTES", [1440, 360, 60, 0]),
            pollIntervalMs: readPositiveIntegerWithDefault("REMINDER_POLL_INTERVAL_MS", 30000),
            batchSize: readPositiveIntegerWithDefault("REMINDER_BATCH_SIZE", 25),
            lockDurationMs: readPositiveIntegerWithDefault("REMINDER_LOCK_DURATION_MS", 60000),
            maxAttempts: readPositiveIntegerWithDefault("REMINDER_MAX_ATTEMPTS", 5),
        },
    };
};
exports.loadAppConfig = loadAppConfig;
