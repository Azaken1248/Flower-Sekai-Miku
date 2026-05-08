"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrikeCommand = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_1 = require("../../../presentation/miku-embed");
const owner_access_1 = require("./owner-access");
const REASON_LABELS = {
    late: "Late Submission",
    misc: "Miscellaneous",
};
class StrikeCommand {
    data = new discord_js_1.SlashCommandBuilder()
        .setName("strike")
        .setDescription("Issue a strike to a crew member. Owners only.")
        .addUserOption((option) => option.setName("member").setDescription("Crew member to strike").setRequired(true))
        .addStringOption((option) => option
        .setName("reason")
        .setDescription("Reason for the strike")
        .setRequired(true)
        .addChoices({ name: "Late Submission", value: "late" }, { name: "Miscellaneous", value: "misc" }))
        .addStringOption((option) => option
        .setName("detail")
        .setDescription("Additional detail (e.g. late date, 'not submitted')")
        .setRequired(false));
    async execute(interaction, context) {
        const hasAccess = await (0, owner_access_1.ensureOwnerAccess)(interaction, context);
        if (!hasAccess)
            return;
        const targetUser = interaction.options.getUser("member", true);
        const reason = interaction.options.getString("reason", true);
        const detail = interaction.options.getString("detail") ?? undefined;
        const result = await context.strikeService.addStrike(targetUser.id, interaction.user.id, reason, detail);
        if (result.status === "notFound") {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Strike Board",
                        description: `> No crew profile found for <@${targetUser.id}>. They need to be onboarded first!`,
                        tone: "mist",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (result.status === "deboarded") {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Strike Board",
                        description: `> <@${targetUser.id}> has been deboarded — strikes cannot be issued to inactive members.`,
                        tone: "mist",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (result.status === "maxStrikes") {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Strike Board",
                        description: `> <@${targetUser.id}> already has **3/3** strikes. No more can be added.`,
                        tone: "wave",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const isMaxed = result.newStrikeCount >= 3;
        const fields = [
            {
                name: "◈ Member",
                value: `> <@${targetUser.id}>`,
                inline: true,
            },
            {
                name: "◈ Strikes",
                value: `> \`${result.newStrikeCount}/3\``,
                inline: true,
            },
            {
                name: "◈ Reason",
                value: `> ${REASON_LABELS[reason]}`,
                inline: true,
            },
            ...(detail
                ? [
                    {
                        name: "◈ Detail",
                        value: `> ${detail}`,
                        inline: false,
                    },
                ]
                : []),
            {
                name: "◈ Strike ID",
                value: `> \`${result.strike?.id ?? "unknown"}\``,
                inline: false,
            },
        ];
        if (isMaxed) {
            fields.push({
                name: "◈ ⚠️ Maximum Strikes Reached",
                value: "> This member has reached the strike limit. Time for a serious check-in.",
                inline: false,
            });
        }
        await interaction.reply({
            embeds: [
                (0, miku_embed_1.createMikuEmbed)({
                    title: "Miku Strike Board — Strike Issued",
                    description: `> A strike has been recorded for <@${targetUser.id}> by <@${interaction.user.id}>.`,
                    tone: "wave",
                    fields,
                }),
            ],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
        // Log to the logs channel
        await this.logToChannel(interaction, context, targetUser.id, reason, detail, result.newStrikeCount, result.strike?.id);
    }
    async logToChannel(interaction, context, targetId, reason, detail, newCount, strikeId) {
        const channelId = context.config.channels.logsChannelId;
        if (!channelId)
            return;
        try {
            const channel = await interaction.client.channels.fetch(channelId);
            if (!channel || !("send" in channel))
                return;
            await channel.send({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Strike Log — Strike Issued",
                        description: `> <@${interaction.user.id}> issued a strike to <@${targetId}>.`,
                        tone: "wave",
                        voiceWrap: false,
                        fields: [
                            { name: "◈ Strikes", value: `> \`${newCount}/3\``, inline: true },
                            { name: "◈ Reason", value: `> ${REASON_LABELS[reason]}`, inline: true },
                            ...(detail ? [{ name: "◈ Detail", value: `> ${detail}`, inline: false }] : []),
                            ...(strikeId ? [{ name: "◈ Strike ID", value: `> \`${strikeId}\``, inline: false }] : []),
                        ],
                    }),
                ],
            });
        }
        catch {
            // Logging failures should not break the command
        }
    }
}
exports.StrikeCommand = StrikeCommand;
