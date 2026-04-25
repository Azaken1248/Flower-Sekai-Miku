import { vi } from "vitest";

import type { CommandExecutionContext } from "../../src/commands/contracts/command-execution-context";
import type { AppConfig } from "../../src/config/env";
import type { Logger } from "../../src/core/logger/logger";

export const createTestConfig = (): AppConfig => ({
  discord: {
    token: "token",
    applicationId: "app-id",
    guildId: "guild-id",
  },
  mongo: {
    uri: "mongodb://localhost:27017/test",
  },
  channels: {
    approvalChannelId: "approval-channel-id",
  },
  roles: {
    owners: "owner-role-id",
    mods: "mod-role-id",
    crew: "crew-role-id",
    specialized: {
      voiceActor: "role-voice-actor",
      sva: "role-sva",
      bva: "role-bva",
      artist: "role-artist",
      editor: "role-editor",
      designer: "role-designer",
      gfx: "role-gfx",
      cardEditor: "role-card-editor",
      translyricist: "role-translyricist",
      vocalGuide: "role-vocal-guide",
    },
  },
  extensionRules: {
    maxStandardExtensions: 2,
    blockTimeLimitedAutoExtension: true,
  },
  reminders: {
    enabled: true,
    offsetMinutes: [60, 0],
    pollIntervalMs: 1000,
    batchSize: 10,
    lockDurationMs: 15000,
    maxAttempts: 3,
  },
});

export const createMockLogger = (): Logger => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

export interface MockUserInput {
  id: string;
  username?: string;
}

export interface MockInteractionInput {
  commandName?: string;
  user?: MockUserInput;
  targetUsers?: Record<string, MockUserInput>;
  stringOptions?: Record<string, string | null | undefined>;
  booleanOptions?: Record<string, boolean | null | undefined>;
  inGuild?: boolean;
  guildId?: string;
  memberRoleIds?: string[];
  createdTimestamp?: number;
  apiLatencyMs?: number;
  replied?: boolean;
  deferred?: boolean;
  guildFetchReject?: Error;
}

export const createMockInteraction = (input: MockInteractionInput = {}) => {
  const commandUser = {
    id: input.user?.id ?? "invoking-user-id",
    username: input.user?.username ?? "invoker",
    displayAvatarURL: vi.fn().mockReturnValue("https://example.com/avatar.png"),
  };

  const targetUsers = Object.entries(input.targetUsers ?? {}).reduce(
    (accumulator, [optionName, user]) => {
      accumulator[optionName] = {
        id: user.id,
        username: user.username ?? "target-user",
        displayAvatarURL: vi.fn().mockReturnValue("https://example.com/avatar.png"),
      };
      return accumulator;
    },
    {} as Record<string, { id: string; username: string; displayAvatarURL: ReturnType<typeof vi.fn> }>,
  );

  const roleSet = new Set(input.memberRoleIds ?? []);

  const guildMember = {
    roles: {
      cache: {
        has: vi.fn((roleId: string) => roleSet.has(roleId)),
      },
    },
  };

  const guild = input.inGuild === false
    ? null
    : {
        members: {
          fetch: input.guildFetchReject
            ? vi.fn().mockRejectedValue(input.guildFetchReject)
            : vi.fn().mockResolvedValue(guildMember),
        },
      };

  const options = {
    getUser: vi.fn((name: string, required?: boolean) => {
      const value = targetUsers[name] ?? null;
      if (!value && required) {
        throw new Error(`Missing required user option: ${name}`);
      }
      return value;
    }),
    getString: vi.fn((name: string, required?: boolean) => {
      const value = input.stringOptions?.[name] ?? null;
      if ((value === null || value === undefined) && required) {
        throw new Error(`Missing required string option: ${name}`);
      }
      return value;
    }),
    getBoolean: vi.fn((name: string, required?: boolean) => {
      const value = input.booleanOptions?.[name] ?? null;
      if (value === null && required) {
        throw new Error(`Missing required boolean option: ${name}`);
      }
      return value;
    }),
  };

  const interaction = {
    commandName: input.commandName ?? "test-command",
    user: commandUser,
    options,
    createdTimestamp: input.createdTimestamp ?? Date.now() - 42,
    client: {
      ws: {
        ping: input.apiLatencyMs ?? 73,
      },
    },
    replied: input.replied ?? false,
    deferred: input.deferred ?? false,
    guild,
    guildId: input.inGuild === false ? null : (input.guildId ?? "guild-id"),
    inGuild: vi.fn(() => input.inGuild !== false),
    reply: vi.fn().mockResolvedValue(undefined),
    followUp: vi.fn().mockResolvedValue(undefined),
  };

  return interaction;
};

export const createMockCommandContext = (
  overrides: Partial<CommandExecutionContext> = {},
): CommandExecutionContext => {
  const config = createTestConfig();
  const logger = createMockLogger();

  return {
    config,
    logger,
    userService: {
      onboard: vi.fn(),
      deboard: vi.fn(),
      setHiatus: vi.fn(),
      getProfile: vi.fn(),
    } as unknown as CommandExecutionContext["userService"],
    assignmentService: {
      assignTask: vi.fn(),
      requestExtension: vi.fn(),
    } as unknown as CommandExecutionContext["assignmentService"],
    configCacheService: {
      getConfig: vi.fn().mockReturnValue({
        ownerRoleIds: [config.roles.owners],
      }),
      loadConfig: vi.fn().mockResolvedValue({
        ownerRoleIds: [config.roles.owners],
      }),
      refreshConfig: vi.fn(),
    } as unknown as CommandExecutionContext["configCacheService"],
    ...overrides,
  };
};
