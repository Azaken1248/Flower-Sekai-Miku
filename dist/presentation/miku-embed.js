"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMikuEmbed = exports.MIKU_PERSONALITY_PROFILE = exports.MIKU_PALETTE = void 0;
const discord_js_1 = require("discord.js");
exports.MIKU_PALETTE = {
    cream: 0xfff5ce,
    mist: 0x7eabc0,
    bloom: 0x5a76f2,
    sky: 0x8ec0fa,
    wave: 0x2a90b6,
};
exports.MIKU_PERSONALITY_PROFILE = {
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
const DEFAULT_TITLE = "Flower Sekai Miku";
const DEFAULT_FOOTER = "Flower Sekai Miku";
const TONE_OPENERS = {
    cream: "Bloom check! ",
    mist: "Miku check-in: ",
    bloom: "Flower Sekai pulse up! ",
    sky: "Sparkle status: ",
    wave: "Quick course-correct with me: ",
};
const TONE_NUDGES = {
    cream: " Keep going, and I will cheer right beside you.",
    mist: " Stay with me and we will keep this smooth.",
    bloom: " Keep the momentum going right now.",
    sky: " Nice rhythm, next step now.",
    wave: " Fix this now with me and we jump right back into motion.",
};
const buildMikuVoiceDescription = (description, tone) => {
    const trimmedDescription = description.trim();
    return `${TONE_OPENERS[tone]}${trimmedDescription}${TONE_NUDGES[tone]}`;
};
const createMikuEmbed = (options) => {
    const tone = options.tone ?? "bloom";
    const description = options.voiceWrap === false
        ? options.description
        : buildMikuVoiceDescription(options.description, tone);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(exports.MIKU_PALETTE[tone])
        .setTitle(options.title ?? DEFAULT_TITLE)
        .setDescription(description)
        .setFooter({ text: DEFAULT_FOOTER })
        .setTimestamp();
    if (options.fields?.length) {
        embed.addFields(options.fields);
    }
    return embed;
};
exports.createMikuEmbed = createMikuEmbed;
