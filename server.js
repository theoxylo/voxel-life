// var StaticServer = require('node-static').Server
// 
// var staticServer = new StaticServer('./')
// 
// require('http').createServer(function(request, response) {
//   request.addListener('end', function() {
//     console.log(request.url)
//     staticServer.serve(request, response)
//   })
// }).listen(8080)

var http = require('http');
var ecstatic = require('ecstatic');

http.createServer(
  ecstatic({ root: __dirname })
).listen(8080);

console.log('Listening on :8080');
