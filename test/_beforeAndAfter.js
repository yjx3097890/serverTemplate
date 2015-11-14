/**
 * Created by yang on 15/1/26.
 */
var utils = require('./utils');
var Server = utils.getServer();

//测试覆盖查询
//require('blanket')({
//    //pattern: function (filename) {
//    //    return !/node_modules/.test(filename);
//    //}
//});

before('初始化系统', function(done){

    //初始化core模块，方便使用schema文件
    Server.prototype.connectDB.call(new Server(), function(err){
        done(err);
    });

});


//after('关闭数据库', function(done){
//
//    process.core.db.conn.close().then(done);
//
//});