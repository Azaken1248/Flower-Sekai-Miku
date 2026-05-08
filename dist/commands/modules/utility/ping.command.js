"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PingCommand = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_1 = require("../../../presentation/miku-embed");
class PingCommand {
    data = new discord_js_1.SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check the bot and Discord API latency.");
    async execute(interaction, _context) {
        const roundTripLatencyMs = Date.now() - interaction.createdTimestamp;
        const apiLatencyMs = interaction.client.ws.ping;
        await interaction.reply({
            embeds: [
                (0, miku_embed_1.createMikuEmbed)({
                    title: "Miku Ping Check",
                    description: "Sound check complete. Here are the current latency values:",
                    tone: "wave",
                    fields: [
                        {
                            name: "Round-trip",
                            value: `${roundTripLatencyMs}ms`,
                            inline: true,
                        },
                        {
                            name: "Discord API",
                            value: `${apiLatencyMs}ms`,
                            inline: true,
                        },
                    ],
                }),
            ],
        });
    }
}
exports.PingCommand = PingCommand;
