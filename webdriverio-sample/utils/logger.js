// logger.log - wrapper around tracer log library.

/**
 * Set the log level in specLogLevel in wdio.conf.js
 */
 const level = typeof browser !== 'undefined' && browser.config && browser.config.specLogLevel
 ? browser.config.specLogLevel
 : 'debug'; //'debug'     // trace|debug|log|info|warn|error

const colors = require('colors');
const logFormatting = {
 format: '{{file}}:{{line}}: <{{title}}>: {{message}}',
 dateformat: 'HH:MM:ss.L',
 methods: ['trace', 'debug', 'log', 'info', 'warn', 'error'],
 filters: {
     log: colors.cyan,
     trace: colors.magenta,
     debug: colors.blue,
     info: colors.green,
     warn: colors.yellow,
     error: [colors.red, colors.bold]
 },
 level: module.parent == null ? 'trace' : level
};

const logger = require('tracer').colorConsole(logFormatting);

if (module.parent == null) {
 logger.trace('trace');
 logger.debug('debug');
 logger.log('log');
 logger.info('info');
 logger.warn('warn');
 logger.error('error');
}

module.exports = logger;