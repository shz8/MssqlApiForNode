var config =
  {
    server: '106.14.1.1',
    user: 'sa',
    pwd: '',
    db: 'clouddata',
    userapi: 'http://136.100.100.35:8089/v1/',
    signTimeout:60 * 60 * 24 * 7,//测试用，不超过一周，单位秒
    timestampUnit:1,//时间戳单位，0=毫秒；1=秒；2=分钟；3=小时
  }
module.exports = config;
module.exports.dbConnection =  config.user + ':' + config.pwd + '@' + config.server + '/' + config.db;