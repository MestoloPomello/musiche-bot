import ytdl = require('@distube/ytdl-core');
import { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus, AudioPlayerStatus } from '@discordjs/voice';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    CommandInteraction,
    GuildMember,
    SlashCommandBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Avvia le musiche nel canale dove ti trovi.')
    .addStringOption(option => option.setName('url').setDescription('URL o nome del video di YouTube').setRequired(true));

export async function execute(interaction: CommandInteraction) {
    try {
        const currVoiceChannel = (interaction.member! as GuildMember)?.voice?.channel;
        if (!currVoiceChannel) throw "non sei in un canale vocale, cazzo!";

        const url = interaction.options.getString('url');
        if (!url) throw "Inserisci un URL valido!";

        const voiceConnection = joinVoiceChannel({
            channelId: currVoiceChannel.id,
            guildId: currVoiceChannel.guild.id,
            adapterCreator: currVoiceChannel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();

        voiceConnection.on(VoiceConnectionStatus.Ready, async () => {
            const stream = ytdl(url, {
                filter: 'audioonly',
                //quality: 'lowestaudio',  // Imposta la qualità più bassa per verificare il funzionamento
                //dlChunkSize: 0, // Scarica il file a chunk
            });

            const resource = createAudioResource(stream);
            player.play(resource);
            voiceConnection.subscribe(player);

            player.on(AudioPlayerStatus.Playing, () => {
                console.log(`Sto suonando: ${url}`);
            });

            player.on('error', error => {
                console.error(`Errore nel player: ${error.message}`);
            });
        });

        const disconnectBtn = new ButtonBuilder()
            .setCustomId('disconnectBtn')
            .setLabel('Disconnetti')
            .setStyle(ButtonStyle.Danger);

        const replyRow = new ActionRowBuilder<ButtonBuilder>().addComponents(disconnectBtn);

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

