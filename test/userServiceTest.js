/**
 * Created by YanJixian on 2015/10/30.
 */

var should = require('chai').use(require("chai-as-promised")).should();
var utils = require('./utils');
var path = require('path');
var User;
var userService;
describe('用户模块', function () {
    before('初始化', function () {
        User = process.core.db.models.User;
        userService = require(path.join(utils.getProjectRoot(), 'service/userService'));
    });

    //beforeEach('清理User表', function (done) {
    //    return User.destroy().then(done);
    //});

    //afterEach('清理User表', function (done) {
    //    return User.destroy().then(done);
    //});

    //after('after', function () {
    //
    //});

    it('create建立用户', function () {
        return userService.create({
            firstName:1,
            lastName:2
        }).then(function (db) {
           db.firstName.should.equal('1');
        });

    });
});