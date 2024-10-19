require("console-stamp")(console, { format: ":date(HH:MM:ss.l)" });
import { Client, GuildDefaultMessageNotifications } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import { deployCommands } from "./deploy-commands";
import { getVoiceConnection } from "@discordjs/voice";
import fs, { readFileSync, writeFileSync } from "fs";
import { GUILDS_LIST_PATH } from "./constants";

const client = new Client({
	intents: ["Guilds", "GuildMessages", "GuildVoiceStates"],
});

client.once("ready", async () => {
	// Create the guilds list file is it doesn't exist
	if (!fs.existsSync(GUILDS_LIST_PATH)) {
		fs.writeFileSync(GUILDS_LIST_PATH, "[]");
	}
	const guildsArray = JSON.parse(readFileSync(GUILDS_LIST_PATH, { encoding: "utf8" }));
	await deployCommands(guildsArray);
	console.log("Musiche ready.");
});

client.on("guildCreate", async (guild) => {
	// Add the server to the list (its ID will be used to refresh commands)
	const guildsArray = JSON.parse(readFileSync(GUILDS_LIST_PATH, { encoding: "utf8" }));
	guildsArray.push(guild.id);
	writeFileSync(GUILDS_LIST_PATH, JSON.stringify(guildsArray), { flag: "w" });
});

client.on("voiceStateUpdate", async (oldState, newState) => {
	const guildId = oldState.guild.id;
	const myConn = getVoiceConnection(guildId);

	if (
		myConn &&
			myConn.joinConfig.channelId == oldState.channelId &&
			myConn.joinConfig.channelId != newState.channelId &&
			oldState.channel?.members.size == 1
	) {
		myConn.destroy();
		console.log("[VOICE] Disconnected from channel because everyone left.");
	}
});

client.on("interactionCreate", async (interaction) => {
	// Slash commands handlers
	if (interaction.isCommand()) {
		const { commandName } = interaction;
		if (commands[commandName as keyof typeof commands]) {
			commands[commandName as keyof typeof commands].execute(interaction);
		}
	}
});

client.login(config.DISCORD_TOKEN);

