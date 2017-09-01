var express = require('express');
var cfg = require('./cloudConfig');
var sql = require('mssql');
let tools = require('./tools');
var router = express.Router();
var md5 = require("md5")
let apps = {};
//初始化数据
async function getApps() {
    apps = {}
    tools.sql.exeSql("select * from App", {},
        function (d) {
            if (d && d.length > 0 && d[0].length > 0) {
                d = d[0];
                for (let idx = 0; idx < d.length; idx++) {
                    apps[d[idx].AppID] = d[idx]
                }
            }
        },
        function (err) {
            tools.logger.error(err)
        })
}
async function init() {
    await getApps();
}
init();
// 该路由使用的中间件
router.use(function timeLog(req, res, next) {
    if (req.body && req.body.errorcode) {
        res.send(req.body);
        return
    }
    let appid = req.headers['appid'] || req.query['appid'];
    let app = apps[appid];
    if (app == null) {
        res.send({ errorcode: -10, errorinfo: '根据appid【' + (appid || '') + '】未找到应用信息！' });
        return
    }
    let einfo = { errorcode: -12, errorinfo: '缺少必须的签名或签名错误，请在header或url中添加sign参数,sign={32小写md5(AppKey+Time)}_{时间戳10位（单位秒）}！' }
    let sign = req.headers['sign'] || req.query['sign'];
    if (sign == null) {
        res.send(einfo);
        return
    }

    let ss = sign.split('_')
    if (ss.length != 2) {
        res.send(einfo);
        return
    }
    let t = parseInt(ss[1])
    if (isNaN(t)) {
        einfo.errorinfo = '时间戳必须为时间的秒数！'
        res.send(einfo);
        return
    }
    let timestampUnit = 1;
    switch (cfg.timestampUnit) {
        case 1:
            timestampUnit = 1000
            break
        case 2:
            timestampUnit = 1000 * 60
            break;
        case 3:
            timestampUnit = 1000 * 60 * 60
            break
    }
    let diff = parseInt(Date.now() / timestampUnit) - t
    if (Math.abs(diff) > cfg.signTimeout) {
        einfo.errorinfo = '时间戳不能超过10分钟！'
        res.send(einfo);
        return
    }
    let md5sign = md5(app.AppKey + ss[1])
    //暂不对时间戳time的有效性进行验证    
    if (md5sign != ss[0]) {
        res.send(einfo);
        return
    }
    next();
});
router.use('/refresh', async function (req, res) {
    await getApps()
    res.send({'info':'刷新命令已发送，可以重新调用了。。。'})
})
router.use('/:name', function (req, res) {
    //获取存储过程所有参数
    try {
        let proname = req.params.name;
        let appid = req.headers['appid'] || req.query['appid'];
        let app = apps[appid];
        var data = req.method == 'POST' ? req.body : req.query;
        const conn = app.DBConnection || cfg.dbConnection
        var rlt;
        tools.sql.exeDbSql(conn, 'select top 1 * from ApiList where ApiName=@name', { 'name': proname },
            function (d) {
                if (d && d.length > 0 && d[0].length > 0 && d[0][0]) {
                    d = d[0][0]
                    proname = d.ApiText || d.ApiName
                    if (d.ApiType == 'pro') {
                        tools.sql.exeDbProCkParms(conn, proname, data,
                            function (d1) {
                                let rlt = convertDataSet2Object(d1)
                                res.send(rlt)
                                return
                            },
                            function (err) {
                                tools.logger.error('router', err)
                                res.send({ errorinfo: err.message, errorcode: err.code, name: err.name })
                                return
                            }, appid)
                    }
                    else if (d.ApiType == 'sql') {
                        tools.sql.exeDbSqlCkParms(conn, proname, data,
                            function (d1) {
                                let rlt = convertDataSet2Object(d1)
                                res.send(rlt)
                                return
                            },
                            function (err) {
                                tools.logger.error('router', err)
                                res.send({ errorinfo: err.message, errorcode: err.code, name: err.name })
                                return
                            })
                    }
                    else {
                        res.send({ errorcode: -11, errorinfo: '请在表tableCondition，tablename=【' + proname + '】的记录，optype=【' + d.ApiType + '】配置错误！' });
                        return;
                    }
                }
                else {
                    res.send({ errorcode: -11, errorinfo: '请在表tableCondition中配置tablename=【' + proname + '】的记录！' });
                    return;
                }
            },
            function (err) {
                tools.logger.error('router', err)
                res.send({ errorinfo: err.message, errorcode: err.code, name: err.name })
                return
            }
        )
    }
    catch (err) {
        tools.logger.error('router', err)
        res.send({ errorinfo: err.message, errorcode: err.code, name: err.name })
        return
    }
});
function convertDataSet2Object(result) {
    //配置表改为放在最后，兼容以前的
    try {
        let rlt = {};
        let l = result.length - 1;
        if (result.length > 0 && result[l].length > 0 && result[l][0].isconfig == 1) {
            if (result[l][0].isroot == 1) {
                rlt = result[result[l][0].tableIdx];
            }
            else {
                for (let i = 0; i < result[l].length; i++) {
                    let d = result[result[l][i].tableIdx];
                    switch (result[l][i].dataType) {
                        case 1:
                            if (d && d.length > 0) {
                                d = d[0];
                            }
                            else
                                d = {};
                            break;
                        case 2:
                            if (d && d.length > 0) {
                                for (var k in d[0]) {
                                    d = d[0][k];
                                    break;
                                }
                            }
                            else
                                d = '';
                            break;
                        default:
                    }
                    rlt[result[l][i].tableName] = d;
                }
            }
        }
        else
            rlt = result;
        return rlt;
    }
    catch (err) {
        return result
    }
}
module.exports = router;