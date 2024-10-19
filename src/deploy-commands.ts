import { REST, Routes } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";

const commandsData = Object.values(commands).map((command) => command.data);

const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

export async function deployCommands(guildIds: string[]) {
	try {
		console.log("Started refreshing (/) commands.");

		for (const guildId of guildIds) {
			rest.put(
				Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId),
				{
					body: commandsData,
				}
			);
		}

		console.log("Successfully reloaded (/) commands.");
	} catch (error) {
		console.error(error);
	}
}
