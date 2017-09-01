# 基于nodejs开发的通用api,集成Oauth2

便捷的将mssql存储过程开放为webapi，或做一些简单配置，将sql操作语句开放为api。前面已经已经开发了一套c#版的，使用起来还是挺方便的，现在改为nodejs实现。
主要表有两张：
1、CloudData.App应用信息表：[AppID]=应用ID,[AppName]=应用名称 ,[AppKey]=应用密钥 ,[DBName]=应用使用的数据库 ,[DBConnection]=应用使用的数据库连接（格式如：帐号:密码@服务器地址/数据库）,[Status]=状态：1正常、0停用 ,[createAt]=创建时间 ,[updateAt]=最后更新时间。所有应用都需要在App表中注册。调用Api时AppID在header或url中传递。并使用AppKey做签名sign，sign=md5(Appkey+时间戳)_时间戳，其中时间戳为当前时间的秒数。
2、Api采用白名单制，所有可使用用的Api存放在各App自己数据库的ApiList表中。[SerialNo]=序号,[ApiName]=api名称，调用时使用该名称,[ApiType]=api类型，现有sql（sql语句）和pro（存储过程）两种,[Status]=状态1正常、0暂停,[CreateTime]=创建时间,[Remark]=api的说明,[ApiText]=api要执行的sql语句（对ApiType=sql）或api要执行的存储过程（对apitype=pro）
入口为cloud.js
