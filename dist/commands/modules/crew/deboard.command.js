"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeboardCommand = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_1 = require("../../../presentation/miku-embed");
const owner_access_1 = require("./owner-access");
const normalizeDeboardMessage = (message) => {
    const trimmed = message.trim();
    if (trimmed.length === 0) {
        return "No farewell note was recorded.";
    }
    if (/different\s+sekai/i.test(trimmed)) {
        return "Moved to a different team.";
    }
    return trimmed;
};
class DeboardCommand {
    data = new discord_js_1.SlashCommandBuilder()
        .setName("deboard")
        .setDescription("Deboard a member from active crew status. Owners only.")
        .addUserOption((option) => option.setName("member").setDescription("Member to deboard").setRequired(true))
        .addStringOption((option) => option
        .setName("reason")
        .setDescription("Optional deboard note")
        .setRequired(false)
        .setMaxLength(300));
    async execute(interaction, context) {
        const hasOwnerAccess = await (0, owner_access_1.ensureOwnerAccess)(interaction, context);
        if (!hasOwnerAccess) {
            return;
        }
        const targetUser = interaction.options.getUser("member", true);
        const reason = interaction.options.getString("reason")?.trim();
        const result = await context.userService.deboard(targetUser.id, reason);
        const messageByStatus = {
            deboarded: `<@${targetUser.id}> has been marked as deboarded in the crew registry.`,
            alreadyDeboarded: `<@${targetUser.id}> is already marked as deboarded.`,
            notFound: `No crew profile exists for <@${targetUser.id}> yet.`,
        };
        const toneByStatus = {
            deboarded: "mist",
            alreadyDeboarded: "sky",
            notFound: "wave",
        };
        const labelByStatus = {
            deboarded: "Deboarded",
            alreadyDeboarded: "Already deboarded",
            notFound: "Profile not found",
        };
        const fields = [
            {
                name: "Member",
                value: `<@${targetUser.id}>`,
                inline: true,
            },
            {
                name: "Result",
                value: labelByStatus[result.status],
                inline: true,
            },
        ];
        if (result.user?.deboardedAt) {
            const deboardedUnix = Math.floor(result.user.deboardedAt.getTime() / 1000);
            fields.push({
                name: "Deboarded At",
                value: `<t:${deboardedUnix}:f>`,
                inline: true,
            });
        }
        if (result.user?.deboardedMessage) {
            fields.push({
                name: "Deboard Note",
                value: normalizeDeboardMessage(result.user.deboardedMessage).slice(0, 1024),
                inline: false,
            });
        }
        await interaction.reply({
            embeds: [
                (0, miku_embed_1.createMikuEmbed)({
                    title: "Miku Crew Deboarding",
                    description: messageByStatus[result.status],
                    tone: toneByStatus[result.status],
                    fields,
                }),
            ],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
    }
}
exports.DeboardCommand = DeboardCommand;
