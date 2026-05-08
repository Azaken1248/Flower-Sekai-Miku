"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UptimeCommand = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_1 = require("../../../presentation/miku-embed");
const formatUptime = (totalSeconds) => {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const units = [];
    if (days > 0) {
        units.push(`${days}d`);
    }
    if (hours > 0 || days > 0) {
        units.push(`${hours}h`);
    }
    if (minutes > 0 || hours > 0 || days > 0) {
        units.push(`${minutes}m`);
    }
    units.push(`${seconds}s`);
    return units.join(" ");
};
class UptimeCommand {
    data = new discord_js_1.SlashCommandBuilder()
        .setName("uptime")
        .setDescription("Show how long the bot has been online.");
    async execute(interaction, _context) {
        const uptimeSeconds = Math.floor(process.uptime());
        await interaction.reply({
            embeds: [
                (0, miku_embed_1.createMikuEmbed)({
                    title: "Miku Runtime Status",
                    description: `Miku has been online for **${formatUptime(uptimeSeconds)}**.`,
                    tone: "sky",
                }),
            ],
        });
    }
}
exports.UptimeCommand = UptimeCommand;
