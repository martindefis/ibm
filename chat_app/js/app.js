$(function ($) {

	var counter=0;
	var socket = io();
	var delivery = new Delivery(socket);
	var $messageList = $("#messageList");
	var $message = $("#my_msg");
	var $chatMessages = $("#chat_messages");
	var $chatForm = $("#chatForm");
	var $chatContainer = $("#chatContainer");
	var $userContainer = $("#userContainer");
	var $usernameForm = $("#userForm");
	var $username = $("#username");
	var $usernameError = $("#usernameError");
	var $usernameLabel = $("#username_label");
	var $sendFile = $("#file");
	var $privateZone = $("#private_zone"); $privateZone.css('visibility', 'hidden');
	var isFileAttached = false;


	$usernameForm.submit(function(e){
		e.preventDefault();
		var nickname = $username.val();
		if(nickname === "")
			$.notify("The chat name cannot be empty. Please, try again!", "info");
		else{
			socket.emit("new user", $username.val(), function(data){
			if(data){
				$userContainer.hide();
				$usernameLabel.text(nickname);
				$chatContainer.show();
			}
			else{
				$.notify("That chat name is already taken", "info");
			}
		});
		$username.val("");
		}
		
	});

	
	$chatForm.submit(function(event){
		event.preventDefault();
		if(isFileAttached){
		  var data = $("input[type=file]")[0].files[0];
	      var reader = new FileReader();
	      var chatMessage = $message.val();
	      reader.onload = function(evt){

	       socket.emit("chat message", 
	       		{message : chatMessage, hasFile: isFileAttached, file: evt.target.result}, function(data){
				$.notify(data, "error");
			});
	      };

      		reader.readAsDataURL(data);
		}
		else{
			socket.emit("chat message", {message : $message.val(), hasFile: isFileAttached}, function(data){
				$.notify(data, "error");
			});
		}

	  $message.val("");
	});
	


	$("#file").click(function(){
		isFileAttached = true;
	});


	function attachMutimediaFiles(file, parent){
		var type = file.substr(5, 5);
		if(type === "image"){
			var image = new Image();
			image.src = ""+file;
			parent.append(image);
		}
		else if(type === "audio"){
			var audio = document.createElement("AUDIO");
			audio.setAttribute("src", ""+file);
			audio.setAttribute("controls", "controls");
		 	//parent.append(audio);
		 	var newType = file.substr(5, 9); 
			if (audio.canPlayType(newType).length > 0) {
   				 parent.append(audio);
			}
			else{
				$.notify("This audio type is not supported yet!", "error");
			}
		}
		else if(type === "video"){
			var video = document.createElement("VIDEO");
			video.setAttribute("src", ""+file);
			video.setAttribute("controls", "controls");
			video.setAttribute("width", "320");
			video.setAttribute("height", "320");
			var newType = file.substr(5, 9); 
			if (video.canPlayType(newType).length > 0) {
   				 parent.append(video);
			}
			else{
				$.notify("This video type is not supported yet!", "error");
			}
		 	
		}
		else{
			$.notify("This type of file is not supported yet!", "error");
		}
		
		
		isFileAttached = false;
	}


	socket.on("user list", function(data){
		$("#number_online_users").html("<strong> Online Users ("+data.length+")</strong>");
		$("#online_users_ul").empty();
		for(i=0; i<data.length; i++){
			var el = document.createElement("li");
			el.innerHTML=""+data[i];
			el.id = el.textContent;
			el.className = "list-group-item";

			el.onmouseover = function(){
				$(this).css("cursor", "pointer");
			};

			el.onclick = function(event){
				var name = $(event.target).text();
				//alert("Action is on "+name);
				$message.val("/w "+name+" ");
				
			}

			$("#online_users_ul").append(el);
		}


	});

	

	socket.on("connected_user", function(data){
		$.notify(data+" has connected", "info");
	});

	socket.on("disconnected_user", function(data){
  		$.notify(data+" has disconnected", "info");
	});

	
	function appendElement(parent, data, isPrivate){
		var text;
		if(isPrivate)
			text = "<strong>"+data.username+" (PM)"+"</strong>"+" : "+data.msg;
		else
			text = "<strong>"+data.username+"</strong>"+" : "+data.msg;
		var p = document.createElement("p");
		p.innerHTML = text;
		var span = document.createElement("span");
		span.className = "time-right";
		span.innerHTML = data.timestamp;
		var hr = document.createElement("hr");
		parent.append(p);  parent.append(span); parent.append(hr); 
		$("#feedback").text("");
	}

	socket.on("add_chat_msg_to_list", function(data){
		appendElement($chatMessages, data, false);
		$chatMessages.show();
	});


	socket.on("add_chat_msg_to_list_with_file", function(data){
		console.log("------------------------ add_chat_msg_to_list_with_file "+JSON.stringify(data.msg));
		appendElement($chatMessages, data, false);
		attachMutimediaFiles(data.multimedia, $chatMessages);
		$chatMessages.show();
	});


	socket.on("private_msg", function(data){
		appendElement($privateZone, data, true);
		$privateZone.css('visibility', 'visible');
	});

	socket.on("private_msg_with_file", function(data){
		appendElement($privateZone, data, true);
		attachMutimediaFiles(data.multimedia, $privateZone);
		$privateZone.css('visibility', 'visible');
	});

	

	$message.keypress(function(){
		console.log("username label value "+$usernameLabel.text());
		socket.emit("typing", $usernameLabel.text());
	});


	socket.on("typing", function(data){
		$("#feedback").html("<strong>"+data+"</strong> is typing a message...");
		//$("#feedback").css("color", "green");
	});

	
});

