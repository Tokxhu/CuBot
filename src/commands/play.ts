import { Command, TrackEmbed } from "../classes";
import { Bot } from "../index";
import { Message, MessageEmbed, User } from "discord.js";
import { Categories } from "../config";
import { ResultError as NoResultsError, NoGuildFoundError } from "../errors";
import { checkUserVoice, initiatePlayer, getServerQueue, getTracks, setServerQueue, getIdealHost, queueLoop, getThumbnail } from "../utils";
import { TrackObject } from "../types";

let setTrackInfo = async (track: TrackObject, author: User): Promise<TrackObject> => {
	track.title = track.title.replace(/\\(\*|_|`|~|\\)/g, '$1').replace(/(\*|_|`|~|\\)/g, '\\$1');

	track.requester = author;
	if (!track.thumbnail) {
		let path = await getThumbnail(track);
		if (!!path) track.thumbnail = path;
	}
	return track;
}

export class Play extends Command {

	constructor(client: Bot) {
		super(client, {
			aliases: ["p", "add"],
			description: "Plays the given query or link in your voice channel.",
			group: Categories.VOICE,
			guildOnly: true,
			needsArgs: true,
			examples: ["<query>", "<link>"]
		})
	}

	async run(message: Message, args: string[]): Promise<string | MessageEmbed | null> {
		let voiceId = checkUserVoice(message);

		const guildId = message.guild?.id;

		if (!guildId) throw new NoGuildFoundError();

		await initiatePlayer(this.client, guildId);

		let isFirst = false;
		let query = args.join(" ");
		let queue = getServerQueue(this.client, guildId);
		let playlist = query.includes('list');
		let tracks = await getTracks(query.startsWith('http') ? query : `ytsearch:${query}`);

		if (tracks.length === 0)
			throw new NoResultsError();

		if (queue.length === 0)
			isFirst = true;

		if (playlist) {
			let toPush = await Promise.all(tracks.map(async t => await setTrackInfo(t, message.author)))
			queue.push(...toPush);
		} else {
			let track = tracks.shift();
			if (track) {
				let trackObject = await setTrackInfo(track, message.author)
				queue.push(trackObject)
			}
		}

		setServerQueue(this.client, guildId, queue);

		if (isFirst) {
			const player = await this.client.manager.join({
				guild: guildId,
				channel: voiceId,
				node: await getIdealHost(this.client.manager)
			});

			// TODO implement now and removal when skipping
			// const server = this.client.servers.get(guildId);
			// let nowPlaying = nowPlayingEmbed(queue);
			// if (server) {
			// 	server.playing = {
			// 		track: queue[0],
			// 		message: nowPlaying
			// 	}
			// }

			// TODO Loop
			// player.loop = true;

			return await queueLoop(this.client, guildId, player);
		} else {
			if (!playlist) {
				let addedTrack = queue.slice().pop();
				if (!addedTrack) throw new NoResultsError();

				addedTrack.thumbnail = await getThumbnail(addedTrack);

				let { author, title, uri } = addedTrack;

				let embed = await new TrackEmbed(addedTrack)
					.setTitle(`Added to the queue :notepad_spiral:`)
					.setDescription(`**[${title}](${uri})** by **${author}**\nIt is **#${queue.length - 1}** in the queue`)
					.getThumbnail()
				return embed;
			} else {
				// TODO better message
				// Embed with pages for playlist.
				return "Added everything from the playlist to the queue."
			}
		}

	}

}