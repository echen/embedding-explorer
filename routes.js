app.config(["$routeProvider", "$compileProvider", function($routeProvider, $compileProvider) {
    $routeProvider.    
      when("/", {
        templateUrl: "explorer.html",
      }).
      otherwise({
        redirectTo: "/"
      });
  }]);