"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = exports.isLogSinkRegistrar = void 0;
const hasOwnRegisterSink = (value) => {
    return typeof value === "object" && value !== null && "registerSink" in value;
};
const isLogSinkRegistrar = (logger) => {
    if (!hasOwnRegisterSink(logger)) {
        return false;
    }
    return typeof logger.registerSink === "function";
};
exports.isLogSinkRegistrar = isLogSinkRegistrar;
const serializeMetadata = (metadata) => {
    if (!metadata) {
        return "";
    }
    try {
        return ` ${JSON.stringify(metadata)}`;
    }
    catch {
        return " [metadata-serialization-failed]";
    }
};
const formatLog = (entry) => {
    const metadataText = serializeMetadata(entry.metadata);
    return `[${entry.timestamp}] [${entry.scope}] [${entry.level}] ${entry.message}${metadataText}`;
};
const createLogger = (scope) => {
    const sinks = [];
    const emit = (level, message, metadata) => {
        const baseEntry = {
            timestamp: new Date().toISOString(),
            level,
            scope,
            message,
        };
        const entry = metadata
            ? {
                ...baseEntry,
                metadata,
            }
            : baseEntry;
        const formatted = formatLog(entry);
        if (level === "INFO") {
            console.log(formatted);
        }
        else if (level === "WARN") {
            console.warn(formatted);
        }
        else {
            console.error(formatted);
        }
        for (const sink of sinks) {
            void Promise.resolve(sink(entry)).catch((error) => {
                const sinkErrorMessage = error instanceof Error ? error.message : "Unknown log sink failure.";
                const sinkErrorEntry = {
                    timestamp: new Date().toISOString(),
                    level: "ERROR",
                    scope,
                    message: "Log sink dispatch failed.",
                    metadata: {
                        sinkErrorMessage,
                    },
                };
                console.error(formatLog(sinkErrorEntry));
            });
        }
    };
    return {
        info: (message, metadata) => {
            emit("INFO", message, metadata);
        },
        warn: (message, metadata) => {
            emit("WARN", message, metadata);
        },
        error: (message, metadata) => {
            emit("ERROR", message, metadata);
        },
        registerSink: (sink) => {
            sinks.push(sink);
        },
    };
};
exports.createLogger = createLogger;
