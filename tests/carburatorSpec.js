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

	it("Injects a controller", function() {
		carburator.reset();
		// carburator.config.debug(true);
		carburator.config.container("controller").container("service");
		
		carburator.controller("testCtrl", ["$scope", function($scope) {
			$scope.attr = "value";
		}]);

		var scope = {};
		carburator.inject(["testCtrl", function(testCtrl) {
			expect(scope.attr).toBe("value");
		}], {$scope:scope});
	});

	it("Injects a controller with a service", function() {
		carburator.reset();
		carburator.config.container("controller").container("service");
		
		carburator.service("testService", {
			get: function() {
				return "value";
			}
		});

		carburator.controller("testCtrl", ["$scope", "testService", function($scope, testService) {
			$scope.attr = testService.get();
		}]);

		var scope = {};
		carburator.inject(["testCtrl", function(testCtrl) {
			expect(scope.attr).toBe("value");
		}], {$scope:scope});

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

});