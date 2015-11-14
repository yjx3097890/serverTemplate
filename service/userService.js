/**
 * Created by YanJixian on 2015/10/29.
 */

var User = process.core.db.models.User;

var utils = process.core.utils;
var async = require('async');

var userService = module.exports;

userService.create = function (user) {
     return User.create(user);
};

//userService.create({
//     lastName: 'last'
//});