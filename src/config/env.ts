import {
  DEFAULT_ROLE_IDS,
  DEFAULT_SPECIALIZED_ROLE_IDS,
  type SpecializedRoleKey,
} from "./constants";

export interface AppConfig {
  discord: {
    token: string;
    applicationId: string;
    guildId: string;
  };
  mongo: {
    uri: string;
  };
  channels: {
    approvalChannelId: string | null;
  };
  roles: {
    owners: string;
    mods: string;
    crew: string;
    specialized: Record<SpecializedRoleKey, string>;
  };
  extensionRules: {
    maxStandardExtensions: number | null;
    blockTimeLimitedAutoExtension: boolean;
  };
}

const readRequiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const readOptionalEnv = (name: string): string | null => {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
};

const readWithDefault = (name: string, fallback: string): string => {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
};

const readOptionalNonNegativeInteger = (name: string): number | null => {
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

const readBooleanWithDefault = (name: string, fallback: boolean): boolean => {
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

const buildSpecializedRoleConfig = (): Record<SpecializedRoleKey, string> => {
  return {
    voiceActor: readWithDefault("ROLE_VOICE_ACTOR_ID", DEFAULT_SPECIALIZED_ROLE_IDS.voiceActor),
    sva: readWithDefault("ROLE_SVA_ID", DEFAULT_SPECIALIZED_ROLE_IDS.sva),
    bva: readWithDefault("ROLE_BVA_ID", DEFAULT_SPECIALIZED_ROLE_IDS.bva),
    artist: readWithDefault("ROLE_ARTIST_ID", DEFAULT_SPECIALIZED_ROLE_IDS.artist),
    editor: readWithDefault("ROLE_EDITOR_ID", DEFAULT_SPECIALIZED_ROLE_IDS.editor),
    designer: readWithDefault("ROLE_DESIGNER_ID", DEFAULT_SPECIALIZED_ROLE_IDS.designer),
    gfx: readWithDefault("ROLE_GFX_ID", DEFAULT_SPECIALIZED_ROLE_IDS.gfx),
    cardEditor: readWithDefault("ROLE_CARD_EDITOR_ID", DEFAULT_SPECIALIZED_ROLE_IDS.cardEditor),
    translyricist: readWithDefault("ROLE_TRANSLYRICIST_ID", DEFAULT_SPECIALIZED_ROLE_IDS.translyricist),
    vocalGuide: readWithDefault("ROLE_VOCAL_GUIDE_ID", DEFAULT_SPECIALIZED_ROLE_IDS.vocalGuide),
  };
};

export const loadAppConfig = (): AppConfig => {
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
    },
    roles: {
      owners: readWithDefault("ROLE_OWNER_ID", DEFAULT_ROLE_IDS.owners),
      mods: readWithDefault("ROLE_MOD_ID", DEFAULT_ROLE_IDS.mods),
      crew: readWithDefault("ROLE_CREW_ID", DEFAULT_ROLE_IDS.crew),
      specialized: buildSpecializedRoleConfig(),
    },
    extensionRules: {
      maxStandardExtensions: readOptionalNonNegativeInteger("MAX_STANDARD_EXTENSIONS"),
      blockTimeLimitedAutoExtension: readBooleanWithDefault(
        "BLOCK_TIME_LIMITED_AUTO_EXTENSION",
        true,
      ),
    },
  };
};
