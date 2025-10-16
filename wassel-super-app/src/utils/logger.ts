type LogMeta = Record<string, unknown> | undefined;

const isDev = typeof import.meta !== 'undefined' && !!import.meta.env?.DEV;

function format(message: string, meta?: LogMeta) {
  const time = new Date().toISOString();
  const base = `[Wassel] ${time} - ${message}`;
  if (!meta || Object.keys(meta).length === 0) return base;
  try {
    return `${base} | ${JSON.stringify(meta)}`;
  } catch {
    return base;
  }
}

export function logInfo(message: string, meta?: LogMeta) {
  if (isDev) console.info(format(message, meta));
}

export function logWarn(message: string, meta?: LogMeta) {
  if (isDev) console.warn(format(message, meta));
}

export function logError(message: string, meta?: LogMeta) {
  // Always log errors
  console.error(format(message, meta));
}
