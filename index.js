/* eslint-disable no-async-promise-executor */
const mysql = require('mysql');
const { Collection } = require('discord.js');
const sleep = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));
// GaryCraft garycraft@our-space.xyz
function readdb(client, table, statementsobj) {
	return new Promise((resolve) => {
		// console.log('MAKING QUERY TO DATABASE')
		const con = mysql.createConnection({
			host: client.config.dbconfig.host,
			user: client.config.dbconfig.user,
			password: client.config.dbconfig.password,
			database: client.config.dbconfig.database,
			supportBigNumbers: true,
			bigNumberStrings: true,
		});


		const statementskeys = Object.keys(statementsobj);

		const statementarr = [];


		for(let i = 0 ; i < statementskeys.length ; i++) {
			statementarr.push(`${statementskeys[i]} ` + (statementsobj[statementskeys[i]] === '*' ? '' : `= '${(statementsobj[statementskeys[i]])}' `));
		}
		// console.log(statement)
		const statement = statementarr.join(' && ');
		con.query(`SELECT * FROM ${table} WHERE ${statement}`,
			(err, fields) => {
				if (err) {
					console.log(err);
					setTimeout(function() { con.end(); }, 100);
					return console.log(
						`DB data not received * where ${statement} on ${table}`,
					);
				}
				let Aresult = [];


				// console.log(fields)
				if (fields[0]) {


					for(let i = 0; i <= fields.length - 1;i++) {
						if(!fields[i]) return;
						const keys = Object.keys(fields[i]);

						const temp = {};
						for(const key of keys) {
							if(fields[i][key] == null || fields[i][key] == undefined) continue;
							if(typeof fields[i][key] !== 'string')continue;

							temp[key] = (fields[i][key].startsWith('{')) ? JSON.parse(fields[i][key]) : fields[i][key];

						}
						Aresult.push(temp);
					}


				}
				else {
					Aresult = null;
				}
				setTimeout(function() { con.end(); }, 100);
				resolve(Aresult);
			});
	});
}
function insertdb(client, table, valuesobj) {
	return new Promise((resolve) => {
		const con = mysql.createConnection({
			host: client.config.dbconfig.host,
			user: client.config.dbconfig.user,
			password: client.config.dbconfig.password,
			database: client.config.dbconfig.database,
			supportBigNumbers: true,
			bigNumberStrings: true,
		});

		const valueskeys = Object.keys(valuesobj);
		let keys = '';
		let values = '';
		/* for( let i = 0 ; i <= valueskeys.length ; i++ ){
			const key = valueskeys[i];
			if(i == 0) {
				keys = keys + `${key}`;
				values = values + `"${JSON.stringify(values[key])}"`;
				continue;
			}
			keys = keys + `, ${key}`
			values = values + `, "${JSON.stringify(values[key])}"`;
		}*/

		for (const key of valueskeys) {
			const pad = typeof valuesobj[key] == 'object' ? '\'' : '';
			if(key == valueskeys[0]) {
				keys = keys + `${key}`;
				values = values + `${pad}${JSON.stringify(valuesobj[key])}${pad}`;
				continue;
			}
			keys = keys + `, ${key}`;
			values = values + `, ${pad}${JSON.stringify(valuesobj[key])}${pad}`;
		}

		con.query(`INSERT INTO ${table} (${keys}) VALUES (${values})`,
			(err) => {
				if (err) {
					console.log(err);
					setTimeout(function() {con.end();}, 100);
					resolve(false);
					return console.log(
						`DB data not inserted ${keys} // ${values} on ${table}`,
					);
				}
				setTimeout(function() {con.end();}, 500);
				console.log('DB data Inserted || ' + `${keys} // ${values}`);
				resolve(true);
			});


	});
}
function updatedb(client, table, key, value, statementsobj) {
	const con = mysql.createConnection({
		host: client.config.dbconfig.host,
		user: client.config.dbconfig.user,
		password: client.config.dbconfig.password,
		database: client.config.dbconfig.database,
		supportBigNumbers: true,
		bigNumberStrings: true,
	});

	let statement = '';
	const statementskeys = Object.keys(statementsobj);
	for(let i = 0 ; i < statementskeys.length ; i++) {
		const pad = typeof statementsobj[statementskeys[i]] == 'object' ? '\'' : '';
		if(i == 0) {

			statement = statement + `${statementskeys[i]} = ${pad}${statementsobj[statementskeys[i]]}${pad}`;
			continue;
		}
		statement = statement + ` && ${statementskeys[i]} = ${pad}${statementsobj[statementskeys[i]]}${pad}`;
	}
	const pad = typeof value == 'object' ? '\'' : '';
	// console.log(value)
	con.query(`UPDATE ${table} SET ${key} = ${pad}${JSON.stringify(value)}${pad} WHERE ${statement}`,
		(err) => {
			if (err) {
				console.log(err);
				setTimeout(function() {con.end();}, 100);
				return console.log(
					`DB data not updated ${key}, ${value} where ${statement} on ${table}`,
				);
			}
			setTimeout(function() {con.end();}, 100);
		});


	// console.log('Succesfully inserted new player || '+`${message.guild.name}`)
}

