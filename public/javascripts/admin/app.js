'use strict'; 
angular.module('admin', ['ngResource','ngCookies', 'ui', 'ui.bootstrap']).
config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
	$routeProvider.
		when('/main', {templateUrl: '/views/admin/Main.html', controller: MainCtrl, name:'Main'})
		otherwise({redirectTo: '/main'});
}])

.filter('status', function() {
	return function(status) { 		
		if(status) 
			return 'enabled'
		
		return 'disabled';
	}
})