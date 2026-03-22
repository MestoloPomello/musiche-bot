import { CommandInteraction } from "discord.js";
import { logger } from "../classes/Logger";

/**
 * Replies to an interaction if it hasn't been replied to or deferred yet, otherwise sends a follow-up message.
 */
export async function replyOrFollowUp(
	interaction: CommandInteraction,
	content: object 
): Promise<void> {
	try {
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(content);
		} else {
			await interaction.reply(content);
		}
	} catch (error: any) {
		logger.error("[replyOrFollowUp] Error:", error);
	}
}