function deletedb(client, table, statementsobj) {
	return new Promise((resolve) => {
		// console.log('MAKING DELETION TO DATABASE')
		const con = mysql.createConnection({
			host: client.config.dbconfig.host,
			user: client.config.dbconfig.user,
			password: client.config.dbconfig.password,
			database: client.config.dbconfig.database,
			supportBigNumbers: true,
			bigNumberStrings: true,
		});


		const statementskeys = Object.keys(statementsobj);

		const statementarr = [];


		for(let i = 0 ; i < statementskeys.length ; i++) {
			statementarr.push(`${statementskeys[i]} ` + (statementsobj[statementskeys[i]] === '*' ? '' : `= '${(statementsobj[statementskeys[i]])}' `));
		}
		// console.log(statement)
		const statement = statementarr.join(' && ');
		con.query(`DELETE FROM ${table} WHERE ${statement}`,
			(err) => {
				if (err) {
					console.log(err);
					setTimeout(function() { con.end(); }, 100);
					return console.log(
						`DB data not deleted where ${statement} on ${table}`,
					);
				}

				resolve(true);
			});
	});
}

class spConfigManager {
	constructor(client) {
		this.client = client;
		this.cache = new Object();
		this.cache.configs = new Collection();
		// this.TempMem = new Collection();
	}

	getConfig(guildid, configobj) {
		return new Promise(async (resolve) => {
			if(typeof configobj !== 'object' && configobj != undefined) return this.client.emit('error', 'Not a Config Object');
			if(typeof guildid !== 'string' || guildid.length !== 18) return this.client.emit('error', 'Invalid Snowflake');

			const guild = await this.client.guilds.fetch(guildid);
			if(!guild) return this.client.emit('error', 'Unknown Guild');

			let config = this.cache.configs.get(guildid);

			if(config) {
				resolve(config);
				return;
			}
			else{
				config = await readdb(this.client, 'serverconfigs', { serverid:guildid });
				this.cache.configs.set(guildid, config ? config[0] : config);
				resolve(config ? config[0] : config);
			}


		});
	}
	getAll(configobj) {
		return new Promise(async (resolve) => {
			if(typeof configobj !== 'object' && configobj != undefined) return this.client.emit('error', 'Not a Config Object');


			// let memconfigs = this.cache.configs

			// console.log('memcfg ' + JSON.stringify(memconfigs))
			const dbconfigs = await readdb(this.client, 'serverconfigs', { serverid:'*' });


			if(!dbconfigs)return resolve(null);


			resolve(dbconfigs);


		});
	}

	async setConfig(guildid, configobj) {
		if(typeof configobj !== 'object') return this.client.emit('error', 'Not a Config Object');
		if(typeof guildid !== 'string' || guildid.length !== 18) return this.client.emit('error', 'Invalid Snowflake');

		const guild = await this.client.guilds.fetch(guildid);
		if(!guild) return this.client.emit('error', 'Unknown Guild');

		let currconfig = this.cache.configs.get(guildid);
		let newconfig = {};

		if(!currconfig) {
			currconfig = await readdb(this.client, 'serverconfigs', { serverid:guildid });
		}
		if(currconfig == null) {
			newconfig = configobj;
			this.cache.configs.set(guildid, configobj);
			newconfig['serverid'] = guildid;
			await insertdb(this.client, 'serverconfigs', newconfig);
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
				updatedb(this.client, 'serverconfigs', key, newconfig[key], { serverid:guildid });
				sleep(2000);
			}
		}

	}
}

