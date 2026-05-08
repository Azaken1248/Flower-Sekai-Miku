"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitApprovalHandler = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_js_1 = require("../../presentation/miku-embed.js");
const permission_bypass_js_1 = require("../../security/permission-bypass.js");
const SUBMIT_APPROVE_PREFIX = "submit_approve:";
const SUBMIT_DENY_PREFIX = "submit_deny:";
class SubmitApprovalHandler {
    assignmentService;
    config;
    logger;
    constructor(assignmentService, config, logger) {
        this.assignmentService = assignmentService;
        this.config = config;
        this.logger = logger;
    }
    canHandle(customId) {
        return customId.startsWith(SUBMIT_APPROVE_PREFIX) || customId.startsWith(SUBMIT_DENY_PREFIX);
    }
    async handle(interaction) {
        const customId = interaction.customId;
        const isApproval = customId.startsWith(SUBMIT_APPROVE_PREFIX);
        const assignmentId = isApproval
            ? customId.slice(SUBMIT_APPROVE_PREFIX.length)
            : customId.slice(SUBMIT_DENY_PREFIX.length);
        if (!assignmentId) {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_js_1.createMikuEmbed)({
                        title: "Miku Submission Desk",
                        description: "> Could not determine the assignment from this button.",
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
                        description: "> Only owners and mods can review submissions.",
                        tone: "wave",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (isApproval) {
            await this.handleApproval(interaction, assignmentId);
        }
        else {
            await this.handleDenial(interaction, assignmentId);
        }
    }
    async handleApproval(interaction, assignmentId) {
        const updated = await this.assignmentService.approveTask(assignmentId);
        if (!updated) {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_js_1.createMikuEmbed)({
                        title: "Miku Submission Desk",
                        description: "> Could not approve this task. It may have already been processed or removed.",
                        tone: "wave",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const approvedEmbed = (0, miku_embed_js_1.createMikuEmbed)({
            title: "Miku Submission Desk — Approved ✅",
            description: `> Task **${updated.taskName}** submitted by <@${updated.discordUserId}> has been **approved** by <@${interaction.user.id}>!`,
            tone: "bloom",
            voiceWrap: false,
            fields: [
                {
                    name: "◈ Status",
                    value: "> `COMPLETED`",
                    inline: true,
                },
                {
                    name: "◈ Reviewed By",
                    value: `> <@${interaction.user.id}>`,
                    inline: true,
                },
                {
                    name: "◈ Assignment ID",
                    value: `> \`${assignmentId}\``,
                    inline: false,
                },
            ],
        });
        await interaction.update({
            embeds: [approvedEmbed],
            components: [],
        });
        this.logger.info("Submission approved via button.", {
            assignmentId,
            reviewerId: interaction.user.id,
        });
    }
    async handleDenial(interaction, assignmentId) {
        const deniedEmbed = (0, miku_embed_js_1.createMikuEmbed)({
            title: "Miku Submission Desk — Denied ❌",
            description: `> The submission for assignment \`${assignmentId}\` has been **denied** by <@${interaction.user.id}>. The task remains **PENDING** so the member can redo and resubmit.`,
            tone: "mist",
            voiceWrap: false,
            fields: [
                {
                    name: "◈ Status",
                    value: "> `PENDING` (unchanged)",
                    inline: true,
                },
                {
                    name: "◈ Reviewed By",
                    value: `> <@${interaction.user.id}>`,
                    inline: true,
                },
                {
                    name: "◈ Assignment ID",
                    value: `> \`${assignmentId}\``,
                    inline: false,
                },
            ],
        });
        await interaction.update({
            embeds: [deniedEmbed],
            components: [],
        });
        this.logger.info("Submission denied via button.", {
            assignmentId,
            reviewerId: interaction.user.id,
        });
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
            this.logger.warn("Unable to verify reviewer access for submission button.", {
                userId: interaction.user.id,
                message,
            });
            return false;
        }
    }
}
exports.SubmitApprovalHandler = SubmitApprovalHandler;
