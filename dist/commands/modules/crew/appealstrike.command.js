"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppealStrikeCommand = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_1 = require("../../../presentation/miku-embed");
const REASON_LABELS = {
    late: "Late Submission",
    misc: "Miscellaneous",
};
class AppealStrikeCommand {
    data = new discord_js_1.SlashCommandBuilder()
        .setName("appealstrike")
        .setDescription("Appeal a strike you received. An owner or mod will review it.")
        .addStringOption((option) => option.setName("strike_id").setDescription("ID of the strike to appeal").setRequired(true).setAutocomplete(true))
        .addStringOption((option) => option.setName("reason").setDescription("Why you believe this strike should be removed").setRequired(true));
    async execute(interaction, context) {
        const strikeId = interaction.options.getString("strike_id", true);
        const reason = interaction.options.getString("reason", true);
        const result = await context.strikeService.fileAppeal(strikeId, interaction.user.id, reason);
        if (result.status === "strikeNotFound") {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Appeal Desk",
                        description: `> No strike found with ID \`${strikeId}\`. Check your strike IDs with \`/profile\` and try again!`,
                        tone: "mist",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (result.status === "notOwner") {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Appeal Desk",
                        description: "> You can only appeal strikes that were issued to you.",
                        tone: "wave",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (result.status === "alreadyPending") {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Appeal Desk",
                        description: "> This strike already has a pending appeal. Hang tight — someone will review it soon!",
                        tone: "mist",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (result.status === "alreadyResolved") {
            const statusText = result.strike?.appealStatus === "accepted" ? "accepted" : "denied";
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Appeal Desk",
                        description: `> This strike's appeal has already been **${statusText}**. No further appeals can be filed.`,
                        tone: "mist",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        // Success — post the appeal with Accept/Deny buttons
        const strike = result.strike;
        const reasonLabel = REASON_LABELS[strike.reason] ?? strike.reason;
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`appeal_accept:${strikeId}`)
            .setLabel("Accept Appeal")
            .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
            .setCustomId(`appeal_deny:${strikeId}`)
            .setLabel("Deny Appeal")
            .setStyle(discord_js_1.ButtonStyle.Danger));
        const ownerRoleId = context.config.roles.owners;
        await interaction.reply({
            content: `<@&${ownerRoleId}> — a strike appeal needs review!`,
            embeds: [
                (0, miku_embed_1.createMikuEmbed)({
                    title: "Miku Appeal Desk — Appeal Filed 📋",
                    description: `> <@${interaction.user.id}> is appealing a strike. Owners and mods — please review!`,
                    tone: "sky",
                    voiceWrap: false,
                    fields: [
                        {
                            name: "◈ Strike ID",
                            value: `> \`${strikeId}\``,
                            inline: true,
                        },
                        {
                            name: "◈ Strike Reason",
                            value: `> ${reasonLabel}`,
                            inline: true,
                        },
                        ...(strike.detail
                            ? [
                                {
                                    name: "◈ Strike Detail",
                                    value: `> ${strike.detail}`,
                                    inline: false,
                                },
                            ]
                            : []),
                        {
                            name: "◈ Appeal Reason",
                            value: `> ${reason}`,
                            inline: false,
                        },
                    ],
                }),
            ],
            components: [row],
        });
    }
    async autocomplete(interaction, context) {
        const focused = interaction.options.getFocused();
        const strikes = await context.strikeService.getStrikesForUser(interaction.user.id);
        const choices = strikes
            .filter((s) => {
            // Only show strikes that haven't been accepted (i.e. still exist)
            if (s.appealStatus === "accepted")
                return false;
            const label = `${s.reason} ${s.detail ?? ""} ${s.id}`;
            return label.toLowerCase().includes(focused.toLowerCase());
        })
            .slice(0, 25)
            .map((s) => {
            const reasonLabel = REASON_LABELS[s.reason] ?? s.reason;
            const dateStr = s.issuedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            const statusTag = s.appealStatus === "pending" ? " [PENDING]" : s.appealStatus === "denied" ? " [DENIED]" : "";
            return {
                name: `${reasonLabel}${s.detail ? ` \u2014 ${s.detail}` : ""} (${dateStr})${statusTag}`.slice(0, 100),
                value: s.id,
            };
        });
        await interaction.respond(choices);
    }
}
exports.AppealStrikeCommand = AppealStrikeCommand;
