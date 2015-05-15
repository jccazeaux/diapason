describe("Test injection", function() {
	it("Rejects container with wrong name", function() {
		carburator.reset();
		expect(function() {
			carburator.config.container("wrong integerName");
		}).toThrow();
	});

	it("Rejects container with same name", function() {
		carburator.reset();
		carburator.config.container("myContainer");
		expect(function() {
			carburator.config.container("myContainer");
		}).toThrow();
	});

	it("Injects with contextual dependency", function() {
		carburator.reset();
		// carburator.config.debug(true);

		var scope = {};
		carburator.inject(["$scope", function($scope) {
			$scope.attr = "value";
		}], {$scope:scope});
		expect(scope.attr).toBe("value");
	});

	it("Injects with a service", function() {
		carburator.reset();
		carburator.config.container("service");
		
		carburator.service("testService", {
			get: function() {
				return "value";
			}
		});

		var scope = {};
		carburator.inject(["$scope", "testService", function($scope, testService) {
			$scope.attr = testService.get();
		}], {$scope:scope});
		expect(scope.attr).toBe("value");

	});


	it("Injects as singleton", function() {
		carburator.reset();
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
		}]);
		carburator.inject(["testService", function(testService) {
			expect(testService.attr).toBe("new value");
		}]);
	});

	it("Injects as prototype", function() {
		carburator.reset();
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
		}]);
		carburator.inject(["testService", function(testService) {
			expect(testService.attr).toBe("value");
		}]);
	});

	it("Clears one type", function() {
		carburator.reset();
		carburator.config.container("controller").container("service");
		
		carburator.controller("ctrl", "foo");
		carburator.service("srvc", "bar");
		carburator.clear("controller");

		carburator.inject(["ctrl", "srvc", function(ctrl, srvc) {
			expect(ctrl).toBe(undefined);
			expect(srvc).toBe("bar");
		}]);
	});

	it("Clears all types", function() {
		carburator.reset();
		carburator.config.container("controller").container("service");
		
		carburator.controller("ctrl", "foo");
		carburator.service("srvc", "bar");
		carburator.clear();

		carburator.inject(["ctrl", "srvc", function(ctrl, srvc) {
			expect(ctrl).toBe(undefined);
			expect(srvc).toBe(undefined);
		}]);
	});

	it("Resets one type", function() {
		carburator.reset();
		carburator.config.container("controller").container("service");
		
		carburator.controller("ctrl", "foo");
		carburator.service("srvc", "bar");
		carburator.reset("controller");

		carburator.inject(["ctrl", "srvc", function(ctrl, srvc) {
			expect(ctrl).toBe(undefined);
			expect(srvc).toBe("bar");
		}]);

		expect(carburator.controller).toBe(undefined);
	});

	it("Resets all types", function() {
		carburator.reset();
		carburator.config.container("controller").container("service");
		
		carburator.controller("ctrl", "foo");
		carburator.service("srvc", "bar");
		carburator.reset();

		carburator.inject(["ctrl", "srvc", function(ctrl, srvc) {
			expect(ctrl).toBe(undefined);
			expect(srvc).toBe(undefined);
		}]);
		expect(carburator.controller).toBe(undefined);
		expect(carburator.service).toBe(undefined);
	});

	it("Runs custom executor", function() {
		carburator.reset();
		carburator.config.container("controller")
			.container("service")
			.executor("controller", function(obj) {
			if (obj === "foo") {
				return "foo executed !";
			}
		});
		
		carburator.controller("ctrl", "foo");
		carburator.service("srvc", "bar");

		carburator.inject(["ctrl", "srvc", function(ctrl, srvc) {
			expect(ctrl).toBe("foo executed !");
			expect(srvc).toBe("bar");
		}]);
	});

	it("Cannot overwrite", function() {
		carburator.reset();
		carburator.config.container("controller").overwrites(false);
		
		expect(function() {
			carburator.controller("ctrl", "foo");
			carburator.controller("ctrl", "foo");
		}).toThrow();
		
	});

	it("Founds specific injection", function() {
		carburator.reset();
		carburator.config.container("controller").container("service").overwrites(false);
		carburator.controller("injection", "foo");
		carburator.service("injection", "bar");

		carburator.inject(["controller:injection", function(injection) {
			expect(injection).toBe("foo");
		}]);
		carburator.inject(["service:injection", function(injection) {
			expect(injection).toBe("bar");
		}]);
		
	});

	it("injects automatic dependency", function() {
		carburator.reset();
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
			expect(injection.getConfig()).toBe("myService config works");
		}]);
		carburator.inject(["myOtherService", function(injection) {
			expect(injection.getConfig()).toBe("myOtherService config works");
		}]);
		carburator.inject(["myController", function(injection) {
			expect(injection.getConfig()).toBe(undefined);
		}]);
	});

	it("ignores containers", function() {
		carburator.reset();
		carburator.config.container("configuration").container("service").container("controller").overwrites(false);
		carburator.controller("myController", "myController");
		carburator.service("myService", "myService");

		carburator.selectContainers(["service"]).inject(["myService", "myController", function(service, controller) {
			expect(service).toBe("myService");
			expect(controller).toBe(undefined);
		}]);
		carburator.selectContainers(["controller"]).inject(["myService", "myController", function(service, controller) {
			expect(controller).toBe("myController");
			expect(service).toBe(undefined);
		}]);
	});

});