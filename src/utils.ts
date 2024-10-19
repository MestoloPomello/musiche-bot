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
