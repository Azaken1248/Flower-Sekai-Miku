"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpCommand = void 0;
const discord_js_1 = require("discord.js");
const miku_embed_js_1 = require("../../../presentation/miku-embed.js");
/**
 * Discord option type numeric codes → human-readable labels.
 * @see https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-option-type
 */
const OPTION_TYPE_LABELS = {
    1: "Sub-command",
    2: "Sub-command Group",
    3: "String",
    4: "Integer",
    5: "Boolean",
    6: "User",
    7: "Channel",
    8: "Role",
    9: "Mentionable",
    10: "Number",
    11: "Attachment",
};
function resolveAccessLabel(command, config) {
    const roles = "requiredRoleIds" in command
        ? command.requiredRoleIds
        : undefined;
    if (!roles || roles.length === 0)
        return "Everyone";
    const ownerRoleId = config.roles.owners;
    const modRoleId = config.roles.mods;
    const hasOwner = roles.includes(ownerRoleId);
    const hasMod = roles.includes(modRoleId);
    if (hasOwner && hasMod)
        return "Owners & Mods";
    if (hasOwner)
        return "Owners";
    if (hasMod)
        return "Mods";
    return "Restricted";
}
function parseOptions(command) {
    const json = command.data.toJSON();
    if (!json.options || json.options.length === 0)
        return [];
    return json.options.map((opt) => ({
        name: opt.name,
        description: opt.description,
        type: OPTION_TYPE_LABELS[opt.type] ?? `Type ${opt.type}`,
        required: opt.required ?? false,
    }));
}
class HelpCommand {
    registry;
    constructor(registry) {
        this.registry = registry;
    }
    data = new discord_js_1.SlashCommandBuilder()
        .setName("help")
        .setDescription("Browse all available commands or get details on a specific one.")
        .addStringOption((option) => option
        .setName("command")
        .setDescription("Get detailed info about a specific command")
        .setRequired(false)
        .setAutocomplete(true));
    async execute(interaction, context) {
        const commandName = interaction.options.getString("command");
        if (commandName) {
            await this.showCommandDetail(interaction, context, commandName);
        }
        else {
            await this.showOverview(interaction, context);
        }
    }
    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
        const commands = this.registry.list();
        const choices = commands
            .filter((cmd) => {
            const name = cmd.data.name;
            const desc = cmd.data.description;
            return name.includes(focused) || desc.toLowerCase().includes(focused);
        })
            .slice(0, 25)
            .map((cmd) => ({
            name: `/${cmd.data.name} — ${cmd.data.description}`.slice(0, 100),
            value: cmd.data.name,
        }));
        await interaction.respond(choices);
    }
    async showOverview(interaction, context) {
        const commands = this.registry.list();
        const groups = {
            "Everyone": [],
            "Owners & Mods": [],
            "Owners": [],
        };
        for (const cmd of commands) {
            if (cmd.data.name === "help")
                continue;
            const access = resolveAccessLabel(cmd, context.config);
            const bucket = groups[access] ?? (groups["Everyone"] ??= []);
            bucket.push({ name: cmd.data.name, desc: cmd.data.description });
        }
        const fields = Object.entries(groups)
            .filter(([, cmds]) => cmds.length > 0)
            .map(([label, cmds]) => ({
            name: `◈ ${label}`,
            value: cmds
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((c) => `> \`/${c.name}\` — ${c.desc}`)
                .join("\n"),
            inline: false,
        }));
        await interaction.reply({
            embeds: [
                (0, miku_embed_js_1.createMikuEmbed)({
                    title: "Miku Help Desk 📖",
                    description: "> Here's everything I can do! Use `/help command:<name>` for details on a specific command.",
                    tone: "sky",
                    voiceWrap: false,
                    fields,
                }),
            ],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
    }
    async showCommandDetail(interaction, context, commandName) {
        const command = this.registry.get(commandName);
        if (!command) {
            await interaction.reply({
                embeds: [
                    (0, miku_embed_js_1.createMikuEmbed)({
                        title: "Miku Help Desk",
                        description: `> No command found named \`${commandName}\`. Use \`/help\` to see all available commands!`,
                        tone: "mist",
                    }),
                ],
                flags: discord_js_1.MessageFlags.Ephemeral,
            });
            return;
        }
        const access = resolveAccessLabel(command, context.config);
        const options = parseOptions(command);
        const fields = [
            {
                name: "◈ Access Level",
                value: `> \` ${access} \``,
                inline: true,
            },
            {
                name: "◈ Autocomplete",
                value: `> \` ${command.autocomplete ? "Yes" : "No"} \``,
                inline: true,
            },
        ];
        if (options.length > 0) {
            const paramLines = options.map((opt) => {
                const reqBadge = opt.required ? "**required**" : "*optional*";
                return `> \`${opt.name}\` (${opt.type}) — ${opt.description} [${reqBadge}]`;
            });
            fields.push({
                name: `◈ Parameters (${options.length})`,
                value: paramLines.join("\n"),
                inline: false,
            });
        }
        else {
            fields.push({
                name: "◈ Parameters",
                value: "> *No parameters*",
                inline: false,
            });
        }
        await interaction.reply({
            embeds: [
                (0, miku_embed_js_1.createMikuEmbed)({
                    title: `Miku Help Desk — /${command.data.name}`,
                    description: `> ${command.data.description}`,
                    tone: "sky",
                    voiceWrap: false,
                    fields,
                }),
            ],
            flags: discord_js_1.MessageFlags.Ephemeral,
        });
    }
}
exports.HelpCommand = HelpCommand;
