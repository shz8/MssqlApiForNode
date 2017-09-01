var sql = require('mssql');
var cfg = require('../cloudConfig');

function sqlHelper() {
}
let dbParms = {}
let defautdb = cfg.dbConnection;
//执行存储过程
sqlHelper.exeDbProCkParms = function (connection, name, parms, success, error, appid) {
    let keyname = (appid || '') + '_' + name;
    if (!dbParms[keyname]) {
        sqlHelper.exeDbSql(connection, "select name=SUBSTRING(s.name,2,len(s.name)-1) from syscolumns s INNER JOIN sys.types T ON s.xtype = T.user_type_id where id = object_id('" + name + "')", {},
            function (d) {
                dbParms[keyname] = d[0];
                let ps = sqlHelper.getCheckParms(keyname, parms)
                sqlHelper.exeDbPro(connection, name, ps, success, error)
            }, error)
    }
    else {
        let ps = sqlHelper.getCheckParms(keyname, parms)
        sqlHelper.exeDbPro(connection, name, ps, success, error)
    }
}
//执行存储过程
sqlHelper.exeDbSqlCkParms = function (connection, sqltext, parms, success, error) {
    let ps = sqlHelper.getSqlParms(sqltext, parms)
    sqlHelper.exeDbSql(connection, sqltext, ps, success, error)
}
sqlHelper.getSqlParms = function (sqltext, parms) {
    if (!sqltext || !parms)
        return {}
    let ps = {};
    sqltext = sqltext.toLowerCase()
    for (let sp in parms) {
        let k = sp.toLowerCase();
        if (k.indexOf('@') < 0) k = '@' + k;
        if (sqltext.indexOf(k) > -1)
            ps[sp] = parms[sp]
    }
    return ps;
}
sqlHelper.getCheckParms = function (name, parms) {
    if (!dbParms[name] || !parms)
        return {}
    let ps = {};
    for (let sp in parms) {
        let k = sp.toLowerCase();
        if (k.indexOf('@') == 0) k = k.substring(1);
        for (let idx = 0; idx < dbParms[name].length; idx++) {
            if (k == dbParms[name][idx].name.toLowerCase()) {
                ps[sp] = parms[sp];
                break;
            }
        }
    }
    return ps;
}
sqlHelper.exeDbPro = function (connection, name, parms, success, error) {
    try {
        const pool1 = new sql.ConnectionPool("mssql://" + connection, err => {
            let req = pool1.request() // or: new sql.Request(pool1) 
            if (parms)
                for (let k in parms) {
                    req.input(k, parms[k])
                }
            req.execute(name, (err, result) => {
                if (err) {
                    typeof error == 'function' && error(err)
                }
                else {
                    if (result && typeof success == 'function') {
                        success(result.recordsets)
                    }
                }
            })
        })
        pool1.on('error', err => {
            typeof error == 'function' && error(err)
        })

    }
    catch (err) {
        typeof error == 'function' && error(err)
    }
}
//执行sql语句
sqlHelper.exeDbSql = function (connection, sqltext, parms, success, error) {
    try {
        const pool1 = new sql.ConnectionPool("mssql://" + connection, err => {
            let req = pool1.request() // or: new sql.Request(pool1) 
            if (parms)
                for (let k in parms) {
                    req.input(k, parms[k])
                }
            req.query(sqltext, (err, result) => {
                if (err) {
                    typeof error == 'function' && error(err)
                }
                else {
                    if (result && typeof success == 'function') {
                        success(result.recordsets)
                    }
                }
            })
        })
        pool1.on('error', err => {
            // ... error handler 
            typeof error == 'function' && error(err)
        })

    }
    catch (err) {
        typeof error == 'function' && error(err)
    }
}
//执行默认数据库连接存储过程
sqlHelper.exePro = function (name, parms, success, error) {
    if (sqlHelper.defautdb) {
        sqlHelper.exeDbPro(sqlHelper.defautdb, name, parms, success, error);
    }
    else {
        if (typeof error == 'function') {
            //err.message, errorcode: err.code, name: err.name
            error({ code: -10, name: 'exePro', message: '缺少默认数据库连接，请在config.js中配置!' })
        }
    }
}
//执行默认数据库连接sql
sqlHelper.exeSql = function (sqltext, parms, success, error) {
    if (defautdb) {
        sqlHelper.exeDbSql(defautdb, sqltext, parms, success, error);
    }
    else {
        if (typeof error == 'function') {
            error({ code: -10, name: 'exeSql', message: '缺少默认数据库连接，请在config.js中配置!' })
        }
    }
}
module.exports = sqlHelper;