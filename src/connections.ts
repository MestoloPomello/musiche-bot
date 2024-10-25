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
	lengthSeconds: number
}


export const guildInstances = new Map<string, ActiveGuildInstance>();

/**
 *	Get a guild instance by its ID. If it doesn't exist, the function creates it.
 */
export function getGuildInstance(
	guildId: string,
	withCreation: boolean = false
): ActiveGuildInstance | undefined {
	let guildInstance = guildInstances.get(guildId);
	if (withCreation && !guildInstance) {
		guildInstance = new ActiveGuildInstance();	
		guildInstances.set(guildId, guildInstance);
		console.trace(`[CONN] New instance created for guild ${guildId}. Total instances: ${guildInstances.size}`);
	}
	return guildInstance;
}


/**
 *	Destroys a GuildInstance by guildId.
 */
export function destroyGuildInstance(
	guildId: string
): void {
	try {
		let guildInstance = guildInstances.get(guildId);
		if (!guildInstance) return;
		guildInstance.destroyVoiceConnection();
		guildInstances.delete(guildId);
		console.log(`[CONN] Instance deleted for guild ${guildId}. Total instances: ${guildInstances.size}`);
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
	const guildInstance: ActiveGuildInstance = getGuildInstance(guildId, true)!; 

	const newSong: SongInfo = {
		title: fullSongInfo.videoDetails.title,
		url: url,
		length: formatDuration(+fullSongInfo.videoDetails.lengthSeconds),
		lengthSeconds: +fullSongInfo.videoDetails.lengthSeconds
	};

	if (asFirst) {
		guildInstance.queue.unshift(newSong);
	} else {
		guildInstance.queue.push(newSong);
	}

	return newSong;
}


export function getVoiceConnection(
	currVoiceChannel: VoiceBasedChannel
): VoiceConnection | null {
	try {
		const guildInstance: ActiveGuildInstance = getGuildInstance(currVoiceChannel.guild.id, true)!;
		if (!guildInstance.voiceConnection) {
			guildInstance.voiceConnection = joinVoiceChannel({
				channelId: currVoiceChannel.id,
				guildId: currVoiceChannel.guild.id,
				// @ts-ignore
				adapterCreator: currVoiceChannel.guild.voiceAdapterCreator,
			});
			if (!guildInstance.voiceConnection) return null;
		} 
		return guildInstance.voiceConnection;
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

