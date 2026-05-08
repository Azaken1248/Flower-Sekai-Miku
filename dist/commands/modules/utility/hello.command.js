"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelloCommand = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_1 = require("../../../presentation/miku-embed");
class HelloCommand {
    data = new discord_js_1.SlashCommandBuilder()
        .setName("hello")
        .setDescription("Say hello to Flower Sekai's Miku.");
    async execute(interaction, _context) {
        await interaction.reply({
            embeds: [
                (0, miku_embed_1.createMikuEmbed)({
                    title: "Miku Greeting",
                    description: `Hello, <@${interaction.user.id}>! Flower Sekai Miku is here for you.`,
                    tone: "cream",
                }),
            ],
        });
    }
}
exports.HelloCommand = HelloCommand;
