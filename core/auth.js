/**
 * Created by YanJixian on 2015/7/28.
 */

var auth = module.exports;

auth.roles = function(roleArray){
    return function(req,res,next){
        if(req.session.user && roleArray.indexOf(req.session.user.level) > -1){
            next();
        }else if (!req.session.user) {
            res.status(403).json({ok: false, message: '用户未登录。'});
        } else {
            res.status(401).json({ok: false, message: '用户权限不足。'});
        }
    }
};

auth.authenticate = function () {

    return function auth(req, res, next) {

        var key = req.get('sid');
        req.session.getItem(key, function (user) {
                req.session.user = user;
                next();
        });

    };
};