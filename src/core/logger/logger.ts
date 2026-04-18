export interface Logger {
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
}

type LogLevel = "INFO" | "WARN" | "ERROR";

const formatLog = (
  level: LogLevel,
  scope: string,
  message: string,
  metadata?: Record<string, unknown>,
): string => {
  const timestamp = new Date().toISOString();
  const metadataText = metadata ? ` ${JSON.stringify(metadata)}` : "";
  return `[${timestamp}] [${scope}] [${level}] ${message}${metadataText}`;
};

export const createLogger = (scope: string): Logger => {
  return {
    info: (message, metadata) => {
      console.log(formatLog("INFO", scope, message, metadata));
    },
    warn: (message, metadata) => {
      console.warn(formatLog("WARN", scope, message, metadata));
    },
    error: (message, metadata) => {
      console.error(formatLog("ERROR", scope, message, metadata));
    },
  };
};
