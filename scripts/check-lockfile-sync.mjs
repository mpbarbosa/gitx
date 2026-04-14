/**
 * Verifies that package-lock.json is current for the committed package.json.
 *
 * The script refreshes the lockfile in place and then fails if that refresh
 * changes package-lock.json any further, which makes lockfile drift explicit in
 * CI and leaves local users with the regenerated file ready to review and
 * commit.
 */
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

function run(command, args, options = {}) {
	return execFileSync(command, args, {
		stdio: 'inherit',
		...options
	});
}

const lockfilePath = new URL('../package-lock.json', import.meta.url);
const beforeSync = readFileSync(lockfilePath, 'utf8');

run('npm', [
	'install',
	'--package-lock-only',
	'--ignore-scripts',
	'--no-audit',
	'--no-fund'
]);

const afterSync = readFileSync(lockfilePath, 'utf8');

if (beforeSync !== afterSync) {
	console.error(
		'package-lock.json was out of date. Review the regenerated lockfile and commit it alongside package.json changes.'
	);
	process.exit(1);
}
