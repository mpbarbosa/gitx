import {mkdir, writeFile} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';

const pajussaraRef = '7b49a6ff376bd9e7c43bf5bb7667110759781729';
const pajussaraBaseUrl = `https://cdn.jsdelivr.net/gh/mpbarbosa/pajussara_tui_comp@${pajussaraRef}`;

const mirroredFiles = [
	'dist/src/DirectoryTextBrowser.js',
	'dist/src/DirectoryTextBrowser.d.ts',
	'dist/src/DirectoryTextBrowserWithStatusBar.js',
	'dist/src/DirectoryTextBrowserWithStatusBar.d.ts',
	'dist/src/DirectoryPanel.js',
	'dist/src/TextListPanel.js',
	'dist/src/TextListPanel.d.ts',
	'dist/src/ListPanel.js',
	'dist/src/ListPanel.d.ts',
	'dist/src/StatusBar.js',
	'dist/src/StatusBar.d.ts',
	'dist/src/Chronometer.js',
	'dist/src/Chronometer.d.ts',
	'dist/src/status_chronometer.js',
	'dist/src/status_chronometer.d.ts',
	'dist/src/status_badge.js',
	'dist/src/status_badge.d.ts',
	'dist/src/types.js',
	'dist/src/types.d.ts',
	'dist/helpers/index.js'
];

async function syncFile(relativePath) {
	const response = await fetch(`${pajussaraBaseUrl}/${relativePath}`);

	if (!response.ok) {
		throw new Error(`Unable to download ${relativePath}: ${response.status} ${response.statusText}`);
	}

	const targetPath = resolve('vendor/pajussara_tui_comp', relativePath);

	await mkdir(dirname(targetPath), {recursive: true});
	await writeFile(targetPath, await response.text(), 'utf8');
}

try {
	const results = await Promise.allSettled(mirroredFiles.map(syncFile));
	const failures = results.flatMap((result, index) =>
		result.status === 'rejected'
			? [{relativePath: mirroredFiles[index], error: result.reason}]
			: []
	);

	if (failures.length > 0) {
		for (const failure of failures) {
			console.error(`Failed to sync ${failure.relativePath}:`, failure.error);
		}

		process.exit(1);
	}
} catch (error) {
	console.error('Failed to sync pajussara_tui_comp files:', error);
	process.exit(1);
}
