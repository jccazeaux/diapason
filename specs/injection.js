describe("Test injection", function() {

	beforeEach(function() {	
		diapason.reset();
	});

	it("Injects with contextual dependency", function() {	
		// diapason.config.debug(true);

		var scope = {};
		diapason.inject(["$scope", function($scope) {
			$scope.attr = "value";
		}], {
			$scope:scope
		})
		.then(function() {
			Should(scope.attr).be.exactly("value");
		});
	});

	it("Injects with a service", function() {	
		diapason.config.container("service");
		
		diapason.service("testService", {
			get: function() {
				return "value";
			}
		});

		var scope = {};
		diapason.inject(["$scope", "testService", function($scope, testService) {
			$scope.attr = testService.get();
		}], {
			$scope:scope
		})
		.then(function() {
			Should(scope.attr).be.exactly("value");	
		});
	});

	it("Injects as singleton", function(done) {	
		diapason.config.container("controller").container("service");
		
		diapason.service("testService", function() {
			return {
				get: function() {
					return "value";
				},
				attr: "value"
			};
		});

		diapason.controller("testCtrl", ["testService", function(testService) {
			testService.attr = "new value";
		}]);

		var scope = {};
		// test service injection
		diapason.inject(["testCtrl", function(testCtrl) {
		}]).then(function() {
			return diapason.inject(["testService", function(testService) {
				Should(testService.attr).be.exactly("new value");
			}]);
		})
		.then(done);

	});

	it("Injects asynchronous injections", function(done) {
		diapason.config.container("service");
		if (window.Promise) {
			diapason.service("testService", Promise.resolve({
				get: function() {
					return "value";
				}
			})).asSingleton();

			diapason.service("facadeService", ["testService", function(testService) {
				return Promise.resolve({
					get: function() {
						return testService.get() + " !!!";
					}
				});
			}]).asSingleton();

		} else if (window.Q) {
			diapason.service("testService", Q({
				get: function() {
					return "value";
				}
			})).asSingleton();

			diapason.service("facadeService", ["testService", function(testService) {
				return Q({
					get: function() {
						return testService.get() + " !!!";
					}
				});
			}]).asSingleton();
		}
		
		diapason.inject(["facadeService", function(facadeService) {
			Should(facadeService.get()).be.exactly("value !!!");
			done();
		}]);
	});

	it("Injects as prototype", function(done) {	
		diapason.config.container("controller").container("service");
		
		diapason.service("testService", function() {
			return {
				get: function() {
					return "value";
				},
				attr: "value"
			};
		}).asPrototype();

		diapason.controller("testCtrl", ["testService", function(testService) {
			testService.attr = "new value";
		}]);

		var scope = {};
		// test service injection
		diapason.inject(["testCtrl", function(testCtrl) {
		}])
		.then(function() {
			return diapason.inject(["testService", function(testService) {
				Should(testService.attr).be.exactly("value");
			}]);
		})
		.then(done);
	});


	it("Founds specific injection", function() {	
		diapason.config.container("controller").container("service").overwrites(false);
		diapason.controller("injection", "foo");
		diapason.service("injection", "bar");

		diapason.inject(["controller:injection", function(injection) {
			Should(injection).be.exactly("foo");
		}]);
		diapason.inject(["service:injection", function(injection) {
			Should(injection).be.exactly("bar");
		}]);
		
	});

	it("injects automatic dependency", function(done) {	
		diapason.config.container("configuration").container("service").container("controller").overwrites(false);
		diapason.config.automaticDependencies("service", {"$configuration": function(name) {
			return diapason.selectContainers(["configuration"]).inject([name, function(config) {
				return config;
			}]);
		}});
		diapason.configuration("myService", "myService config works");
		diapason.service("myService", ["$configuration", function($configuration) {
			return {
				getConfig: function() {
					return $configuration;
				}
			};
		}]);
		diapason.configuration("myOtherService", "myOtherService config works");
		diapason.service("myOtherService", ["$configuration", function($configuration) {
			return {
				getConfig: function() {
					return $configuration;
				}
			};
		}]);
		diapason.controller("myController", ["$configuration", function($configuration) {
			return {
				getConfig: function() {
					return $configuration;
				}
			};
		}]);


		diapason.inject(["myService", function(injection) {
			Should(injection.getConfig()).be.exactly("myService config works");
		}])
		.then(function() {
			diapason.inject(["myOtherService", function(injection) {
				Should(injection.getConfig()).be.exactly("myOtherService config works");
			}]);
		})
		.then(function() {
			diapason.inject(["myController", function() {
				Should().fail();
			}])
			.catch(function(err) {
				Should(err).be.exactly("Injection $configuration doesn't exist");
			});
		})
		.then(done)
	});

	it("Fails if injection does not exist", function(done) {
		diapason.config.container("service");
		diapason.inject(["foo", function(foo) {

		}])
		.catch(function(err) {
			Should(err).be.exactly("Injection foo doesn't exist");
			done();
		});
	});

});