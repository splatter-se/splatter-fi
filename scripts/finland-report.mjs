import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const sql = readFileSync(new URL('../worker/report.sql', import.meta.url), 'utf8');
// D1's --file is an import command and does not return SELECT result rows.
const statements = sql.replace(/^--.*$/gm, '').split(';').map(value => value.trim()).filter(Boolean);
const results = [];
for (const query of statements) {
  const result = spawnSync(process.env.WRANGLER_BIN || 'wrangler', [
    'd1', 'execute', 'DB', '--remote', '--config', 'worker/wrangler.jsonc', '--command', query, '--json',
  ], { encoding: 'utf8', env: { ...process.env, WRANGLER_LOG_PATH: process.env.WRANGLER_LOG_PATH || '/tmp/splatter-fi-report-wrangler.log' } });
  if (result.error || result.status !== 0) {
    process.stderr.write('Could not read the report. Check Cloudflare login and WRANGLER_BIN.\n');
    process.exit(1);
  }
  const parsed = JSON.parse(result.stdout);
  results.push(parsed.flatMap(item => item.results || []));
}
process.stdout.write(JSON.stringify({
  experiment: 'fi-demand-2026-01',
  measurement: 'Consented browser sessions, not all visits or unique people. QA is excluded. Baseline has no offer version.',
  cohorts: results[0],
  confirmedWithoutSessionMeasurement: results[1]?.[0]?.confirmed_without_session_measurement || 0,
  countries: results[2],
}, null, 2) + '\n');
