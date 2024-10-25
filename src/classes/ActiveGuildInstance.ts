import { AudioPlayer, createAudioPlayer, VoiceConnection } from "@discordjs/voice";
import { SongInfo } from "../connections";

export class ActiveGuildInstance {
	voiceConnection: VoiceConnection | null;
	disconnectTimeout: NodeJS.Timeout | null;
	player: AudioPlayer | null;
	nowPlaying: SongInfo | null;
	queue: SongInfo[];

	constructor() {
		this.voiceConnection = null;
		this.disconnectTimeout = null;
		this.player = null;
		this.nowPlaying = null;
		this.queue = [];
	}

	getNextSongInQueue(): SongInfo | null {
		if (this.queue.length == 0) return null;
		this.nowPlaying = this.queue[0];
		return this.queue.shift()!;
	}

	destroyPlayer(): void {
		if (!this.player) return;
		this.player.stop();
		this.player.removeAllListeners();
		this.player = null;
	}

	getNewPlayer(): AudioPlayer {
		this.destroyPlayer();
		this.player = createAudioPlayer();
		return this.player;
	}

	destroyVoiceConnection(): void {
		if (!this.voiceConnection) return;
		this.destroyPlayer();
		this.voiceConnection.destroy();
		this.voiceConnection = null;
	}
}
