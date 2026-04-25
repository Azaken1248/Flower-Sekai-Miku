import { describe, expect, it, vi } from "vitest";

import { HelloCommand } from "../../src/commands/modules/utility/hello.command";
import { PingCommand } from "../../src/commands/modules/utility/ping.command";
import { ProfileCommand } from "../../src/commands/modules/utility/profile.command";
import { UptimeCommand } from "../../src/commands/modules/utility/uptime.command";
import { createMockCommandContext, createMockInteraction } from "../helpers/mocks";

describe("utility commands", () => {
  it("HelloCommand replies with greeting embed", async () => {
    const command = new HelloCommand();
    const interaction = createMockInteraction({
      user: { id: "user-1" },
    });

    await command.execute(interaction as never, createMockCommandContext());

    expect(interaction.reply).toHaveBeenCalledTimes(1);
    const payload = interaction.reply.mock.calls[0][0];
    const embed = payload.embeds[0].toJSON();

    expect(embed.title).toBe("Miku Greeting");
    expect(embed.description).toContain("<@user-1>");
  });

  it("PingCommand replies with latency fields", async () => {
    const command = new PingCommand();
    const interaction = createMockInteraction({
      createdTimestamp: Date.now() - 50,
      apiLatencyMs: 123,
    });

    await command.execute(interaction as never, createMockCommandContext());

    const payload = interaction.reply.mock.calls[0][0];
    const embed = payload.embeds[0].toJSON();

    expect(embed.title).toBe("Miku Ping Check");
    expect(embed.fields?.some((field: { name: string; value: string }) => field.name === "Discord API" && field.value === "123ms")).toBe(true);
  });

  it("UptimeCommand formats and replies uptime", async () => {
    const command = new UptimeCommand();
    const interaction = createMockInteraction();

    const uptimeSpy = vi.spyOn(process, "uptime").mockReturnValue(3661);

    await command.execute(interaction as never, createMockCommandContext());

    uptimeSpy.mockRestore();

    const payload = interaction.reply.mock.calls[0][0];
    const embed = payload.embeds[0].toJSON();

    expect(embed.description).toContain("1h 1m 1s");
  });

  it("ProfileCommand responds with onboarding hint when profile is missing", async () => {
    const command = new ProfileCommand();
    const interaction = createMockInteraction({
      user: { id: "user-1" },
    });
    const context = createMockCommandContext();
    (context.userService.getProfile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await command.execute(interaction as never, context);

    const payload = interaction.reply.mock.calls[0][0];
    const embed = payload.embeds[0].toJSON();

    expect(embed.title).toBe("Miku Profile Board");
    expect(embed.description).toContain("onboard them first");
  });

  it("ProfileCommand renders stats and deboard note when profile exists", async () => {
    const command = new ProfileCommand();
    const interaction = createMockInteraction({
      user: { id: "invoker-id" },
      targetUsers: {
        user: {
          id: "target-id",
          username: "target-user",
        },
      },
    });

    const context = createMockCommandContext();
    (context.userService.getProfile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: {
        joinedAt: new Date("2026-01-01T00:00:00.000Z"),
        deboardedAt: new Date("2026-02-01T00:00:00.000Z"),
        deboardedMessage: "Moved to a different sekai",
        isDeboarded: true,
        isOnHiatus: false,
        strikes: 1,
      },
      assignmentStats: {
        total: 10,
        pending: 3,
        completed: 5,
        late: 1,
        excused: 1,
      },
    });

    await command.execute(interaction as never, context);

    const payload = interaction.reply.mock.calls[0][0];
    const embed = payload.embeds[0].toJSON();

    expect(embed.fields?.some((field: { name: string; value: string }) => field.name.includes("Assignment Record") && field.value.includes("Total     : 10"))).toBe(true);
    expect(embed.fields?.some((field: { name: string; value: string }) => field.name.includes("Deboard Note") && field.value.includes("Moved to a different team."))).toBe(true);
  });
});
