"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionCreateHandler = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_1 = require("../../presentation/miku-embed");
const permission_bypass_1 = require("../../security/permission-bypass");
class InteractionCreateHandler {
    commandRegistry;
    commandContext;
    submitApprovalHandler;
    strikeAppealHandler;
    userRepository;
    logger;
    constructor(commandRegistry, commandContext, submitApprovalHandler, strikeAppealHandler, userRepository, logger) {
        this.commandRegistry = commandRegistry;
        this.commandContext = commandContext;
        this.submitApprovalHandler = submitApprovalHandler;
        this.strikeAppealHandler = strikeAppealHandler;
        this.userRepository = userRepository;
        this.logger = logger;
    }
    attach(client) {
        client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
            await this.handleInteraction(interaction);
        });
    }
    async handleInteraction(interaction) {
        if (interaction.isButton()) {
            await this.handleButtonInteraction(interaction);
            return;
        }
        if (interaction.isAutocomplete()) {
            const command = this.commandRegistry.get(interaction.commandName);
            if (command?.autocomplete) {
                try {
                    await command.autocomplete(interaction, this.commandContext);
                }
                catch (error) {
                    this.logger.warn("Autocomplete handler failed.", {
                        commandName: interaction.commandName,
                        userId: interaction.user.id,
                    });
                    await interaction.respond([]).catch(() => { });
                }
            }
            return;
        }
        if (!interaction.isChatInputCommand()) {
            return;
        }
        const command = this.commandRegistry.get(interaction.commandName);
        if (!command) {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Command Desk",
                        description: "This command is not available in my current runtime.",
                        tone: "mist",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        if (command.requiredRoleIds?.length && !(0, permission_bypass_1.hasPermissionBypass)(interaction.user.id)) {
            const hasPermission = await this.memberHasAnyRole(interaction, command.requiredRoleIds);
            if (!hasPermission) {
                await interaction.reply({
                    embeds: [
                        (0, miku_embed_1.createMikuEmbed)({
                            title: "Miku Access Check",
                            description: "You do not have permission to use this command.",
                            tone: "wave",
                        }),
                    ],
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
        }
        try {
            await command.execute(interaction, this.commandContext);
            // After successful command execution, check for max-strike warning
            await this.sendStrikeWarningIfNeeded(interaction);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unexpected command failure.";
            this.logger.error("Command execution failed.", {
                commandName: interaction.commandName,
                userId: interaction.user.id,
                message,
            });
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    embeds: [
                        (0, miku_embed_1.createMikuEmbed)({
                            title: "Miku Error Report",
                            description: `Command failed: ${message}`,
                            tone: "wave",
                        }),
                    ],
                    flags: discord_js_1.MessageFlags.Ephemeral,
                });
                return;
            }
            await interaction.reply({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "Miku Error Report",
                        description: `Command failed: ${message}`,
                        tone: "wave",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
        }
    }
    async handleButtonInteraction(interaction) {
        if (this.submitApprovalHandler.canHandle(interaction.customId)) {
            try {
                await this.submitApprovalHandler.handle(interaction);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Unexpected button handler failure.";
                this.logger.error("Submit approval button handler failed.", {
                    customId: interaction.customId,
                    userId: interaction.user.id,
                    message,
                });
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        embeds: [
                            (0, miku_embed_1.createMikuEmbed)({
                                title: "Miku Error Report",
                                description: `Button action failed: ${message}`,
                                tone: "wave",
                            }),
                        ],
                        flags: discord_js_1.MessageFlags.Ephemeral,
                    });
                }
            }
            return;
        }
        if (this.strikeAppealHandler.canHandle(interaction.customId)) {
            try {
                await this.strikeAppealHandler.handle(interaction);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Unexpected button handler failure.";
                this.logger.error("Strike appeal button handler failed.", {
                    customId: interaction.customId,
                    userId: interaction.user.id,
                    message,
                });
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        embeds: [
                            (0, miku_embed_1.createMikuEmbed)({
                                title: "Miku Error Report",
                                description: `Button action failed: ${message}`,
                                tone: "wave",
                            }),
                        ],
                        flags: discord_js_1.MessageFlags.Ephemeral,
                    });
                }
            }
            return;
        }
    }
    async sendStrikeWarningIfNeeded(interaction) {
        try {
            const user = await this.userRepository.findByDiscordId(interaction.user.id);
            if (!user || user.strikes < 3)
                return;
            await interaction.followUp({
                embeds: [
                    (0, miku_embed_1.createMikuEmbed)({
                        title: "⚠️ Miku Strike Warning",
                        description: `> <@${interaction.user.id}>, you currently have **3/3 strikes**. This is the maximum — please take this seriously. If you believe a strike is unfair, you can appeal it with \`/appealstrike\`. Let's work together to get things back on track! 🌸`,
                        tone: "wave",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
        }
        catch {
            // Warning failures should never break the command flow
        }
    }
    async memberHasAnyRole(interaction, requiredRoleIds) {
        if (!interaction.inGuild() || !interaction.guild) {
            return false;
        }
        try {
            const member = await interaction.guild.members.fetch(interaction.user.id);
            return requiredRoleIds.some((roleId) => member.roles.cache.has(roleId));
        }
        catch (error) {
            this.logger.warn("Unable to resolve guild member role set.", {
                commandName: interaction.commandName,
                userId: interaction.user.id,
            });
            return false;
        }
    }
}
exports.InteractionCreateHandler = InteractionCreateHandler;
