"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandDeployer = void 0;
const discord_js_1 = require("discord.js");
class CommandDeployer {
    config;
    logger;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }
    async deploy(commands) {
        const rest = new discord_js_1.REST({ version: "10" }).setToken(this.config.discord.token);
        const payload = commands.map((command) => command.data.toJSON());
        await rest.put(discord_js_1.Routes.applicationGuildCommands(this.config.discord.applicationId, this.config.discord.guildId), {
            body: payload,
        });
        this.logger.info("Slash commands deployed.", {
            commandCount: commands.length,
            guildId: this.config.discord.guildId,
        });
    }
}
exports.CommandDeployer = CommandDeployer;
