import {
    AudioPlayer,
	AudioPlayerStatus,
	createAudioPlayer,
	joinVoiceChannel,
	VoiceConnection
} from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
import { VoiceBasedChannel } from "discord.js";
import { formatDuration } from "./utils";


export type SongInfo = {
	title: string
	url: string
	length: string
}


export const openedVoiceConnections = new Map<string, VoiceConnection>(); 
export const disconnectTimeouts = new Map<string, NodeJS.Timeout>(); // Handle silence timeouts 
export const playersMap = new Map<string, AudioPlayer>();
export const queues = new Map<string, SongInfo[]>(); // { guildId, [ {song1}, {song2} ]}


export async function addToQueue(
	guildId: string,
	url: string,
	asFirst: boolean = false
): Promise<SongInfo> {
	const fullSongInfo = await ytdl.getBasicInfo(url); 
	const queue = queues.get(guildId) ?? [];

	const newSong: SongInfo = {
		title: fullSongInfo.videoDetails.title,
		url: url,
		length: formatDuration(+fullSongInfo.videoDetails.lengthSeconds)
	};

	if (asFirst) {
		queue.unshift(newSong);
	} else {
		queue.push(newSong);
	}

	queues.set(guildId, queue);
	return newSong;
}


export function getNextSongInQueue(guildId: string): SongInfo | null {
	return queues.get(guildId)?.shift() ?? null;	
}


export function getVoiceConnection(
	currVoiceChannel: VoiceBasedChannel
): VoiceConnection | null {
	try {
		let voiceConnection = openedVoiceConnections.get(currVoiceChannel.guild.id);
		if (!voiceConnection) {
			voiceConnection = joinVoiceChannel({
				channelId: currVoiceChannel.id,
				guildId: currVoiceChannel.guild.id,
				// @ts-ignore
				adapterCreator: currVoiceChannel.guild.voiceAdapterCreator,
			});
			if (!voiceConnection) return null;
			openedVoiceConnections.set(currVoiceChannel.guild.id, voiceConnection);
			console.log(`[CONN] New connection opened for guild ${currVoiceChannel.guild.id}. Total connections: ${openedVoiceConnections.size}`);
		} 
		return voiceConnection;
	} catch (error: any) {
		console.trace("getVoiceConnection error:", error);
		return null;
	}
}


export function destroyVoiceConnection(
	guildId: string
): void {
	try {
		destroyPlayer(guildId);
		openedVoiceConnections.get(guildId)?.destroy();		
		openedVoiceConnections.delete(guildId);
		console.log(`[CONN] Connection closed for guild ${guildId}. Total connections: ${openedVoiceConnections.size}`);
	} catch (error: any) {
		console.trace("destroyVoiceConnection error", error);
	}
}


export function getNewPlayer(
	guildId: string
): AudioPlayer | null {
	try {
		let oldPlayer = playersMap.get(guildId);
		if (oldPlayer) {
			oldPlayer.stop();
			oldPlayer.removeAllListeners();
			playersMap.delete(guildId);
		}
		const newPlayer = createAudioPlayer();
		playersMap.set(guildId, newPlayer);
		return newPlayer;
	} catch (error: any) {
		console.trace("getPlayer error:", error);
		return null;
	}
} 


/** 
 *	Returns true if the player is paused (or not running in general), false otherwise.
 */
export function handlePlayerPause(
	guildId: string
): boolean {
	try {
		const player = playersMap.get(guildId);
		if (!player) return true;
		if (player.state.status === AudioPlayerStatus.Paused) {
			player.unpause();
			return false;
		} else {
			player.pause();
			return true;
		}
	} catch (error: any) {
		console.trace("handlePlayerPause error:", error);
		return true;
	}
}


export function destroyPlayer(
	guildId: string
): void {
	try {
		const player = playersMap.get(guildId);
		if (!player) return;
		player.stop(true);
		player.removeAllListeners();
		playersMap.delete(guildId);
	} catch (error: any) {
		console.trace("destroyPlayer error:", error);
	}
}
