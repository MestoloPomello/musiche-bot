import { Client } from "discord.js";

export type SavedGuild = {
    id: string;
    status: string;
    guildData: object;
}

export type GuildSetupInput = {
    guildObj: SavedGuild;
    client?: Client;
}
