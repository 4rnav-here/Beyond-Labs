#!/usr/bin/env node
// Usage: node cli/parse.js <saved-stream.txt> [platform|auto] [--csv] [--full]
import { readFileSync } from 'node:fs';
import { extract, toCSV } from '../extension/parser.js';
const [file, platform = 'auto', ...flags] = process.argv.slice(2);
if (!file) { console.error('usage: node cli/parse.js <saved-stream.txt> [chatgpt|perplexity|gemini|claude|grok|auto] [--csv] [--full]'); process.exit(1); }
const r = extract(platform.startsWith('--') ? 'auto' : platform, readFileSync(file, 'utf8'));
const all = [platform, ...flags];
if (!all.includes('--full')) delete r.answer;
console.log(all.includes('--csv') ? toCSV(r) : JSON.stringify(r, null, 2));
