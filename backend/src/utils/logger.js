const PREFIX = '[backend]';

function timestamp() {
  return new Date().toISOString();
}

function format(level, args) {
  return [`${timestamp()} ${PREFIX} [${level}]`, ...args];
}

export const logger = {
  info: (...args) => console.log(...format('info', args)),
  warn: (...args) => console.warn(...format('warn', args)),
  error: (...args) => console.error(...format('error', args)),
  debug: (...args) => {
    if (process.env.DEBUG === 'true') {
      console.log(...format('debug', args));
    }
  },
};

export default logger;
