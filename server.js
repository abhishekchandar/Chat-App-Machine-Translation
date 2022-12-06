var http = require("http");
var fs = require("fs");
var path = require("path");
const { callbackify } = require("util");
const APP_PORT = process.env.APP_PORT || 3000;
const app = http.createServer(requestHandler);
fs = require('fs');


app.listen(APP_PORT);
console.log(`🖥 HTTP Server running at ${APP_PORT}`);

// https://stackoverflow.com/questions/65054067/return-result-from-python-script-in-node-js-child-process
function modelInitialize(incomingMsg,langList,users) {
  return new Promise((resolve,reject) => {

    const destSocketId = Object.keys(users).find(key => users[key] === incomingMsg.destusername);
    var spawn = require("child_process").spawn;
    // fs.writeFile('input.txt', incomingMsg.message,'utf-8', function (err) {
    //   if (err) return console.log(err);
    //   // console.log('Hello World > input.txt');
    // });
    const process = spawn('python',["./M2MInference.py",
                incomingMsg.message,langList[incomingMsg.user],langList[destSocketId]]);
    var result = '';
    process.stdout.on('data', function(data) {
      result += data.toString();
    });
    process.on('close' , function(code) {
      // fs.readFile('output.txt', 'utf8', function(err, dataFromFile) {
      //   if (err) throw err;
      //   resolve(dataFromFile)
      // });
      console.log(result)
      resolve(result)
  });
  process.on('error' , function(err){
      reject(err)
  });
  });
};

// handles all http requests to the server
function requestHandler(request, response) {
  console.log(`🖥 Received request for ${request.url}`);
  // append /client to serve pages from that folder
  var filePath = "./client" + request.url;
  if (filePath == "./client/") {
    // serve index page on request /
    filePath = "./client/index.html";
  }
  var extname = String(path.extname(filePath)).toLowerCase();
  console.log(`🖥 Serving ${filePath}`);
  var mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };
  var contentType = mimeTypes[extname] || "application/octet-stream";
  fs.readFile(filePath, function (error, content) {
    if (error) {
      if (error.code == "ENOENT") {
        fs.readFile("./client/404.html", function (error, content) {
          response.writeHead(404, { "Content-Type": contentType });
          response.end(content, "utf-8");
        });
      } else {
        response.writeHead(500);
        response.end("Sorry, there was an error: " + error.code + " ..\n");
      }
    } else {
      response.writeHead(200, { "Content-Type": contentType });
      response.end(content, "utf-8");
    }
  });
}

// SOCKET.IO CHAT EVENT HANDLING
const io = require("socket.io")(app, {
  path: "/socket.io",
});

io.attach(app, {
  // includes local domain to avoid CORS error locally
  // configure it accordingly for production
  cors: {
    origin: "http://localhost",
    methods: ["GET", "POST"],
    credentials: true,
    transports: ["websocket", "polling"],
  },
  allowEIO3: true,
});

var users = {};
var langList = {}

io.on("connection", (socket) => {
  console.log("👾 New socket connected! >>", socket.id);

  // handles new connection
  socket.on("new-connection", (data) => {
    // captures event when new clients join
    console.log(`new-connection event received`, data);
    // adds user to list
    users[socket.id] = data.username;
    langList[socket.id] = data.preferredLanguage;
    console.log("users :>> ", users);
    console.log("Selected Language:", data.preferredLanguage)
    // emit welcome message event
    socket.emit("welcome-message", {
      user: "server",
      message: `Welcome ${data.username}. Your preferred language is ${data.preferredLanguage}. There are ${
        Object.keys(users).length
      } users connected`,
    });
  });

  // handles message posted by client
  socket.on("new-message", (data) => {
    modelInitialize(data,langList,users).then(function(result) {
    console.log(`👾 new-message from ${data.user}`);
    console.log('RESULT =')
    console.log(result)
    // broadcast message to all sockets except the one that triggered the event
    socket.broadcast.emit("broadcast-message", {
      user: users[data.user],
      message: result,
    });
    })
  });
});

function getTokenString(data,langList) {
    var tokenString = ""
    langPreference = langList[data.user]
    if (langPreference === "eng") {
        tokenString = 'en'
    }
    else {
        tokenString = 'fr'
    }
    return tokenString
}