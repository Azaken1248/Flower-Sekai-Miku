"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionCommand = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_1 = require("../../../presentation/miku-embed");
const date_parser_1 = require("../../../utils/date-parser");
class ExtensionCommand {
    data = new discord_js_1.SlashCommandBuilder()
        .setName("extend")
        .setDescription("Request a deadline extension for one of your pending tasks.")
        .addStringOption((option) => option
        .setName("assignment_id")
        .setDescription("The ID of the assignment to extend")
        .setRequired(true)
        .setAutocomplete(true))
        .addStringOption((option) => option
        .setName("new_deadline")
        .setDescription('e.g., "tomorrow", "in 3 days", "Oct 24", "next friday"')
        .setRequired(true));
    async execute(interaction, context) {
        const assignmentId = interaction.options.getString("assignment_id", true);
        const deadlineInput = interaction.options.getString("new_deadline", true);
        const newDeadline = (0, date_parser_1.parseNaturalDate)(deadlineInput);
        if (!newDeadline || newDeadline.getTime() <= Date.now()) {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Extension Board",
                        description: `> I couldn't understand the date \`${deadlineInput}\`, or it's in the past. Try something like \`"in 3 days"\`!`,
                        tone: "wave",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const result = await context.assignmentService.requestExtension({
            assignmentId,
            discordUserId: interaction.user.id,
            newDeadline,
        });
        if (!result.allowed || !result.assignment) {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Extension Board",
                        description: `> **Extension Denied:** ${result.reason ?? "Unknown reason."}`,
                        tone: "wave",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const unixDeadline = Math.floor(result.assignment.deadline.getTime() / 1000);
        await interaction.reply({
            embeds: [
                (0, miku_embed_1.createMikuEmbed)({
                    title: "Miku Extension Board",
                    description: `> Miku approved the extension! Keep your momentum going! 🌟`,
                    tone: "bloom",
                    fields: [
                        {
                            name: "◈ New Deadline",
                            value: `> <t:${unixDeadline}:F>\n> (<t:${unixDeadline}:R>)`,
                            inline: true,
                        },
                        {
                            name: "◈ Extensions Used",
                            value: `> \` ${result.assignment.extensionsGranted} \``,
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
                name: `${a.taskName} \u2014 due ${deadlineStr}`.slice(0, 100),
                value: a.id,
            };
        });
        await interaction.respond(choices);
    }
}
exports.ExtensionCommand = ExtensionCommand;
