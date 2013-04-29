angular.module  ( 'application.controllers', [ 'ngResource','ngCookies', 'ui' ] );

var GlobalCtrl= [ '$scope', '$resource', '$location', '$window', '$cookies', '$http'
					, function ( $scope, $resource, $location, $window, $cookies, $http ) {


	$scope.safeApply = function(fn) {
	  var phase = this.$root.$$phase;	  
	  if(phase == '$apply' || phase == '$digest') {
	    if(fn && (typeof(fn) === 'function')) {
	      fn();
	    }
	  } else {
	    this.$apply(fn);
	  }
	};	
	
	$scope.host = 'http://node.mediamagic.co.il:8080';

	$scope.socket = new SocketController(io.connect($scope.host));
}];

var MainCtrl = ['$scope', function ( $scope ) {

	$scope.notifications = [];
	$scope.notificationToDelete = 0;
	$scope.notification = {
		id:0,
		message:''
	}	

	$scope.socket.on(function (event, data, respond) {				
		var res = {};
		
		switch(event) {				
			default:
				res = {};
			break;
		}

		respond(res);		
	});

	$scope.sendNotification = function() {
		$scope.notification = {
			id:++$scope.notification.id,
			message:$scope.notification.message
		}
		$scope.socket.to('server').emit('NOTIFICATION', $scope.notification, function(res) {			
			$scope.safeApply(function() {	
				$scope.notifications.push(angular.copy($scope.notification));
			});			
		});	
	}

	$scope.deleteNotification = function() {
		$scope.socket.to('server').emit('CANCEL_NOTIFICATION', $scope.notificationToDelete, function(res) {			
			$scope.safeApply(function() {	
				//$scope.notifications.push($scope.notification);
			});			
		});	
	}

	$scope.deleteNotifications = function() {
		$scope.socket.to('server').emit('CANCEL_NOTIFICATIONS', {}, function(res) {			
			$scope.safeApply(function() {	
				//$scope.notifications.push($scope.notification);
			});			
		});	
	}

}];

var MarqueeCtrl = ['$scope', function ( $scope ) {

	$scope.direction = 'left';
	$scope.marqueeRow = '';
	$scope.marqueeData = [];

	$scope.startMarquee = function() {
		//$scope.socket.io.emit('START_MARQUEE');
		$scope.socket.to('server').emit('START_MARQUEE', {});
	}

	$scope.stopMarquee = function() {
		//$scope.socket.io.emit('STOP_MARQUEE');
		$scope.socket.to('server').emit('STOP_MARQUEE', {});
	}

	$scope.resetMarquee = function() {		
		$scope.socket.to('server').emit('RESET_MARQUEE', {});
	}

	$scope.addMarqueeRow = function() {	
		if($scope.marqueeRow != '') {
			$scope.safeApply(function() {	
				$scope.marqueeData.push($scope.marqueeRow)
				$scope.marqueeRow = '';
			});			
		}
	}

	$scope.updateMarquee = function() {		
		$scope.socket.to('server').emit('UPDATE_MARQUEE', $scope.marqueeData);
	}

	$scope.resetMarqueeData = function() {	
		$scope.marqueeData = [];
	}

	$scope.$watch('direction', function(n,o) {
		if(n != o)
			$scope.socket.to('server').emit('SET_MARQUEE_DIRECTION', { direction:$scope.direction});
	});

}];

