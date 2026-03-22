require("console-stamp")(console, { format: ":date(HH:MM:ss.l)" });
import { guildSetup, loadGuilds, saveGuilds } from "./handlers/guilds";
import { COOKIES_PATH, GUILDS_LIST_PATH, ICONS } from "./constants";
import { destroyGuildInstance } from "./handlers/connections";
import { getVoiceConnection } from "@discordjs/voice";
import { handlePlayerPause } from "./handlers/music";
import { existsSync, writeFileSync } from "fs";
import { SavedGuild } from "./types/guilds";
import { commands } from "./commands";
import { config } from "./config";
import {
	ActionRowBuilder,
	ButtonBuilder,
	Client,
	ChatInputCommandInteraction 
} from "discord.js";

const client = new Client({
	intents: ["Guilds", "GuildMessages", "GuildVoiceStates"],
});

client.once("clientReady", async () => {
	// Check if there is a cookies file, if not throw an error 
	if (!existsSync(COOKIES_PATH)) {
		console.error("[ERROR] Missing cookies file in data folder.");
		client.destroy();
		process.exit(1);
	}

	if (!existsSync(GUILDS_LIST_PATH)) {
		writeFileSync(GUILDS_LIST_PATH, "[]");
	}
	const guildsArray: SavedGuild[] = loadGuilds();

	// Guilds setup
	console.log("[STARTUP] Setting up guilds...");
	const promisesArray = guildsArray.map(async (guild) => {
		guildSetup({ guildObj: guild, client });
	});
	await Promise.all(promisesArray);

	console.log("Bot ready.");
});

client.on("guildCreate", async (guild) => {
	// Add the server to the list (its ID will be used to refresh commands)
	const guildsArray: SavedGuild[] = loadGuilds();
	const newGuild = { id: guild.id, status: "", guildData: {} };
	guildsArray.push(newGuild);
	saveGuilds(guildsArray);
	guildSetup({ guildObj: newGuild });
});

client.on("voiceStateUpdate", async (oldState, newState) => {
	const guildId = oldState.guild.id;
	const myConn = getVoiceConnection(guildId);
	const remainingHumans = oldState.channel?.members.filter((member) => !member.user.bot).size ?? 0;

	if (
		myConn &&
			myConn.joinConfig.channelId == oldState.channelId &&
			myConn.joinConfig.channelId != newState.channelId &&
			remainingHumans == 0
	) {
		destroyGuildInstance(guildId);
		console.log("[VOICE] Disconnected from channel because everyone left.");
	}
});

client.on("interactionCreate", async (interaction) => {
	// Slash commands handlers
	try {
		if (interaction.isCommand()) {
			const { commandName } = interaction;
			if (commands[commandName as keyof typeof commands]) {
				commands[commandName as keyof typeof commands].execute(interaction as ChatInputCommandInteraction);
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
					destroyGuildInstance(guildId);
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

