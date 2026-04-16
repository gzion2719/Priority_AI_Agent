import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function getHeaders(): Record<string, string> {
  const user = process.env.PRIORITY_USERNAME;
  const pass = process.env.PRIORITY_PASSWORD;

  if (!user || !pass) throw new Error('PRIORITY_USERNAME and PRIORITY_PASSWORD must be set');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
  };

  if (process.env.PRIORITY_APP_ID) headers['X-App-Id'] = process.env.PRIORITY_APP_ID;
  if (process.env.PRIORITY_APP_KEY) headers['X-App-Key'] = process.env.PRIORITY_APP_KEY;

  return headers;
}

export async function priorityGet(path: string, debug = false): Promise<unknown> {
  const base = process.env.PRIORITY_SERVICE_ROOT;
  if (!base) throw new Error('PRIORITY_SERVICE_ROOT must be set');

  const url = `${base}/${path}`;
  const headers = getHeaders();

  if (debug) headers['X-App-Trace'] = '1';

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Priority API ${res.status}: ${body}`);
  }

  return res.json();
}
