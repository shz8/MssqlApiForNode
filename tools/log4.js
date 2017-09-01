var log4js = require('log4js');
log4js.configure({
    appenders: {
        out: { type: 'console' }, //控制台输出
        normal: { type: 'file', filename: 'logs/normal.log' }
    },
    categories: {
        default: { appenders: ['out', 'normal'], level: 'debug' },
        cmd: { appenders: ['normal'], level: 'debug' }
    }
});

var logger = log4js.getLogger();
module.exports = logger;