# MusicheBot 
![discordjs](https://img.shields.io/badge/discordjs-v14-blue)

### Environment variables
- `DISCORD_TOKEN`: from Discord Developer Portal
- `DISCORD_CLIENT_ID`: from Discord Developer Portal
- `YOUTUBE_API_KEY`: from Youtube Data API (for finding URL by title)

### Commands
- `play`: queues a song or starts playing it if the queue is empty.
- `playskip`: places a song at the top of the queue and starts playing it.
- `skip`: skips the current song and starts playing the next in the queue.
- `queue`: shows the queued songs.
- `leave`: makes the bot quit the voice channel (same as the disconnect button)

### Cookies setup
To avoid getting IP blocked, the bot needs to mask itself as a user.
Setup a `data/cookies.json` file following instructions in the [distubejs/ytdl-core](https://github.com/distubejs/ytdl-core) repo.
