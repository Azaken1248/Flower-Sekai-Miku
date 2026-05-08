"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitCommand = void 0;
const discord_js_1 = require("discord.js");
const constants_js_1 = require("../../../config/constants.js");
const miku_embed_js_1 = require("../../../presentation/miku-embed.js");
const resolveRoleLabel = (roleId, specializedRoles) => {
    for (const [key, id] of Object.entries(specializedRoles)) {
        if (id === roleId) {
            return constants_js_1.SPECIALIZED_ROLE_LABELS[key] ?? key;
        }
    }
    return "Unknown";
};
class SubmitCommand {
    data = new discord_js_1.SlashCommandBuilder()
        .setName("submit")
        .setDescription("Submit a pending task for review by an owner or mod.")
        .addStringOption((option) => option
        .setName("assignment_id")
        .setDescription("The ID of the assignment to submit")
        .setRequired(true)
        .setAutocomplete(true));
    async execute(interaction, context) {
        const assignmentId = interaction.options.getString("assignment_id", true);
        const result = await context.assignmentService.submitTask({
            assignmentId,
            discordUserId: interaction.user.id,
        });
        if (result.status !== "submitted" || !result.assignment) {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_js_1.createMikuEmbed)({
                        title: "Miku Submission Desk",
                        description: `> **Submission Failed:** ${result.reason ?? "Unknown reason."}`,
                        tone: "wave",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const assignment = result.assignment;
        const unixDeadline = Math.floor(assignment.deadline.getTime() / 1000);
        const roleLabel = resolveRoleLabel(assignment.roleId, context.config.roles.specialized);
        const ownerRoleId = context.config.roles.owners;
        const approvalEmbed = (0, miku_embed_js_1.createMikuEmbed)({
            title: "Miku Submission Desk — Awaiting Review",
            description: `> <@${assignment.discordUserId}> has submitted a task for approval!`,
            tone: "sky",
            voiceWrap: false,
            fields: [
                {
                    name: "◈ Task",
                    value: `> **${assignment.taskName}**`,
                    inline: true,
                },
                {
                    name: "◈ Role",
                    value: `> \` ${roleLabel} \``,
                    inline: true,
                },
                {
                    name: "◈ Deadline",
                    value: `> <t:${unixDeadline}:F>\n> (<t:${unixDeadline}:R>)`,
                    inline: true,
                },
                {
                    name: "◈ Description",
                    value: `> ${assignment.description || "No additional details provided."}`,
                    inline: false,
                },
                {
                    name: "◈ Assignment ID",
                    value: `> \`${assignment.id}\``,
                    inline: false,
                },
            ],
        });
        const actionRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`submit_approve:${assignment.id}`)
            .setLabel("Approve")
            .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
            .setCustomId(`submit_deny:${assignment.id}`)
            .setLabel("Deny")
            .setStyle(discord_js_1.ButtonStyle.Danger));
        const approvalPayload = {
            content: `<@&${ownerRoleId}> — a submission is awaiting review!`,
            embeds: [approvalEmbed],
            components: [actionRow],
        };
        // Post the approval embed in the current channel/thread
        if (!interaction.channel || !("send" in interaction.channel)) {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_js_1.createMikuEmbed)({
                        title: "Miku Submission Desk",
                        description: "> I can't post the approval embed here. Make sure I have permission to send messages in this channel.",
                        tone: "wave",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        try {
            await interaction.channel.send(approvalPayload);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown send failure.";
            context.logger.error("Failed to send approval embed to current channel.", {
                channelId: interaction.channelId,
                assignmentId: assignment.id,
                errorMessage,
            });
            await interaction.reply({
                embeds: [
                    (0, miku_embed_js_1.createMikuEmbed)({
                        title: "Miku Submission Desk",
                        description: "> I could not post the approval request in this channel. Please check my permissions and try again.",
                        tone: "wave",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        // If a dedicated approval channel is configured, cross-post there too
        const approvalChannelId = context.config.channels.approvalChannelId;
        if (approvalChannelId && approvalChannelId !== interaction.channelId) {
            try {
                const approvalChannel = await interaction.client.channels.fetch(approvalChannelId);
                if (approvalChannel && "send" in approvalChannel) {
                    await approvalChannel.send({
                        embeds: [approvalEmbed],
                        components: [actionRow],
                    });
                }
            }
            catch {
                // Cross-post failure is non-critical — the primary post already succeeded
                context.logger.warn("Failed to cross-post approval embed to approval channel.", {
                    approvalChannelId,
                    assignmentId: assignment.id,
                });
            }
        }
        await interaction.reply({
            embeds: [
                (0, miku_embed_js_1.createMikuEmbed)({
                    title: "Miku Submission Desk",
                    description: `> Your task **${assignment.taskName}** has been submitted for review! An owner or mod will approve or deny it soon. 🌟`,
                    tone: "bloom",
                    fields: [
                        {
                            name: "◈ Assignment ID",
                            value: `> \`${assignment.id}\``,
                            inline: true,
                        },
                    ],
                }),
            ],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
    }
    async autocomplete(interaction, context) {
        const focused = interaction.options.getFocused();
        const assignments = await context.assignmentService.getPendingTasks(interaction.user.id);
        const choices = assignments
            .filter((a) => {
            const label = `${a.taskName} (${a.id})`;
            return label.toLowerCase().includes(focused.toLowerCase());
        })
            .slice(0, 25)
            .map((a) => {
            const deadlineStr = a.deadline.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return {
                name: `${a.taskName} — due ${deadlineStr}`.slice(0, 100),
                value: a.id,
            };
        });
        await interaction.respond(choices);
    }
}
exports.SubmitCommand = SubmitCommand;
