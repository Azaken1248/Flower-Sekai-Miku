"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignCommand = void 0;
const discord_js_1 = require("discord.js");
const constants_1 = require("../../../config/constants");
const miku_embed_1 = require("../../../presentation/miku-embed");
const date_parser_1 = require("../../../utils/date-parser");
class AssignCommand {
    data;
    requiredRoleIds;
    specializedRoles;
    constructor(adminRoleIds, specializedRoles) {
        this.requiredRoleIds = adminRoleIds;
        this.specializedRoles = specializedRoles;
        const roleChoices = Object.entries(specializedRoles).map(([key, value]) => ({
            name: constants_1.SPECIALIZED_ROLE_LABELS[key] || key,
            value,
        }));
        this.data = new discord_js_1.SlashCommandBuilder()
            .setName("assign")
            .setDescription("Assign a new task to a crew member.")
            .addUserOption((option) => option.setName("member").setDescription("Crew member").setRequired(true))
            .addStringOption((option) => option
            .setName("role")
            .setDescription("Task domain (Art, Audio, etc.)")
            .setRequired(true)
            .addChoices(...roleChoices))
            .addStringOption((option) => option.setName("task").setDescription("Short task name (e.g. Draw Card)").setRequired(true))
            .addStringOption((option) => option
            .setName("deadline")
            .setDescription('e.g., "tomorrow", "in 3 days", "Oct 24", "next friday"')
            .setRequired(true))
            .addStringOption((option) => option.setName("description").setDescription("Task details").setRequired(false))
            .addBooleanOption((option) => option
            .setName("is_time_limited")
            .setDescription("Strict deadline? (Blocks the /extend command). Defaults to False.")
            .setRequired(false));
    }
    async execute(interaction, context) {
        const member = interaction.options.getUser("member", true);
        const roleId = interaction.options.getString("role", true);
        const taskName = interaction.options.getString("task", true);
        const deadlineInput = interaction.options.getString("deadline", true);
        const description = interaction.options.getString("description") ?? "No additional details provided.";
        const isTimeLimited = interaction.options.getBoolean("is_time_limited") ?? false;
        const deadline = (0, date_parser_1.parseNaturalDate)(deadlineInput);
        if (!deadline || deadline.getTime() <= Date.now()) {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Assignment Board",
                        description: `> I couldn't understand the deadline \`${deadlineInput}\`, or it's in the past! Try something like \`"tomorrow"\` or \`"in 3 days"\`.`,
                        tone: "wave",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        try {
            const assignment = await context.assignmentService.assignTask({
                discordUserId: member.id,
                roleId,
                taskName,
                description,
                deadline,
                isTimeLimited,
            });
            const timeLimitText = isTimeLimited ? "Yes (Extensions Blocked 🛑)" : "No (Extensions Allowed ✨)";
            const unixDeadline = Math.floor(assignment.deadline.getTime() / 1000);
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Assignment Board",
                        description: `> Task successfully assigned to <@${member.id}>!`,
                        tone: "bloom",
                        fields: [
                            { name: "◈ Task", value: `> **${assignment.taskName}**`, inline: true },
                            { name: "◈ Deadline", value: `> <t:${unixDeadline}:F>\n> (<t:${unixDeadline}:R>)`, inline: true },
                            { name: "◈ Strict Limit", value: `> \` ${timeLimitText} \``, inline: false },
                        ],
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred.";
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Assignment Board",
                        description: `> Failed to assign task: ${errorMessage}`,
                        tone: "wave",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
        }
    }
}
exports.AssignCommand = AssignCommand;
