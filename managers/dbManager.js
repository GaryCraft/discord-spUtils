const { Collection } = require('discord.js');
const { sleep, validateConfig } = require('../baseFunctions/util');

const { readdb, insertdb, updatedb, deletedb } = require('../baseFunctions/database');

async function applyOptions(cache, results, options) {
	return new Promise((resolve, reject) => {
		
		for(const option in options) {
			if(!option['property']){
				console.log(`[${option['type']}]`);
				continue;
			}
			switch(option['type']) {
				case 'order' : {
					if(option['args'] == 'asc') {
						results.sort(function(a, b) {
							return a[`${option['property']}`] - b[`${option['property']}`];
						});
					} else if(option['args'] == 'desc') {
						results.sort(function(a, b) {
							return b[`${option['property']}`] - a[`${option['property']}`];
						});
					}
					break;
				}
				/*
				case 'forceupdate':{
					if (option['property'] == true)results = await readdb(cache.modulecfg, table, query, options);
					break;
				}
				*/
				default : {
					console.log(`Unknown option type: ${option['type']}`);
				}
			}
		}
		resolve(results);
	});
}
class spDatabase {
	constructor(config, client) {
		this.cache = new Object();
		this.cache.data = new Collection();
		
		if(!validateConfig(config)) throw new Error('Invalid Config');
		this.cache.modulecfg = config;
		
		this.client = client ? client : null;
		
	}

	forceQuery(table, query, options) {
		return new Promise(async (resolve)=>{
			if(typeof table !== 'string') throw new Error('Not a valid Table');
			if(typeof query !== 'object') throw new Error('Not a valid Query object');
			if(options){
				if(typeof options !== 'object' && !options.length > 0) throw new Error('Not a valid Options array');
			}
			
			let dbdata = null;

			let queryres = null;
			
			dbdata = await readdb(this.cache.modulecfg, table, query, options);
			if(!dbdata) {
				resolve(queryres);
				return;
			}
			else{
				queryres = dbdata;
				this.cache.data.set(table, dbdata);
				resolve(queryres);
			}
		});
	}
	query(table, query, options) {
		return new Promise(async (resolve)=>{
			if(typeof table !== 'string') throw new Error('Not a valid Table');
			if(typeof query !== 'object') throw new Error('Not a valid Query object');
			if(options){
				if(typeof options !== 'object' && !options.length > 0) throw new Error('Not a valid Options array');
			}
			
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
					/*
					if(options){
						queryres = await applyOptions(this.cache, queryres, options);
					}
					*/
					resolve(queryres);
					return;
				}
				else {
					dbdata = await readdb(this.cache.modulecfg, table, query, options);

					if(!dbdata) {
						resolve(queryres);
						return;
					}
					const updated = cachedata.concat(dbdata);
					this.cache.data.set(table, updated);
				}


			}
			else{
				dbdata = await readdb(this.cache.modulecfg, table, query, options);
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
		if(typeof table !== 'string') throw new Error('Not a valid Table');
		if(typeof query !== 'object') throw new Error('Invalid Query');
		if(typeof newvalues !== 'object') throw new Error('Invalid Values');

		let currdata = null;
		const currcache = this.cache.data.get(table);
		if(!query.new == true)currdata = await this.forceQuery(table, query);

		if(!currdata || query.new == true) {
			if(currcache) {
				this.cache.data.set(table, currcache.concat([newvalues]));
			}
			else{
				this.cache.data.set(table, [newvalues]);
			}
			await insertdb(this.cache.modulecfg, table, newvalues);
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
						updatedb(this.cache.modulecfg, table, key, obj[key], query);
						sleep(1000);
					}
				}
			}


		}

	}
	async setcache(table, query, newvalues) {
		if(typeof table !== 'string') throw new Error('Not a valid Table');
		if(typeof query !== 'object') throw new Error('Invalid Query');
		if(typeof newvalues !== 'object') throw new Error('Invalid Values');

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
		if(typeof table !== 'string') throw new Error('Not a valid Table');
		if(typeof query !== 'object') throw new Error('Invalid Query');

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
		await deletedb(this.cache.modulecfg, table, query);

	}
}

module.exports =  spDatabase;