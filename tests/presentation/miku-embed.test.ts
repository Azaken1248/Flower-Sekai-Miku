import { describe, expect, it } from "vitest";

import { createMikuEmbed, MIKU_PALETTE } from "../../src/presentation/miku-embed";

describe("createMikuEmbed", () => {
  it("applies tone color, title, footer, and wrapped voice style by default", () => {
    const embed = createMikuEmbed({
      description: "System is ready.",
      tone: "sky",
    }).toJSON();

    expect(embed.color).toBe(MIKU_PALETTE.sky);
    expect(embed.title).toBe("Flower Sekai Miku");
    expect(embed.footer?.text).toBe("Flower Sekai Miku");
    expect(embed.description).toContain("Sparkle status:");
    expect(embed.description).toContain("Nice rhythm, next step now.");
  });

  it("keeps raw description when voiceWrap is false", () => {
    const embed = createMikuEmbed({
      description: "Raw payload",
      voiceWrap: false,
    }).toJSON();

    expect(embed.description).toBe("Raw payload");
  });

  it("adds provided fields", () => {
    const embed = createMikuEmbed({
      description: "Test",
      fields: [
        {
          name: "Key",
          value: "Value",
          inline: true,
        },
      ],
    }).toJSON();

    expect(embed.fields).toHaveLength(1);
    expect(embed.fields?.[0]).toMatchObject({
      name: "Key",
      value: "Value",
      inline: true,
    });
  });
});
