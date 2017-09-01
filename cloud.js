let tools = require('./tools');
let app = require('./cloudinit');
let pro = require('./apirouter');
app.use('/api', pro);
var server = app.listen(3001, function () {
    var host = server.address().address;
    var port = server.address().port;
    tools.logger.info('Example app listening at http://%s:%s', host, port);
});