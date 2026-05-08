"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrikeAppealHandler = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_js_1 = require("../../presentation/miku-embed.js");
const permission_bypass_js_1 = require("../../security/permission-bypass.js");
const APPEAL_ACCEPT_PREFIX = "appeal_accept:";
const APPEAL_DENY_PREFIX = "appeal_deny:";
class StrikeAppealHandler {
    strikeService;
    config;
    logger;
    constructor(strikeService, config, logger) {
        this.strikeService = strikeService;
        this.config = config;
        this.logger = logger;
    }
    canHandle(customId) {
        return customId.startsWith(APPEAL_ACCEPT_PREFIX) || customId.startsWith(APPEAL_DENY_PREFIX);
    }
    async handle(interaction) {
        const customId = interaction.customId;
        const isAccept = customId.startsWith(APPEAL_ACCEPT_PREFIX);
        const strikeId = isAccept
            ? customId.slice(APPEAL_ACCEPT_PREFIX.length)
            : customId.slice(APPEAL_DENY_PREFIX.length);
        if (!strikeId) {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_js_1.createMikuEmbed)({
                        title: "Miku Appeal Desk",
                        description: "> Could not determine the strike from this button.",
                        tone: "wave",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const hasAccess = await this.verifyReviewerAccess(interaction);
        if (!hasAccess) {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_js_1.createMikuEmbed)({
                        title: "Miku Access Check",
                        description: "> Only owners and mods can review strike appeals.",
                        tone: "wave",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const result = await this.strikeService.resolveAppeal(strikeId, interaction.user.id, isAccept);
        if (result.status === "strikeNotFound") {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_js_1.createMikuEmbed)({
                        title: "Miku Appeal Desk",
                        description: "> This strike no longer exists. It may have already been removed.",
                        tone: "mist",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (result.status === "notPending") {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_js_1.createMikuEmbed)({
                        title: "Miku Appeal Desk",
                        description: "> This appeal has already been resolved.",
                        tone: "mist",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (result.status === "accepted") {
            const acceptedEmbed = (0, miku_embed_js_1.createMikuEmbed)({
                title: "Miku Appeal Desk — Accepted ✅",
                description: `> The appeal for strike \`${strikeId}\` has been **accepted** by <@${interaction.user.id}>. The strike has been removed!`,
                tone: "bloom",
                voiceWrap: false,
                fields: [
                    {
                        name: "◈ Reviewed By",
                        value: `> <@${interaction.user.id}>`,
                        inline: true,
                    },
                    {
                        name: "◈ New Strike Count",
                        value: `> \`${result.newStrikeCount}/3\``,
                        inline: true,
                    },
                ],
            });
            await interaction.update({
                embeds: [acceptedEmbed],
                components: [],
            });
            await this.logToChannel(interaction, `Appeal for strike \`${strikeId}\` **accepted** by <@${interaction.user.id}>. Strike removed.`, "bloom", result.newStrikeCount);
            return;
        }
        // Denied
        const deniedEmbed = (0, miku_embed_js_1.createMikuEmbed)({
            title: "Miku Appeal Desk — Denied ❌",
            description: `> The appeal for strike \`${strikeId}\` has been **denied** by <@${interaction.user.id}>. The strike stands.`,
            tone: "mist",
            voiceWrap: false,
            fields: [
                {
                    name: "◈ Reviewed By",
                    value: `> <@${interaction.user.id}>`,
                    inline: true,
                },
                {
                    name: "◈ Strike Count",
                    value: `> \`${result.newStrikeCount}/3\``,
                    inline: true,
                },
            ],
        });
        await interaction.update({
            embeds: [deniedEmbed],
            components: [],
        });
        await this.logToChannel(interaction, `Appeal for strike \`${strikeId}\` **denied** by <@${interaction.user.id}>.`, "mist", result.newStrikeCount);
    }
    async logToChannel(interaction, description, tone, strikeCount) {
        const channelId = this.config.channels.logsChannelId;
        if (!channelId)
            return;
        try {
            const channel = await interaction.client.channels.fetch(channelId);
            if (!channel || !("send" in channel))
                return;
            await channel.send({
                embeds: [
                    (0, miku_embed_js_1.createMikuEmbed)({
                        title: "Miku Strike Log — Appeal Resolved",
                        description: `> ${description}`,
                        tone,
                        voiceWrap: false,
                        fields: [
                            { name: "◈ Strikes", value: `> \`${strikeCount}/3\``, inline: true },
                        ],
                    }),
                ],
            });
        }
        catch {
            // Logging failures should not break the handler
        }
    }
    async verifyReviewerAccess(interaction) {
        if ((0, permission_bypass_js_1.hasPermissionBypass)(interaction.user.id)) {
            return true;
        }
        if (!interaction.inGuild() || !interaction.guild) {
            return false;
        }
        const adminRoleIds = [this.config.roles.owners, this.config.roles.mods];
        try {
            const member = await interaction.guild.members.fetch(interaction.user.id);
            return adminRoleIds.some((roleId) => member.roles.cache.has(roleId));
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown role resolution failure.";
            this.logger.warn("Unable to verify reviewer access for appeal button.", {
                userId: interaction.user.id,
                message,
            });
            return false;
        }
    }
}
exports.StrikeAppealHandler = StrikeAppealHandler;
