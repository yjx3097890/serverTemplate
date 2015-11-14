/**
 * Created by YanJixian on 2014/10/21.
 */

var winston = require('winston');
var config = require('../config');
var path = require('path');
var fs = require('fs');
var onFinished = require('on-finished');
var MongoDB = require('winston-mongodb').MongoDB;

var logPath = path.join(__dirname, config.logPath);

var Logger = (function () {

    var logger;

    return function Logger(options) {
        if (options) {
            this.format = options.format || 'dev';
        }

        //不存在就创建
        if ( !fs.existsSync(logPath) || !fs.statSync(logPath).isDirectory()) {
            fs.mkdirSync(logPath, 0777);
        }

        //系统日志
        this.sysLogger = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)({
                    colorize: true
                }),
                new (winston.transports.DailyRotateFile)({
                    level: 'info',
                    filename: path.join(logPath, 'info'),
                    datePattern: '-yyyy-MM-dd.log',
                    name: 'info'
                }),
                new (winston.transports.DailyRotateFile)({
                    level: 'error',
                    filename: path.join(logPath, 'error'),
                    datePattern: '-yyyy-MM-dd.log',
                    name: 'error'
                })
            ]
        });


        //业务日志
        this.useLogger = new winston.Logger({
            transports: [
                new MongoDB(config.logDB)
            ]
        });

        //单例
        if (!logger) {
            logger = this;
            return this;
        } else {
            return logger;
        }
    }
})();


Logger.prototype = {
    construction: Logger,

    info: function () {
        var args = Array.prototype.slice.call(arguments, 0);
        args.unshift('info');
        this.sysLogger.log.apply(this.sysLogger, args);
    },

    warn: function () {
        var args = Array.prototype.slice.call(arguments, 0);
        args.unshift('warn');
        this.sysLogger.log.apply(this.sysLogger, args);
    },

    error: function () {
        var args = Array.prototype.slice.call(arguments, 0);
        args.unshift('error');
        this.sysLogger.log.apply(this.sysLogger, args);
    },

    logReq: function(f){
        this.setFormat(f);
        var that = this;
        var fmt = compile(exports[this.format]);
        return function (req, res, next) {
            req._startAt = process.hrtime();
            req._startTime = new Date();
            req._remoteAddress = exports['remote-addr'](req);

            function logRequest(err, res){
                var line = fmt(exports, req, res);
                if (null == line) return;
                if (err) {
                    that.sysLogger.error(err.stack);
                }
                if (res.statusCode >= 400) {
                    that.sysLogger.warn(line);
                } else {
                    that.sysLogger.info(line);
                }

            }

            onFinished(res, logRequest);

            next();
        };
    },

    //记录事务 :时间 管理员 XXX 行为  结果（成功）  TODO
    //res.result 是记录标志
    logBusiness: function () {
        var that  = this;

        return function (req, res, next) {

            var business = {createTime: Date.now()};
            business.user = exports['user'](req);
            business.action = exports['method'](req);
            business.remoteIp = exports['remote-addr'](req);

            onFinished(res, function (err , res) {
                if (!res.result || res.req.baseUrl.indexOf('log') > -1) {
                    return;
                }
                business.target = {
                    type: exports['part'](res.req),
                    target : res.result.target
                };
                business.result = res.result.ok;
                business.desc = res.result.desc;
                that.logToDB('info', business);
            });
            next();
        };
    },

    logToDB: function () {
        var args = Array.prototype.slice.call(arguments, 0);
        this.useLogger.log.apply(this.useLogger, args);
    },

    setFormat: function (fmt) {
        if (!fmt) {
            throw new Error('fmt must be in combined, common, dev, short, tiny');
        }else {
            this.format = fmt;
        }
        return this;
    }
};

module.exports = new Logger();


//来自morgan, 用于logReq
/**
 * Compile `format` into a function.
 *
 * @param {Function|String} format
 * @return {Function}
 * @api private
 */

