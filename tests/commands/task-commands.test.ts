import { MessageFlags } from "discord.js";
import { describe, expect, it, vi } from "vitest";

import { AssignCommand } from "../../src/commands/modules/tasks/assign.command";
import { ExtensionCommand } from "../../src/commands/modules/tasks/extension.command";
import { createMockCommandContext, createMockInteraction, createTestConfig } from "../helpers/mocks";

describe("task commands", () => {
  it("AssignCommand rejects invalid deadline input", async () => {
    const config = createTestConfig();
    const command = new AssignCommand([config.roles.owners], config.roles.specialized);

    const interaction = createMockInteraction({
      targetUsers: {
        member: {
          id: "target-id",
        },
      },
      stringOptions: {
        role: "role-artist",
        task: "Draw Card",
        deadline: "not-a-date",
      },
      booleanOptions: {
        is_time_limited: true,
      },
    });

    const context = createMockCommandContext();

    await command.execute(interaction as never, context);

    expect(context.assignmentService.assignTask).not.toHaveBeenCalled();
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });

  it("AssignCommand assigns task and replies with success embed", async () => {
    const config = createTestConfig();
    const command = new AssignCommand([config.roles.owners], config.roles.specialized);

    const interaction = createMockInteraction({
      targetUsers: {
        member: {
          id: "target-id",
        },
      },
      stringOptions: {
        role: "role-artist",
        task: "Draw Card",
        deadline: "2026-12-20T10:00:00.000Z",
        description: "Deliver first draft",
      },
      booleanOptions: {
        is_time_limited: false,
      },
    });

    const context = createMockCommandContext();
    (context.assignmentService.assignTask as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      taskName: "Draw Card",
      deadline: new Date("2026-12-20T10:00:00.000Z"),
    });

    await command.execute(interaction as never, context);

    expect(context.assignmentService.assignTask).toHaveBeenCalledWith(
      expect.objectContaining({
        discordUserId: "target-id",
        taskName: "Draw Card",
      }),
    );

    const payload = interaction.reply.mock.calls[0][0];
    const embed = payload.embeds[0].toJSON();
    expect(embed.title).toBe("Miku Assignment Board");
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });

  it("ExtensionCommand rejects invalid date input", async () => {
    const command = new ExtensionCommand();
    const interaction = createMockInteraction({
      stringOptions: {
        assignment_id: "assignment-id",
        new_deadline: "invalid-date",
      },
    });
    const context = createMockCommandContext();

    await command.execute(interaction as never, context);

    expect(context.assignmentService.requestExtension).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledTimes(1);
  });

  it("ExtensionCommand replies with denial reason when extension not allowed", async () => {
    const command = new ExtensionCommand();
    const interaction = createMockInteraction({
      user: { id: "invoker-id" },
      stringOptions: {
        assignment_id: "assignment-id",
        new_deadline: "2026-12-30T10:00:00.000Z",
      },
    });
    const context = createMockCommandContext();
    (context.assignmentService.requestExtension as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: false,
      reason: "Denied for test",
    });

    await command.execute(interaction as never, context);

    const payload = interaction.reply.mock.calls[0][0];
    const embed = payload.embeds[0].toJSON();

    expect(embed.description).toContain("Denied for test");
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });

  it("ExtensionCommand replies with success when extension is granted", async () => {
    const command = new ExtensionCommand();
    const interaction = createMockInteraction({
      user: { id: "invoker-id" },
      stringOptions: {
        assignment_id: "assignment-id",
        new_deadline: "2026-12-30T10:00:00.000Z",
      },
    });
    const context = createMockCommandContext();
    (context.assignmentService.requestExtension as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: true,
      assignment: {
        deadline: new Date("2026-12-30T10:00:00.000Z"),
      },
    });

    await command.execute(interaction as never, context);

    const payload = interaction.reply.mock.calls[0][0];
    const embed = payload.embeds[0].toJSON();

    expect(embed.description).toContain("Miku approved the extension");
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });
});
