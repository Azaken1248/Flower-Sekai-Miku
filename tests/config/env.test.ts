import { afterEach, describe, expect, it } from "vitest";

import { loadAppConfig } from "../../src/config/env";

const originalEnv = { ...process.env };

const setRequiredBaseEnv = () => {
  process.env.DISCORD_TOKEN = "token";
  process.env.DISCORD_APPLICATION_ID = "app-id";
  process.env.GUILD_ID = "guild-id";
  process.env.MONGODB_URI = "mongodb://localhost:27017/test";
};

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("loadAppConfig", () => {
  it("loads required values and reminder defaults", () => {
    setRequiredBaseEnv();

    const config = loadAppConfig();

    expect(config.discord.token).toBe("token");
    expect(config.discord.applicationId).toBe("app-id");
    expect(config.discord.guildId).toBe("guild-id");
    expect(config.mongo.uri).toBe("mongodb://localhost:27017/test");
    expect(config.reminders.enabled).toBe(true);
    expect(config.reminders.offsetMinutes).toEqual([1440, 360, 60, 0]);
    expect(config.reminders.batchSize).toBe(25);
  });

  it("uses DISCORD_GUILD_ID when provided", () => {
    setRequiredBaseEnv();
    process.env.DISCORD_GUILD_ID = "guild-id-override";

    const config = loadAppConfig();

    expect(config.discord.guildId).toBe("guild-id-override");
  });

  it("parses and deduplicates reminder offsets", () => {
    setRequiredBaseEnv();
    process.env.REMINDER_OFFSETS_MINUTES = " 30, 0, 30, 120";

    const config = loadAppConfig();

    expect(config.reminders.offsetMinutes).toEqual([120, 30, 0]);
  });

  it("throws on invalid reminder offset value", () => {
    setRequiredBaseEnv();
    process.env.REMINDER_OFFSETS_MINUTES = "30,abc";

    expect(() => loadAppConfig()).toThrowError(
      "REMINDER_OFFSETS_MINUTES must be a comma-separated list of non-negative integers.",
    );
  });

  it("throws when required env is missing", () => {
    process.env = {};

    expect(() => loadAppConfig()).toThrowError(
      "Missing required environment variable: GUILD_ID",
    );
  });
});
