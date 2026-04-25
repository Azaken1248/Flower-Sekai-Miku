import { describe, expect, it, vi } from "vitest";

import { UserService } from "../../src/services/user-service";
import { createMockLogger } from "../helpers/mocks";

describe("UserService", () => {
  it("creates a new user during onboarding when none exists", async () => {
    const createdUser = {
      id: "user-id",
      discordId: "123",
      username: "alice",
      isDeboarded: false,
      joinedAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(createdUser),
      reactivate: vi.fn(),
      markDeboarded: vi.fn(),
      setHiatus: vi.fn(),
      appendAssignment: vi.fn(),
    };

    const assignmentRepository = {
      countByDiscordUserId: vi.fn(),
    };

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      createMockLogger(),
    );

    const result = await service.onboard("123", "alice");

    expect(result.status).toBe("created");
    expect(userRepository.create).toHaveBeenCalledWith({ discordId: "123", username: "alice" });
  });

  it("reactivates a deboarded user during onboarding", async () => {
    const existingUser = {
      id: "user-id",
      discordId: "123",
      username: "old",
      isDeboarded: true,
    };
    const reactivatedUser = {
      ...existingUser,
      username: "new-name",
      isDeboarded: false,
      joinedAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue(existingUser),
      create: vi.fn(),
      reactivate: vi.fn().mockResolvedValue(reactivatedUser),
      markDeboarded: vi.fn(),
      setHiatus: vi.fn(),
      appendAssignment: vi.fn(),
    };

    const assignmentRepository = {
      countByDiscordUserId: vi.fn(),
    };

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      createMockLogger(),
    );

    const result = await service.onboard("123", "new-name");

    expect(result.status).toBe("reactivated");
    expect(userRepository.reactivate).toHaveBeenCalledWith("123", "new-name");
  });

  it("returns alreadyActive when user is already active", async () => {
    const existingUser = {
      id: "user-id",
      discordId: "123",
      username: "alice",
      isDeboarded: false,
      joinedAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue(existingUser),
      create: vi.fn(),
      reactivate: vi.fn(),
      markDeboarded: vi.fn(),
      setHiatus: vi.fn(),
      appendAssignment: vi.fn(),
    };

    const assignmentRepository = {
      countByDiscordUserId: vi.fn(),
    };

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      createMockLogger(),
    );

    const result = await service.onboard("123", "alice");

    expect(result.status).toBe("alreadyActive");
    expect(result.user).toBe(existingUser);
  });

  it("returns notFound on deboard when profile does not exist", async () => {
    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      reactivate: vi.fn(),
      markDeboarded: vi.fn(),
      setHiatus: vi.fn(),
      appendAssignment: vi.fn(),
    };

    const assignmentRepository = {
      countByDiscordUserId: vi.fn(),
    };

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      createMockLogger(),
    );

    const result = await service.deboard("123", "reason");

    expect(result).toEqual({ status: "notFound", user: null });
  });

  it("returns alreadyDeboarded when user is already marked", async () => {
    const existingUser = {
      id: "user-id",
      discordId: "123",
      username: "alice",
      isDeboarded: true,
    };

    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue(existingUser),
      create: vi.fn(),
      reactivate: vi.fn(),
      markDeboarded: vi.fn(),
      setHiatus: vi.fn(),
      appendAssignment: vi.fn(),
    };

    const assignmentRepository = {
      countByDiscordUserId: vi.fn(),
    };

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      createMockLogger(),
    );

    const result = await service.deboard("123");

    expect(result).toEqual({ status: "alreadyDeboarded", user: existingUser });
    expect(userRepository.markDeboarded).not.toHaveBeenCalled();
  });

  it("marks user as deboarded when active", async () => {
    const existingUser = {
      id: "user-id",
      discordId: "123",
      username: "alice",
      isDeboarded: false,
    };
    const deboardedUser = {
      ...existingUser,
      isDeboarded: true,
    };

    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue(existingUser),
      create: vi.fn(),
      reactivate: vi.fn(),
      markDeboarded: vi.fn().mockResolvedValue(deboardedUser),
      setHiatus: vi.fn(),
      appendAssignment: vi.fn(),
    };

    const assignmentRepository = {
      countByDiscordUserId: vi.fn(),
    };

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      createMockLogger(),
    );

    const result = await service.deboard("123", "bye");

    expect(result).toEqual({ status: "deboarded", user: deboardedUser });
    expect(userRepository.markDeboarded).toHaveBeenCalledWith("123", "bye");
  });

  it("returns null profile for unknown users", async () => {
    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      reactivate: vi.fn(),
      markDeboarded: vi.fn(),
      setHiatus: vi.fn(),
      appendAssignment: vi.fn(),
    };

    const assignmentRepository = {
      countByDiscordUserId: vi.fn(),
    };

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      createMockLogger(),
    );

    await expect(service.getProfile("missing")).resolves.toBeNull();
  });

  it("returns profile with assignment stats", async () => {
    const user = {
      id: "user-id",
      discordId: "123",
      username: "alice",
      joinedAt: new Date("2026-01-01T00:00:00.000Z"),
      isDeboarded: false,
      isOnHiatus: false,
      strikes: 0,
    };

    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue(user),
      create: vi.fn(),
      reactivate: vi.fn(),
      markDeboarded: vi.fn(),
      setHiatus: vi.fn(),
      appendAssignment: vi.fn(),
    };

    const assignmentRepository = {
      countByDiscordUserId: vi.fn((_: string, status?: string) => {
        if (status === "PENDING") {
          return Promise.resolve(2);
        }
        if (status === "COMPLETED") {
          return Promise.resolve(5);
        }
        if (status === "LATE") {
          return Promise.resolve(1);
        }
        if (status === "EXCUSED") {
          return Promise.resolve(1);
        }

        return Promise.resolve(9);
      }),
    };

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      createMockLogger(),
    );

    const profile = await service.getProfile("123");

    expect(profile?.user).toBe(user);
    expect(profile?.assignmentStats).toEqual({
      total: 9,
      pending: 2,
      completed: 5,
      late: 1,
      excused: 1,
    });
  });
});
