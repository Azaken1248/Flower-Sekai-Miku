import { describe, expect, it, vi } from "vitest";

import { UserService } from "../../src/services/user-service";
import { createMockLogger } from "../helpers/mocks";

const createMockReminderService = () => ({
  scheduleForAssignment: vi.fn(),
  rescheduleForAssignment: vi.fn(),
  cancelRemindersForAssignment: vi.fn(),
  scheduleForAssignments: vi.fn(),
});

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
      createMockReminderService() as never,
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
      createMockReminderService() as never,
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
      createMockReminderService() as never,
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
      createMockReminderService() as never,
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
      createMockReminderService() as never,
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
      createMockReminderService() as never,
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
      createMockReminderService() as never,
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
      createMockReminderService() as never,
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

  it("getAvailableMembers splits free users into active and hiatus", async () => {
    const users = [
      { discordId: "user-1", isOnHiatus: false },
      { discordId: "user-2", isOnHiatus: true },
      { discordId: "user-3", isOnHiatus: false },
    ];

    const userRepository = {
      findByDiscordId: vi.fn(),
      findAllActive: vi.fn().mockResolvedValue(users),
      create: vi.fn(),
      reactivate: vi.fn(),
      markDeboarded: vi.fn(),
      setHiatus: vi.fn(),
      appendAssignment: vi.fn(),
    };

    const assignmentRepository = {
      countByDiscordUserId: vi.fn((_: string, status?: string) => {
        if (status === "PENDING") {
          return Promise.resolve(0);
        }

        return Promise.resolve(0);
      }),
    };

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      createMockReminderService() as never,
      createMockLogger(),
    );

    const result = await service.getAvailableMembers();

    expect(result.active.length).toBe(2);
    expect(result.hiatus.length).toBe(1);
    expect(result.hiatus[0]!.discordId).toBe("user-2");
  });

  it("getAvailableMembers excludes users with pending tasks", async () => {
    const users = [
      { discordId: "user-1", isOnHiatus: false },
      { discordId: "user-2", isOnHiatus: false },
    ];

    const userRepository = {
      findByDiscordId: vi.fn(),
      findAllActive: vi.fn().mockResolvedValue(users),
      create: vi.fn(),
      reactivate: vi.fn(),
      markDeboarded: vi.fn(),
      setHiatus: vi.fn(),
      appendAssignment: vi.fn(),
    };

    const assignmentRepository = {
      countByDiscordUserId: vi.fn((discordId: string, status?: string) => {
        if (status === "PENDING" && discordId === "user-1") {
          return Promise.resolve(3);
        }

        return Promise.resolve(0);
      }),
    };

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      createMockReminderService() as never,
      createMockLogger(),
    );

    const result = await service.getAvailableMembers();

    expect(result.active.length).toBe(1);
    expect(result.active[0]!.discordId).toBe("user-2");
    expect(result.hiatus.length).toBe(0);
  });

  it("startHiatus returns notFound for unknown user", async () => {
    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue(null),
      setHiatus: vi.fn(),
    };

    const assignmentRepository = {
      pushDeadlinesByDiscordUserId: vi.fn(),
    };

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      createMockReminderService() as never,
      createMockLogger(),
    );

    const result = await service.startHiatus("missing");

    expect(result.status).toBe("notFound");
    expect(userRepository.setHiatus).not.toHaveBeenCalled();
  });

  it("startHiatus returns deboarded for deboarded user", async () => {
    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue({ discordId: "123", isDeboarded: true, isOnHiatus: false }),
      setHiatus: vi.fn(),
    };

    const assignmentRepository = {
      pushDeadlinesByDiscordUserId: vi.fn(),
    };

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      createMockReminderService() as never,
      createMockLogger(),
    );

    const result = await service.startHiatus("123");

    expect(result.status).toBe("deboarded");
    expect(userRepository.setHiatus).not.toHaveBeenCalled();
  });

  it("startHiatus returns alreadyOnHiatus when user is already on hiatus", async () => {
    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue({ discordId: "123", isDeboarded: false, isOnHiatus: true }),
      setHiatus: vi.fn(),
    };

    const assignmentRepository = {
      pushDeadlinesByDiscordUserId: vi.fn(),
    };

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      createMockReminderService() as never,
      createMockLogger(),
    );

    const result = await service.startHiatus("123");

    expect(result.status).toBe("alreadyOnHiatus");
    expect(userRepository.setHiatus).not.toHaveBeenCalled();
  });

  it("startHiatus sets hiatus with timestamp and cancels reminders", async () => {
    const updatedUser = { discordId: "123", isDeboarded: false, isOnHiatus: true };
    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue({ discordId: "123", isDeboarded: false, isOnHiatus: false }),
      setHiatus: vi.fn().mockResolvedValue(updatedUser),
    };

    const assignmentRepository = {
      pushDeadlinesByDiscordUserId: vi.fn(),
      findPendingByDiscordUserId: vi.fn().mockResolvedValue([
        { id: "a1" },
        { id: "a2" },
      ]),
    };

    const mockReminderService = createMockReminderService();

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      mockReminderService as never,
      createMockLogger(),
    );

    const result = await service.startHiatus("123");

    expect(result.status).toBe("started");
    expect(result.user).toBe(updatedUser);
    expect(userRepository.setHiatus).toHaveBeenCalledWith("123", true, expect.any(Date), null);
    expect(assignmentRepository.findPendingByDiscordUserId).toHaveBeenCalledWith("123");
    expect(mockReminderService.cancelRemindersForAssignment).toHaveBeenCalledTimes(2);
    expect(mockReminderService.cancelRemindersForAssignment).toHaveBeenCalledWith("a1");
    expect(mockReminderService.cancelRemindersForAssignment).toHaveBeenCalledWith("a2");
  });

  it("startHiatus passes reason to repository", async () => {
    const updatedUser = { discordId: "123", isDeboarded: false, isOnHiatus: true };
    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue({ discordId: "123", isDeboarded: false, isOnHiatus: false }),
      setHiatus: vi.fn().mockResolvedValue(updatedUser),
    };

    const assignmentRepository = {
      pushDeadlinesByDiscordUserId: vi.fn(),
      findPendingByDiscordUserId: vi.fn().mockResolvedValue([]),
    };

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      createMockReminderService() as never,
      createMockLogger(),
    );

    const result = await service.startHiatus("123", "Taking a vacation");

    expect(result.status).toBe("started");
    expect(userRepository.setHiatus).toHaveBeenCalledWith("123", true, expect.any(Date), "Taking a vacation");
  });

  it("endHiatus returns notFound for unknown user", async () => {
    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue(null),
      setHiatus: vi.fn(),
    };

    const assignmentRepository = {
      pushDeadlinesByDiscordUserId: vi.fn(),
      findPendingByDiscordUserId: vi.fn().mockResolvedValue([]),
    };

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      createMockReminderService() as never,
      createMockLogger(),
    );

    const result = await service.endHiatus("missing");

    expect(result.status).toBe("notFound");
  });

  it("endHiatus returns notOnHiatus when user is not on hiatus", async () => {
    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue({ discordId: "123", isOnHiatus: false }),
      setHiatus: vi.fn(),
    };

    const assignmentRepository = {
      pushDeadlinesByDiscordUserId: vi.fn(),
      findPendingByDiscordUserId: vi.fn().mockResolvedValue([]),
    };

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      createMockReminderService() as never,
      createMockLogger(),
    );

    const result = await service.endHiatus("123");

    expect(result.status).toBe("notOnHiatus");
    expect(userRepository.setHiatus).not.toHaveBeenCalled();
  });

  it("endHiatus pushes deadlines and reschedules reminders", async () => {
    const hiatusStart = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const updatedUser = { discordId: "123", isOnHiatus: false };

    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue({
        discordId: "123",
        isOnHiatus: true,
        hiatusStartedAt: hiatusStart,
      }),
      setHiatus: vi.fn().mockResolvedValue(updatedUser),
    };

    const assignmentRepository = {
      pushDeadlinesByDiscordUserId: vi.fn().mockResolvedValue(2),
      findPendingByDiscordUserId: vi.fn().mockResolvedValue([
        { id: "a1" },
        { id: "a2" },
      ]),
    };

    const mockReminderService = createMockReminderService();

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      mockReminderService as never,
      createMockLogger(),
    );

    const result = await service.endHiatus("123");

    expect(result.status).toBe("ended");
    expect(result.deadlinesAffected).toBe(2);
    expect(userRepository.setHiatus).toHaveBeenCalledWith("123", false, null, null);
    expect(assignmentRepository.pushDeadlinesByDiscordUserId).toHaveBeenCalledWith(
      "123",
      expect.any(Number),
    );

    // Verify the offset is roughly 3 days (within 5 seconds tolerance)
    const actualOffset = assignmentRepository.pushDeadlinesByDiscordUserId.mock.calls[0][1];
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    expect(actualOffset).toBeGreaterThan(threeDaysMs - 5000);
    expect(actualOffset).toBeLessThan(threeDaysMs + 5000);

    // Verify reminders rescheduled
    expect(mockReminderService.rescheduleForAssignment).toHaveBeenCalledTimes(2);
  });

  it("endHiatus handles missing hiatusStartedAt gracefully", async () => {
    const updatedUser = { discordId: "123", isOnHiatus: false };

    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue({
        discordId: "123",
        isOnHiatus: true,
        hiatusStartedAt: null,
      }),
      setHiatus: vi.fn().mockResolvedValue(updatedUser),
    };

    const assignmentRepository = {
      pushDeadlinesByDiscordUserId: vi.fn(),
      findPendingByDiscordUserId: vi.fn().mockResolvedValue([]),
    };

    const service = new UserService(
      userRepository as never,
      assignmentRepository as never,
      createMockReminderService() as never,
      createMockLogger(),
    );

    const result = await service.endHiatus("123");

    expect(result.status).toBe("ended");
    expect(result.deadlinesAffected).toBe(0);
    expect(assignmentRepository.pushDeadlinesByDiscordUserId).not.toHaveBeenCalled();
  });
});
