
export const ytAliases = ["youtu.be", "youtube.com", "www.youtube.com", "music.youtube.com"];

/**
 *	From seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

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
export async function getUrl(
	str: string
): Promise<string | null> {
	if (!str) return null;
	if (str.includes("http://") || str.includes("https://")) {
		let isYtUrl = false;
		for (const alias of ytAliases) {
			if (str.includes(alias)) {
				isYtUrl = true;
				break;
			}
		}
		if (isYtUrl) return str;
		else throw "NO_YT_URL"; // ToDo - expand with other providers
	} else {
		return await getYtUrlByName(str);
	}
}
