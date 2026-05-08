"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksCommand = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_1 = require("../../../presentation/miku-embed");
const permission_bypass_1 = require("../../../security/permission-bypass");
class TasksCommand {
    data;
    adminRoleIds;
    constructor(adminRoleIds) {
        this.adminRoleIds = adminRoleIds;
        this.data = new discord_js_1.SlashCommandBuilder()
            .setName("tasks")
            .setDescription("View your pending tasks, or check another crew member's tasks (Admins only).")
            .addUserOption((option) => option
            .setName("member")
            .setDescription("Crew member to inspect (Admins only)")
            .setRequired(false));
    }
    async execute(interaction, context) {
        const targetUser = interaction.options.getUser("member");
        const queryUser = targetUser ?? interaction.user;
        const isSelf = queryUser.id === interaction.user.id;
        if (!isSelf) {
            let hasAdminAccess = (0, permission_bypass_1.hasPermissionBypass)(interaction.user.id);
            if (!hasAdminAccess && interaction.member && "roles" in interaction.member) {
                const member = interaction.member;
                hasAdminAccess = this.adminRoleIds.some((roleId) => member.roles.cache.has(roleId));
            }
            if (!hasAdminAccess) {
                await interaction.reply({
                    embeds: [
                        (0, miku_embed_1.createMikuEmbed)({
                            title: "Miku Assignment Board",
                            description: "> 🛑 Only admins and managers can view other crew members' task boards!",
                            tone: "wave",
                        }),
                    ],
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
        }
        const profile = await context.userService.getProfile(queryUser.id);
        if (!profile || profile.user.isDeboarded) {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Assignment Board",
                        description: `> <@${queryUser.id}> is not currently an active, onboarded crew member.`,
                        tone: "mist",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const tasks = await context.assignmentService.getPendingTasks(queryUser.id);
        if (tasks.length === 0) {
            const msg = isSelf
                ? "> You have no pending tasks right now! Great job keeping up the momentum! ✨"
                : `> <@${queryUser.id}> has no pending tasks right now!`;
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Assignment Board",
                        description: msg,
                        tone: "bloom",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const fields = tasks.slice(0, 25).map((task, index) => {
            const unixDeadline = Math.floor(task.deadline.getTime() / 1000);
            const status = task.isTimeLimited ? "🛑 Strict" : "✨ Flexible";
            return {
                name: `◈ Task ${index + 1}: ${task.taskName}`,
                value: `> **Deadline:** <t:${unixDeadline}:F> (<t:${unixDeadline}:R>)\n> **Status:** \`${status}\` | **Extensions:** \`${task.extensionsGranted}\`\n> **ID:** \`${task.id}\``,
                inline: false,
            };
        });
        await interaction.reply({
            embeds: [
                (0, miku_embed_1.createMikuEmbed)({
                    title: "Miku Assignment Board",
                    description: `> Here are the pending tasks for <@${queryUser.id}>. Keep moving forward! 🌟`,
                    tone: "sky",
                    fields,
                }),
            ],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
    }
}
exports.TasksCommand = TasksCommand;
