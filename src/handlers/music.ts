import { ActiveGuildInstance } from "../classes/ActiveGuildInstance";
import { DISCONNECTION_TIMEOUT, ICONS } from "../constants";
import { YouTubePlayer } from "../classes/YouTubePlayer";
import { SpotifyPlayer } from "../classes/SpotifyPlayer";
import { replyOrFollowUp } from "./interactions";
import { _Player } from "../classes/_Player";
import { SongInfo } from "../types/music";
import {
    ActionRowBuilder,
    ButtonBuilder,
	ButtonStyle,
	CommandInteraction,
	GuildMember
} from "discord.js";
import {
	AudioPlayer,
	AudioPlayerStatus,
	createAudioResource,
	VoiceConnection,
    VoiceConnectionStatus
} from "@discordjs/voice";
import {
	getGuildInstance,
	destroyGuildInstance,
	getVoiceConnection
} from "./connections";
import { logger } from "../classes/Logger";

export const guildInstances = new Map<string, ActiveGuildInstance>();

export const ytAliases = ["youtu.be", "youtube.com", "www.youtube.com", "music.youtube.com"];
export const youTubePlayer = new YouTubePlayer();
export const spotifyPlayer = new SpotifyPlayer();

export const spotifyAliases = ["spotify.com", "open.spotify.com"];

function getPlayerByUrl(url: string): _Player {
	for (const alias of ytAliases) {
		if (url.includes(alias)) return youTubePlayer;
	}
	for (const alias of spotifyAliases) {
		if (url.includes(alias)) return spotifyPlayer;
	}
	throw "NO_PROVIDER_FOUND";
}

/**
 *	Adds a new song to a guild's queue.
 */
export async function addToQueue(
	guildId: string,
	url: string,
	asFirst: boolean = false
): Promise<SongInfo> {
	const guildInstance: ActiveGuildInstance = getGuildInstance(guildId, true)!; 
	const newSong: SongInfo = await getPlayerByUrl(url).getSongInfo(url);

	if (asFirst) {
		guildInstance.queue.unshift(newSong);
	} else {
		guildInstance.queue.push(newSong);
	}

	return newSong;
}
/** 
 *	Returns true if the player is paused (or not running in general), false otherwise.
 */
export function handlePlayerPause(
	guildId: string
): boolean {
	try {
		const guildInstance: ActiveGuildInstance = getGuildInstance(guildId, true)!; 
		if (!guildInstance.player) return true;
		if (guildInstance.player.state.status === AudioPlayerStatus.Paused) {
			guildInstance.player.unpause();
			return false;
		} else {
			guildInstance.player.pause();
			return true;
		}
	} catch (error: any) {
		console.trace("handlePlayerPause error:", error);
		return true;
	}
}

export async function startNextQueuedSong(
	interaction?: CommandInteraction,
) {
	const currVoiceChannel = interaction
		? (interaction.member! as GuildMember)?.voice?.channel
		: null;
	const guildId: string | undefined =
		interaction?.guildId ?? currVoiceChannel?.guild.id;
	if (!guildId) throw "Impossibile determinare la guild per la riproduzione.";

	const guildInstance: ActiveGuildInstance = getGuildInstance(guildId, true)!; 
	const nextSong: SongInfo | null = guildInstance.getNextSongInQueue();
	if (!nextSong) {
		if (interaction) {
			replyOrFollowUp(interaction, {
				content: "Nessun brano in coda.",
				components: []
			});
		}
		return;
	}

	const isVCexisting: boolean = guildInstance.voiceConnection != null; 
	const voiceConnection: VoiceConnection | null = isVCexisting
		? guildInstance.voiceConnection
		: currVoiceChannel
			? getVoiceConnection(currVoiceChannel)
			: null;
	if (!voiceConnection) throw "Errore nello stabilire una connessione al canale vocale.";
	//voiceConnection.removeAllListeners();

	const player: AudioPlayer = guildInstance.getNewPlayer(); 
	if (!player) throw "Errore nella creazione di un player audio.";

	if (isVCexisting) {
		startPlayingMusic(
			voiceConnection,
			nextSong,
			player,
			guildId
		);
	} else {
		voiceConnection.on(VoiceConnectionStatus.Ready, async () => {
			startPlayingMusic(
				voiceConnection,
				nextSong,
				player,
				guildId
			);
		});
	}	

	const pauseBtn = new ButtonBuilder()
		.setCustomId("pauseBtn")
		.setLabel(ICONS.pause)
		.setStyle(ButtonStyle.Primary);

	//const stopBtn = new ButtonBuilder()
	//	.setCustomId("stopBtn")
	//	.setLabel(ICONS.stop)
	//	.setStyle(ButtonStyle.Primary);

	const disconnectBtn = new ButtonBuilder()
		.setCustomId("disconnectBtn")
		.setLabel("Disconnetti")
		.setStyle(ButtonStyle.Danger);

	const replyRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
		pauseBtn,
		//stopBtn, // ToDo - temporarily hidden
		disconnectBtn
	]);

	const interactionResponse = {
		content: `Sto riproducendo il brano: ${nextSong.title} [${nextSong.length}] - ${nextSong.url}`,
		components: [replyRow],
	};

	if (interaction) {
		try {
			await replyOrFollowUp(interaction, interactionResponse);
		} catch (e) {
			console.trace("[startNextQueuedSong] Error:", e);
		}
	}
}

export function startPlayingMusic(
	voiceConnection: VoiceConnection, 
	song: SongInfo,
	player: AudioPlayer,
	guildId: string
) {
	const guildInstance: ActiveGuildInstance = getGuildInstance(guildId, true)!;
	const nodeReadable = getPlayerByUrl(song.url).getSongReadableStream(song.url);
	const resource = createAudioResource(nodeReadable);
	player.play(resource);
	voiceConnection.subscribe(player);
	
	// Variabled used to resume in case of "aborted" player error
	let playbackStartTime = Date.now();
	let elapsedTime = 0;

	player.on(AudioPlayerStatus.Playing, () => {
		logger.log(`[PLAY] Guild: ${guildId} | Playing song: ${song.title}`);

		// Reset the timer if a new song starts
		if (guildInstance.disconnectTimeout) {
			clearTimeout(guildInstance.disconnectTimeout);
			guildInstance.disconnectTimeout = null;
		}

		playbackStartTime = Date.now();
	});

	player.on(AudioPlayerStatus.Idle, () => {
		if (guildInstance.queue.length > 0) {
			startNextQueuedSong();
			return;
		}
		guildInstance.nowPlaying = null;
		guildInstance.player = null;

		// const timeout = setTimeout(() => {
		// 	destroyGuildInstance(guildId);
		// 	logger.log(`[DISCONNECT] After timeout in guild ${guildId}.`);
		// }, DISCONNECTION_TIMEOUT);
		// guildInstance.disconnectTimeout = timeout;
	});

	player.on('error', error => {
	 	console.error(`[ERROR] Guild: ${guildId} | Player error: ${error.message}`);
	});
}

