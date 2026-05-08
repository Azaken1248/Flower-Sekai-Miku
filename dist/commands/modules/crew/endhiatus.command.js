"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndHiatusCommand = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_1 = require("../../../presentation/miku-embed");
class EndHiatusCommand {
    data = new discord_js_1.SlashCommandBuilder()
        .setName("endhiatus")
        .setDescription("End your hiatus — your frozen deadlines will be recalculated and resumed.");
    async execute(interaction, context) {
        const result = await context.userService.endHiatus(interaction.user.id);
        const messages = {
            ended: `> Welcome back, <@${interaction.user.id}>! 🌟 Your deadlines have been unfrozen and pushed forward to account for your hiatus.`,
            notOnHiatus: `> <@${interaction.user.id}> is not currently on hiatus.`,
            notFound: `> No crew profile found for <@${interaction.user.id}>. You need to be onboarded first.`,
            deboarded: "> Unexpected state.",
            started: "> Unexpected state.",
            alreadyOnHiatus: "> Unexpected state.",
        };
        const toneByStatus = {
            ended: "bloom",
            notOnHiatus: "mist",
            notFound: "wave",
            deboarded: "wave",
            started: "mist",
            alreadyOnHiatus: "mist",
        };
        const fields = result.status === "ended"
            ? [
                {
                    name: "◈ Status",
                    value: "> `ACTIVE`",
                    inline: true,
                },
                {
                    name: "◈ Deadlines Adjusted",
                    value: `> \` ${result.deadlinesAffected} \` task${result.deadlinesAffected === 1 ? "" : "s"}`,
                    inline: true,
                },
            ]
            : [];
        await interaction.reply({
            embeds: [
                (0, miku_embed_1.createMikuEmbed)({
                    title: "Miku Hiatus Board",
                    description: messages[result.status],
                    tone: toneByStatus[result.status],
                    fields,
                }),
            ],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
    }
}
exports.EndHiatusCommand = EndHiatusCommand;
