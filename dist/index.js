"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const build_container_1 = require("./bootstrap/build-container");
const tokens_1 = require("./core/di/tokens");
const run = async () => {
    const container = (0, build_container_1.buildContainer)();
    const bot = container.resolve(tokens_1.TOKENS.bot);
    await bot.start();
};
void run().catch((error) => {
    console.error("Fatal startup error.", error);
    process.exit(1);
});
