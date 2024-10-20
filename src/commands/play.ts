import ytdl = require('@distube/ytdl-core');
import {
	createAudioResource,
	VoiceConnectionStatus,
	AudioPlayerStatus
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
	disconnectTimeouts,
	getPlayer,
	getVoiceConnection,
	openedVoiceConnections
} from '../connections';
import { DISCONNECTION_TIMEOUT } from '../constants';

export const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Avvia le musiche nel canale dove ti trovi.')
    .addStringOption(option => option.setName('url').setDescription('URL o nome del video di YouTube').setRequired(true));

export async function execute(interaction: CommandInteraction) {
	console.log("ricevuto comando play")
    try {
        const currVoiceChannel = (interaction.member! as GuildMember)?.voice?.channel;
        if (!currVoiceChannel) throw "non sei in un canale vocale, cazzo!";

		const guildId = currVoiceChannel.guild.id;

		// @ts-ignore
        const url = interaction.options.getString('url');
        if (!url) throw "Inserisci un URL valido!";

        const voiceConnection = getVoiceConnection(currVoiceChannel); 
		if (!voiceConnection) throw "Errore nello stabilire una connessione al canale vocale.";

        const player = getPlayer(guildId); 
		if (!player) throw "Errore nella creazione di un player audio.";

        voiceConnection.on(VoiceConnectionStatus.Ready, async () => {
            const stream = ytdl(url, {
                filter: 'audioonly'
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
                console.error(`Errore nel player: ${error.message}`);
            });
        });

		const pauseBtn = new ButtonBuilder()
			.setCustomId("pauseBtn")
			.setLabel("\u{23F8}")
			.setStyle(ButtonStyle.Primary);

		const stopBtn = new ButtonBuilder()
			.setCustomId("stopBtn")
			.setLabel("\u{23F9}")
			.setStyle(ButtonStyle.Primary);

        const disconnectBtn = new ButtonBuilder()
            .setCustomId("disconnectBtn")
            .setLabel("Disconnetti")
            .setStyle(ButtonStyle.Danger);

        const replyRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
			pauseBtn,
			stopBtn,
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

