const mysql = require('mysql');
function translateOption(option){
	switch (option['type']){
		case 'order':{
			return `ORDER BY ${option['property']} ${option['args']}`;
			break;
		}
		default:{
			console.log(`Unknown Option ${option['type']}`);
			return '';
		}
	}

}
function readdb(modulecfg, table, statementsobj, optionsobj) {
	return new Promise((resolve) => {
		// console.log('MAKING QUERY TO DATABASE')
		const con = mysql.createConnection({
			host: modulecfg.host,
			user: modulecfg.user,
			password: modulecfg.password,
			database: modulecfg.database,
			supportBigNumbers: true,
			bigNumberStrings: true,
		});
		let optionsstatement = '';
		if(optionsobj){
			const optionsarr = [];
			for (const option of optionsobj) {
				optionsarr.push(translateOption(option));
			}
			optionsstatement = ` ${optionsarr.join(' ')}`;
		}

		const statementskeys = Object.keys(statementsobj);

		const statementarr = [];


		for(let i = 0 ; i < statementskeys.length ; i++) {
			statementarr.push(`${statementskeys[i]} ` + (statementsobj[statementskeys[i]] === '*' ? '' : `= '${(statementsobj[statementskeys[i]])}' `));
		}
		// console.log(statement)
		const statement = statementarr.join(' && ');
		con.query(`SELECT * FROM ${table} WHERE ${statement}${optionsstatement}`,
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
function insertdb(modulecfg, table, valuesobj) {
	return new Promise((resolve) => {
		const con = mysql.createConnection({
			host: modulecfg.host,
			user: modulecfg.user,
			password: modulecfg.password,
			database: modulecfg.database,
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
function updatedb(modulecfg, table, key, value, statementsobj) {
	const con = mysql.createConnection({
		host: modulecfg.host,
		user: modulecfg.user,
		password: modulecfg.password,
		database: modulecfg.database,
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

function deletedb(modulecfg, table, statementsobj) {
	return new Promise((resolve) => {
		// console.log('MAKING DELETION TO DATABASE')
		const con = mysql.createConnection({
			host: modulecfg.host,
			user: modulecfg.user,
			password: modulecfg.password,
			database: modulecfg.database,
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
module.exports = { readdb, insertdb, updatedb, deletedb };