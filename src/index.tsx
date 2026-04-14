#!/usr/bin/env node

/**
 * CLI entrypoint that mounts the gitx Ink application.
 */
import {render} from 'ink';
import {App} from './app.js';

render(<App />);
