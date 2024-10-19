require("console-stamp")(console, { format: ":date(HH:MM:ss.l)" });
import { Client } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";
import { deployCommands } from "./deploy-commands";
import { getVoiceConnection } from "@discordjs/voice";

const client = new Client({
	intents: ["Guilds", "GuildMessages", "GuildVoiceStates"],
});

client.once("ready", async () => {
	//deployCommands({ guildId: process.env.DEFAULT_GUILD! });
	console.log("Musiche ready.");
});

client.on("guildCreate", async (guild) => {
	await deployCommands({ guildId: guild.id });
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

