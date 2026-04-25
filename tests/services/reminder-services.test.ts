import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TaskReminderBootstrapService } from "../../src/services/task-reminder-bootstrap-service";
import { TaskReminderDispatcherService } from "../../src/services/task-reminder-dispatcher-service";
import { TaskReminderScheduleService } from "../../src/services/task-reminder-schedule-service";
import { createMockLogger, createTestConfig } from "../helpers/mocks";

const createAssignment = (overrides: Record<string, unknown> = {}) => ({
  id: "assignment-id",
  discordUserId: "member-id",
  taskName: "Task Name",
  deadline: new Date("2026-12-01T10:00:00.000Z"),
  status: "PENDING",
  ...overrides,
});

describe("TaskReminderScheduleService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-12-01T09:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("schedules reminders based on configured offsets", async () => {
    const config = createTestConfig();
    config.reminders.offsetMinutes = [60, 30, 0];

    const taskReminderRepository = {
      createMany: vi.fn().mockResolvedValue(undefined),
      claimDueReminders: vi.fn(),
      markSent: vi.fn(),
      markFailed: vi.fn(),
      cancelPendingForAssignment: vi.fn(),
    };

    const service = new TaskReminderScheduleService(
      config,
      taskReminderRepository as never,
      createMockLogger(),
    );

    const scheduledCount = await service.scheduleForAssignment(
      createAssignment({ deadline: new Date("2026-12-01T10:00:00.000Z") }) as never,
    );

    expect(scheduledCount).toBe(2);
    expect(taskReminderRepository.createMany).toHaveBeenCalledTimes(1);

    const reminders = taskReminderRepository.createMany.mock.calls[0][0];
    expect(reminders).toHaveLength(2);
    expect(reminders.map((item: { offsetMinutes: number }) => item.offsetMinutes)).toEqual([
      30,
      0,
    ]);
  });

  it("returns zero when reminders are disabled", async () => {
    const config = createTestConfig();
    config.reminders.enabled = false;

    const taskReminderRepository = {
      createMany: vi.fn(),
      claimDueReminders: vi.fn(),
      markSent: vi.fn(),
      markFailed: vi.fn(),
      cancelPendingForAssignment: vi.fn(),
    };

    const service = new TaskReminderScheduleService(
      config,
      taskReminderRepository as never,
      createMockLogger(),
    );

    const scheduledCount = await service.scheduleForAssignment(createAssignment() as never);

    expect(scheduledCount).toBe(0);
    expect(taskReminderRepository.createMany).not.toHaveBeenCalled();
  });

  it("cancels and reschedules reminders on reschedule", async () => {
    const config = createTestConfig();

    const taskReminderRepository = {
      createMany: vi.fn().mockResolvedValue(undefined),
      claimDueReminders: vi.fn(),
      markSent: vi.fn(),
      markFailed: vi.fn(),
      cancelPendingForAssignment: vi.fn().mockResolvedValue(undefined),
    };

    const service = new TaskReminderScheduleService(
      config,
      taskReminderRepository as never,
      createMockLogger(),
    );

    await service.rescheduleForAssignment(createAssignment() as never);

    expect(taskReminderRepository.cancelPendingForAssignment).toHaveBeenCalledWith("assignment-id");
    expect(taskReminderRepository.createMany).toHaveBeenCalled();
  });
});

describe("TaskReminderBootstrapService", () => {
  it("syncs pending assignments on startup", async () => {
    const assignmentRepository = {
      findAllPending: vi.fn().mockResolvedValue([createAssignment(), createAssignment({ id: "a2" })]),
    };

    const scheduleService = {
      scheduleForAssignments: vi.fn().mockResolvedValue({ processed: 2, scheduled: 4 }),
    };

    const logger = createMockLogger();

    const service = new TaskReminderBootstrapService(
      assignmentRepository as never,
      scheduleService as never,
      logger,
    );

    await service.runStartupSync();

    expect(assignmentRepository.findAllPending).toHaveBeenCalledTimes(1);
    expect(scheduleService.scheduleForAssignments).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith("Reminder bootstrap sync complete.", {
      pendingAssignments: 2,
      remindersScheduled: 4,
    });
  });
});

