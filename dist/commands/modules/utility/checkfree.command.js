"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckFreeCommand = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_js_1 = require("../../../presentation/miku-embed.js");
class CheckFreeCommand {
    data = new discord_js_1.SlashCommandBuilder()
        .setName("checkfree")
        .setDescription("See which crew members currently have zero pending tasks.");
    async execute(interaction, context) {
        const { active, hiatus } = await context.userService.getAvailableMembers();
        if (active.length === 0 && hiatus.length === 0) {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_js_1.createMikuEmbed)({
                        title: "Miku Availability Board",
                        description: "> Everyone has tasks right now! The whole crew is in full momentum — love to see it! 🎵",
                        tone: "bloom",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const fields = [];
        if (active.length > 0) {
            const activeList = active
                .map((user) => `> • <@${user.discordId}>`)
                .join("\n");
            fields.push({
                name: `◈ Available & Active (${active.length})`,
                value: activeList,
                inline: false,
            });
        }
        if (hiatus.length > 0) {
            const hiatusList = hiatus
                .map((user) => `> • <@${user.discordId}> *(on hiatus)*`)
                .join("\n");
            fields.push({
                name: `◈ Available but On Hiatus (${hiatus.length})`,
                value: hiatusList,
                inline: false,
            });
        }
        const totalFree = active.length + hiatus.length;
        await interaction.reply({
            embeds: [
                (0, miku_embed_js_1.createMikuEmbed)({
                    title: "Miku Availability Board",
                    description: `> **${totalFree}** crew member${totalFree !== 1 ? "s" : ""} currently ${totalFree !== 1 ? "have" : "has"} no pending tasks. Ready for the next spotlight! 🌟`,
                    tone: "sky",
                    fields,
                }),
            ],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
    }
}
exports.CheckFreeCommand = CheckFreeCommand;
