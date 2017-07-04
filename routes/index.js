var express = require('express');
var router = express.Router();


var mysql = require('promise-mysql');
var sql = require('mysql2');
var con = sql.createConnection({
    host     : '52.78.230.42',
    user     : 'root',
    password : '1234',
    port     : 3306,
    database : '16drop',
    connectionLimit: 50

});
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
    var returnVal;
    var itemVal=[];
    var promiseArr =[];
    pool.query('SELECT form_group_no `formGroupNo`, title, descript, operation  FROM 16drop.form_group where form_form_no =1 order by form_group_no asc;',[userNo]).
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
            var query = ' select ? "i",? "j", content ,score,description from select_item where form_item_form_item_no =? order by number asc'
            for(var i = 0; i<itemVal.length; i++){
                for( var j = 0; j <itemVal[i].length ; j++){
                    if(itemVal[i][j].type != 0){
                        pool.query(query,[i,j,itemVal[i][j].formItemNo])
                            .then(function (result) {
                                itemVal[result[0].i][result[0].j].choice = result;
                                console.log(itemVal[result[0].i][result[0].j])
                                console.log(result)
                                if(result[0].i==itemVal.length-1&&result[0].j==itemVal[itemVal.length-1].length-1){
                                    for(var i=0;i<returnVal.length;i++){
                                        returnVal[i].menu=itemVal[i]
                                        if( i == returnVal.length-1){
                                            res.send(returnVal)
                                        }
                                    }
                                }
                            }
                        )
                    }

                }
            }
        })
        .catch(function (err) {
            console.log(err)
            res.sendStatus(500);
        })
});
router.get('/order',function (req, res) {
    var storeNo = req.query.storeNo
    var status = req.query.status
    var returnVal;
    var query = 'SELECT form_group_no `formGroupNo` FROM 16drop.form_group where form_form_no =1 order by form_group_no asc'
    var promiseArr =[];
    pool.query(query)
        .then(function (row) {
            var query = ' select menu_name_en "name", price, cnt from order_detail where order_no =?'
            for(var i = 0; i<row.length; i++){
                promiseArr.push(pool.query(query,[row[i].orderNo]))
            }
            returnVal = row;
            return 0;
        })
        .then(function () {
            console.log(promiseArr);
            return Promise.all(promiseArr);
        })
        .then(function (rows) {
            console.log(rows)
            for(var i=0;i<rows.length;i++){
                returnVal[i].menu=rows[i]
            }
            res.send(returnVal)
        })
        .catch(function (err) {
            console.log(err)
            res.status(404).send(err);
        })
})
module.exports = router;
