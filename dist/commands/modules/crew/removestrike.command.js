"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveStrikeCommand = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_1 = require("../../../presentation/miku-embed");
const owner_access_1 = require("./owner-access");
class RemoveStrikeCommand {
    data = new discord_js_1.SlashCommandBuilder()
        .setName("removestrike")
        .setDescription("Remove a strike from a crew member. Owners only.")
        .addStringOption((option) => option.setName("strike_id").setDescription("ID of the strike to remove").setRequired(true).setAutocomplete(true))
        .addStringOption((option) => option.setName("reason").setDescription("Reason for removing the strike").setRequired(true));
    async execute(interaction, context) {
        const hasAccess = await (0, owner_access_1.ensureOwnerAccess)(interaction, context);
        if (!hasAccess)
            return;
        const strikeId = interaction.options.getString("strike_id", true);
        const reason = interaction.options.getString("reason", true);
        const result = await context.strikeService.removeStrike(strikeId);
        if (result.status === "strikeNotFound") {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Strike Board",
                        description: `> No strike found with ID \`${strikeId}\`. Double-check the ID and try again!`,
                        tone: "mist",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (result.status === "userNotFound") {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Strike Board",
                        description: "> The user associated with this strike could not be found.",
                        tone: "mist",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        await interaction.reply({
            embeds: [
                (0, miku_embed_1.createMikuEmbed)({
                    title: "Miku Strike Board — Strike Removed ✅",
                    description: `> Strike \`${strikeId}\` has been removed by <@${interaction.user.id}>.`,
                    tone: "bloom",
                    fields: [
                        {
                            name: "◈ New Strike Count",
                            value: `> \`${result.newStrikeCount}/3\``,
                            inline: true,
                        },
                        {
                            name: "◈ Removal Reason",
                            value: `> ${reason}`,
                            inline: false,
                        },
                    ],
                }),
            ],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
        // Log to the logs channel
        const channelId = context.config.channels.logsChannelId;
        if (channelId) {
            try {
                const channel = await interaction.client.channels.fetch(channelId);
                if (channel && "send" in channel) {
                    await channel.send({
                        embeds: [
                            (0, miku_embed_1.createMikuEmbed)({
                                title: "Miku Strike Log — Strike Removed",
                                description: `> <@${interaction.user.id}> removed strike \`${strikeId}\`.`,
                                tone: "bloom",
                                voiceWrap: false,
                                fields: [
                                    { name: "◈ Strikes Now", value: `> \`${result.newStrikeCount}/3\``, inline: true },
                                    { name: "◈ Reason", value: `> ${reason}`, inline: false },
                                ],
                            }),
                        ],
                    });
                }
            }
            catch {
                // Logging failures should not break the command
            }
        }
    }
    async autocomplete(interaction, context) {
        const focused = interaction.options.getFocused();
        const strikes = await context.strikeService.getAllStrikes();
        const { resolveUsernames } = await import("../../../utils/resolve-usernames.js");
        const userIds = strikes.map((s) => s.discordUserId);
        const nameMap = await resolveUsernames(interaction.client, userIds);
        const REASON_LABELS = { late: "Late", misc: "Misc" };
        const choices = strikes
            .filter((s) => {
            const username = nameMap.get(s.discordUserId) ?? s.discordUserId;
            const label = `${username} ${s.reason} ${s.id}`;
            return label.toLowerCase().includes(focused.toLowerCase());
        })
            .slice(0, 25)
            .map((s) => {
            const username = nameMap.get(s.discordUserId) ?? s.discordUserId;
            const reasonLabel = REASON_LABELS[s.reason] ?? s.reason;
            const dateStr = s.issuedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return {
                name: `${username} \u2014 ${reasonLabel} (${dateStr})`.slice(0, 100),
                value: s.id,
            };
        });
        await interaction.respond(choices);
    }
}
exports.RemoveStrikeCommand = RemoveStrikeCommand;
