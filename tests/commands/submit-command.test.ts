import { MessageFlags } from "discord.js";
import { describe, expect, it, vi } from "vitest";

import { SubmitCommand } from "../../src/commands/modules/tasks/submit.command";
import { createMockCommandContext, createMockInteraction } from "../helpers/mocks";

describe("SubmitCommand", () => {
  it("replies with error when submitTask returns notFound", async () => {
    const command = new SubmitCommand();
    const interaction = createMockInteraction({
      stringOptions: { assignment_id: "fake-id" },
    });
    const context = createMockCommandContext();

    (context.assignmentService.submitTask as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "notFound",
      reason: "Assignment not found.",
    });

    await command.execute(interaction as never, context);

    expect(context.assignmentService.submitTask).toHaveBeenCalledWith({
      assignmentId: "fake-id",
      discordUserId: "invoking-user-id",
    });

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds[0].toJSON().description).toContain("Submission Failed");
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });

  it("replies with error when submitTask returns notOwner", async () => {
    const command = new SubmitCommand();
    const interaction = createMockInteraction({
      stringOptions: { assignment_id: "assignment-1" },
    });
    const context = createMockCommandContext();

    (context.assignmentService.submitTask as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "notOwner",
      reason: "You can only submit your own assignments.",
    });

    await command.execute(interaction as never, context);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds[0].toJSON().description).toContain("Submission Failed");
  });

  it("replies with error when submitTask returns notPending", async () => {
    const command = new SubmitCommand();
    const interaction = createMockInteraction({
      stringOptions: { assignment_id: "assignment-1" },
    });
    const context = createMockCommandContext();

    (context.assignmentService.submitTask as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "notPending",
      reason: "This assignment is currently marked as `COMPLETED`.",
    });

    await command.execute(interaction as never, context);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds[0].toJSON().description).toContain("Submission Failed");
  });

  it("replies with error when no approval channel is configured", async () => {
    const command = new SubmitCommand();
    const interaction = createMockInteraction({
      stringOptions: { assignment_id: "assignment-1" },
    });
    const context = createMockCommandContext();
    context.config.channels.approvalChannelId = null;

    (context.assignmentService.submitTask as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "submitted",
      assignment: {
        id: "assignment-1",
        taskName: "Draw Card",
        discordUserId: "invoking-user-id",
        deadline: new Date(),
        roleId: "role-artist",
        description: "First draft",
      },
    });

    await command.execute(interaction as never, context);

    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.embeds[0].toJSON().description).toContain("No approval channel is configured");
  });

  it("sends approval embed to channel and replies with confirmation on success", async () => {
    const command = new SubmitCommand();
    const mockSend = vi.fn().mockResolvedValue(undefined);
    const mockFetch = vi.fn().mockResolvedValue({
      isTextBased: () => true,
      send: mockSend,
    });

    const interaction = createMockInteraction({
      stringOptions: { assignment_id: "assignment-1" },
    });
    (interaction as any).client = {
      ...interaction.client,
      channels: { fetch: mockFetch },
    };

    const context = createMockCommandContext();
    context.config.channels.approvalChannelId = "approval-channel-id";

    (context.assignmentService.submitTask as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: "submitted",
      assignment: {
        id: "assignment-1",
        taskName: "Draw Card",
        discordUserId: "invoking-user-id",
        deadline: new Date(),
        roleId: "role-artist",
        description: "First draft",
      },
    });

    await command.execute(interaction as never, context);

    expect(mockFetch).toHaveBeenCalledWith("approval-channel-id");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        embeds: expect.any(Array),
        components: expect.any(Array),
      }),
    );

    const payload = interaction.reply.mock.calls[0][0];
    const embed = payload.embeds[0].toJSON();
    expect(embed.description).toContain("submitted for review");
    expect(embed.title).toBe("Miku Submission Desk");
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });
});