var NotificationsCtrl = ['$scope', '$http', function ( $scope, $http ) {

	$scope.appKey = '9JL67kIDIBabgiY8YYA10rFJTDeAKaG4';

	$scope.logged = false;

	$scope.channel = '';
	$scope.notification = '';
	$scope.sound = 'default';

	$scope.params = {};

	try {
		delete $http.defaults.headers.common['X-Requested-With'];
	} catch(e) {}

	
	$scope.sessionId = '';

	$scope.login = function() {
		$http({method: 'POST', url: 'https://api.cloud.appcelerator.com/v1/users/login.json?key=' + $scope.appKey, params: { login:'info', password:'chipo$$2013'}}).
		success(function(data, status) {
			if(status == 200) {
				$scope.sessionId = data.meta.session_id;
				$scope.safeApply(function() {	
					$scope.logged = true;
				});
			}
	    }).
	    error(function(data, status) {

	    });
	}

	$scope.login();

    $scope.$watch('appKey', function(n, o ) {
    	if(n != o) {
    		$scope.logged = false;
    		$scope.login();
    	}
    });

	$scope.sendNotification = function() {
		if($scope.notification.length > 2) {

			$scope.params = {
				payload:{ alert:$scope.notification, sound:$scope.sound },
				vibrate:true
			};

			if($scope.channel.length > 0) {
				$scope.params.channel = $scope.channel;
			} else {
				$scope.params.channel = 'main_channel';
			}

			$http({method: 'POST', url: 'https://api.cloud.appcelerator.com/v1/push_notification/notify.json?key=' + $scope.appKey + '&_session_id=' + $scope.sessionId, params: $scope.params}).
			success(function(data, status) {
	            console.log(status);
	            console.log(data);
	        }).
	        error(function(data, status) {
	            console.log('error');
	            console.log(data);
	        });
		}
	}

}];

var TooltipCtrl = ['$scope', function ( $scope){

	$scope.text = '';
	$scope.color = 'white';
	$scope.backgroundColor = 'black';
	$scope.fontSize = '12px';
	$scope.pointer = 'TOP';
	$scope.shadow = false;

	$scope.width = 150;
	$scope.height = 60;

	$scope.position = {
		top:null,
		left:null,
		right:null,
		bottom:null
	}

	$scope.updateText = function() {
		if($scope.text.length > 0)
			$scope.socket.to('server').emit('TOOLTIP_SET_TEXT', { text:$scope.text, options:{color:$scope.color, font:{fontSize:$scope.fontSize}} });
	}

	$scope.updatePosition = function() {
		$scope.socket.to('server').emit('TOOLTIP_SET_POSITION', {position:$scope.position}); 
	}

	$scope.updateSize = function() {
		var size = {
			width: 20,
			height:20
		};

		if($scope.width > 20) 
			size.width = $scope.width;
		if($scope.height > 20) 
			size.height = $scope.height;

		$scope.socket.to('server').emit('TOOLTIP_SET_SIZE', { size:size });
	}

	$scope.$watch('pointer', function(n, o) {
		$scope.socket.to('server').emit('TOOLTIP_SET_POINTER', { pointer:n });
	})

	$scope.$watch('shadow', function(n, o) {
		$scope.socket.to('server').emit('TOOLTIP_SET_SHADOW', { shadow:n });
	})

	$scope.$watch('color', function(n, o) {
		$scope.socket.to('server').emit('TOOLTIP_SET_TEXT', {options:{color:n} });
	})

	$scope.$watch('backgroundColor', function(n, o) {
		$scope.socket.to('server').emit('TOOLTIP_SET_BACKGROUND_COLOR', {color:n});
	})

	$scope.$watch('fontSize', function(n, o) {
		$scope.socket.to('server').emit('TOOLTIP_SET_TEXT', {options:{font:{fontSize:n}} });
	})

	$scope.toggleTooltip = function(show) {
		if(show) {
			$scope.socket.to('server').emit('TOOLTIP_SHOW', {});
		} else {
			$scope.socket.to('server').emit('TOOLTIP_HIDE', {});
		}
	}

}];

var LoginCtrl = ['$scope', '$window' , function ( $scope, $window ){
	var prevUrl = $scope.location.$$search.url;
	$scope.loginSubmit = function (){
		$scope.Login.save(	{}
							, { username: $scope.username
							, password: $scope.password }
							, function(resp){
				if (resp.error === 0){
					$window.location.href = '/admin';
				} 
			});
	}
}];