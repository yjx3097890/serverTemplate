/**
 * Created by YanJixian on 2015/7/15.
 */


var path = require('path');

var utils = module.exports;

utils.getProjectRoot = function(){
    return path.join(__dirname,'../');
};

utils.getServer = function(){
    return require(path.join(utils.getProjectRoot(),'core/Server'));
};

utils.getConfig = function () {
    return require(path.join(utils.getProjectRoot(),'config'));
};

utils.clone = function (obj) {
    var clone = {};
    for (var key in obj) {
        if (obj.hasOwnProperty(key) ) {
            clone[key] = obj[key];
        }
    }
    return clone;
};

utils.encryptStr = function (str) {
    if (!str) {
        return '';
    }
    var hmac = require('crypto').createHmac('sha1', utils.getConfig().pwdKey);
    hmac.update(str);
    return hmac.digest('hex');
};

utils.randomId = function () {
    var arr = [0,1,2,3,4,5,6,7,8,9,'a', 'b','c','d', 'e', 'f'];
    var r=0;
    var result = '';
    for (var i=0; i < 24; i++) {
        r = 16 * Math.random() << 0;
        result += arr[r];
    }
    return result;
};

if(require.main === module){
    console.log(utils.getProjectRoot());
}