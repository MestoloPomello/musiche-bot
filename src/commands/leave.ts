import {
	CommandInteraction,
	SlashCommandBuilder
} from "discord.js";

import { getVoiceConnection } from "@discordjs/voice";
import { replyOrFollowUp } from "../handlers/interactions";

export const data = new SlashCommandBuilder()
	.setName("leave")
	.setDescription("Lascia il canale attuale.");

export async function execute(interaction: CommandInteraction) {
	try {
		if (!interaction.guildId) throw "questo comando non funziona in privato.";

		const voiceConnection = getVoiceConnection(interaction.guildId);
		if (!voiceConnection) throw "non sono in un canale vocale.";
		voiceConnection.destroy();

		replyOrFollowUp(interaction, {
			content: `Ho abbandonato il canale vocale.`
		});
	} catch (error) {
		console.trace("[LEAVE] Error:", error);
		await replyOrFollowUp(interaction, {
			content: `Errore: ${error}`
		});
	}
}
