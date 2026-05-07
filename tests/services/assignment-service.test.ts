import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Logger } from "../../src/core/logger/logger";
import type { AssignmentRepository } from "../../src/repositories/interfaces/assignment-repository";
import type { UserRepository } from "../../src/repositories/interfaces/user-repository";
import { AssignmentService } from "../../src/services/assignment-service";
import type { TaskReminderScheduleService } from "../../src/services/task-reminder-schedule-service";


describe("AssignmentService", () => {
  let mockAssignmentRepo: ReturnType<typeof vi.fn>;
  let mockUserRepo: ReturnType<typeof vi.fn>;
  let mockReminderService: ReturnType<typeof vi.fn>;
  let mockLogger: Logger;
  let service: AssignmentService;
  
  beforeEach(() => {
    mockAssignmentRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      extendDeadline: vi.fn(),
      deleteById: vi.fn(),
      transfer: vi.fn(),
    } as unknown as ReturnType<typeof vi.fn>;

    mockUserRepo = {
      findByDiscordId: vi.fn(),
      appendAssignment: vi.fn(),
      removeAssignment: vi.fn(),
    } as unknown as ReturnType<typeof vi.fn>;

    mockReminderService = {
      scheduleForAssignment: vi.fn(),
      rescheduleForAssignment: vi.fn(),
      cancelRemindersForAssignment: vi.fn(),
    } as unknown as ReturnType<typeof vi.fn>;

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;

    service = new AssignmentService(
      mockAssignmentRepo as unknown as AssignmentRepository,
      mockUserRepo as unknown as UserRepository,
      mockReminderService as unknown as TaskReminderScheduleService,
      mockLogger,
    );
  });

  describe("assignTask", () => {
    it("throws if user is not found or deboarded", async () => {
      (mockUserRepo as any).findByDiscordId.mockResolvedValue(null);

      await expect(
        service.assignTask({
          discordUserId: "user-1",
          roleId: "role-1",
          taskName: "Task",
          description: "Desc",
          deadline: new Date(),
          isTimeLimited: false,
        }),
      ).rejects.toThrow("active crew member");
    });

    it("creates assignment, appends to user, and schedules reminders", async () => {
      (mockUserRepo as any).findByDiscordId.mockResolvedValue({ id: "mongo-user-id", isDeboarded: false });
      (mockAssignmentRepo as any).create.mockResolvedValue({ id: "assignment-1", status: "PENDING" });

      await service.assignTask({
        discordUserId: "user-1",
        roleId: "role-1",
        taskName: "Task",
        description: "Desc",
        deadline: new Date(),
        isTimeLimited: false,
      });

      expect((mockAssignmentRepo as any).create).toHaveBeenCalled();
      expect((mockUserRepo as any).appendAssignment).toHaveBeenCalledWith("user-1", "assignment-1");
      expect((mockReminderService as any).scheduleForAssignment).toHaveBeenCalled();
    });
  });

  describe("removeTask", () => {
    it("returns success false if assignment does not exist", async () => {
      (mockAssignmentRepo as any).findById.mockResolvedValue(null);

      const result = await service.removeTask("fake-id");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("Assignment not found.");
    });

    it("removes assignment, pulls from user array, and cancels reminders", async () => {
      const mockAssignment = { id: "assignment-1", discordUserId: "user-1" };
      (mockAssignmentRepo as any).findById.mockResolvedValue(mockAssignment);
      (mockAssignmentRepo as any).deleteById.mockResolvedValue(true);

      const result = await service.removeTask("assignment-1");

      expect(result.success).toBe(true);
      expect((mockUserRepo as any).removeAssignment).toHaveBeenCalledWith("user-1", "assignment-1");
      expect((mockAssignmentRepo as any).deleteById).toHaveBeenCalledWith("assignment-1");
      expect((mockReminderService as any).cancelRemindersForAssignment).toHaveBeenCalledWith("assignment-1");
    });
  });

  describe("transferTask", () => {
    it("fails if target user is the same as current", async () => {
      (mockAssignmentRepo as any).findById.mockResolvedValue({ discordUserId: "user-1" });

      const result = await service.transferTask("assignment-1", "user-1");
      expect(result.success).toBe(false);
      expect(result.reason).toContain("already assigned");
    });

    it("fails if target user is not active", async () => {
      (mockAssignmentRepo as any).findById.mockResolvedValue({ discordUserId: "user-1" });
      (mockUserRepo as any).findByDiscordId.mockResolvedValue({ isDeboarded: true });

      const result = await service.transferTask("assignment-1", "new-user");
      expect(result.success).toBe(false);
      expect(result.reason).toContain("not active or onboarded");
    });

    it("transfers safely and reschedules reminders", async () => {
      const mockAssignment = { id: "assignment-1", discordUserId: "user-1" };
      const mockNewUser = { id: "mongo-user-new", discordUserId: "new-user" };

      (mockAssignmentRepo as any).findById.mockResolvedValue(mockAssignment);
      (mockUserRepo as any).findByDiscordId.mockResolvedValue(mockNewUser);
      (mockAssignmentRepo as any).transfer.mockResolvedValue({ ...mockAssignment, discordUserId: "new-user" });

      const result = await service.transferTask("assignment-1", "new-user");

      expect(result.success).toBe(true);
      expect((mockUserRepo as any).removeAssignment).toHaveBeenCalledWith("user-1", "assignment-1");
      expect((mockUserRepo as any).appendAssignment).toHaveBeenCalledWith("new-user", "assignment-1");
      expect((mockAssignmentRepo as any).transfer).toHaveBeenCalledWith("assignment-1", "mongo-user-new", "new-user");
      expect((mockReminderService as any).rescheduleForAssignment).toHaveBeenCalled();
    });
  });
});