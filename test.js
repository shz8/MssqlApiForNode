let cfg = require('./cloudconfig');
var sql = require('mssql');
let helper = require('./sqlHelper');
var md5 = require('md5');
console.log(md5('A201603250031504181688'))
return
function getApps(idx) {
    try {
        const pool1 = new sql.ConnectionPool("mssql://" + cfg.dbConnection, err => {
            pool1.request() // or: new sql.Request(pool1) 
                .query('select * from App', (err, result) => {
                    // ... error checks       
                    if (err)
                        console.error(err)
                    else
                        console.info(idx, result)
                })
        })
        pool1.on('error', err => {
            // ... error handler 
            console.error(err)
        })

    } catch (err) {

    }
}
var start = function () {
    // 在这里使用起来就像同步代码那样直观
    let idx = 0;
    while (idx++ < 10) {
        helper.exePro('test', {},
            function (d) {
                console.log('pro',idx, d)
            },
            function (err) {
                console.log('pro',idx, err)
            })
        helper.exeSql('select * from App', {},
            function (d) {
                console.log('sql',idx, d)
            },
            function (err) {
                console.log('sql',idx, err)
            })
    }
};
function Person() {
    var age = 0;
    Object.defineProperty(this, "age", {
        get: function () { console.log("内部存储数据为:" + age); return new Date().getFullYear() - age; },
        set: function (value) { age = value; }
    });
}
start();