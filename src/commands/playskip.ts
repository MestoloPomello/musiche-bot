import {
    CommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from "discord.js";
import { queues } from '../connections';
import { startNextQueuedSong } from '../music-player';

export const data = new SlashCommandBuilder()
    .setName('playskip')
    .setDescription('Avvia direttamente l\'URL inserito')
    .addStringOption(option => option.setName('url').setDescription('URL del video di YouTube').setRequired(true));

export async function execute(interaction: CommandInteraction) {
    try {
		// @ts-ignore
        const url = interaction.options.getString('url');
        if (!url) throw "Inserisci un URL valido!";

		const guildId = (interaction.member! as GuildMember)?.voice?.channel?.guild?.id;
		if (!guildId) {
			throw "NO_GUILD";
		}

		const queue = queues.get(guildId) ?? [];
		queue.unshift(url);

		startNextQueuedSong(interaction);
    } catch (error) {
        console.trace("[PLAYSKIP] Error:", error);
        await interaction.reply({
            content: `Errore: ${error}`
        });
    }
}