class spUserManager {
	constructor(client) {
		this.client = client;
		this.cache = new Object();
		this.cache.data = new Collection();
		// this.TempMem = new Collection();
	}
	getData(userid, configobj) {
		return new Promise(async (resolve) => {
			if(typeof configobj !== 'object' && configobj != undefined) return this.client.emit('error', 'Not a Config Object');
			if(typeof userid !== 'string' || userid.length !== 18) return this.client.emit('error', 'Invalid Snowflake');

			const member = await this.client.users.fetch(userid);
			if(!member) return this.client.emit('error', 'Unknown Member');

			const cacheconfig = this.cache.data.get(userid);

			if(cacheconfig) {
				resolve(cacheconfig);
				return;
			}
			else{
				const dbconfig = await readdb(this.client, 'userdata', { userid:userid });
				this.cache.data.set(userid, dbconfig ? dbconfig[0] : null);
				resolve(dbconfig ? dbconfig[0] : null);
			}


		});
	}
	getAll(configobj) {
		return new Promise(async (resolve) => {
			if(typeof configobj !== 'object' && configobj != undefined) return this.client.emit('error', 'Not a Config Object');


			const memconfigs = this.cache.data;

			console.log('memcfg ' + JSON.stringify(memconfigs) + ', Using Database');
			const dbconfigs = await readdb(this.client, 'userdata', { userid:'*' });


			if(!dbconfigs)return resolve(null);


			resolve(dbconfigs);


		});
	}

	async setData(userid, configobj) {
		if(typeof configobj !== 'object') return this.client.emit('error', 'Not a Config Object');
		if(typeof userid !== 'string' || userid.length !== 18) return this.client.emit('error', 'Invalid Snowflake');

		const guild = await this.client.users.fetch(userid);
		if(!guild) return this.client.emit('error', 'Unknown Member');

		let currconfig = this.cache.data.get(userid);
		let newconfig = {};

		if(!currconfig) {
			currconfig = await readdb(this.client, 'userdata', { userid:userid });
		}
		if(currconfig == null) {
			newconfig = configobj;
			this.cache.data.set(userid, configobj);
			newconfig['userid'] = userid;
			await insertdb(this.client, 'userdata', newconfig);
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
			// updatedb(this.client, 'userdata', 'configobj', newconfig, { userid:userid });
			for await(const key of Object.keys(newconfig)) {
				updatedb(this.client, 'userdata', key, newconfig[key], { userid:userid });
				sleep(2000);
			}
			console.log(`Data has been Updated ${JSON.stringify(newconfig)}`);

		}

	}
}
class spDatabase {
	constructor(client) {
		this.client = client;
		this.cache = new Object();
		this.cache.data = new Collection();
	}
	query(table, query) {
		return new Promise(async (resolve)=>{
			if(typeof table !== 'string') return this.client.emit('error', 'Not a valid Table');
			if(typeof query !== 'object') return this.client.emit('error', 'Invalid Query');

			const cachedata = this.cache.data.get(table);
			let dbdata = null;

			let queryres = null;
			if(cachedata) {
				const tarr = [];
				for await(const obj of cachedata) {
					const keys = Object.keys(query);
					const st = [];

					for await(const key of keys) {
						if(obj[key] == query[key]) {
							st.push(true);
						}
						else{
							st.push(false);
						}
					}
					if(!st.includes(false))tarr.push(obj);

				}
				if(tarr.length >= 1) queryres = tarr;

				if(queryres) {
					// console.log('Found in Cache'+JSON.stringify(queryres));
					resolve(queryres);
					return;
				}
				else {
					dbdata = await readdb(this.client, table, query);

					if(!dbdata) {
						// console.log('Not found cache (not updated) nor DB'+queryres);
						resolve(queryres);
						return;
					}
					// console.log('Not found cache (not updated) but did in DB'+queryres);
					const updated = cachedata.concat(dbdata);
					this.cache.data.set(table, updated);
					// console.log(queryres);
				}


			}
			else{
				dbdata = await readdb(this.client, table, query);
				if(!dbdata) {
					// console.log('Not found In cache nor DB'+queryres);
					resolve(queryres);
					return;
				}
				else{
					queryres = dbdata;
					this.cache.data.set(table, dbdata);
					// console.log('Not found cache but did in DB'+queryres);
					resolve(queryres);
				}

			}


		});
	}

