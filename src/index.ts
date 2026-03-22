require("console-stamp")(console, { format: ":date(HH:MM:ss.l)" });
import { ChatInputCommandInteraction, Client } from "discord.js";
import { guildSetup, loadGuilds, saveGuilds } from "./handlers/guilds";
import { existsSync, writeFileSync } from "fs";
import { destroyGuildInstance } from "./handlers/connections";
import { getVoiceConnection } from "@discordjs/voice";
import { GUILDS_LIST_PATH } from "./constants";
import { SavedGuild } from "./types/guilds";
import { logger } from "./classes/Logger";
import { commands } from "./commands";
import { config } from "./config";

const client = new Client({
	intents: ["Guilds", "GuildMessages", "GuildVoiceStates"],
});

client.once("clientReady", async () => {

	if (!existsSync(GUILDS_LIST_PATH)) {
		writeFileSync(GUILDS_LIST_PATH, "[]");
	}
	const guildsArray: SavedGuild[] = loadGuilds();

	// Guilds setup
	logger.log("[STARTUP] Setting up guilds...");
	const promisesArray = guildsArray.map(async (guild) => {
		guildSetup({ guildObj: guild, client });
	});
	await Promise.all(promisesArray);

	logger.log("Bot ready.");
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
		logger.log("[VOICE] Disconnected from channel because everyone left.");
	}
});

client.on("interactionCreate", async (interaction) => {
	// Slash commands handlers
	if (interaction.isCommand()) {
		const { commandName } = interaction;
		if (commands[commandName as keyof typeof commands]) {
			commands[commandName as keyof typeof commands].execute(interaction as ChatInputCommandInteraction);
		}
	}
});

client.login(config.DISCORD_TOKEN);
