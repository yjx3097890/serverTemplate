/**
 * Created by YanJixian on 2015/8/14.
 */

var CronJob = require('cron').CronJob;
var File = process.core.db.models.File;
var fs = require('fs');
var utils = require('./utils');
var path = require('path');
var config = require('../config');
var async = require('async');
var log = process.core.log;

var job = new CronJob({
    cronTime: '00 00 4 * * 0-6',
    onTick: function() {
        /*
         * Runs every day
         * at 4:00:00 AM.
         */
        var uploadPath = path.join(utils.getProjectRoot(), config.uploadPath);
        var files = fs.readdirSync(uploadPath);
        var delNumber = 0;  // 删除文件数
        var total = 0;  //总文件数
        async.each(files,function (file, cb) {
            File.findOne({name: file}, function (err, dbFile) {
                if (!dbFile) {
                    fs.unlinkSync(path.join(uploadPath, file));
                    delNumber++;
                    cb(err);
                } else {
                    cb(err);
                }
            });
            total++;
        }, function (err) {
            if (err) {
                log.error(err.stack);
            } else {
                log.info('删除了：'+delNumber+'个文件.\n');
                log.info('剩余：'+(total-delNumber)+'个文件。');
            }
        });
    },
    start: false,  /* Start the job right now, not run. */
    timeZone: 'Asia/Shanghai'  /* Time zone of this job. */
});

job.start();


//if(require.main === module) {
//    console.log(path.join(utils.getProjectRoot(), config.uploadPath));
//} else {
//    console.log('xxx',require.main)
//    console.log( 'kkk',module)
//}