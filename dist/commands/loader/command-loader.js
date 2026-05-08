"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandLoader = void 0;
class CommandLoader {
    commandRegistry;
    commands;
    isLoaded = false;
    constructor(commandRegistry, commands) {
        this.commandRegistry = commandRegistry;
        this.commands = commands;
    }
    load() {
        if (this.isLoaded) {
            return this.commands;
        }
        for (const command of this.commands) {
            this.commandRegistry.register(command);
        }
        this.isLoaded = true;
        return this.commands;
    }
}
exports.CommandLoader = CommandLoader;
