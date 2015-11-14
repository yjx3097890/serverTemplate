/**
 * Created by yang on 14/12/9.
 */

var config = module.exports = {};
var mongoPort = 'localhost';
config.dbConfig ={

    dbAddress: 'mongodb://'+mongoPort+':27017/birthday',

    options:{
        server:{
            auto_reconnect:true,
            socketOptions:{
                keepAlive:3600000
            }
        }
    }
};

config.logDB ={
    db: 'mongodb://'+mongoPort+':27017/birthday',

    collection: 'logs',
    showLevel: false,
    options:{
        db: {native_parser: true},
        server:{
            poolSize: 2,
            auto_reconnect:true,
            socketOptions:{
                keepAlive:3600000
            }
        }
    }
};


config.admin={
    username: "admin",
    password: "123456",
    level:0,
    online: 0,
    label:'管理员是万能的',
    phone:'123456',
    weixin: '123456',
    name:'管理员'
};

config.portConfig = {
    server:1771
};

config.uploadPath = "uploads";

config.sessionKey = "123456";

config.pwdKey = 'iloveyou';


config.logPath = 'logs';



