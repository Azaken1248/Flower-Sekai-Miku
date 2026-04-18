import { EmbedBuilder } from "discord.js";

export const MIKU_PALETTE = {
  cream: 0xfff5ce,
  mist: 0x7eabc0,
  bloom: 0x5a76f2,
  sky: 0x8ec0fa,
  wave: 0x2a90b6,
} as const;

export type MikuTone = keyof typeof MIKU_PALETTE;

export interface MikuPersonalityProfile {
  identity: string;
  archetypeBlend: string;
  coreTraits: readonly string[];
  responsePolicy: {
    positiveFirst: boolean;
    energeticHelper: boolean;
    pushyButKind: boolean;
    clearNextStep: boolean;
  };
}

export const MIKU_PERSONALITY_PROFILE: MikuPersonalityProfile = {
  identity: "Flower Sekai Miku",
  archetypeBlend: "Stage idol warmth x wonder show sparkle",
  coreTraits: [
    "cheerful",
    "energetic",
    "supportive",
    "pushy-for-progress",
    "action-oriented",
  ],
  responsePolicy: {
    positiveFirst: true,
    energeticHelper: true,
    pushyButKind: true,
    clearNextStep: true,
  },
};

export interface MikuEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface MikuEmbedOptions {
  title?: string;
  description: string;
  tone?: MikuTone;
  fields?: MikuEmbedField[];
  voiceWrap?: boolean;
}

const DEFAULT_TITLE = "Flower Sekai Miku";
const DEFAULT_FOOTER = "Flower Sekai Miku";

const TONE_OPENERS: Readonly<Record<MikuTone, string>> = {
  cream: "Bloom check! ",
  mist: "Miku check-in: ",
  bloom: "Flower Sekai pulse up! ",
  sky: "Sparkle status: ",
  wave: "Quick course-correct with me: ",
};

const TONE_NUDGES: Readonly<Record<MikuTone, string>> = {
  cream: " Keep going, and I will cheer right beside you.",
  mist: " Stay with me and we will keep this smooth.",
  bloom: " Keep the momentum going right now.",
  sky: " Nice rhythm, next step now.",
  wave: " Fix this now with me and we jump right back into motion.",
};

const buildMikuVoiceDescription = (description: string, tone: MikuTone): string => {
  const trimmedDescription = description.trim();
  return `${TONE_OPENERS[tone]}${trimmedDescription}${TONE_NUDGES[tone]}`;
};

export const createMikuEmbed = (options: MikuEmbedOptions): EmbedBuilder => {
  const tone = options.tone ?? "bloom";
  const description =
    options.voiceWrap === false
      ? options.description
      : buildMikuVoiceDescription(options.description, tone);

  const embed = new EmbedBuilder()
    .setColor(MIKU_PALETTE[tone])
    .setTitle(options.title ?? DEFAULT_TITLE)
    .setDescription(description)
    .setFooter({ text: DEFAULT_FOOTER })
    .setTimestamp();

  if (options.fields?.length) {
    embed.addFields(options.fields);
  }

  return embed;
};