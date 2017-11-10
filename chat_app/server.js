var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var express = require('express');
var dl  = require('delivery');
var fs  = require('fs');
var fs2 = require("fs");
var userList = {};
app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css'));
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/fonts'));
app.use('/fonts', express.static(__dirname + '/node_modules/bootstrap/dist/fonts'));



app.get('/', function(req, res){
  res.sendFile(__dirname + '/client.html');
});


server.listen(3000, function(){
  console.log('listening on *:3000');
});

io.on('connection', function(socket){
  

  socket.on("typing", function(data){
    socket.broadcast.emit("typing", data);
  });

  socket.on('chat message', function(data, callback){
  	var msg = data.message.trim();
  	var date = new Date();
  	var time = date.getHours()+" : "+date.getMinutes();
  	if(msg.substr(0, 3) === "/w "){
  		msg = msg.substr(3);
  		var index = msg.indexOf(" ");
  		if(index != -1){
  			var name = msg.substr(0, index);
  			msg = msg.substr(index+1);
  			if(name in userList){
          if(data.hasFile){
           userList[name].emit('private_msg_with_file', {msg:msg, username: socket.username+" ---> "+name, timestamp: time, multimedia: data.file});
           userList[socket.username].emit('private_msg_with_file', {msg:msg, username: socket.username+" ---> "+name, timestamp: time, multimedia: data.file});
          }
          else{
            userList[name].emit('private_msg', {msg:msg, username: socket.username+" ---> "+name, timestamp: time});
            userList[socket.username].emit('private_msg', {msg:msg, username: socket.username+" ---> "+name, timestamp: time});
          }

  			}
  			else{
  				callback("Error. Please enter a valid chat name");
  			}
  			
  		}
  		else{
  			callback("Error. Please enter a message")
  		}
  		
  	}
  	else{

      if(data.hasFile){
        io.emit('add_chat_msg_to_list_with_file', {msg:msg, username: socket.username, timestamp: time, multimedia: data.file});
      }
      else{
          io.emit('add_chat_msg_to_list', {msg:msg, username: socket.username, timestamp: time});
      }
  	}
    
  });

  socket.on("new user", function(data, callback){
  	if(data in userList)
  		callback(false);
  	else{
  		callback(true);
  		socket.username = data;
  		userList[socket.username] = socket;
  		updateUserlist();
  		socket.broadcast.emit("connected_user", socket.username);
  	}
  });

  socket.on("disconnect", function(data){
      if(!socket.username) return;
      delete userList[socket.username];
      updateUserlist();
      socket.broadcast.emit("disconnected_user", socket.username);
    });

  function updateUserlist(){
  	io.emit("user list", Object.keys(userList));
  }


});