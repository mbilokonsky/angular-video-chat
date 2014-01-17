AngularVideoChat
================

An angular directive for initiating peer-to-peer video chat in the browser.

Usage example:

```
var myApp = angular.module("myApp", ["myk.videochat"]);

myApp.directive("videoChat", ["VideoChat", function(VideoChat) {

        return {
            restrict: "E",
            scope: {
                session:"@"
            },
            template: "<div><video></video><video></video></div>",
            link: function(scope, element) {
                scope.status = "dormant";
                var localVideoElements = element.find('video');
                var lv1 = localVideoElements[0];
                var rv1 = localVideoElements[1];

                var socketURL = "ws://" + window.location.host + "/videoSocket/" + scope.session;
                console.log("Connecting to websocket: " + socketURL);
                var vs = new WebSocket(socketURL);

                scope.status = "initializing";

                vs.onopen = function() {
                    console.log("Connected to video socket!");
                    scope.status = "connected, waiting for peer";
                    scope.$apply();
                    VideoChat(lv1, rv1, vs);
                };

            }
        };
    }])
```

Note that this service has very specific server-side dependencies. This can probably be abstracted away, but that video socket I'm using there? On the server, the rules are as follows:

1) When a socket connects to channel 'foo', it waits until a second socket connects to the same channel.

2) When two sockets are connected, they are paired off and the following JSON is sent to each:
	```
	{
		"action":"handshake",
		"initiator": true | false*
	}
	```
* I send 'true' to the first socket that connected and 'false' to the second, but it doesn't really matter as long as only one is true.

3) From then on, the web socket server acts as a router. All inputs from socketA get immediately sent to socket B, and vice versa.