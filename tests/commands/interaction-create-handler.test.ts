import { MessageFlags } from "discord.js";
import { describe, expect, it, vi } from "vitest";

import { InteractionCreateHandler } from "../../src/commands/handlers/interaction-create-handler";
import { CommandRegistry } from "../../src/commands/registry/command-registry";
import { createMockCommandContext, createMockInteraction, createMockLogger } from "../helpers/mocks";

describe("InteractionCreateHandler", () => {
  it("ignores non-chat interactions", async () => {
    const registry = new CommandRegistry();
    const handler = new InteractionCreateHandler(registry, createMockCommandContext(), createMockLogger());

    const interaction = {
      isChatInputCommand: vi.fn().mockReturnValue(false),
    };

    await (handler as unknown as { handleInteraction: (interaction: unknown) => Promise<void> }).handleInteraction(interaction);

    expect(interaction.isChatInputCommand).toHaveBeenCalledTimes(1);
  });

  it("replies when command is not registered", async () => {
    const registry = new CommandRegistry();
    const handler = new InteractionCreateHandler(registry, createMockCommandContext(), createMockLogger());

    const interaction = {
      ...createMockInteraction({ commandName: "unknown" }),
      isChatInputCommand: vi.fn().mockReturnValue(true),
    };

    await (handler as unknown as { handleInteraction: (interaction: unknown) => Promise<void> }).handleInteraction(interaction);

    expect(interaction.reply).toHaveBeenCalledTimes(1);
    const payload = interaction.reply.mock.calls[0][0];
    expect(payload.flags).toBe(MessageFlags.Ephemeral);
  });

  it("blocks role-gated commands when member lacks required role", async () => {
    const registry = new CommandRegistry();
    const execute = vi.fn();
    registry.register({
      data: { name: "admin-only" },
      requiredRoleIds: ["role-required"],
      execute,
    } as never);

    const handler = new InteractionCreateHandler(registry, createMockCommandContext(), createMockLogger());

    const interaction = {
      ...createMockInteraction({
        commandName: "admin-only",
        inGuild: true,
        memberRoleIds: [],
        user: { id: "regular-user" },
      }),
      isChatInputCommand: vi.fn().mockReturnValue(true),
    };

    await (handler as unknown as { handleInteraction: (interaction: unknown) => Promise<void> }).handleInteraction(interaction);

    expect(execute).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledTimes(1);
  });

  it("allows bypass user to execute role-gated commands", async () => {
    const registry = new CommandRegistry();
    const execute = vi.fn().mockResolvedValue(undefined);
    registry.register({
      data: { name: "admin-only" },
      requiredRoleIds: ["role-required"],
      execute,
    } as never);

    const handler = new InteractionCreateHandler(registry, createMockCommandContext(), createMockLogger());

    const interaction = {
      ...createMockInteraction({
        commandName: "admin-only",
        inGuild: true,
        memberRoleIds: [],
        user: { id: "1213817849693478972" },
      }),
      isChatInputCommand: vi.fn().mockReturnValue(true),
    };

    await (handler as unknown as { handleInteraction: (interaction: unknown) => Promise<void> }).handleInteraction(interaction);

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("replies with command error when execution throws before initial reply", async () => {
    const logger = createMockLogger();
    const registry = new CommandRegistry();
    registry.register({
      data: { name: "throws" },
      execute: vi.fn().mockRejectedValue(new Error("expected failure")),
    } as never);

    const handler = new InteractionCreateHandler(registry, createMockCommandContext(), logger);

    const interaction = {
      ...createMockInteraction({ commandName: "throws", replied: false, deferred: false }),
      isChatInputCommand: vi.fn().mockReturnValue(true),
    };

    await (handler as unknown as { handleInteraction: (interaction: unknown) => Promise<void> }).handleInteraction(interaction);

    expect(logger.error).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledTimes(1);
  });

  it("follows up with command error when interaction is already replied", async () => {
    const registry = new CommandRegistry();
    registry.register({
      data: { name: "throws" },
      execute: vi.fn().mockRejectedValue(new Error("expected failure")),
    } as never);

    const handler = new InteractionCreateHandler(registry, createMockCommandContext(), createMockLogger());

    const interaction = {
      ...createMockInteraction({ commandName: "throws", replied: true, deferred: false }),
      isChatInputCommand: vi.fn().mockReturnValue(true),
    };

    await (handler as unknown as { handleInteraction: (interaction: unknown) => Promise<void> }).handleInteraction(interaction);

    expect(interaction.followUp).toHaveBeenCalledTimes(1);
  });
});
