describe("Test injection", function() {

	beforeEach(function() {	
		carburator.reset();
	});

	it("Injects with contextual dependency", function() {	
		// carburator.config.debug(true);

		var scope = {};
		carburator.inject(["$scope", function($scope) {
			$scope.attr = "value";
		}], {
			$scope:scope
		})
		.then(function() {
			Should(scope.attr).be.exactly("value");
		});
	});

	it("Injects with a service", function() {	
		carburator.config.container("service");
		
		carburator.service("testService", {
			get: function() {
				return "value";
			}
		});

		var scope = {};
		carburator.inject(["$scope", "testService", function($scope, testService) {
			$scope.attr = testService.get();
		}], {
			$scope:scope
		})
		.then(function() {
			Should(scope.attr).be.exactly("value");	
		});
	});

	it("Injects as singleton", function(done) {	
		carburator.config.container("controller").container("service");
		
		carburator.service("testService", function() {
			return {
				get: function() {
					return "value";
				},
				attr: "value"
			};
		});

		carburator.controller("testCtrl", ["testService", function(testService) {
			testService.attr = "new value";
		}]);

		var scope = {};
		// test service injection
		carburator.inject(["testCtrl", function(testCtrl) {
		}]).then(function() {
			return carburator.inject(["testService", function(testService) {
				Should(testService.attr).be.exactly("new value");
			}]);
		})
		.then(done);

	});

	it("Injects asynchronous injections", function(done) {
		carburator.config.container("service");
		if (window.Promise) {
			carburator.service("testService", Promise.resolve({
				get: function() {
					return "value";
				}
			})).asSingleton();

			carburator.service("facadeService", ["testService", function(testService) {
				return Promise.resolve({
					get: function() {
						return testService.get() + " !!!";
					}
				});
			}]).asSingleton();

		} else if (window.Q) {
			carburator.service("testService", Q({
				get: function() {
					return "value";
				}
			})).asSingleton();

			carburator.service("facadeService", ["testService", function(testService) {
				return Q({
					get: function() {
						return testService.get() + " !!!";
					}
				});
			}]).asSingleton();
		}
		
		carburator.inject(["facadeService", function(facadeService) {
			Should(facadeService.get()).be.exactly("value !!!");
			done();
		}]);
	});

	it("Injects as prototype", function(done) {	
		carburator.config.container("controller").container("service");
		
		carburator.service("testService", function() {
			return {
				get: function() {
					return "value";
				},
				attr: "value"
			};
		}).asPrototype();

		carburator.controller("testCtrl", ["testService", function(testService) {
			testService.attr = "new value";
		}]);

		var scope = {};
		// test service injection
		carburator.inject(["testCtrl", function(testCtrl) {
		}])
		.then(function() {
			return carburator.inject(["testService", function(testService) {
				Should(testService.attr).be.exactly("value");
			}]);
		})
		.then(done);
	});


	it("Founds specific injection", function() {	
		carburator.config.container("controller").container("service").overwrites(false);
		carburator.controller("injection", "foo");
		carburator.service("injection", "bar");

		carburator.inject(["controller:injection", function(injection) {
			Should(injection).be.exactly("foo");
		}]);
		carburator.inject(["service:injection", function(injection) {
			Should(injection).be.exactly("bar");
		}]);
		
	});

	it("injects automatic dependency", function(done) {	
		carburator.config.container("configuration").container("service").container("controller").overwrites(false);
		carburator.config.automaticDependencies("service", {"$configuration": function(name) {
			return carburator.selectContainers(["configuration"]).inject([name, function(config) {
				return config;
			}]);
		}});
		carburator.configuration("myService", "myService config works");
		carburator.service("myService", ["$configuration", function($configuration) {
			return {
				getConfig: function() {
					return $configuration;
				}
			};
		}]);
		carburator.configuration("myOtherService", "myOtherService config works");
		carburator.service("myOtherService", ["$configuration", function($configuration) {
			return {
				getConfig: function() {
					return $configuration;
				}
			};
		}]);
		carburator.controller("myController", ["$configuration", function($configuration) {
			return {
				getConfig: function() {
					return $configuration;
				}
			};
		}]);


		carburator.inject(["myService", function(injection) {
			Should(injection.getConfig()).be.exactly("myService config works");
		}])
		.then(function() {
			carburator.inject(["myOtherService", function(injection) {
				Should(injection.getConfig()).be.exactly("myOtherService config works");
			}]);
		})
		.then(function() {
			carburator.inject(["myController", function() {
				Should().fail();
			}])
			.catch(function(err) {
				Should(err).be.exactly("Injection $configuration doesn't exist");
			});
		})
		.then(done)
	});

	it("Fails if injection does not exist", function(done) {
		carburator.config.container("service");
		carburator.inject(["foo", function(foo) {

		}])
		.catch(function(err) {
			Should(err).be.exactly("Injection foo doesn't exist");
			done();
		});
	});

});