describe("TaskReminderDispatcherService", () => {
  it("does not start loop when reminders are disabled", () => {
    const config = createTestConfig();
    config.reminders.enabled = false;

    const taskReminderRepository = {
      createMany: vi.fn(),
      claimDueReminders: vi.fn(),
      markSent: vi.fn(),
      markFailed: vi.fn(),
      cancelPendingForAssignment: vi.fn(),
    };

    const discordClient = {
      channels: {
        fetch: vi.fn(),
      },
    };

    const logger = createMockLogger();

    const service = new TaskReminderDispatcherService(
      config,
      taskReminderRepository as never,
      discordClient as never,
      logger,
    );

    service.start();

    expect(taskReminderRepository.claimDueReminders).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith("Reminder dispatcher is disabled by configuration.");
  });

  it("dispatches claimed reminders and marks them as sent", async () => {
    const config = createTestConfig();
    const deadline = new Date("2026-12-01T11:00:00.000Z");

    const taskReminderRepository = {
      createMany: vi.fn(),
      claimDueReminders: vi.fn().mockResolvedValue([
        {
          id: "reminder-id",
          discordUserId: "member-id",
          taskName: "Task Name",
          deadline,
          offsetMinutes: 30,
        },
      ]),
      markSent: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
      cancelPendingForAssignment: vi.fn(),
    };

    const channel = {
      isTextBased: vi.fn().mockReturnValue(true),
      send: vi.fn().mockResolvedValue(undefined),
    };

    const discordClient = {
      channels: {
        fetch: vi.fn().mockResolvedValue(channel),
      },
    };

    const logger = createMockLogger();

    const service = new TaskReminderDispatcherService(
      config,
      taskReminderRepository as never,
      discordClient as never,
      logger,
    );

    await (service as unknown as { runDispatchCycle: () => Promise<void> }).runDispatchCycle();

    expect(taskReminderRepository.claimDueReminders).toHaveBeenCalledTimes(1);
    expect(discordClient.channels.fetch).toHaveBeenCalledWith(config.channels.remindersChannelId);
    expect(channel.send).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "<@member-id>",
      }),
    );
    expect(taskReminderRepository.markSent).toHaveBeenCalledWith(
      "reminder-id",
      expect.any(Date),
    );
    expect(taskReminderRepository.markFailed).not.toHaveBeenCalled();
  });

  it("marks reminder as failed when dm send fails", async () => {
    const config = createTestConfig();

    const taskReminderRepository = {
      createMany: vi.fn(),
      claimDueReminders: vi.fn().mockResolvedValue([
        {
          id: "reminder-id",
          discordUserId: "member-id",
          taskName: "Task Name",
          deadline: new Date("2026-12-01T08:00:00.000Z"),
          offsetMinutes: 0,
        },
      ]),
      markSent: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
      cancelPendingForAssignment: vi.fn(),
    };

    const channel = {
      isTextBased: vi.fn().mockReturnValue(true),
      send: vi.fn().mockRejectedValue(new Error("cannot send")),
    };

    const discordClient = {
      channels: {
        fetch: vi.fn().mockResolvedValue(channel),
      },
    };

    const logger = createMockLogger();

    const service = new TaskReminderDispatcherService(
      config,
      taskReminderRepository as never,
      discordClient as never,
      logger,
    );

    await (service as unknown as { runDispatchCycle: () => Promise<void> }).runDispatchCycle();

    expect(taskReminderRepository.markFailed).toHaveBeenCalledWith("reminder-id", "cannot send");
    expect(logger.warn).toHaveBeenCalledWith(
      "Failed to send task reminder.",
      expect.objectContaining({ reminderId: "reminder-id" }),
    );
  });

  it("logs cycle errors when claim step fails", async () => {
    const config = createTestConfig();

    const taskReminderRepository = {
      createMany: vi.fn(),
      claimDueReminders: vi.fn().mockRejectedValue(new Error("claim failed")),
      markSent: vi.fn(),
      markFailed: vi.fn(),
      cancelPendingForAssignment: vi.fn(),
    };

    const discordClient = {
      channels: {
        fetch: vi.fn(),
      },
    };

    const logger = createMockLogger();

    const service = new TaskReminderDispatcherService(
      config,
      taskReminderRepository as never,
      discordClient as never,
      logger,
    );

    await (service as unknown as { runDispatchCycle: () => Promise<void> }).runDispatchCycle();

    expect(logger.error).toHaveBeenCalledWith(
      "Reminder dispatch cycle failed.",
      expect.objectContaining({ message: "claim failed" }),
    );
  });

  it("marks reminder as failed when reminders channel is not configured", async () => {
    const config = createTestConfig();
    config.channels.remindersChannelId = null;

    const taskReminderRepository = {
      createMany: vi.fn(),
      claimDueReminders: vi.fn().mockResolvedValue([
        {
          id: "reminder-id",
          discordUserId: "member-id",
          taskName: "Task Name",
          deadline: new Date("2026-12-01T08:00:00.000Z"),
          offsetMinutes: 0,
        },
      ]),
      markSent: vi.fn(),
      markFailed: vi.fn().mockResolvedValue(undefined),
      cancelPendingForAssignment: vi.fn(),
    };

    const discordClient = {
      channels: {
        fetch: vi.fn(),
      },
    };

    const logger = createMockLogger();

    const service = new TaskReminderDispatcherService(
      config,
      taskReminderRepository as never,
      discordClient as never,
      logger,
    );

    await (service as unknown as { runDispatchCycle: () => Promise<void> }).runDispatchCycle();

    expect(taskReminderRepository.markFailed).toHaveBeenCalledWith(
      "reminder-id",
      "Reminders channel is not configured.",
    );
    expect(discordClient.channels.fetch).not.toHaveBeenCalled();
  });
});
