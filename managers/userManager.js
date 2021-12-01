/* eslint-disable no-async-promise-executor */
const { Collection } = require('discord.js');
const { sleep, validateConfig } = require('../baseFunctions/util');

const { readdb, insertdb, updatedb } = require('../baseFunctions/database');
class spUserManager {
	constructor(config, client) {
		this.cache = new Object();
		this.cache.data = new Collection();

		if(!validateConfig(config)) throw new Error('Invalid Config');
		this.cache.modulecfg = config;

		this.client = client ? client : null;

	}
	getData(userid, configobj) {
		return new Promise(async (resolve) => {
			if(typeof configobj !== 'object' && configobj != undefined) throw new Error('Not a Config Object');
			if(typeof userid !== 'string' || userid.length !== 18) throw new Error('UserID not a valid snowflake string');

			if(this.client) {
				const member = await this.client.users.fetch(userid);
				if(!member) throw new Error('Unknown Member');
			}
			const cacheconfig = this.cache.data.get(userid);

			if(cacheconfig) {
				resolve(cacheconfig);
				return;
			}
			else{
				const dbconfig = await readdb(this.cache.modulecfg, 'userdata', { userid:userid });
				this.cache.data.set(userid, dbconfig ? dbconfig[0] : null);
				resolve(dbconfig ? dbconfig[0] : null);
			}


		});
	}
	getAll(configobj) {
		return new Promise(async (resolve) => {
			if(typeof configobj !== 'object' && configobj != undefined) throw new Error('Not a Config Object');


			const memconfigs = this.cache.data;

			console.log('memcfg ' + JSON.stringify(memconfigs) + ', Using Database');
			const dbconfigs = await readdb(this.cache.modulecfg, 'userdata', { userid:'*' });


			if(!dbconfigs)return resolve(null);


			resolve(dbconfigs);


		});
	}

	async setData(userid, configobj) {
		if(typeof configobj !== 'object') throw new Error('Not a Config Object');
		if(typeof userid !== 'string' || userid.length !== 18) throw new Error('Invalid Snowflake');

		if(this.client) {
			const guild = await this.client.users.fetch(userid);
			if(!guild) throw new Error('Unknown Member');
		}
		let currconfig = this.cache.data.get(userid);
		let newconfig = {};

		if(!currconfig) {
			currconfig = await readdb(this.cache.modulecfg, 'userdata', { userid:userid });
		}
		if(currconfig == null) {
			newconfig = configobj;
			this.cache.data.set(userid, configobj);
			newconfig['userid'] = userid;
			await insertdb(this.cache.modulecfg, 'userdata', newconfig);
			return;
		}
		else{

			newconfig = currconfig;

			for await(const newkey of Object.keys(configobj)) {
				if(!configobj[newkey]) continue;

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
			// console.log(newconfig);

			this.cache.data.set(userid, newconfig);
			for await(const key of Object.keys(newconfig)) {
				if(newconfig[key] === userid) continue;
				updatedb(this.cache.modulecfg, 'userdata', key, newconfig[key], { userid:userid });
				sleep(2000);
			}
			console.log(`Data has been Updated ${JSON.stringify(newconfig)}`);

		}

	}
}

module.exports = spUserManager;