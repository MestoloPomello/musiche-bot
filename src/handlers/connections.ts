import { joinVoiceChannel, VoiceConnection } from "@discordjs/voice";
import { ActiveGuildInstance } from "../classes/ActiveGuildInstance";
import { VoiceBasedChannel } from "discord.js";

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
        console.log(`[CONN] New instance created for guild ${guildId}. Total instances: ${guildInstances.size}`);
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
        console.trace("[destroyGuildInstance] Error", error);
    }
}

/**
 *	Retrieves the voice connection for the given voice channel. If the connection doesn't exist, creates it.
 * @param {VoiceBasedChannel} currVoiceChannel - The voice channel from which to retrieve the connection.
 * @returns {VoiceConnection | null} The voice connection if it exists, null otherwise.
 */
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