function compile(format) {
    if (typeof format === 'function') {
        // already compiled
        return format
    }

    if (typeof format !== 'string') {
        throw new TypeError('argument format must be a function or string')
    }

    var fmt = format.replace(/"/g, '\\"')
    var js = '  return "' + fmt.replace(/:([-\w]{2,})(?:\[([^\]]+)\])?/g, function(_, name, arg){
        return '"\n    + (tokens["' + name + '"](req, res, "' + arg + '") || "-") + "';
    }) + '";';

    return new Function('tokens, req, res', js);
}

/**
 * Define a token function with the given `name`,
 * and callback `fn(req, res)`.
 *
 * @param {String} name
 * @param {Function} fn
 * @return {Object} exports for chaining
 * @api public
 */

exports.token = function(name, fn) {
    exports[name] = fn;
    return this;
};

/**
 * Define a `fmt` with the given `name`.
 *
 * @param {String} name
 * @param {String|Function} fmt
 * @return {Object} exports for chaining
 * @api public
 */

exports.format = function(name, fmt){
    exports[name] = fmt;
    return this;
};

/**
 * Apache combined log format.
 */

exports.format('combined', ':remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"')

/**
 * Apache common log format.
 */

exports.format('common', ':remote-addr - :remote-user [:date] ":method :url HTTP/:http-version" :status :res[content-length]')

/**
 * Short format.
 */

exports.format('short', ':remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms');

/**
 * Tiny format.
 */

exports.format('tiny', ':method :url :status :res[content-length] - :response-time ms');

/**
 * dev (colored)
 */

exports.format('dev', function(tokens, req, res){
    var color = 32; // green
    var status = res.statusCode;

    if (status >= 500) color = 31; // red
    else if (status >= 400) color = 33; // yellow
    else if (status >= 300) color = 36; // cyan

    var fn = compile('\x1b[0m:method :url \x1b[' + color + 'm:status \x1b[0m:response-time ms - :res[content-length]\x1b[0m');

    return fn(tokens, req, res);
});

/**
 * request url
 */

exports.token('url', function(req){
    return req.originalUrl || req.url;
});

/**
 * request method
 */

exports.token('method', function(req){
    return req.method;
});

/**
 * response time in milliseconds
 */

exports.token('response-time', function(req, res){
    if (!res._header || !req._startAt) return '';
    var diff = process.hrtime(req._startAt);
    var ms = diff[0] * 1e3 + diff[1] * 1e-6;
    return ms.toFixed(3);
});

/**
 * UTC date
 */
exports.token('date', function(){
    return new Date().toUTCString();
});

/**
 * response status code
 */
exports.token('status', function(req, res){
    return res._header ? res.statusCode : null;
});

/**
 * normalized referrer
 */
exports.token('referrer', function(req){
    return req.headers['referer'] || req.headers['referrer'];
});

/**
 * remote address
 */
exports.token('remote-addr', function (req) {
    return req.ip
        || req._remoteAddress
        || (req.connection && req.connection.remoteAddress)
        || undefined;
});


/**
 * HTTP version
 */
exports.token('http-version', function(req){
    return req.httpVersionMajor + '.' + req.httpVersionMinor;
});

/**
 * UA string
 */
exports.token('user-agent', function(req){
    return req.headers['user-agent'];
});

/**
 * request header
 */
exports.token('req', function(req, res, field){
    return req.headers[field.toLowerCase()];
});

/**
 * response header
 */
exports.token('res', function(req, res, field){
    return (res._headers || {})[field.toLowerCase()];
});

/**
 * session user
 */
exports.token('user', function(req){
    return (req.session && req.session.user);
});

/**
 * request part
 */
exports.token('part', function(req){
    var baseUrl = req.baseUrl;
    return baseUrl.substring(baseUrl.lastIndexOf('/')+1);
});
