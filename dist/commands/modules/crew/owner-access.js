"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureOwnerAccess = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_1 = require("../../../presentation/miku-embed");
const permission_bypass_1 = require("../../../security/permission-bypass");
const ensureOwnerAccess = async (interaction, context) => {
    if (!interaction.inGuild() || !interaction.guild || !interaction.guildId) {
        await interaction.reply({
            embeds: [
                (0, miku_embed_1.createMikuEmbed)({
                    title: "Miku Access Check",
                    description: "This command is only available inside a server.",
                    tone: "mist",
                }),
            ],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
        return false;
    }
    if ((0, permission_bypass_1.hasPermissionBypass)(interaction.user.id)) {
        return true;
    }
    let ownerRoleIds = [];
    try {
        const cachedConfig = context.configCacheService.getConfig(interaction.guildId);
        ownerRoleIds = cachedConfig.ownerRoleIds;
    }
    catch {
        const loadedConfig = await context.configCacheService.loadConfig(interaction.guildId);
        ownerRoleIds = loadedConfig.ownerRoleIds;
    }
    if (ownerRoleIds.length === 0) {
        await interaction.reply({
            embeds: [
                (0, miku_embed_1.createMikuEmbed)({
                    title: "Miku Access Check",
                    description: "No owner roles are configured for this server yet. Ask an owner to configure access roles first.",
                    tone: "wave",
                }),
            ],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
        return false;
    }
    try {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const hasOwnerRole = ownerRoleIds.some((roleId) => member.roles.cache.has(roleId));
        if (hasOwnerRole) {
            return true;
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown role resolution failure.";
        context.logger.warn("Unable to verify owner access for command.", {
            commandName: interaction.commandName,
            userId: interaction.user.id,
            message,
        });
        await interaction.reply({
            embeds: [
                (0, miku_embed_1.createMikuEmbed)({
                    title: "Miku Access Check",
                    description: "I could not verify your role permissions right now. Please try again in a moment.",
                    tone: "wave",
                }),
            ],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
        return false;
    }
    await interaction.reply({
        embeds: [
            (0, miku_embed_1.createMikuEmbed)({
                title: "Miku Access Check",
                description: "This command is owner-only.",
                tone: "wave",
            }),
        ],
        flags: discord_js_1.MessageFlags.Ephemeral,
    });
    return false;
};
exports.ensureOwnerAccess = ensureOwnerAccess;
