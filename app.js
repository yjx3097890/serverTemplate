/**
 * Created by Yang on 2014/10/8.
 */
var config = require('./config');
var Server = require('./core/Server');
var path = require('path');

var port = config.portConfig.server;
var site = new Server('site-server',port);



site.loadRouters = function(){
    var app = this.app;

    //app.use('/api/weather', require('./modules/api/weather'));


};

site.init = function(){
    this.useCoreLogger();
    this.loadFrontend();  //挂载前端
    this.useCookieParser();
    this.useBodyParser();
    this.useMulterUpload();
    this.useCrossSetting();
    this.useMongoSession();
    this.useAuthenticate();
    this.uncaughtExceptionHandler();

};



if (require.main === module) {
    site.run();
}