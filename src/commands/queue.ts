import {
	CommandInteraction,
	GuildMember,
	SlashCommandBuilder
} from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { queues } from "../connections";

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
		let queueStr = "";

		if (queue.length == 0) {
			queueStr = "Non c'è nessuna canzone in coda.";
		} else {
			queueStr = "Canzoni in coda:";
			let cont = 0;
			for (const songInfo of queue) {
				queueStr += `\n${++cont}. ${songInfo.title} [${songInfo.length}]`;
			}
		}

		interaction.reply({
			content: queueStr
		});
	} catch (error) {
		console.trace("[QUEUE] Error:", error);
		await interaction.reply({
			content: `Errore: ${error}`
		});
	}
}
