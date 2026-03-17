import {
    SlashCommandBuilder,
    ActivityType,
    ChatInputCommandInteraction,
    MessageFlags,
} from "discord.js";
import { loadGuilds, saveGuilds } from "../handlers/guilds";

export const data = new SlashCommandBuilder()
    .setName("status")
    .setDescription("Imposta lo stato del bot.")
    .addStringOption(option =>
        option
            .setName("status")
            .setDescription("Il testo da mostrare nello stato del bot.")
            .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    try {
        if (interaction.user.id !== process.env.OWNER_ID) {
            await interaction.reply({
                content: "❌ Solo lo Stefa può usare questo comando!",
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        const status = interaction.options.get("status")?.value as string;

        interaction.client.user?.setPresence({
            activities: [{ name: status, type: ActivityType.Custom }],
            status: "online"
        });

        const guilds = loadGuilds();
        guilds.find((guild) => guild.id == interaction.guildId)!.status = status;
        saveGuilds(guilds);

        await interaction.reply({
            content: `✅ Stato cambiato! Nuovo stato: **${status}**`,
                flags: MessageFlags.Ephemeral
        });
    } catch (error) {
        console.error("[SetStatus] Error:", error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: `Errore: ${error}`,
                flags: MessageFlags.Ephemeral
            });
        } else {
            await interaction.reply({
                content: `Errore: ${error}`,
                flags: MessageFlags.Ephemeral
            });
        }
    }
}
