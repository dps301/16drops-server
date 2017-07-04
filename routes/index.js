var express = require('express');
var router = express.Router();


var mysql = require('promise-mysql');
var dbconfig   = require('./config/db.js');
pool = mysql.createPool(dbconfig);

router.get('/', function(req, res){
    var userNo = req.header('userNo')
    pool.query('SELECT form_no `formNo`, title , description, propose, due  FROM 16drop.form where store_store_no=1',[userNo]).
    then(function(rows) {
        res.send(rows[0]);
    })
        .catch(function (err) {
            res.send(err);
        })
});
router.get('/title', function(req, res){
    var userNo = req.header('userNo')
    pool.query('SELECT form_group_no `formGroupNo`, title, descript, operation  FROM 16drop.form_group where form_form_no =1 order by form_group_no asc;',[userNo]).
    then(function(rows) {
        res.send(rows);
    })
        .catch(function (err) {
            res.send(err);
        })
});
router.get('/items', function(req, res){
    var userNo = req.header('userNo')
    pool.query('SELECT form_group_no `formGroupNo`, title, descript, operation  FROM 16drop.form_group where form_form_no =1 order by form_group_no asc;',[userNo]).
    then(function(rows) {
        res.send(rows);
    })
        .catch(function (err) {
            res.send(err);
        })
});

module.exports = router;
