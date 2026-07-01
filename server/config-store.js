import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { exists } from './fs-utils.js';

const CONFIG_DIR = path.join(os.homedir(), '.project-fast-onboarding');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export async function readConfig() {
  if (!(await exists(CONFIG_FILE))) {
    return envConfig();
  }
  try {
    const parsed = JSON.parse(await fs.readFile(CONFIG_FILE, 'utf8'));
    return { ...envConfig(), ...parsed };
  } catch {
    return envConfig();
  }
}

export async function writeConfig(config) {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  const current = await readConfig();
  const next = { ...current, ...config };
  await fs.writeFile(CONFIG_FILE, JSON.stringify(next, null, 2));
  return next;
}

export function redactConfig(config) {
  return {
    ...config,
    apiKey: config.apiKey ? '********' : ''
  };
}

function envConfig() {
  return {
    provider: process.env.PFO_AI_PROVIDER || 'openai-compatible',
    baseURL: process.env.PFO_AI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.PFO_AI_MODEL || process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    apiKey: process.env.PFO_AI_API_KEY || process.env.OPENAI_API_KEY || ''
  };
}
