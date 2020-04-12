const { categories } = require('../config.json');
const { MessageEmbed } = require('discord.js');
const logger = require('../cli/logger.js')

let play = async (message, args) => {
	const { client } = message;
	const { commands, utils } = client;
	let isFirst = false;
	let userCheckFail = await utils.checkUserVoice(message);
	if (userCheckFail) return userCheckFail;

	if (!args)
		return "You didn't send me anything to play."

	await utils.initiatePlayer(client, message.guild.id);

	let query = args.join(" ");
	let queue = utils.getServerQueue(client, message.guild.id);
	let playlist = query.includes('list')
	let track = await utils.getAudio(query.startsWith('http') ? query : `ytsearch:${query}`, playlist)

	if (!track[0])
		return new Error('No results found. Please try again!');
	if (!queue[0]) isFirst = true;
	if (track[0].info.title.includes('*')) // https://stackoverflow.com/questions/39542872/escaping-discord-subset-of-markdown
		track[0].info.title = track[0].info.title.replace(/\\(\*|_|`|~|\\)/g, '$1').replace(/(\*|_|`|~|\\)/g, '\\$1');

	track[0].requester = message.author

	if (track[0].info.uri.includes("youtube"))
		track[0].thumbnail = await utils.getThumbnail(client, track[0]);
	else
		track[0].thumbnail = `${client.runningDir}/static/thumbnailError.png`


	queue.push(track[0]);

	if (isFirst) {
		console.log("Creating player...")
		const player = await client.manager.join({
			guild: message.guild.id,
			channel: message.member.voice.channelID,
			node: "1"
		})
		console.log("Created player.")

		player.loop = false;

		player.on('leave', () => delete client.servers[message.guild.id])
		return await utils.queueLoop(client, message, queue, player);
	} else {
		client.servers[message.guild.id].queue = queue
		logger.log(`Added %s to %s's queue. New queue length for %s: %d`, track[0].info.title, message.guild.name, message.guild.name, queue.length)
		return new MessageEmbed()
			.setTitle('Added to queue')
			.setDescription(`**${track[0].info.title}** by ${track[0].info.author}\n\nThere ${(queue.length - 1) > 1 ? `are ${queue.length - 1} tracks` : `is ${queue.length - 1} track`} before it.`)
			.attachFiles([
				{ attachment: track[0].thumbnail, name: `thumbnail.jpg` }
			])
			.setThumbnail(`attachment://thumbnail.jpg`)
	}
}
play.usage = `<query>`;
play.shortDesc = 'Plays music with an added search query';
play.args = true;
play.aliases = ['p'];
play.category = categories.VOICE;

module.exports = play;