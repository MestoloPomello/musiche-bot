import {
    CommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from "discord.js";
import { addToQueue } from '../connections';
import { startNextQueuedSong } from '../music-player';

export const data = new SlashCommandBuilder()
    .setName('playskip')
    .setDescription('Avvia direttamente l\'URL inserito')
    .addStringOption(option => option.setName('query').setDescription('URL del video di YouTube o testo da cercare').setRequired(true));

export async function execute(interaction: CommandInteraction) {
    try {
		// @ts-ignore
        const url = await getUrl(interaction.options.getString('query'));
        if (!url) throw "Inserisci un URL valido!";

		const guildId = (interaction.member! as GuildMember)?.voice?.channel?.guild?.id;
		if (!guildId) {
			throw "questo comando non funziona in privato.";
		}

		addToQueue(guildId, url, true);
		startNextQueuedSong(interaction);
    } catch (error) {
        console.trace("[PLAYSKIP] Error:", error);
        await interaction.reply({
            content: `Errore: ${error}`
        });
    }
}
