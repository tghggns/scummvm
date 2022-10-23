const fs = require('fs');
const http = require('http');
const path = require('path');
const static = require('node-static');
const child_process = require('child_process');
const buildIndexScript = path.join('', 'build-make_http_index.js');

var address = "127.0.0.1";
var directory = '.';
var port = 8080;
var savePath = './saves';
const buildIndexArgs = ['-d', savePath, '-out', 'index.json'];

args=process.argv;
args.indexOf('-p') > -1 ? port=args[args.indexOf('-p') + 1] : null;
args.indexOf('-a') > -1 ? address=args[args.indexOf('-a') + 1] : null;
args.indexOf('-d') > -1 ? directory=args[args.indexOf('-d') + 1] : null;
args.indexOf('-sP') > -1 ? savePath=args[args.indexOf('-sP') + 1] : null;

var fileServer = new static.Server(directory);

http.createServer(function (request, response) {
  if (request.method == 'POST') {
    console.log('Received POST request from: ' + request.headers.origin);
    var body = '';
    request.on('data', function(data) {
      body += data;
    })
    request.on('end', function() {
      try{
        var jsonBody = JSON.parse(body);
        const jFileName = jsonBody['file'];
        const fullPath = path.join(savePath, jFileName);
        var jData = jsonBody['data'];
        const byteLength = jsonBody['byteLength'];
        var dataArr = new Uint8Array(byteLength);
        for(var i in jData){
          dataArr[parseInt(i)] = jData[i];
        }
        fs.writeFileSync(fullPath, dataArr);
        child_process.execSync("node " + buildIndexScript + " " + buildIndexArgs.join(' '));
        response.writeHead(200, {'s-Type': 'text/html'});
        response.end('success');
      }
      catch(e){
        console.log('Error ' + e);
        response.writeHead(400, {'s-Type': 'text/html'});
        response.end('Bad Request: ' + e);
      }
    })
  }
  else{
    request.addListener('end', function () {
      fileServer.serve(request, response, function (err, result) {
          if (err) { // There was an error serving the file
              console.error("Error serving " + request.url + " - " + err.message);
              // Respond to the client
              response.writeHead(err.status, err.headers);
              response.end();
          }
      });
    }).resume();
  }
}).listen(port, address);