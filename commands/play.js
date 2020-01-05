const Command = require("./command.js");
module.exports = class Play extends Command {
	constructor() {
		super();

		this.name = "play";
		this.usage += `${this.name} <query>`;
		this.description = 'Plays music with an added search query';
		this.args = true;
		this.aliases = ['p'];
		this.category = 'voice';
	}

	run = (message, args) => {
		let client = message.client;
		
	}
}