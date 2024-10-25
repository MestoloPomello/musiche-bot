import {
	CommandInteraction,
	GuildMember,
	SlashCommandBuilder
} from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { getGuildInstance } from "../connections";
import { ActiveGuildInstance } from "../classes/ActiveGuildInstance";

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
		if (!voiceConnection) throw "non sono in un canale vocale, cazzo!";

		const guildInstance: ActiveGuildInstance = getGuildInstance(guildId, true)!;
		
		const nowPlayingStr = `In esecuzione: ${guildInstance.nowPlaying?.title} [${guildInstance.nowPlaying?.length}]`;

		let queueStr = "";

		if (guildInstance.queue.length == 0) {
			queueStr = `Non c'è nessuna canzone in coda.`;
		} else {
			queueStr = `Canzoni in coda:`;
			let cont = 0;
			for (const songInfo of guildInstance.queue) {
				queueStr += `\n${++cont}. ${songInfo.title} [${songInfo.length}]`;
			}
		}

		interaction.reply({
			content: nowPlayingStr + "\n---\n" + queueStr
		});
	} catch (error) {
		console.trace("[QUEUE] Error:", error);
		await interaction.reply({
			content: `Errore: ${error}`
		});
	}
}
