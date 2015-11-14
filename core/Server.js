/**
 * Created by yang on 15/1/8.
 */

var http = require('http');
var path = require('path');
var domain = require('domain');
var config = require('../config');
var express = require('express');
var utils = require('./utils');
var db = require('./db');
var log = require('./Logger');
var auth = require('./auth');
var contentDisposition = require('content-disposition');

module.exports = Server = function(name,port){
    this.name = name;//app name
    this.port = port;//app port
    this.utils = utils;
    this.config = config;
    this.log = log;
    this.app = express();
    this.server = http.createServer(this.app);
    process.core = this;
};

Server.prototype.exitProcess = function(){
    process.exit(1);
};

Server.prototype.loadRouters = function(){
    console.log(this.name + ' loadRouters doing nothing!');
};

Server.prototype.connectDB = function (callback) {
    var that = this;
    if (!process.core ) {
        process.core = this;
    }
    db.loadModels(function(err){
        that.db = db;
        callback(err);
    });
};

Server.prototype.useCookieParser = function(){
    /*
     * 启用cookie解析
     * */
    var cookieParser = require('cookie-parser');
    this.app.use(cookieParser(config.sessionKey));
};

Server.prototype.useBodyParser = function(){
    /*
     * 启动body解析
     * */
    var bodyParser = require('body-parser');
    var methodOverride = require('method-override');
    this.app.use(bodyParser.urlencoded({ extended: false, limit:10000000}));
    this.app.use(bodyParser.json({limit:10000000}));
    this.app.use(methodOverride());
};

Server.prototype.useMulterUpload = function(){
    /*
     * 上传设置
     * */
    var multer  = require('multer');
    var uploadPath = path.join(utils.getProjectRoot(),config.uploadPath);
    this.app.use(multer({
        dest : uploadPath
        //limits:{
        //    fileSize:10*1024*1024 //上传文件大小限制在10mb
        //},
        //rename: function (fieldname, filename, req, res) {
        //    return filename +"-" + Date.now();
        //}
    }));

    //静态文件路径
    this.app.use('/public', express.static(uploadPath));
};

Server.prototype.useSession = function(){
    /*
     * 启用session机制
     * */
    var session = require('express-session');
    this.app.use(session({
        secret: config.sessionKey,
        saveUninitialized: true,
        cookie: {httpOnly: false},
        resave: true}));

};



Server.prototype.useMongoSession = function(){
    /*
     * 将session存入mongodb防止应用意外重启
     *
     */
    var session = require('express-session');
    var MongoStore = require('connect-mongo')(session);
    var sessionStore =  new MongoStore({
        url:config.dbConfig.dbAddress,
        autoReconnect: true, // Default
        w: 1, // Default,
        ssl: false // Default
    });

    this.app.use(session({
        secret: config.sessionKey,
        saveUninitialized: true,
        resave: true,
        store:sessionStore
    }));
};

Server.prototype.useAuthenticate = function () {
    /*
     * 读取sid，设置session
     **/
    this.app.use(auth.authenticate());
};

Server.prototype.useCrossSetting = function(){
    /*
     *启用跨域限制
     **/
    this.app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With, sid");
        res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
        res.header('Access-Control-Allow-Credentials', true);
        res.header("X-Powered-By",'3.2.1');//预请求
        res.header("Access-Control-Max-Age",'1728000');
        if(req.method=="OPTIONS"){
            res.sendStatus(200);//让options请求快速返回
        }else{
            next();
        }
    });
};

Server.prototype.useCoreLogger = function(){
    this.app.use(this.log.logReq('dev'));
};

Server.prototype.useBusinessLogger = function(){
    this.app.use(this.log.logBusiness());
};

Server.prototype.loadFrontend = function(){
    //挂载前端路径
    this.app.use(express.static(path.join(utils.getProjectRoot(), 'public')));
};



Server.prototype.useXmlParse = function(){
    //启用xml解析
    var xmlParse = require('./utils/xmlParser');
    this.app.use(xmlParse);
};

//处理错误
Server.prototype.notFoundHandler = function () {
    this.app.use(function(req, res, next) {
        var err = new Error('请求未找到！');
        err.status = 404;
        next(err);
    });
};


//处理错误
Server.prototype.errHandler = function () {
    this.app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        if (err.status !== 404) {
            log.error(err.stack || err.message);
            res.result = {ok: false , desc: err.message};
            res.json({ok: false, message: err.message});
        } else {
            res.send(err.message);
        }
    });
};


Server.prototype.uncaughtExceptionHandler = function () {
    var that = this;
    this.app.use(function( req, res, next) {
        var reqDomain = domain.create();
        reqDomain.on('error', function (err) {
            that.log.error('error when exit', err.stack);
            try {
                var killTimer = setTimeout(function () {
                    process.exit(1);
                }, 10000);
                killTimer.unref();

                that.server.close();

                res.sendStatus(500);
            } catch (e) {
                that.log.error('error when exit', e.stack);
            }
        });

        reqDomain.run(next);
    });

    // uncaughtException 避免程序崩溃
    process.on('uncaughtException', function (err) {
        that.log.error(err);

        try {
            var killTimer = setTimeout(function () {
                process.exit(1);
            }, 10000);
            killTimer.unref();

            that.server.close();
        } catch (e) {
            that.log.error('error when exit', e.stack);
        }
    });
};

Server.prototype.handleError = function () {
    this.notFoundHandler();
    this.errHandler();
};

Server.prototype.createAdmin = function () {
    var userService = require('../modules/service/userService');
    var admin = config.admin;
    userService.getByUsername(admin.username, function (err, dbUser) {
        if (err) log.error(err);
        if (!dbUser) {
            userService.create(admin,function (err) {
                if (err) log.error(err);
            });
        }
    });
};

Server.prototype.runServer = function(){
    var scope = this;
    var port =  this.port;
    var log = this.log;
    this.server.listen(port,function(){
        log.info(scope.name + ' is listening on port ' + port);
    });
};

Server.prototype.init = function(){
    console.log(this.name + ' init doing nothing!');
};

Server.prototype._init = function (callback) {
    this.init();
    this.loadRouters();
    this.handleError();
    callback();
};

Server.prototype.run = function(){
    var scope = this;
    scope.connectDB(function(err){
        if(!err){
            scope._init(function(){
            //    scope.createAdmin();
                scope.runServer();
            });
        }else{
            scope.exitProcess();
        }
    });
};










