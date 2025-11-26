import fs from "fs";
import util from "util";
import path from "path";

class Logger {
	private baseDir: string;
	private currentDay: number;
	private currentFile: string;

	constructor(baseDir: string) {
		this.baseDir = baseDir;
		this.currentDay = new Date().getDate();
		this.currentFile = this.buildFilename(this.currentDay);
		if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
	}

	private buildFilename(day: number) {
		const file = `logs_${String(day).padStart(2, "0")}.txt`;
		return path.join(this.baseDir, file);
	}

	private rotateIfNeeded() {
		const today = new Date().getDate();
		if (today !== this.currentDay) {
			this.currentDay = today;
			this.currentFile = this.buildFilename(today);
		}
	}

	private async output(scope: string, ...args: any[]) {
		this.rotateIfNeeded();
		const formatted = util.format(...args);
		const line = `[${new Date().toLocaleString()}] ${formatted}`;
		switch (scope) {
			case "error":
				console.trace(line);
				break;
			case "log":
			default:
				console.log(line);
		}
		await fs.promises.appendFile(this.currentFile, line + "\n");
	}

	async log(...args: any[]) {
		this.output("log", ...args);
	}

	async error(...args: any[]) {
		this.output("error", ...args);
	}
}

export const logger = new Logger(path.join(process.cwd(), "logs"));
