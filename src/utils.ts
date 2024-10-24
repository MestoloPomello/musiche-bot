import {
	AudioPlayer,
	NoSubscriberBehavior,
	createAudioPlayer
} from "@discordjs/voice";

export let player: AudioPlayer;

export function createPlayer() {
	player = createAudioPlayer({
		behaviors: {
			noSubscriber: NoSubscriberBehavior.Play,
		}
	});

	// Hooks
	player.on('error', error => {
		throw error;
	});

	return player;
}


export function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
