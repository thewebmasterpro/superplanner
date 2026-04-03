const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'] ?? 2;

function formatMessage(level, ...args) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`;
}

export const logger = {
  error: (...args) => currentLevel >= 0 && console.error(formatMessage('error', ...args)),
  warn: (...args) => currentLevel >= 1 && console.warn(formatMessage('warn', ...args)),
  info: (...args) => currentLevel >= 2 && console.log(formatMessage('info', ...args)),
  debug: (...args) => currentLevel >= 3 && console.log(formatMessage('debug', ...args)),
};
