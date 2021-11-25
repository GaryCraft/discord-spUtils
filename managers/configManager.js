const { Collection } = require('discord.js');
const { sleep, validateConfig } = require('../baseFunctions/util');

const { readdb, insertdb, updatedb, deletedb } = require('../baseFunctions/database');
class spConfigManager {
	constructor(config, client) {
		if(!validateConfig(config)) throw new Error('Invalid Config');
		this.cache.modulecfg = config;
		this.client = client ? client : null;
		this.cache = new Object();
		this.cache.configs = new Collection();
	}

	getConfig(guildid, configobj) {
		return new Promise(async (resolve) => {
			if(typeof configobj !== 'object' && configobj != undefined) throw new Error('Not a Config Object');
			if(typeof guildid !== 'string' || guildid.length !== 18) throw new Error('Not a Valid GuildID Snowflake string');

			if(this.client){
				const guild = await this.client.guilds.fetch(guildid);
				if(!guild) throw new Error('Unknown Guild');
			}
			let config = this.cache.configs.get(guildid);

			if(config) {
				resolve(config);
				return;
			}
			else{
				config = await readdb(this.cache.modulecfg, 'serverconfigs', { serverid:guildid });
				this.cache.configs.set(guildid, config ? config[0] : config);
				resolve(config ? config[0] : config);
			}


		});
	}
	getAll(configobj) {
		return new Promise(async (resolve) => {
			if(typeof configobj !== 'object' && configobj != undefined) throw new Error('Not a Config Object');


			// let memconfigs = this.cache.configs

			// console.log('memcfg ' + JSON.stringify(memconfigs))
			const dbconfigs = await readdb(this.cache.modulecfg, 'serverconfigs', { serverid:'*' });


			if(!dbconfigs)return resolve(null);


			resolve(dbconfigs);


		});
	}

	async setConfig(guildid, configobj) {
		if(typeof configobj !== 'object') throw new Error('Not a Config Object');
		if(typeof guildid !== 'string' || guildid.length !== 18) throw new Error('Invalid Snowflake');

		if(this.client){
			const guild = await this.client.guilds.fetch(guildid);
			if(!guild) throw new Error('Unknown Guild');
		}
		let currconfig = this.cache.configs.get(guildid);
		let newconfig = {};

		if(!currconfig) {
			currconfig = await readdb(this.cache.modulecfg, 'serverconfigs', { serverid:guildid });
		}
		if(currconfig == null) {
			newconfig = configobj;
			this.cache.configs.set(guildid, configobj);
			newconfig['serverid'] = guildid;
			await insertdb(this.cache.modulecfg, 'serverconfigs', newconfig);
			return;
		}
		else{

			newconfig = currconfig;

			for await(const newkey of Object.keys(configobj)) {


				if(currconfig[newkey] === configobj[newkey]) continue;

				if(typeof configobj[newkey] != 'object') {
					newconfig[newkey] = configobj[newkey];
				}
				else{
					for await(const key of Object.keys(configobj[newkey])) {
						if(!newconfig[newkey]) newconfig[newkey] = {};
						newconfig[newkey][key] = configobj[newkey][key];
						if(configobj[newkey][key] === null) delete newconfig[newkey][key];
					}
				}
			}

			this.cache.configs.set(guildid, newconfig);

			for await(const key of Object.keys(newconfig)) {
				updatedb(this.cache.modulecfg, 'serverconfigs', key, newconfig[key], { serverid:guildid });
				sleep(2000);
			}
		}

	}
}

module.exports = spConfigManager;