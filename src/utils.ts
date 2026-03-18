import fs from "fs";
import { COOKIES_PATH } from "./constants";
import { spotifyAliases } from "./handlers/music";

export const ytAliases = ["youtu.be", "youtube.com", "www.youtube.com", "music.youtube.com"];


/**
 *	Finds a YT video URL by query.
 */
export async function getYtUrlByName(
	query: string
): Promise<string | null> {
	const apiKey = process.env.YOUTUBE_API_KEY;
	if (!apiKey) throw "NO_API_KEY";
	if (!query) throw "NO_QUERY";

	const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${apiKey}&maxResults=1`;
	const response = await fetch(url);
	const data = await response.json();

	if (data.items && data.items.length > 0) {
		const videoId = data.items[0].id.videoId;
		return `https://www.youtube.com/watch?v=${videoId}`;
	} else {
		return null;
	}
}


/**
 *	Given a string criteria, returns an URL.
 *	Throws an error if the URL is not from YouTube.
 */
export async function getUrl(str: string): Promise<string | null> {
	if (!str) return null;

	if (str.includes("http://") || str.includes("https://")) {
		for (const alias of ytAliases) {
			if (str.includes(alias)) return str.split("&")[0];
		}
		for (const alias of spotifyAliases) {
			if (str.includes(alias)) return str.split("?")[0]; // rimuove ?si= e simili
		}
		throw "URL non supportato. Usa YouTube o Spotify.";
	}

	// Ricerca testuale → YouTube
	const ytUrl = await getYtUrlByName(str);
	return ytUrl?.split("&")[0] || null;
}

/**
 * Returns an agent object with the saved cookies, creating it if it doesn't exist. 
 */
// export function getAgent(): Agent {
// 	if (!agent) {
// 		agent = createAgent(
// 			JSON.parse(fs.readFileSync(COOKIES_PATH, { encoding: "utf-8" })),
// 			//{
// 			//	pipelining: 5,
// 			//	maxRedirections: 0,
// 			//	//localAddress: "51.254.32.246"
// 			//	localAddress: generateRandomIPv6() 
// 			//}
// 		);
// 	}
// 	return agent;
// }


function generateRandomIPv6(): string {
    const getRandomHex = () => Math.floor(Math.random() * 0xFFFF).toString(16);
    return Array(8).fill(null).map(getRandomHex).join(':');
}

