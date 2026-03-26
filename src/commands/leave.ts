import {
	CommandInteraction,
	SlashCommandBuilder
} from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { replyOrFollowUp } from "../handlers/interactions";
import { destroyGuildInstance } from "../handlers/connections";

export const data = new SlashCommandBuilder()
	.setName("leave")
	.setDescription("Lascia il canale attuale.");

export async function execute(interaction: CommandInteraction) {
	try {
		if (!interaction.guildId) throw "questo comando non funziona in privato.";
		if (!getVoiceConnection(interaction.guildId)) throw "non sono in un canale vocale.";

		destroyGuildInstance(interaction.guildId);

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
