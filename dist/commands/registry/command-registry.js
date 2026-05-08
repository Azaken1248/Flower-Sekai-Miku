"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRegistry = void 0;
class CommandRegistry {
    commands = new Map();
    register(command) {
        const commandName = command.data.name;
        if (this.commands.has(commandName)) {
            throw new Error(`Duplicate command registration attempted for '${commandName}'.`);
        }
        this.commands.set(commandName, command);
    }
    get(name) {
        return this.commands.get(name);
    }
    list() {
        return [...this.commands.values()];
    }
}
exports.CommandRegistry = CommandRegistry;
