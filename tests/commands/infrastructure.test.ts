import { describe, expect, it } from "vitest";

import { CommandLoader } from "../../src/commands/loader/command-loader";
import { buildCommandModules } from "../../src/commands/modules";
import { CommandRegistry } from "../../src/commands/registry/command-registry";
import { createTestConfig } from "../helpers/mocks";

describe("CommandRegistry", () => {
  it("registers and retrieves commands", () => {
    const registry = new CommandRegistry();
    const command = {
      data: { name: "hello" },
      execute: async () => undefined,
    };

    registry.register(command as never);

    expect(registry.get("hello")).toBe(command);
    expect(registry.list()).toEqual([command]);
  });

  it("throws on duplicate registration", () => {
    const registry = new CommandRegistry();
    const command = {
      data: { name: "hello" },
      execute: async () => undefined,
    };

    registry.register(command as never);

    expect(() => registry.register(command as never)).toThrowError(
      "Duplicate command registration attempted for 'hello'.",
    );
  });
});

describe("CommandLoader", () => {
  it("registers commands once", () => {
    const registry = new CommandRegistry();
    const commands = [
      {
        data: { name: "alpha" },
        execute: async () => undefined,
      },
      {
        data: { name: "beta" },
        execute: async () => undefined,
      },
    ] as never[];

    const loader = new CommandLoader(registry, commands);

    const firstLoad = loader.load();
    const secondLoad = loader.load();

    expect(firstLoad).toBe(commands);
    expect(secondLoad).toBe(commands);
    expect(registry.list()).toHaveLength(2);
  });
});

describe("buildCommandModules", () => {
  it("includes all expected command names", () => {
    const modules = buildCommandModules(createTestConfig());
    const names = modules.map((command) => command.data.name).sort();

    expect(names).toEqual([
      "assign",
      "deboard",
      "extension",
      "hello",
      "onboard",
      "ping",
      "profile",
      "uptime",
    ]);
  });
});
