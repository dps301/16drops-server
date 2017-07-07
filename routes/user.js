var express = require('express');
var router = express.Router();
var mysql = require('promise-mysql');

var dbconfig   = require('./config/db.js');
pool = mysql.createPool(dbconfig);
/* GET users listing. */
router.get('/', function(req, res, next) {
  pool.query('select user_no "userNo", name, age, sex, email, phone, type from user ',[])
      .then(function (rows) {
          res.json(rows)
      })
});
router.post('/', function(req, res, next) {
  var name = req.body.name;
  var age = req.body.age;
  var sex = req.body.sex;
  var email = req.body.email;
  var phone = req.body.phone;
  var type = req.body.type;
  pool.query('insert into user (name, age, sex,email,phone, type) values(?,?,?,?,?,?) ',[name,age,sex,email.phone,type])
      .then(function (rows) {
          res.json(rows)
      })
});

module.exports = router;
