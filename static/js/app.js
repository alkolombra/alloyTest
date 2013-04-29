'use strict'; 

angular.module('application', ['ngResource', 'ngCookies', 'ui'])

.config(['$routeProvider'
        , '$locationProvider'
        , function($routeProvider, $locationProvider) {
	$routeProvider
		.when('/main',  { templateUrl: '/views/Main.html'
                        , controller: MainCtrl, name:'Main' })
		.when('/marquee',  { templateUrl: '/views/Marquee.html'
                        , controller: MarqueeCtrl, name:'Marquee' })
		.when('/notifications',  { templateUrl: '/views/Notifications.html'
                        , controller: NotificationsCtrl, name:'Notifications' })
		.when('/tooltip',  { templateUrl: '/views/Tooltip.html'
                        , controller: TooltipCtrl, name:'Tooltip' })
		.when('/login', { templateUrl: '/views/Login.html'
                        , controller: LoginCtrl, name: 'Login' })
		.otherwise(     { redirectTo: '/main' })
}])