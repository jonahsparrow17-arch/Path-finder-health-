import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { RedFlagsConfig, EmergencyConfig, DemoScenario } from './types.js';

export interface AppConfig {
  environment: string;
  apiBaseUrl: string;
  dbPath: string;
  allowedOrigins: string[];
  sessionTokenSecret: string;
  rateLimitRequests: number;
  rateLimitWindowSeconds: number;
  retentionDays: number;
  geminiApiKey: string | null;
  redFlagsConfig: RedFlagsConfig;
  redFlagsHash: string;
  emergencyConfig: EmergencyConfig;
  classificationRules: any;
  navigationRules: any;
  demoScenarios: DemoScenario[];
}

let cachedConfig: AppConfig | null = null;

function computeFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function loadAndValidateConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const rootDir = process.cwd();
  const configDir = path.join(rootDir, 'shared', 'config');

  // Verify critical config files exist
  const redFlagsPath = path.join(configDir, 'red_flags.json');
  const classRulesPath = path.join(configDir, 'classification_rules.json');
  const navRulesPath = path.join(configDir, 'navigation_rules.json');
  const emergencyPath = path.join(configDir, 'emergency_config.json');
  const demoPath = path.join(configDir, 'demo_scenarios.json');

  const requiredFiles = [
    { path: redFlagsPath, name: 'red_flags.json' },
    { path: classRulesPath, name: 'classification_rules.json' },
    { path: navRulesPath, name: 'navigation_rules.json' },
    { path: emergencyPath, name: 'emergency_config.json' },
    { path: demoPath, name: 'demo_scenarios.json' },
  ];

  for (const item of requiredFiles) {
    if (!fs.existsSync(item.path)) {
      throw new Error(`CRITICAL STARTUP ERROR: Required configuration file missing: ${item.name} at ${item.path}`);
    }
  }

  let redFlagsConfig: RedFlagsConfig;
  let classificationRules: any;
  let navigationRules: any;
  let emergencyConfig: EmergencyConfig;
  let demoScenariosData: { scenarios: DemoScenario[] };

  try {
    redFlagsConfig = JSON.parse(fs.readFileSync(redFlagsPath, 'utf-8'));
    classificationRules = JSON.parse(fs.readFileSync(classRulesPath, 'utf-8'));
    navigationRules = JSON.parse(fs.readFileSync(navRulesPath, 'utf-8'));
    emergencyConfig = JSON.parse(fs.readFileSync(emergencyPath, 'utf-8'));
    demoScenariosData = JSON.parse(fs.readFileSync(demoPath, 'utf-8'));
  } catch (err: any) {
    throw new Error(`CRITICAL STARTUP ERROR: Malformed configuration JSON: ${err.message}`);
  }

  if (!redFlagsConfig.rules || !Array.isArray(redFlagsConfig.rules) || redFlagsConfig.rules.length === 0) {
    throw new Error('CRITICAL STARTUP ERROR: red_flags.json contains zero active safety rules.');
  }

  const redFlagsHash = computeFileHash(redFlagsPath);

  const env = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development';
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:8000/api/v1';
  const dbPath = process.env.DB_PATH || path.join(rootDir, 'data', 'pathfinder.db');
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
    : ['http://localhost:5173', 'http://localhost:3000', '*'];

  const sessionTokenSecret =
    process.env.SESSION_TOKEN_SECRET ||
    'REPLACE_WITH_A_LONG_RANDOM_SECRET';

  const rateLimitRequests = parseInt(process.env.RATE_LIMIT_REQUESTS || '60', 10);
  const rateLimitWindowSeconds = parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60', 10);
  const retentionDays = parseInt(process.env.RETENTION_DAYS || '30', 10);
  const geminiApiKey = process.env.GEMINI_API_KEY || null;

  cachedConfig = {
    environment: env,
    apiBaseUrl,
    dbPath,
    allowedOrigins,
    sessionTokenSecret,
    rateLimitRequests,
    rateLimitWindowSeconds,
    retentionDays,
    geminiApiKey,
    redFlagsConfig,
    redFlagsHash,
    emergencyConfig,
    classificationRules,
    navigationRules,
    demoScenarios: demoScenariosData.scenarios || [],
  };

  return cachedConfig;
}
