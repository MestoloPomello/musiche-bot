import { VideoInfo, YtDlp } from "ytdlp-nodejs";
import { SongInfo } from "../types/music";
import { PassThrough } from "stream";
import { _Player } from "./_Player";

export class YouTubePlayer extends _Player {

	constructor () {
		super();
	}

	async getSongInfo (
		url: string
	): Promise<SongInfo> {
		const ytdlp = new YtDlp();
		const fullSongInfo: VideoInfo = await ytdlp.getInfoAsync(url) as VideoInfo; 
		return {
			title: fullSongInfo.title,
			url: url,
			length: _Player.formatDuration(+fullSongInfo.duration),
			lengthSeconds: +fullSongInfo.duration
		};
	}

	getSongReadableStream(
		url: string
	): PassThrough {
		const ytdlp = new YtDlp();
		const ytdlpStream = ytdlp.stream(url, {
			format: {
				filter: "audioonly"
			}
		});

		const nodeReadable = new PassThrough();
		ytdlpStream.pipe(nodeReadable);
		return nodeReadable;
	}
}

