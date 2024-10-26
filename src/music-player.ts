import {
    ActionRowBuilder,
    ButtonBuilder,
	ButtonStyle,
	CommandInteraction,
	GuildMember
} from "discord.js";
import {
    destroyGuildInstance,
    getGuildInstance,
	getVoiceConnection,
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
import { ActiveGuildInstance } from "./classes/ActiveGuildInstance";
import { getAgent } from "./utils";


export async function startNextQueuedSong(
	interaction: CommandInteraction,
) {
	const currVoiceChannel = (interaction.member! as GuildMember)?.voice?.channel;
	if (!currVoiceChannel) throw "Non sei in un canale vocale, cazzo!";

	const guildId: string = currVoiceChannel.guild.id;
	const guildInstance: ActiveGuildInstance = getGuildInstance(guildId, true)!; 
	const nextSong: SongInfo | null = guildInstance.getNextSongInQueue();
	if (!nextSong) {
		interaction.reply({
			content: "Nessun brano in coda.",
			components: []
		});
		return;
	}

	const isVCexisting: boolean = guildInstance.voiceConnection != null; 
	const voiceConnection: VoiceConnection | null = getVoiceConnection(currVoiceChannel); 
	if (!voiceConnection) throw "Errore nello stabilire una connessione al canale vocale.";
	//voiceConnection.removeAllListeners();

	const player: AudioPlayer = guildInstance.getNewPlayer(); 
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
		filter: "audioonly",
		agent: getAgent()
	});

	const guildInstance: ActiveGuildInstance = getGuildInstance(guildId, true)!;
	const resource = createAudioResource(stream);
	player.play(resource);
	voiceConnection.subscribe(player);
	
	// Variabled used to resume in case of "aborted" player error
	let playbackStartTime = Date.now();
	let elapsedTime = 0;

	player.on(AudioPlayerStatus.Playing, () => {
		console.log(`[PLAY] Guild: ${guildId} | Playing song: ${song.title}`);

		// Reset the timer if a new song starts
		if (guildInstance.disconnectTimeout) {
			clearTimeout(guildInstance.disconnectTimeout);
			guildInstance.disconnectTimeout = null;
		}

		playbackStartTime = Date.now();
	});

	player.on(AudioPlayerStatus.Idle, () => {
		if (guildInstance.queue.length > 0) {
			startNextQueuedSong(
				interaction,
			);
			return;
		}
		guildInstance.nowPlaying = null;

		const timeout = setTimeout(() => {
			destroyGuildInstance(guildId);
			console.log(`[DISCONNECT] After timeout in guild ${guildId}.`);
		}, DISCONNECTION_TIMEOUT);
		guildInstance.disconnectTimeout = timeout;
	});

	player.on('error', error => {
	 	console.error(`[ERROR] Guild: ${guildId} | Player error: ${error.message}`);

		if (error.message === "aborted") {
			const currentTime = Date.now();
			elapsedTime += Math.floor((currentTime - song.lengthSeconds) / 1000);
		}
		try {
			const newStream = ytdl(`${song.url}&t=${elapsedTime}s`, {
				filter: 'audioonly',
				agent: getAgent()
			});
			const newResource = createAudioResource(newStream);
			player.play(newResource);
			console.log(`[PLAY] Guild: ${guildId} | Resumed from ${elapsedTime} seconds: ${song.url}`);
		} catch (retryError) {
			console.error(`[ERROR] Guild: ${guildId} | While trying to resume the stream: ${retryError}`);
		}
	});
}


