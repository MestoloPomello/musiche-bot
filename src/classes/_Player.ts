import { ActiveGuildInstance } from "./ActiveGuildInstance";
import { getGuildInstance } from "../handlers/connections";
import { SongInfo } from "../types/music";
import { PassThrough } from "stream";

export abstract class _Player {

	constructor () {}

	abstract getSongInfo (
		url: string
	): Promise<SongInfo>;

	abstract getSongReadableStream(
		url: string
	): PassThrough;

	/**
	 *	From seconds to MM:SS
	 */
	protected static formatDuration(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	}
}
