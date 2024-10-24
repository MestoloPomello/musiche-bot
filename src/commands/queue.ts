import {
	CommandInteraction,
	GuildMember,
	SlashCommandBuilder
} from "discord.js";
import ytdl from "@distube/ytdl-core";

import { getVoiceConnection } from "@discordjs/voice";
import { queues } from "../connections";
import { formatDuration } from "../utils";

export const data = new SlashCommandBuilder()
	.setName("queue")
	.setDescription("Mostra la coda attuale.");

export async function execute(interaction: CommandInteraction) {
	try {
		const guildId: string | undefined = (interaction.member! as GuildMember)?.voice?.channel?.guild?.id;
		if (!guildId) {
			throw "questo comando non funziona in privato.";
		}

		const voiceConnection = getVoiceConnection(guildId);
		if (!voiceConnection) throw "non sono in un canale vocale.";

		const queue = queues.get(guildId) ?? [];
		let queueStr = "Canzoni in coda:";
		const promisesArr = []; 
		for (const url of queue) {
			promisesArr.push(ytdl.getBasicInfo(url));
		}

		const queueInfoArr = await Promise.all(promisesArr);
		let cont = 0;
		for (const songInfo of queueInfoArr) {
			queueStr += `\n${++cont}. ${songInfo.videoDetails.title} [${formatDuration(+songInfo.videoDetails.lengthSeconds)}]`;
		}

		interaction.reply({
			content: queueStr
		});
	} catch (error) {
		console.trace("[LEAVE] Error:", error);
		await interaction.reply({
			content: `Errore: ${error}`
		});
	}
}
