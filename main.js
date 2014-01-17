angular.module("myk.videochat", ["myk.camera"])
	.service("VideoChat", ["Camera", function(Camera) {
		return function(localVideoElement, remoteVideoElement, socket, pc_config) {
			var conf = pc_config || {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
			var pc = new webkitRTCPeerConnection(conf);
			var isInitiator;

			function initPC() {
				Camera.register(function() {
					pc.addStream(Camera.stream);

					pc.onicecandidate = function(e) {
						if (e.candidate) {
							socket.send(JSON.stringify({
								action: "ice",
								label: e.candidate.sdpMLineIndex,
								candidate: e.candidate.candidate
							}));
						}
					};

					pc.onaddstream = function(e) {
						var streamUrl = webkitURL.createObjectURL(e.stream);
						remoteVideoElement.src = streamUrl;
						remoteVideoElement.play();
					}

					localVideoElement.src = Camera.streamUrl;
					localVideoElement.muted = true;
					localVideoElement.play();

					socket.send(JSON.stringify({
						action: "ready"
					}));
				});
			}			

			socket.onmessage = function(event) {
				var message = JSON.parse(event.data);
				switch(message.action) {
					case "handshake":
						isInitiator = message.initiate;
						initPc();
						break;

					case "ice":
						var candidate = new RTCIceCandidate({
							sdpMLineIndex: message.label,
							candidate: message.candidate
						});

						pc.addIceCandidate(candidate);
						break;

					case "desc": 
						pc.setRemoteDescription(new RTCSessionDescription(message.desc));
						break;

					case "ready":
						if (isInitiator) {
							startVideoChat();
						}

						break;

					case "error": 
						console.error(message);
						break;
				
					case "hangup":

						break;
				}				
			};

			function setLocalAndSendMessage(desc) {
				pc.setLocalDescription(new RTCSessionDescription(desc));
				socket.send(JSON.stringify({action:"desc", desc: desc}));
			}

			function doCall() {
				pc.createOffer(setLocalAndSendMessage, null, { mandatory: { OfferToReceiveVideo: true, OfferToReceiveAudio: true}});				
			}

			function doAnswer() {
				pc.createAnswer(setLocalAndSendMessage, null, { mandatory: { OfferToReceiveVideo: true, OfferToReceiveAudio: true}});
			}

			function startVideoChat() {
				doCall();
			}

		};
	}]);