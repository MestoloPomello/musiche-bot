import { ActivityType, REST, Routes } from "discord.js";
import { readFileSync, writeFileSync } from "fs";
import { GUILDS_LIST_PATH } from "../constants";
import { commands } from "../commands";
import { config } from "../config";
import { GuildSetupInput, SavedGuild } from "../types/guilds";

const commandsData = Object.values(commands).map((command) => command.data);
const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

export async function guildSetup({
    guildObj,
    client
}: GuildSetupInput) {
    try {
        // Status
        if (client) {
            client.user?.setPresence({
                activities: [{ name: guildObj.status, type: ActivityType.Custom }],
                status: "online",
            });
        }

        // Commands
        await rest.put(
            Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildObj.id),
            {
                body: commandsData,
            }
        );
    } catch (error) {
        console.error(error);
    }
}

export function loadGuilds(): SavedGuild[] {
    return JSON.parse(readFileSync(GUILDS_LIST_PATH, { encoding: "utf8" }));
}

export function saveGuilds(guildsArray: SavedGuild[]): void {
    writeFileSync(GUILDS_LIST_PATH, JSON.stringify(guildsArray), { flag: "w" });
}