/**
 * Zaakpay Transaction Flow Logger (krishi-shaktisewa)
 *
 * Same [ZP] / [ZP:STEP] format as server for end-to-end trace.
 * Steps: CHECKOUT, CALLBACK, REDIRECT
 *
 * To trace one payment: grep "TXN_ZP_123" or "ORDER_ZP_abc"
 */

const PREFIX = '[ZP]';

function ts(): string {
  return new Date().toISOString();
}

function kv(obj: Record<string, unknown> | undefined): string {
  if (!obj || typeof obj !== 'object') return '';
  return Object.entries(obj)
    .filter(([_, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
    .join(' ');
}

function tag(stepName: string): string {
  return stepName ? `[ZP:${stepName}]` : PREFIX;
}

/**
 * [ZP:STEP] txnId=... | message | key=val ...
 */
export function step(
  stepName: string,
  txnId: string | undefined,
  message: string,
  data?: Record<string, unknown>
): string {
  const parts = [ts(), `txnId=${txnId || '-'}`];
  const extra = kv(data);
  if (extra) parts.push(extra);
  const msg = `${tag(stepName)} ${parts.join(' ')} | ${message}`;
  console.log(msg);
  return msg;
}

/**
 * [ZP] generic log
 */
export function log(message: string, data?: Record<string, unknown>): string {
  const extra = kv(data);
  const msg = `${PREFIX} ${ts()} | ${message}${extra ? ' | ' + extra : ''}`;
  console.log(msg);
  return msg;
}

/**
 * [ZP] [ERROR] ...
 */
export function err(
  message: string,
  errObj?: unknown,
  data?: Record<string, unknown>
): string {
  const parts = [ts()];
  const extra = kv(data);
  if (extra) parts.push(extra);
  const errMsg = errObj && typeof errObj === 'object' && 'message' in errObj
    ? String((errObj as Error).message) : '';
  let msg = `${PREFIX} [ERROR] ${parts.join(' ')} | ${message}`;
  if (errMsg) msg += ` | error=${errMsg}`;
  console.error(msg);
  if (errObj && typeof errObj === 'object' && 'stack' in errObj) {
    console.error((errObj as Error).stack);
  }
  return msg;
}

/**
 * Phase separator for callback/checkout start
 */
export function phase(
  stepName: string,
  txnId: string | undefined,
  title: string,
  data?: Record<string, unknown>
): string {
  const extra = kv(data);
  const line = `${tag(stepName)} ========== ${title} ========== txnId=${txnId || '-'} ${extra}`;
  console.log(line);
  return line;
}

export const zplog = { step, log, err, phase, PREFIX, tag };
