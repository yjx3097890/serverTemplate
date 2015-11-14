/**
 * Created by yang on 15/1/12.
 */

var express = require('express');
var router = module.exports = express.Router();
var userService = require('../service/userService');
var async = require('async');
var roles = require('../../core/auth').roles;

var rolesAdmin = [0];
var rolesLeader = [0,1];
var rolesUser = [0,1,2,3];

/**
 * @api {get} /api/user/exist 用户是否存在
 * @apiName UserIsExist
 * @apiGroup User
 * @apiPermission 0-管理员
 *
 * @apiParam {String} username 用户名
 *
 * @apiSuccess {Boolean} ok 用户是否存在
 *
 */
router.get('/exist', roles(rolesAdmin),function (req, res, next) {
    var username = req.query.username;
    userService.getByUsername(username, function (err, dbUser) {
        if (err) {
            next(err);
        } else {
            res.json(dbUser ? {ok: true}: {ok: false});
        }
    });
});


/**
 * @api {post} /api/user 管理员添加用户
 * @apiName AddUser
 * @apiGroup User
 * @apiPermission 0-管理员
 *
 * @apiParam {String} username 用户名
 * @apiParam {String} password 密码
 * @apiParam {String} name 真实姓名
 * @apiParam {String} departmentId 所属部门Id
 * @apiParam {String} level 用户级别
 *
 * @apiSuccess {String} _id 用户id
 * @apiSuccess {String} username 用户名
 * @apiSuccess {String} name 真实姓名
 * @apiSuccess {String} departmentId 所属部门Id
 * @apiSuccess {String} level 用户级别
 * @apiSuccess {Number} points=0 用户积分
 * @apiSuccess {Number} online 在线状态
 * @apiSuccess {String} image=uploads/defaultAvatar.png 用户头像
 *
 */
router.post('',roles(rolesAdmin),function(req,res, next){
    userService.create(req.body, function (err, dbUser) {
        if(err){
            next(err);
        }else{
            res.result = {ok: true, target: dbUser._id, desc: '添加用户'};  //记录日志
        }
    });
});

/**
 * @api {get} /api/user/count 取得用户数
 * @apiName GetUserCount
 * @apiGroup User
 * @apiPermission all
 *
 * @apiParam {Object} [conditions = {}] 查询条件
 *
 * @apiSuccess {Number} count 符合条件的用户数
 *
 */
router.get('/count', function (req, res, next) {

    userService.userTotal(req.query.conditions || {}, function (err, count) {
        if(!err){
            res.json({ok: true, count:count})
        }else{
            next(err)
        }
    });
});

/**
 * @api {get} /api/user/search 按姓名查询用户列表
 * @apiName SearchUserListByName
 * @apiGroup User
 * @apiPermission all
 *
 * @apiParam {String} [name] 名字关键字
 *
 * @apiSuccess {Array} list 用户数组
 *
 */
router.get('search', function (req, res, next) {

    userService.queryByName(req.query.name, function (err, list) {
        if (err) {
            next(err);
        } else {
            res.result = {ok: true, desc: 'search列表'};
            res.json({ok: true, list:list});
        }
    });
});

/**
 * @api {get} /api/user/:userId 取得用户信息
 * @apiName GetUser
 * @apiGroup User
 * @apiPermission all
 *
 * @apiParam {String} userId 用户Id
 *
 * @apiSuccess {String} _id 用户id
 * @apiSuccess {String} username 用户名
 * @apiSuccess {String} name 真实姓名
 * @apiSuccess {String} label 个人签名
 * @apiSuccess {String} image 头像链接
 * @apiSuccess {String} weixin 微信号
 * @apiSuccess {String} email 邮箱
 * @apiSuccess {String} occupationName 职位
 * @apiSuccess {Date} birthday 生日
 * @apiSuccess {String} departmentId 所属部门Id
 * @apiSuccess {String} level 用户级别
 * @apiSuccess {Number} points=0 用户积分
 * @apiSuccess {Number} online 在线状态
 * @apiSuccess {String} IDCardNumber 身份证号
 * @apiSuccess {Number} account 账户
 *
 */
router.get('/:userId',function (req, res, next) {
    var userId = req.params.userId;
     userService.getById(userId, function (err, dbUser) {
         if (err) {
             next(err);
         } else {
             res.json(dbUser);
         }
     });
});


/**
 * @api {get} /api/user 取得用户列表
 * @apiName GetUserList
 * @apiGroup User
 * @apiPermission all
 *
 * @apiParam {Object} [conditions={}] 查询条件
 * @apiParam {String} [fields=""] 查询字段
 * @apiParam {Object} [options={}] 查询选项，分页、排序
 *
 * @apiParamExample {json} 分页请求用户name，image字段:
 *  {
 *      conditions: {},
 *      fields: "name image",
 *      options: {skip: 10,limit: 5}
 *  }
 *
 * @apiSuccess {Array} list 用户数组
 *
 */
router.get('', function (req, res, next) {

    userService.query(req.query, function (err, list) {
        if (err) {
            next(err);
        } else {
            res.result = {ok: true, desc: '查询列表'};
            res.json({ok: true, list:list});
        }
    });
});

