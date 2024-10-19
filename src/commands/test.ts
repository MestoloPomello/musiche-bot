import {
    CommandInteraction,
    SlashCommandBuilder,
  } from "discord.js";
  
  import * as JOIN from "./join";
  
  export const data = new SlashCommandBuilder()
    .setName("test")
    .setDescription("Test");
  
  export async function execute(interaction: CommandInteraction) {
    JOIN.execute(interaction);
  }
  