import {
    CommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from "discord.js";
import { startNextQueuedSong } from '../music-player';

export const data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Inserisce il brano inserito in coda')

export async function execute(interaction: CommandInteraction) {
    try {
		const guildId = (interaction.member! as GuildMember)?.voice?.channel?.guild?.id;
		if (!guildId) {
			throw "questo comando non funziona in privato.";
		}

		startNextQueuedSong(interaction);
    } catch (error) {
        console.trace("[SKIP] Error:", error);
        await interaction.reply({
            content: `Errore: ${error}`
        });
    }
}
