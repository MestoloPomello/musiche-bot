import {
	AudioPlayer,
	createAudioPlayer,
	VoiceConnection
} from "@discordjs/voice";

export class ActiveGuildInstance {
	public voiceConnection: VoiceConnection | null;
	public disconnectTimeout: NodeJS.Timeout | null;
	public player: AudioPlayer | null;

	constructor() {
		this.voiceConnection = null;
		this.disconnectTimeout = null;
		this.player = null;
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
		this.voiceConnection.removeAllListeners();
		this.voiceConnection.destroy();
		this.voiceConnection = null;
	}
}
