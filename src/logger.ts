export function log(message: string, data?: Record<string, unknown>): void {
  const ts = new Date().toISOString();
  if (data) {
    console.log(`[${ts}] ${message}`, JSON.stringify(data));
  } else {
    console.log(`[${ts}] ${message}`);
  }
}

export function logError(error: unknown): void {
  console.error(error);
}
