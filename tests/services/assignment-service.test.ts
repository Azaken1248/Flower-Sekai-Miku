import { describe, expect, it, vi } from "vitest";

import { AssignmentService } from "../../src/services/assignment-service";
import { createMockLogger } from "../helpers/mocks";

const createAssignment = (overrides: Record<string, unknown> = {}) => {
  const baseDeadline = new Date("2026-08-01T00:00:00.000Z");

  return {
    id: "assignment-id",
    userId: "user-id",
    discordUserId: "member-id",
    roleId: "role-id",
    taskName: "Task Name",
    description: "Task Description",
    assignedAt: new Date("2026-07-01T00:00:00.000Z"),
    deadline: baseDeadline,
    status: "PENDING",
    isTimeLimited: false,
    extensionsGranted: 0,
    ...overrides,
  };
};

describe("AssignmentService", () => {
  it("throws when assigning to non-onboarded users", async () => {
    const assignmentRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      extendDeadline: vi.fn(),
      updateStatus: vi.fn(),
      findPendingByDiscordUserId: vi.fn(),
      findAllPending: vi.fn(),
      countByDiscordUserId: vi.fn(),
    };

    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue(null),
      appendAssignment: vi.fn(),
    };

    const reminderScheduleService = {
      scheduleForAssignment: vi.fn(),
      rescheduleForAssignment: vi.fn(),
    };

    const service = new AssignmentService(
      assignmentRepository as never,
      userRepository as never,
      reminderScheduleService as never,
      createMockLogger(),
    );

    await expect(
      service.assignTask({
        discordUserId: "member-id",
        roleId: "role-id",
        taskName: "Task",
        description: "Description",
        deadline: new Date("2026-08-01T00:00:00.000Z"),
        isTimeLimited: false,
      }),
    ).rejects.toThrowError("Target user is not onboarded as an active crew member.");
  });

  it("creates assignment and schedules reminders", async () => {
    const assignment = createAssignment();
    const assignmentRepository = {
      create: vi.fn().mockResolvedValue(assignment),
      findById: vi.fn(),
      extendDeadline: vi.fn(),
      updateStatus: vi.fn(),
      findPendingByDiscordUserId: vi.fn(),
      findAllPending: vi.fn(),
      countByDiscordUserId: vi.fn(),
    };

    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue({
        id: "user-id",
        isDeboarded: false,
      }),
      appendAssignment: vi.fn().mockResolvedValue(undefined),
    };

    const reminderScheduleService = {
      scheduleForAssignment: vi.fn().mockResolvedValue(2),
      rescheduleForAssignment: vi.fn(),
    };

    const service = new AssignmentService(
      assignmentRepository as never,
      userRepository as never,
      reminderScheduleService as never,
      createMockLogger(),
    );

    const result = await service.assignTask({
      discordUserId: "member-id",
      roleId: "role-id",
      taskName: "Task",
      description: "Description",
      deadline: new Date("2026-08-01T00:00:00.000Z"),
      isTimeLimited: false,
    });

    expect(result).toBe(assignment);
    expect(assignmentRepository.create).toHaveBeenCalled();
    expect(userRepository.appendAssignment).toHaveBeenCalledWith("member-id", "assignment-id");
    expect(reminderScheduleService.scheduleForAssignment).toHaveBeenCalledWith(assignment);
  });

  it("continues assignment flow when reminder scheduling fails", async () => {
    const logger = createMockLogger();
    const assignment = createAssignment();

    const assignmentRepository = {
      create: vi.fn().mockResolvedValue(assignment),
      findById: vi.fn(),
      extendDeadline: vi.fn(),
      updateStatus: vi.fn(),
      findPendingByDiscordUserId: vi.fn(),
      findAllPending: vi.fn(),
      countByDiscordUserId: vi.fn(),
    };

    const userRepository = {
      findByDiscordId: vi.fn().mockResolvedValue({
        id: "user-id",
        isDeboarded: false,
      }),
      appendAssignment: vi.fn().mockResolvedValue(undefined),
    };

    const reminderScheduleService = {
      scheduleForAssignment: vi.fn().mockRejectedValue(new Error("boom")),
      rescheduleForAssignment: vi.fn(),
    };

    const service = new AssignmentService(
      assignmentRepository as never,
      userRepository as never,
      reminderScheduleService as never,
      logger,
    );

    const result = await service.assignTask({
      discordUserId: "member-id",
      roleId: "role-id",
      taskName: "Task",
      description: "Description",
      deadline: new Date("2026-08-01T00:00:00.000Z"),
      isTimeLimited: false,
    });

    expect(result).toBe(assignment);
    expect(logger.warn).toHaveBeenCalledWith(
      "Assignment created but reminder scheduling failed.",
      expect.objectContaining({ assignmentId: "assignment-id" }),
    );
  });

  it("rejects extension for non-owner attempting another user's assignment", async () => {
    const assignment = createAssignment({ discordUserId: "another-user" });

    const assignmentRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(assignment),
      extendDeadline: vi.fn(),
      updateStatus: vi.fn(),
      findPendingByDiscordUserId: vi.fn(),
      findAllPending: vi.fn(),
      countByDiscordUserId: vi.fn(),
    };

    const userRepository = {
      findByDiscordId: vi.fn(),
      appendAssignment: vi.fn(),
    };

    const reminderScheduleService = {
      scheduleForAssignment: vi.fn(),
      rescheduleForAssignment: vi.fn(),
    };

    const service = new AssignmentService(
      assignmentRepository as never,
      userRepository as never,
      reminderScheduleService as never,
      createMockLogger(),
    );

    const result = await service.requestExtension({
      assignmentId: "assignment-id",
      discordUserId: "invoker-id",
      newDeadline: new Date("2026-08-02T00:00:00.000Z"),
    });

    expect(result).toEqual({
      allowed: false,
      reason: "You can only request extensions for your own assignments.",
    });
  });

  it("applies extension and reschedules reminders", async () => {
    const assignment = createAssignment();
    const updatedAssignment = createAssignment({
      deadline: new Date("2026-08-03T00:00:00.000Z"),
      extensionsGranted: 1,
    });

    const assignmentRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(assignment),
      extendDeadline: vi.fn().mockResolvedValue(updatedAssignment),
      updateStatus: vi.fn(),
      findPendingByDiscordUserId: vi.fn(),
      findAllPending: vi.fn(),
      countByDiscordUserId: vi.fn(),
    };

    const userRepository = {
      findByDiscordId: vi.fn(),
      appendAssignment: vi.fn(),
    };

    const reminderScheduleService = {
      scheduleForAssignment: vi.fn(),
      rescheduleForAssignment: vi.fn().mockResolvedValue(2),
    };

    const service = new AssignmentService(
      assignmentRepository as never,
      userRepository as never,
      reminderScheduleService as never,
      createMockLogger(),
    );

    const result = await service.requestExtension({
      assignmentId: "assignment-id",
      discordUserId: "member-id",
      newDeadline: new Date("2026-08-03T00:00:00.000Z"),
    });

    expect(result.allowed).toBe(true);
    expect(result.assignment).toBe(updatedAssignment);
    expect(reminderScheduleService.rescheduleForAssignment).toHaveBeenCalledWith(updatedAssignment);
  });

  it("continues extension flow when reminder rescheduling fails", async () => {
    const logger = createMockLogger();
    const assignment = createAssignment();
    const updatedAssignment = createAssignment({
      deadline: new Date("2026-08-03T00:00:00.000Z"),
      extensionsGranted: 1,
    });

    const assignmentRepository = {
      create: vi.fn(),
      findById: vi.fn().mockResolvedValue(assignment),
      extendDeadline: vi.fn().mockResolvedValue(updatedAssignment),
      updateStatus: vi.fn(),
      findPendingByDiscordUserId: vi.fn(),
      findAllPending: vi.fn(),
      countByDiscordUserId: vi.fn(),
    };

    const userRepository = {
      findByDiscordId: vi.fn(),
      appendAssignment: vi.fn(),
    };

    const reminderScheduleService = {
      scheduleForAssignment: vi.fn(),
      rescheduleForAssignment: vi.fn().mockRejectedValue(new Error("boom")),
    };

    const service = new AssignmentService(
      assignmentRepository as never,
      userRepository as never,
      reminderScheduleService as never,
      logger,
    );

    const result = await service.requestExtension({
      assignmentId: "assignment-id",
      discordUserId: "member-id",
      newDeadline: new Date("2026-08-03T00:00:00.000Z"),
    });

    expect(result.allowed).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith(
      "Assignment deadline extended but reminder rescheduling failed.",
      expect.objectContaining({ assignmentId: "assignment-id" }),
    );
  });
});
