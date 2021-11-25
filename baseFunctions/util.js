const sleep = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));
function validateConfig(config) {
	if (config.host == null) {
		console.log('[Database] No host specified');
		return false;
	}
	if (config.user == null) {
		console.log('[Database] No user specified');
		return false;
	}
	if (config.password == null) {
		console.log('[Database] No password specified');
		return false;
	}
	if (config.database == null) {
		console.log('[Database] No database specified');
		return false;
	}
	return true;
}
const cleanupDuplicates = (array) => {
	return [...new Set(array)];

};
module.exports = { sleep, validateConfig, cleanupDuplicates };