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
	getVoiceConnection,
	openedVoiceConnections,
	queues
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
	const queue: string[] = queues.get(guildId) ?? [];	
	if (queue.length == 0) {
		return;
	}
	const url: string = queue.shift()!;
	queues.set(guildId, queue);

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
			url,
			player,
			guildId
		);
	} else {
		voiceConnection.on(VoiceConnectionStatus.Ready, async () => {
			startPlayingMusic(
				interaction,
				voiceConnection,
				url,
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
		content: `Sto riproducendo il brano: ${url}`,
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
	url: string,
	player: AudioPlayer,
	guildId: string
) {
	const stream = ytdl(url, {
		filter: "audioonly"
	});

	const resource = createAudioResource(stream);
	player.play(resource);
	voiceConnection.subscribe(player);

	player.on(AudioPlayerStatus.Playing, () => {
		console.log(`[PLAY] Guild: ${guildId} | URL: ${url}`);

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
	});
}
