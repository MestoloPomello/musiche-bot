# Discord Common Template
![discordjs](https://img.shields.io/badge/discordjs-v14-blue)

## Environment variables (root/.env)
- `DISCORD_TOKEN`: from Discord Developer Portal
- `DISCORD_CLIENT_ID`: from Discord Developer Portal
- `OWNER_ID`: (optional) the Discord ID for the user who owns the bot (for special commands)

## Repository Actions Secrets (for auto-deployment with PM2 on release)
- `VPS_HOST`: VPS IP
- `VPS_USERNAME`: VPS login username
- `VPS_SSH_KEY`: SSH private key, steps for generation in the deploy.yml
- `VPS_PORT`: VPS connection port
