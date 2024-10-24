import {
	AudioPlayerStatus,
	joinVoiceChannel,
	VoiceConnection
} from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
import { VoiceBasedChannel } from "discord.js";
import { formatDuration } from "./utils";
import { ActiveGuildInstance } from "./classes/ActiveGuildInstance";


export type SongInfo = {
	title: string
	url: string
	length: string
}


export const guildInstances = new Map<string, ActiveGuildInstance>();

/**
 *	Get a guild instance by its ID. If it doesn't exist, the function creates it.
 */
export function getGuildInstance(guildId: string): ActiveGuildInstance {
	let guildInstance = guildInstances.get(guildId);
	if (!guildInstance) {
		guildInstance = new ActiveGuildInstance();	
		guildInstances.set(guildId, guildInstance);
		console.log(`[CONN] New instance created for guild ${guildId}. Total instances: ${guildInstances.size}`);
	}
	return guildInstance;
}


export function destroyGuildInstance(
	guildId: string
): void {
	try {
		let guildInstance = guildInstances.get(guildId);
		guildInstance?.destroyVoiceConnection();
		guildInstances.delete(guildId);
		console.log(`[CONN] Instace deleted for guild ${guildId}. Total instances: ${guildInstances.size}`);
	} catch (error: any) {
		console.trace("destroyVoiceConnection error", error);
	}
}


/**
 *	Adds a new song to a guild's queue.
 */
export async function addToQueue(
	guildId: string,
	url: string,
	asFirst: boolean = false
): Promise<SongInfo> {
	const fullSongInfo = await ytdl.getBasicInfo(url); 
	const guildInstance: ActiveGuildInstance = getGuildInstance(guildId); 
	const { queue } = guildInstance;

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

	return newSong;
}


export function getVoiceConnection(
	currVoiceChannel: VoiceBasedChannel
): VoiceConnection | null {
	try {
		const guildInstance: ActiveGuildInstance = getGuildInstance(currVoiceChannel.guild.id);
		let voiceConnection = guildInstance?.voiceConnection; 
		if (!voiceConnection) {
			voiceConnection = joinVoiceChannel({
				channelId: currVoiceChannel.id,
				guildId: currVoiceChannel.guild.id,
				// @ts-ignore
				adapterCreator: currVoiceChannel.guild.voiceAdapterCreator,
			});
			if (!voiceConnection) return null;
		} 
		return voiceConnection;
	} catch (error: any) {
		console.trace("getVoiceConnection error:", error);
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
		const guildInstance: ActiveGuildInstance = getGuildInstance(guildId); 
		const player = guildInstance?.player; 
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

