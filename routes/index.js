var express = require('express');
var router = express.Router();


var mysql = require('promise-mysql');

var dbconfig   = require('./config/db.js');
pool = mysql.createPool(dbconfig);

router.get('/', function(req, res){
    var userNo = req.header('userNo')
    pool.query('SELECT form_no `formNo`, title , description, propose, due  FROM 16drop.form where store_no=1',[userNo]).
    then(function(rows) {
        res.send(rows[0]);
    })
        .catch(function (err) {
            res.send(err);
        })
});
router.get('/title', function(req, res){
    var userNo = req.header('userNo')
    pool.query('SELECT form_group_no `formGroupNo`, title, descript  FROM 16drop.form_group where form_no =1 order by form_group_no asc;',[userNo]).
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
    var itemVal=[];
    var promiseArr =[];
    var promiseArr2 =[];
    pool.query('SELECT form_group_no `formGroupNo`, title, descript  FROM 16drop.form_group where form_no =1 order by form_group_no asc;',[userNo]).
        then(function(row) {

            var query = ' select title, type , form_item_no "formItemNo" from form_item where form_group_no =?  order by number asc'
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
            var query = ' select ? "index",? "jindex", content ,score,description from select_item where form_item_no =? order by number asc'
            for(var i = 0; i<rows.length; i++) {
                for (var j = 0; j < rows[i].length; j++) {
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
                    returnVal[row[i][j].index].items[row[i][j].jindex].items= row[i]
                    if(i==row.length-1 && j == row[i].length)
                        return 1;
                }
        })
        .then(function (row) {
            res.send(returnVal)
        })
        .catch(function (err) {
            console.log(err)
            res.sendStatus(500);
        })
});
router.post('/answer',function (req, res) {
    var userNo = req.body.item;
    pool.query('SELECT form_group_no `formGroupNo`, title, descript  FROM 16drop.form_group where form_no =1 order by form_group_no asc;',[userNo]).
    then(function(rows) {
        res.send(rows);
    })
        .catch(function (err) {
            res.send(err);
        })
})
module.exports = router;
