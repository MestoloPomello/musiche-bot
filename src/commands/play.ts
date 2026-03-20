import { ActiveGuildInstance } from "../classes/ActiveGuildInstance";
import { AudioPlayerStatus } from "@discordjs/voice";
import { getGuildInstance } from "../handlers/connections";
import { replyOrFollowUp } from "../handlers/interactions";
import { startNextQueuedSong } from "../handlers/music";
import { addToQueue } from "../handlers/music";
import { SongInfo } from "../types/music";
import { getUrl } from "../utils";
import {
    CommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Metti in coda la canzone da riprodurre.')
    .addStringOption(option => option.setName('query').setDescription('URL del video di YouTube o testo da cercare').setRequired(true));

export async function execute(interaction: CommandInteraction) {
    try {
		// @ts-ignore
        const url = await getUrl(interaction.options.getString('query'));
        if (!url) throw "Ma che cazzo di URL è!";

		const guildId: string | undefined = (interaction.member! as GuildMember)?.voice?.channel?.guild?.id;
		if (!guildId) {
			throw "questo comando non funziona in privato.";
		}

		await replyOrFollowUp(interaction, {
			content: `Sto recuperando la canzone...`
		});

		const song: SongInfo = await addToQueue(guildId, url, false);
		const guildInstance: ActiveGuildInstance = getGuildInstance(guildId, true)!; 

		console.log(`[PLAY] Guild: ${guildId} | Queued song: ${song.title}`);

		const isPlayerInactive =
			!guildInstance?.player ||
			guildInstance.player.state.status === AudioPlayerStatus.Idle;

		if (isPlayerInactive) {
			startNextQueuedSong(interaction);
		} else {
			await replyOrFollowUp(interaction, {
				content: `Aggiunto alla coda: ${song.title} [${song.length}]`
			});
		}
    } catch (error) {
        console.trace("[PLAY] Error:", error);
        await replyOrFollowUp(interaction, {
            content: `Errore: ${error}`
        });
    }
}
