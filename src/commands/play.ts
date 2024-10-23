import ytdl = require('@distube/ytdl-core');
import {
	createAudioResource,
	VoiceConnectionStatus,
	AudioPlayerStatus,
    AudioPlayer,
    VoiceConnection
} from '@discordjs/voice';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from "discord.js";
import {
    destroyPlayer,
	disconnectTimeouts,
	getNewPlayer,
	getVoiceConnection,
	openedVoiceConnections
} from '../connections';
import { DISCONNECTION_TIMEOUT, ICONS } from '../constants';

export const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Avvia le musiche nel canale dove ti trovi.')
    .addStringOption(option => option.setName('url').setDescription('URL del video di YouTube').setRequired(true));

export async function execute(interaction: CommandInteraction) {
    try {
        const currVoiceChannel = (interaction.member! as GuildMember)?.voice?.channel;
        if (!currVoiceChannel) throw "Non sei in un canale vocale, cazzo!";

		const guildId = currVoiceChannel.guild.id;

		// @ts-ignore
        const url = interaction.options.getString('url');
        if (!url) throw "Inserisci un URL valido!";

		// ToDo - fix music replacement
	
		const isVCexisting = openedVoiceConnections.has(guildId); 
        const voiceConnection = getVoiceConnection(currVoiceChannel); 
		if (!voiceConnection) throw "Errore nello stabilire una connessione al canale vocale.";
		voiceConnection.removeAllListeners();

        const player = getNewPlayer(guildId); 
		if (!player) throw "Errore nella creazione di un player audio.";

		if (isVCexisting) {
			startPlayingMusic(
				voiceConnection,
				url,
				player,
				guildId
			);
		} else {
			voiceConnection.on(VoiceConnectionStatus.Ready, async () => {
				startPlayingMusic(
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

        await interaction.reply({
            content: `Sto riproducendo il brano: ${url}`,
            components: [replyRow],
        });
    } catch (error) {
        console.error("[CMD] Join error:", error);
        await interaction.reply({
            content: `Errore: ${error}`
        });
    }
}


function startPlayingMusic(
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
