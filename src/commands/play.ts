import {
    CommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from "discord.js";
import {
    playersMap,
    queues
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

		const queue: string[] = queues.get(guildId) ?? [];
		queue.push(url);
		queues.set(guildId, queue);

		// If the queue was empty
		if (!playersMap.has(guildId)) {
			startNextQueuedSong(interaction);
		} else {
			await interaction.reply({
				content: `Aggiunto alla coda: ${url}`
			});
		}
    } catch (error) {
        console.trace("[PLAY] Error:", error);
        await interaction.reply({
            content: `Errore: ${error}`
        });
    }
}
