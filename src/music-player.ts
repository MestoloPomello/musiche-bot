import {
    ActionRowBuilder,
    ButtonBuilder,
	ButtonStyle,
	CommandInteraction,
	GuildMember
} from "discord.js";
import {
	disconnectTimeouts,
	getNewPlayer,
	getNextSongInQueue,
	getVoiceConnection,
	openedVoiceConnections,
	queues,
    SongInfo
} from "./connections";
import {
	AudioPlayer,
	AudioPlayerStatus,
	createAudioResource,
	VoiceConnection,
    VoiceConnectionStatus
} from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
import { DISCONNECTION_TIMEOUT, ICONS } from "./constants";


export async function startNextQueuedSong(
	interaction: CommandInteraction,
) {
	const currVoiceChannel = (interaction.member! as GuildMember)?.voice?.channel;
	if (!currVoiceChannel) throw "Non sei in un canale vocale, cazzo!";

	const guildId: string = currVoiceChannel.guild.id;
	const nextSong: SongInfo | null = getNextSongInQueue(guildId);
	if (!nextSong) return;

	const isVCexisting: boolean = openedVoiceConnections.has(guildId); 
	const voiceConnection: VoiceConnection | null = getVoiceConnection(currVoiceChannel); 
	if (!voiceConnection) throw "Errore nello stabilire una connessione al canale vocale.";
	voiceConnection.removeAllListeners();

	const player: AudioPlayer | null = getNewPlayer(guildId); 
	if (!player) throw "Errore nella creazione di un player audio.";

	if (isVCexisting) {
		startPlayingMusic(
			interaction,
			voiceConnection,
			nextSong,
			player,
			guildId
		);
	} else {
		voiceConnection.on(VoiceConnectionStatus.Ready, async () => {
			startPlayingMusic(
				interaction,
				voiceConnection,
				nextSong,
				player,
				guildId
			);
		});
	}	

	const pauseBtn = new ButtonBuilder()
		.setCustomId("pauseBtn")
		.setLabel(ICONS.pause)
		.setStyle(ButtonStyle.Primary);

	//const stopBtn = new ButtonBuilder()
	//	.setCustomId("stopBtn")
	//	.setLabel(ICONS.stop)
	//	.setStyle(ButtonStyle.Primary);

	const disconnectBtn = new ButtonBuilder()
		.setCustomId("disconnectBtn")
		.setLabel("Disconnetti")
		.setStyle(ButtonStyle.Danger);

	const replyRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
		pauseBtn,
		//stopBtn, // ToDo - temporarily hidden
		disconnectBtn
	]);

	const interactionResponse = {
		content: `Sto riproducendo il brano: ${nextSong.title} [${nextSong.length}] - ${nextSong.url}`,
		components: [replyRow],
	};

	try {
		await interaction.reply(interactionResponse);
	} catch (e) {
		await interaction.followUp(interactionResponse);
	}
}


export function startPlayingMusic(
	interaction: CommandInteraction,
	voiceConnection: VoiceConnection, 
	song: SongInfo,
	player: AudioPlayer,
	guildId: string
) {
	const stream = ytdl(song.url, {
		filter: "audioonly"
	});

	const resource = createAudioResource(stream);
	player.play(resource);
	voiceConnection.subscribe(player);

	player.on(AudioPlayerStatus.Playing, () => {
		console.log(`[PLAY] Guild: ${guildId} | Song: ${song.title}`);

		// Reset the timer if a new song starts
		if (disconnectTimeouts.has(guildId)) {
			clearTimeout(disconnectTimeouts.get(guildId));
			disconnectTimeouts.delete(guildId);
		}
	});

	player.on(AudioPlayerStatus.Idle, () => {
		const queue = queues.get(guildId) ?? [];
		if (queue.length > 0) {
			startNextQueuedSong(
				interaction,
			);
			return;
		}

		const timeout = setTimeout(() => {
			voiceConnection?.destroy();
			openedVoiceConnections.delete(guildId);
			console.log(`[PLAY] Disconnected after timeout in guild ${guildId}.`);
		}, DISCONNECTION_TIMEOUT);
		disconnectTimeouts.set(guildId, timeout);
	});

	player.on('error', error => {
	 	console.trace(`Errore nel player: ${error.message}`);

		try {
            const newStream = await ytdl(`${url}&t=${elapsedTime}s`, { filter: 'audioonly' });
            const newResource = createAudioResource(newStream);
            player.play(newResource);
            console.log(`Ripresa la riproduzione da ${elapsedTime} secondi: ${url}`);
        } catch (retryError) {
            console.error(`Errore nel tentativo di ripresa dello stream: ${retryError.message}`);
        }
	});
}
