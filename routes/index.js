var express = require('express');
var router = express.Router();


var mysql = require('promise-mysql');

var dbconfig   = require('./config/db.js');
pool = mysql.createPool(dbconfig);

router.get('/', function(req, res){
    var userNo = req.header('userNo')
    pool.query('SELECT form_no `formNo`, title , description, propose, due  FROM 16drop.form where store_no=1',[]).
    then(function(rows) {
        res.send(rows[0]);
    })
        .catch(function (err) {
            res.send(err);
        })
});
router.get('/title', function(req, res){
    var userNo = req.header('userNo')
    pool.query('SELECT form_group_no `formGroupNo`, title, descript, disp  FROM 16drop.form_group where form_no =1 order by form_group_no asc;',[]).
        then(function(rows) {
            res.send(rows);
        })
        .catch(function (err) {
            res.send(err);
        })
});

router.get('/items', function(req, res){
    var userNo = req.header('userNo')
    var returnVal;
    var returnVal2;
    var itemVal=[];
    var promiseArr =[];
    var promiseArr2 =[];
    var promiseArr3 =[];
    var total1=0;
    var total2=0;
    pool.query('SELECT form_group_no `formGroupNo`, title, descript, disp  FROM 16drop.form_group where form_no =1 order by form_group_no asc;',[]).
        then(function(row) {
            var query = ' select  title, type , form_item_no "formItemNo", `limit` from form_item where form_group_no =? and use_yn=1  order by number asc'
            for(var i = 0; i<row.length; i++){
                promiseArr.push(pool.query(query,[row[i].formGroupNo]))
            }
            returnVal = row;
            return 0;
        })
        .then(function () {
            return Promise.all(promiseArr);
        })
        .then(function (rows) {
            itemVal = rows;
            for(var i = 0 ; i< returnVal.length; i++){
                returnVal[i].items = rows[i];
            }
            var query = ' select ? "index",? "jindex", content ,score,description, select_item_no "no" from select_item where form_item_no =? order by number asc'

            for(var i = 0; i<rows.length; i++) {
                for (var j = 0; j < rows[i].length; j++) {
                    total1++;
                    promiseArr2.push(pool.query(query, [i,j,rows[i][j].formItemNo]))
                }
            }
            return Promise.all(promiseArr2);
        })
        .then(function (row) {
            // console.log(returnVal)
            for(var i = 0; i< row.length; i++)
                for(var j = 0; j<row[i].length; j++){
                // console.log(returnVal[0].items[0])
                // console.log(row[i][j].index,row[i][j].jindex)
                    returnVal[row[i][j].index].items[row[i][j].jindex].items= row[i];
                    if(i==row.length-1 && j == row[i].length)
                        return 1;
                }
        })
        .then(function (r) {
            return pool.query('select user_info_no "formItemNo", title, type from user_info where form_no =1 and use_yn=1',[]);;
        })
        .then(function (row) {
            var query = ' select user_info_select_no "no", content  from user_info_select where user_info_no =?  order by user_info_select_no asc'
            for(var i = 0; i<row.length; i++){
                total2++
                promiseArr3.push(pool.query(query,[row[i].formItemNo]))
            }
            returnVal2 = row;
            return 0;
        })
        .then(function () {
            return Promise.all(promiseArr3);
        })
        .then(function (rows) {
            itemVal = rows;
            for (var i = 0; i < returnVal2.length; i++) {
                returnVal2[i].items = rows[i];
            }
            return 0;
        })
        .then(function (row) {
            res.send({user:returnVal2,items:returnVal,total:total1+total2,userTotal:total2,itemsTotal:total1})
        })
        .catch(function (err) {
            console.log(err)
            res.sendStatus(500);
        })
});
router.post('/apply',function (req, res) {
    var user = req.body.user;
    var items = req.body.items;
    var userFormNo;
    var promiseArr = [];
    var promiseArr2 = [];

    console.log(req.body)

    pool.query('insert into user_form (form_no) values (1)',[])
        .then(function(rows) {
            userFormNo=rows.insertId
            for( var i = 0 ; i<user.length;i++){
                promiseArr.push(pool.query('insert into user_info_item (answer, user_form_no, user_info_no,title) values (?,?,?,?)',[user.answer,userFormNo,user.form_item_no,user.title]))
            }
            return 1;
        })
        .then(function (row) {
            for( var i = 0 ; i<items.length;i++){
                if(items[i].type == 2){
                    for(var j=0; j<items[i].no.length;j++){
                        promiseArr2.push(pool.query('insert into user_item (form_item_no, select_item_no, user_form_no) values (?,?,?)',[items[i].no[j].form_item_no,items[i].no[j].no,userFormNo]))
                    }
                } else {
                    promiseArr2.push(pool.query('insert into user_item (form_item_no, select_item_no, user_form_no) values (?,?,?)',[items[i].form_item_no,items[i].no,userFormNo]))
                }
            }
            return Promise.all(promiseArr);
        })
        .then(function (row) {
            return Promise.all(promiseArr2);
        })
        .then(function () {
            var let = 'insert into 16drop.user_form_result (user_form_no,con1,con2,con3,con4,con5,`check`,re1,re2,re3,re4,re5,re6)' +
                ' values' +
                ' (?,' +
                ' (select sum(a.score) from 16drop.select_item a , 16drop.form_item b , 16drop.user_item c where' +
                ' c.form_item_no = b.form_item_no' +
                ' and b.form_group_no=1' +
                ' and c.select_item_no = a.select_item_no' +
                ' and c.user_form_no=?),' +
                ' (select sum(a.score) from 16drop.select_item a , 16drop.form_item b , 16drop.user_item c where' +
                ' c.form_item_no = b.form_item_no' +
                ' and b.form_group_no=4' +
                ' and c.select_item_no = a.select_item_no' +
                ' and c.user_form_no=?),' +
                ' (select sum(a.score) from 16drop.select_item a , 16drop.form_item b , 16drop.user_item c where' +
                ' c.form_item_no = b.form_item_no' +
                ' and b.form_group_no=5' +
                ' and c.select_item_no = a.select_item_no' +
                ' and c.user_form_no=?),' +
                ' (select sum(a.score) from 16drop.select_item a , 16drop.form_item b , 16drop.user_item c where' +
                ' c.form_item_no = b.form_item_no' +
                ' and b.form_group_no=6' +
                ' and c.select_item_no = a.select_item_no' +
                ' and c.user_form_no=?),' +
                ' (select sum(a.score) from 16drop.select_item a , 16drop.form_item b , 16drop.user_item c where' +
                ' c.form_item_no = b.form_item_no' +
                ' and b.form_group_no=7' +
                ' and c.select_item_no = a.select_item_no' +
                ' and c.user_form_no=?' +
                ' ),' +
                ' (SELECT count(*) FROM 16drop.user_item where form_item_no = 26 and select_item_no = 55 and user_form_no=?)' +
                ' ,' +
                ' (select  d.result from 16drop.form_condition d where (select sum(a.score) from 16drop.select_item a , 16drop.form_item b , 16drop.user_item c where' +
                ' c.form_item_no = b.form_item_no' +
                ' and b.form_group_no=1' +
                ' and c.select_item_no = a.select_item_no' +
                ' and c.user_form_no=?) between d.mean-0.1 and d.max+0.1 and d.form_group_no = 1)' +
                ' ,' +
                ' (select  d.result from 16drop.form_condition d where (select sum(a.score) from 16drop.select_item a , 16drop.form_item b , 16drop.user_item c where' +
                ' c.form_item_no = b.form_item_no' +
                ' and b.form_group_no=4' +
                ' and c.select_item_no = a.select_item_no' +
                ' and c.user_form_no=?) between d.mean-0.1 and d.max+0.1 and d.form_group_no = 4)' +
                ' ,' +
                ' (select  d.result from 16drop.form_condition d where (select sum(a.score) from 16drop.select_item a , 16drop.form_item b , 16drop.user_item c where' +
                ' c.form_item_no = b.form_item_no' +
                ' and b.form_group_no=5' +
                ' and c.select_item_no = a.select_item_no' +
                ' and c.user_form_no=?) between d.mean-0.1 and d.max+0.1 and d.form_group_no = 5)' +
                ' ,' +
                ' (select  d.result from 16drop.form_condition d where (select sum(a.score) from 16drop.select_item a , 16drop.form_item b , 16drop.user_item c where' +
                ' c.form_item_no = b.form_item_no' +
                ' and b.form_group_no=6' +
                ' and c.select_item_no = a.select_item_no' +
                ' and c.user_form_no=?) between d.mean-0.1 and d.max+0.1 and d.form_group_no = 6)' +
                ' ,' +
                ' (select  d.result from 16drop.form_condition d where (select sum(a.score) from 16drop.select_item a , 16drop.form_item b , 16drop.user_item c where' +
                ' c.form_item_no = b.form_item_no' +
                ' and b.form_group_no=7' +
                ' and c.select_item_no = a.select_item_no' +
                ' and c.user_form_no=?) between d.mean-0.1 and d.max+0.1 and d.form_group_no = 7)' +
                ' ,(SELECT count(*) FROM 16drop.user_item where form_item_no = 26 and select_item_no = 55 and user_form_no=?)' +
                '' +
                '' +
                ')';
            console.log(let);
            return pool.query(let,[userFormNo,userFormNo,userFormNo,userFormNo,userFormNo,userFormNo,userFormNo,userFormNo,userFormNo,userFormNo,userFormNo,userFormNo,userFormNo])
        })
        .then(function (row) {
            res.send('ok')
        })
        .catch(function (err) {
            console.log(err)
            res.status(500).send(err);
        })
});
router.post('log',function (req, res) {
    console.log(req.body)
    res.send(req.body)
})
module.exports = router;
