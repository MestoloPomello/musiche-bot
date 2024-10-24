import {
    CommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from "discord.js";
import {
    addToQueue,
    playersMap,
    SongInfo
} from '../connections';
import { startNextQueuedSong } from "../music-player";

export const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Metti in coda la canzone da riprodurre.')
    .addStringOption(option => option.setName('url').setDescription('URL del video di YouTube').setRequired(true));

export async function execute(interaction: CommandInteraction) {
    try {
		// @ts-ignore
        const url = interaction.options.getString('url');
        if (!url) throw "Inserisci un URL valido!";

		const guildId: string | undefined = (interaction.member! as GuildMember)?.voice?.channel?.guild?.id;
		if (!guildId) {
			throw "questo comando non funziona in privato.";
		}

		const song: SongInfo = await addToQueue(guildId, url, false);

		// If the music wasn't running
		if (!playersMap.has(guildId)) {
			startNextQueuedSong(interaction);
		} else {
			await interaction.reply({
				content: `Aggiunto alla coda: ${song.title} [${song.length}] - ${url}`
			});
		}
    } catch (error) {
        console.trace("[PLAY] Error:", error);
        await interaction.reply({
            content: `Errore: ${error}`
        });
    }
}
