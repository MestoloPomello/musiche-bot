import {
    CommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from "discord.js";
import {
    addToQueue,
    getGuildInstance,
    SongInfo
} from '../connections';
import { startNextQueuedSong } from "../music-player";
import { ActiveGuildInstance } from "../classes/ActiveGuildInstance";
import { getUrl } from "../utils";

export const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Metti in coda la canzone da riprodurre.')
    .addStringOption(option => option.setName('query').setDescription('URL del video di YouTube o testo da cercare').setRequired(true));

export async function execute(interaction: CommandInteraction) {
    try {
		// @ts-ignore
        const url = await getUrl(interaction.options.getString('query'));
        if (!url) throw "Inserisci un URL valido!";

		const guildId: string | undefined = (interaction.member! as GuildMember)?.voice?.channel?.guild?.id;
		if (!guildId) {
			throw "questo comando non funziona in privato.";
		}

		const song: SongInfo = await addToQueue(guildId, url, false);
		const guildInstance: ActiveGuildInstance = getGuildInstance(guildId, true)!; 

		console.log(`[PLAY] Guild: ${guildId} | Queued song: ${song.title}`);

		// If the music wasn't running
		if (!guildInstance?.player) {
			startNextQueuedSong(interaction);
		} else {
			await interaction.reply({
				content: `Aggiunto alla coda: ${song.title} [${song.length}]`
			});
		}
    } catch (error) {
        console.trace("[PLAY] Error:", error);
        await interaction.reply({
            content: `Errore: ${error}`
        });
    }
}