/**
 * @api {put} /api/user 用户修改自己的信息
 * @apiName EditUserSelf
 * @apiGroup User
 * @apiPermission user
 *
 * @apiParam {String} [name] 真实姓名
 * @apiParam {String} [label] 个人签名
 * @apiParam {String} [image] 头像链接
 * @apiParam {String} [weixin] 微信号
 * @apiParam {String} [email] 邮箱
 * @apiParam {String} [occupationName] 职位
 * @apiParam {Date} [birthday] 生日
 * @apiParam {String} IDCardNumber 身份证号
 * @apiParam {Number} account 账户
 *
 * @apiSuccess {Boolean} ok 更新操作是否成功
 *
 */
router.put('',roles(rolesUser),function(req,res, next){
    var userId = req.session.user._id;
    userService.updateById(userId, req.body, function (err, dbUser) {
        if(!err){
            res.result = {ok: true, target: userId, desc: '更新用户'};
            res.json({ok:true});

            io.sockets.emit('UpdateUser_SIG', {type:'modify', body:dbUser});
        }else{
            next(err);
        }
    });
});

/**
 * @api {put} /api/user/:userId 管理员修改用户信息
 * @apiName EditUser
 * @apiGroup User
 * @apiPermission admin
 *
 * @apiParam (params) {String} userId 用户Id
 *
 * @apiParam (body) {String} [name] 真实姓名
 * @apiParam (body) {String} [label] 个人签名
 * @apiParam (body) {String} [password] 密码
 * @apiParam (body) {String} [image] 头像链接
 * @apiParam (body) {String} [weixin] 微信号
 * @apiParam (body) {String} [email] 邮箱
 * @apiParam (body) {String} [occupationName] 职位
 * @apiParam (body) {Date} [birthday] 生日
 * @apiParam (body) {String} [departmentId] 部门Id
 * @apiParam (body) {String} [level] 用户级别
 * @apiParam (body) {Number} [points=0] 用户积分
 *
 * @apiSuccess {Boolean} ok 更新操作是否成功
 *
 */
router.put('/:userId',roles(rolesAdmin),function(req,res, next){
    var userId = req.params.userId;
    userService.updateById(userId, req.body, function (err, dbUser) {
        if(!err){
            res.result = {ok: true, target: userId, desc: '管理员更新用户'};
            res.json({ok:true});

            io.sockets.emit('UpdateUser_SIG', {type:'modify', body:dbUser});
        }else{
            next(err);
        }
    });
});

/**
 * @api {put} /api/user/department/:userId 管理员修改用户部门
 * @apiName EditUserDepartment
 * @apiGroup User
 * @apiPermission admin
 *
 * @apiParam (params) {String} userId 用户Id
 *
 * @apiParam (body) {String} departmentId 部门Id
 *
 * @apiSuccess {Boolean} ok 更新操作是否成功
 *
 */
router.put("/department/:userId",roles(rolesAdmin), function (req, res, next) {
    var userId = req.params.userId;
    userService.assignUserToDepartmentById(userId, req.body.departmentId, function (err, dbUser) {
        if(!err){
            res.result = {ok: true, target: userId, desc: '更新用户部门'};
            res.json({ok:true});

            io.sockets.emit('UpdateUser_SIG', {type:'modify', body:dbUser});
        }else{
            next(err);
        }
    });
});

/**
 * @api {delete} /api/user/:userId 删除用户
 * @apiName DeleteUser
 * @apiGroup User
 * @apiPermission admin
 *
 * @apiParam {String} userId 需要删除的用户id
 *
 * @apiSuccess {Boolean} ok 删除操作是否成功
 *
 */
router.delete("/:userId",roles(rolesAdmin), function (req, res, next) {
    var userId = req.params.userId;
    userService.deleteById(userId,function(err){
        if(err){
            next(err);
        }else{
            res.result = {ok: true, target: userId, desc: '删除用户'};
            res.json({ok:true});

            io.sockets.emit('UpdateUser_SIG', {type:'delete', _id:userId});

        }
    });
});

/**
 * @api {post} /api/user/login 用户登录
 * @apiName UserLogin
 * @apiGroup User
 * @apiPermission all
 *
 * @apiParam {String} username 用户名
 * @apiParam {String} password 密码
 *
 * @apiSuccess {Boolean} ok=true 登录成功
 * @apiSuccess {User} value 登录用户信息
 * @apiSuccess {String} sid sessionId
 *
 * @apiError (401) {Boolean} ok=false 登录失败
 * @apiError (401) {String} message 登录失败消息
 *
 */
router.post('/login', function (req, res, next) {
    userService.login(req.body.username, req.body.password, function (err, result) {
        if(!err){
            if(result.ok){
                result.sid = req.session.setItemAuto(result.value.toObject());
                res.json(result);
                if(result.value.online) {
                    io.sockets.emit('secondaryLogon', {"Id": result.value._id});
                }
            }else{
                res.json(result);
            }
        }else{
            next(err);
        }
    });
});

/**
 * @api {post} /api/user/logout 退出登录
 * @apiName UserLogout
 * @apiGroup User
 * @apiPermission all
 *
 *
 * @apiSuccess {Boolean} ok=true 退出成功
 *
 */
router.get('/logout',function(req,res,next){
        req.session.removeItem(req.session.user.sid);
        res.json({ok:true});
});