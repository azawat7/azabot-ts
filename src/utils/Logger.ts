import chalk from "chalk";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.DEBUG;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  private getTimestamp(): string {
    return new Date().toLocaleTimeString();
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level < this.logLevel) return;
    const timestamp = chalk.gray(`[${this.getTimestamp()}]`);
    const formattedArgs =
      args.length > 0
        ? args
            .map((arg) =>
              typeof arg === "object"
                ? JSON.stringify(arg, null, 2)
                : String(arg)
            )
            .join(" ")
        : "";

    let levelPrefix: string;
    let coloredMessage: string;

    switch (level) {
      case LogLevel.DEBUG:
        levelPrefix = chalk.bgMagenta("DEBUG");
        coloredMessage = chalk.gray(message);
        break;
      case LogLevel.INFO:
        levelPrefix = chalk.bgBlue("INFO");
        coloredMessage = chalk.white(message);
        break;
      case LogLevel.WARN:
        levelPrefix = chalk.bgYellow("WARN");
        coloredMessage = chalk.yellow(message);
        break;
      case LogLevel.ERROR:
        levelPrefix = chalk.bgRed("ERROR");
        coloredMessage = chalk.red(message);
        break;
    }

    console.log(
      `${timestamp} ${levelPrefix} ${coloredMessage}${
        formattedArgs ? " " + formattedArgs : ""
      }`
    );
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }
}

export const logger = Logger.getInstance();
