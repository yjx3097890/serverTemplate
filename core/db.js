/**
 * Created by Yang on 2014/10/30.
 */
var mongoose = require('mongoose');
var dbConfig = require('../config').dbConfig;
var fs = require('fs');
var path = require('path');
var db = module.exports = {};
var log = require('./Logger');



db.conn =  mongoose.createConnection(dbConfig.dbAddress,dbConfig.options);

db.conn.on('connected', function () {
    log.info("Mongoose connected to " + dbConfig.dbAddress);
});
db.conn.on('error', function (err) {
    log.error("Mongoose connection error: " + err);

});
db.conn.on('disconnected', function () {
    log.info("Mongoose disconnected .");
});

db.models = {};

db.loadModels = function(callback){
    var dir = path.join(__dirname,'../schema');
    fs.readdir(dir, function(err,files){
        files.forEach(function(file){
                if(file.split('Schema').pop() === '.js'){
                    var module = path.join(dir,file.split('.')[0]);
                    var Schema = require(module);
                    var Name = file.split('Schema')[0];
                    db.models[Name] = db.conn.model(Name,Schema);
                }
            });

        callback(err);
    });
};

