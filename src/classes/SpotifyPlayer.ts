import { VideoInfo, YtDlp } from "ytdlp-nodejs";
import { getYtUrlByName } from "../utils";
import { SongInfo } from "../types/music";
import { PassThrough } from "stream";
import { _Player } from "./_Player";

const SPOTIFY_TRACK_REGEX= /https?:\/\/open\.spotify\.com\/intl-[a-z]{2}\/track\/([A-Za-z0-9]+)/;

export class SpotifyPlayer extends _Player {

	constructor() {
		super();
	}

	/**
	 * Fetches Spotify track metadata via oEmbed (no auth required),
	 * then resolves a YouTube URL by searching the title.
	 */
	async getSongInfo(url: string): Promise<SongInfo> {
		const { title, ytUrl } = await this.resolveSpotifyTrack(url);
		const ytdlp = new YtDlp();
		const fullSongInfo: VideoInfo = await ytdlp.getInfoAsync(ytUrl) as VideoInfo;
		return {
			title,
			url,
			length: _Player.formatDuration(+fullSongInfo.duration),
			lengthSeconds: +fullSongInfo.duration,
		};
	}

	getSongReadableStream(url: string): PassThrough {
		// url here is the original Spotify URL — we need to re-resolve to YT
		// We store the resolved ytUrl in a closure via a PassThrough bridge
		const output = new PassThrough();

		this.resolveSpotifyTrack(url)
			.then(({ ytUrl }) => {
				const ytdlp = new YtDlp();
				const ytdlpStream = ytdlp.stream(ytUrl, {
					format: { filter: "audioonly" },
				});
				ytdlpStream.pipe(output);
			})
			.catch(err => output.destroy(err));

		return output;
	}

	/**
	 * Resolves a Spotify track URL to its title and a matching YouTube URL.
	 */
	private async resolveSpotifyTrack(
		spotifyUrl: string
	): Promise<{ title: string; ytUrl: string }> {
		const match = spotifyUrl.match(SPOTIFY_TRACK_REGEX);
		if (!match) throw "URL Spotify non valido (solo tracce singole supportate).";

		// oEmbed gives us the track title without needing OAuth
		const oEmbedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`;
		const response = await fetch(oEmbedUrl);
		if (!response.ok) throw "Impossibile recuperare i metadati da Spotify.";

		const data = await response.json() as { title: string };
		const title: string = data.title;

		const ytUrl = await getYtUrlByName(title);
		if (!ytUrl) throw `Nessun risultato YouTube trovato per: "${title}"`;

		return { title, ytUrl };
	}
}
