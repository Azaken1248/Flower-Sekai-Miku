"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferTaskCommand = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_1 = require("../../../presentation/miku-embed");
class TransferTaskCommand {
    data;
    requiredRoleIds;
    constructor(adminRoleIds) {
        this.requiredRoleIds = adminRoleIds;
        this.data = new discord_js_1.SlashCommandBuilder()
            .setName("transfer-task")
            .setDescription("Transfer a task to another active crew member. Admins only.")
            .addStringOption((option) => option
            .setName("assignment_id")
            .setDescription("Assignment Mongo ID")
            .setRequired(true)
            .setAutocomplete(true))
            .addUserOption((option) => option
            .setName("new_member")
            .setDescription("Crew member to receive the task")
            .setRequired(true));
    }
    async execute(interaction, context) {
        const assignmentId = interaction.options.getString("assignment_id", true);
        const newMember = interaction.options.getUser("new_member", true);
        const result = await context.assignmentService.transferTask(assignmentId, newMember.id);
        if (!result.success || !result.assignment) {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Assignment Board",
                        description: `> ${result.reason ?? "Task could not be transferred."}`,
                        tone: "wave",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        await interaction.reply({
            embeds: [
                (0, miku_embed_1.createMikuEmbed)({
                    title: "Miku Assignment Board",
                    description: `> Task **${result.assignment.taskName}** has been successfully transferred.`,
                    tone: "sky",
                    fields: [
                        {
                            name: "◈ Previous Assignee",
                            value: `> <@${result.oldDiscordUserId}>`,
                            inline: true,
                        },
                        {
                            name: "◈ New Assignee",
                            value: `> <@${newMember.id}>`,
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
        const assignments = await context.assignmentService.getPendingTasks();
        const { resolveUsernames } = await import("../../../utils/resolve-usernames.js");
        const userIds = assignments.map((a) => a.discordUserId);
        const nameMap = await resolveUsernames(interaction.client, userIds);
        const choices = assignments
            .filter((a) => {
            const username = nameMap.get(a.discordUserId) ?? a.discordUserId;
            const label = `${a.taskName} ${username} ${a.id}`;
            return label.toLowerCase().includes(focused.toLowerCase());
        })
            .slice(0, 25)
            .map((a) => {
            const username = nameMap.get(a.discordUserId) ?? a.discordUserId;
            return {
                name: `${a.taskName} \u2014 ${username}`.slice(0, 100),
                value: a.id,
            };
        });
        await interaction.respond(choices);
    }
}
exports.TransferTaskCommand = TransferTaskCommand;
