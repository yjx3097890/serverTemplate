/**
 * Created by wangziwei on 2015/7/15.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');


module.exports = UserSchema = new Schema({
    username:{
        type : String,
        desc : '用户名',
        unique: true
    },
    password:{
        type : String,
        desc : '登录密码',
        set: function (str) {
            if (!str) {
                return '';
            }
            var hmac = crypto.createHmac('sha1', process.core.config.pwdKey);
            hmac.update(str);
            return hmac.digest('hex');
        }
    },
    online:{
        type : Boolean,
        default : false,
        desc : '在线状态'
    },
    label:{
        type : String,
        desc : '个人签名',
        default : ''
    },
    name:{
        type : String,
        desc : '姓名',
        default : ''
    },
    image:{
        type : String,
        desc : '头像'
    },
    weixin:{
        type : String,
        desc : '微信',
        default : ''
    },
    address:{
        type: String,
        desc: '地址',
        default: ''
    },
    IDCardNumber:{
        type: String,
        desc: '身份证号',
        default: ''
    },
    account:{
        type: String,
        desc: '账户',
        default: ''
    },
    phone:{
        type : String,
        desc : '电话',
        default : ''
    },
    email:{
        type : String,
        desc : '邮箱',
        default : ''
    },
    birthday:{
        type : Date,
        desc : '生日',
        default : new Date()
    },
    occupationName:{
        type : String,
        desc : '职位',
        default : ''
    },
    level:{
        type : Number,
        desc : '级别,0-管理员, 1-项目负责人, 2-内部用户,3-外部用户'
    },
    points:{
        type : Number,
        default : 0,
        desc : '积分'
    }
});
