"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardCommand = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_1 = require("../../../presentation/miku-embed");
const owner_access_1 = require("./owner-access");
class OnboardCommand {
    data = new discord_js_1.SlashCommandBuilder()
        .setName("onboard")
        .setDescription("Onboard a member as active crew in the bot database. Owners only.")
        .addUserOption((option) => option.setName("member").setDescription("Member to onboard").setRequired(true));
    async execute(interaction, context) {
        const hasOwnerAccess = await (0, owner_access_1.ensureOwnerAccess)(interaction, context);
        if (!hasOwnerAccess) {
            return;
        }
        const targetUser = interaction.options.getUser("member", true);
        const result = await context.userService.onboard(targetUser.id, targetUser.username);
        const joinedUnix = Math.floor(result.user.joinedAt.getTime() / 1000);
        const messages = {
            created: `<@${targetUser.id}> is now active in the crew registry.`,
            reactivated: `<@${targetUser.id}> has been reactivated in the crew registry.`,
            alreadyActive: `<@${targetUser.id}> is already active in the crew registry.`,
        };
        const toneByStatus = {
            created: "bloom",
            reactivated: "sky",
            alreadyActive: "mist",
        };
        const labelByStatus = {
            created: "New profile created",
            reactivated: "Reactivated",
            alreadyActive: "Already active",
        };
        await interaction.reply({
            embeds: [
                (0, miku_embed_1.createMikuEmbed)({
                    title: "Miku Crew Onboarding",
                    description: messages[result.status],
                    tone: toneByStatus[result.status],
                    fields: [
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
                        {
                            name: "Joined",
                            value: `<t:${joinedUnix}:f>`,
                            inline: true,
                        },
                    ],
                }),
            ],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
    }
}
exports.OnboardCommand = OnboardCommand;
