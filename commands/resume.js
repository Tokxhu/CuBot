const Command = require('./command.js');
const { categories } = require('../config.json')
const { MessageEmbed } = require('discord.js');

module.exports = class resume extends Command {
	constructor() {
		super();

		this.name = 'resume';
		this.usage += `${this.name}`;
		this.description = 'Resumes the paused track.';
		this.args = false;
		this.aliases = [];
		this.category = categories.VOICE;
	}
	run = (message, args) => {
		const { client } = message;
		const { commands, utils } = client;

		let userCheckFail = utils.checkUserVoice.run(message);
		if (userCheckFail) return userCheckFail;

		let botCheckFail = utils.checkBotVoice.run(message);
		if (botCheckFail) return botCheckFail;

		const player = client.player.get(message.guild.id)
		const queue = utils.getServerQueue.run(client, message.guild.id)
		player.pause(false)
		return new MessageEmbed()
			.setTitle(`Resumed ${queue[0].info.title}.`)
	}
}