	async set(table, query, newvalues) {
		if(typeof table !== 'string') return this.client.emit('error', 'Not a valid Table');
		if(typeof query !== 'object') return this.client.emit('error', 'Invalid Query');
		if(typeof newvalues !== 'object') return this.client.emit('error', 'Invalid Values');

		let currdata = null;
		const currcache = this.cache.data.get(table);
		if(!query.new == true)currdata = await this.query(table, query);

		if(!currdata || query.new == true) {
			if(currcache) {
				this.cache.data.set(table, currcache.concat([newvalues]));
			}
			else{
				this.cache.data.set(table, [newvalues]);
			}
			await insertdb(this.client, table, newvalues);
			return;
		}
		else{
			const nomod = [];
			const mod = [];
			for await(const obj of currcache) {
				const keys = Object.keys(query);
				const st = [];

				for await(const key of keys) {
					if(obj[key] == query[key]) {
						st.push(true);
					}
					else{
						st.push(false);
					}
				}
				if(st.includes(false)) {
					nomod.push(obj);
					continue;
				}
				else{
					let newobj = {};
					newobj = obj;
					for await(const newkey of Object.keys(newvalues)) {

						if(obj[newkey] === newvalues[newkey]) continue;

						if(typeof newvalues[newkey] != 'object') {
							newobj[newkey] = newvalues[newkey];
						}
						else{
							for await(const key of Object.keys(newvalues[newkey])) {
								if(!newobj[newkey]) newobj[newkey] = {};
								newobj[newkey][key] = newvalues[newkey][key];
								if(newvalues[newkey][key] === null) delete newobj[newkey][key];
							}
						}
					}
					mod.push(newobj);

				}

			}
			if(mod.length >= 1) {
				const joined = nomod.concat(mod);
				this.cache.data.set(table, joined);

				for await(const obj of mod) {
					for await(const key of Object.keys(obj)) {
						updatedb(this.client, table, key, obj[key], query);
						sleep(1000);
					}
				}
			}


		}

	}
	async setcache(table, query, newvalues) {
		if(typeof table !== 'string') return this.client.emit('error', 'Not a valid Table');
		if(typeof query !== 'object') return this.client.emit('error', 'Invalid Query');
		if(typeof newvalues !== 'object') return this.client.emit('error', 'Invalid Values');

		let currdata = null;
		const currcache = this.cache.data.get(table);
		if(!query.new == true)currdata = await this.query(table, query);

		if(!currdata || query.new == true) {
			if(currcache) {
				this.cache.data.set(table, currcache.concat([newvalues]));
			}
			else{
				this.cache.data.set(table, [newvalues]);
			}
			return;
		}
		else{
			const nomod = [];
			const mod = [];
			for await(const obj of currcache) {
				const keys = Object.keys(query);
				const st = [];

				for await(const key of keys) {
					if(obj[key] == query[key]) {
						st.push(true);
					}
					else{
						st.push(false);
					}
				}
				if(st.includes(false)) {
					nomod.push(obj);
					continue;
				}
				else{
					let newobj = {};
					newobj = obj;
					for await(const newkey of Object.keys(newvalues)) {

						if(obj[newkey] === newvalues[newkey]) continue;

						if(typeof newvalues[newkey] != 'object') {
							newobj[newkey] = newvalues[newkey];
						}
						else{
							for await(const key of Object.keys(newvalues[newkey])) {
								if(!newobj[newkey]) newobj[newkey] = {};
								newobj[newkey][key] = newvalues[newkey][key];
								if(newvalues[newkey][key] === null) delete newobj[newkey][key];
							}
						}
					}
					mod.push(newobj);

				}

			}
			if(mod.length >= 1) {
				const joined = nomod.concat(mod);
				this.cache.data.set(table, joined);
			}


		}

	}
	async delete(table, query) {
		if(typeof table !== 'string') return this.client.emit('error', 'Not a valid Table');
		if(typeof query !== 'object') return this.client.emit('error', 'Invalid Query');

		const currcache = this.cache.data.get(table);

		const nomatch = [];
		for await(const obj of currcache) {
			const keys = Object.keys(query);
			const st = [];

			for await(const key of keys) {
				if(obj[key] == query[key]) {
					st.push(true);
				}
				else{
					st.push(false);
				}
			}
			if(st.includes(false)) {
				nomatch.push(obj);
				continue;
			}
		}

		this.cache.data.set(table, nomatch.length >= 1 ? nomatch : null);
		await deletedb(this.client, table, query);

	}
}

module.exports = {
	spConfigManager,
	spUserManager,
	spDatabase,
};