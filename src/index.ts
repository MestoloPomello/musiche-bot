require("console-stamp")(console, { format: ":date(HH:MM:ss.l)" });
import { ActionRowBuilder, ButtonBuilder, Client } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import { deployCommands } from "./deploy-commands";
import { VoiceConnection } from "@discordjs/voice";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { GUILDS_LIST_PATH, ICONS } from "./constants";
import {
    destroyPlayer,
	destroyVoiceConnection,
	handlePlayerPause,
	openedVoiceConnections
} from "./connections";

const client = new Client({
	intents: ["Guilds", "GuildMessages", "GuildVoiceStates"],
});

client.once("ready", async () => {
	// Create the guilds list file is it doesn't exist
	if (!existsSync(GUILDS_LIST_PATH)) {
		writeFileSync(GUILDS_LIST_PATH, "[]");
	}
	const guildsArray: string[] = JSON.parse(readFileSync(GUILDS_LIST_PATH, { encoding: "utf8" }));
	await deployCommands(guildsArray);
	console.log("MusicheBot ready.");
});

client.on("guildCreate", async (guild) => {
	// Add the server to the list (its ID will be used to refresh commands)
	const guildsArray: string[] = JSON.parse(readFileSync(GUILDS_LIST_PATH, { encoding: "utf8" }));
	guildsArray.push(guild.id);
	writeFileSync(GUILDS_LIST_PATH, JSON.stringify(guildsArray), { flag: "w" });
});

client.on("voiceStateUpdate", async (oldState, newState) => {
	const guildId: string = oldState.guild.id;
	const voiceConnection: VoiceConnection | undefined = openedVoiceConnections.get(guildId); 

	// If everyone leaves, quit the channel
	if (
		voiceConnection &&
		voiceConnection.joinConfig.channelId == oldState.channelId &&
		voiceConnection.joinConfig.channelId != newState.channelId &&
		oldState.channel?.members.size == 1
	) {
		destroyVoiceConnection(guildId);
		console.log("[VOICE] Disconnected from channel because everyone left.");
	}
});

client.on("interactionCreate", async (interaction) => {
	// Slash commands handlers
	try {
		if (interaction.isCommand()) {
			const { commandName } = interaction;
			if (commands[commandName as keyof typeof commands]) {
				commands[commandName as keyof typeof commands].execute(interaction);
			}
		} else if (interaction.isButton()) {
			const guildId = interaction.guildId!;
			switch (interaction.customId) {
				case "pauseBtn":
					const isPaused = handlePlayerPause(guildId);
					const row = interaction.message.components[0] as unknown as ActionRowBuilder<ButtonBuilder>;
					const buttons = row.components as ButtonBuilder[];
					// @ts-ignore
					const pauseBtn = buttons.find(b => b.data.custom_id === "pauseBtn");
					if (isPaused) {
						// @ts-ignore
						pauseBtn.data.label = ICONS.play;
					} else {
						// @ts-ignore
						pauseBtn.data.label = ICONS.pause;
					}

					// Update the whole action row 
					interaction.update({
						components: [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)]
					});
					break;
				//case "stopBtn":
				//	destroyPlayer(guildId);
				//	interaction.deferUpdate();
				//	break;
				case "disconnectBtn":
					destroyVoiceConnection(guildId);
					interaction.update({
						components: []
					});
					break;
			}
		}
	} catch (error) {
		console.trace("[INTERACTION] Error:", error);
	}
});

client.login(config.DISCORD_TOKEN);

