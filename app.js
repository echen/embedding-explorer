var app = angular.module("app", ["ngRoute"]);

app.run(function($rootScope, $window, $location) {
  //scroll to top of page after each route change  
  $rootScope.$on("$locationChangeSuccess", function(event, toState, toParams, fromState, fromParams) {
    window.scrollTo(0, 0);    
  });  
});
