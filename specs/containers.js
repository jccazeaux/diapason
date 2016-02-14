describe("Containers", function() {

	beforeEach(function() {
		carburator.reset();
	});

	it("Rejects container with wrong name", function() {
		Should(function() {
			carburator.config.container("wrong integerName");
		}).throw();
	});

	it("Rejects container with same name", function() {
		carburator.config.container("myContainer");
		Should(function() {
			carburator.config.container("myContainer");
		}).throw();
	});

	it("Clears one type", function(done) {
		carburator.config.container("controller").container("service");
		
		carburator.controller("ctrl", "foo");
		carburator.service("srvc", "bar");
		carburator.clear("controller");

		carburator.inject(["srvc", function(srvc) {
			Should(srvc).be.exactly("bar");
			return carburator.inject(["ctrl", function(ctrl) {
			}]);
		}])
		.catch(function(err) {
			Should(err).be.exactly("Injection ctrl doesn't exist");
			done();
		});
	});

	it("Clears all types", function(done) {
		carburator.config.container("controller").container("service");
		
		carburator.controller("ctrl", "foo");
		carburator.service("srvc", "bar");
		carburator.clear();

		carburator.inject(["ctrl", function(ctrl) {
		}])
		.catch(function(err) {
			Should(err).be.exactly("Injection ctrl doesn't exist");		
			return carburator.inject(["srvc", function(srvc) {
			}]);
		})
		.catch(function(err) {
			Should(err).be.exactly("Injection srvc doesn't exist");
			done();
		});
	});

	it("Resets one type", function(done) {
		carburator.config.container("controller").container("service");
		
		carburator.controller("ctrl", "foo");
		carburator.service("srvc", "bar");
		carburator.reset("controller");

		Should(carburator.controller).be.exactly(undefined);

		carburator.inject(["srvc", function(srvc) {
			Should(srvc).be.exactly("bar");
		}])
		.then(function() {
			return carburator.inject(["ctrl", function(ctrl) {
			}]);
		})
		.catch(function(err) {
			Should(err).be.exactly("Injection ctrl doesn't exist");
			done();
		});

	});

	it("Resets all types", function(done) {
		carburator.config.container("controller").container("service");
		
		carburator.controller("ctrl", "foo");
		carburator.service("srvc", "bar");

		carburator.reset();

		Should(carburator.controller).be.exactly(undefined);
		Should(carburator.service).be.exactly(undefined);

		carburator.inject(["ctrl", "srvc", function(ctrl, srvc) {
		}])
		.catch(function(err) {
			Should(err).be.exactly("Injection ctrl doesn't exist");
			done();
		});
	});

	it("Cannot overwrite", function() {
		carburator.config.container("controller").overwrites(false);
		
		Should(function() {
			carburator.controller("ctrl", "foo");
			carburator.controller("ctrl", "foo");
		}).throw();
		
	});

	it("Founds specific injection", function(done) {
		carburator.config.container("controller").container("service").overwrites(false);
		carburator.controller("injection", "foo");
		carburator.service("injection", "bar");

		carburator.inject(["controller:injection", function(injection) {
			Should(injection).be.exactly("foo");
		}])
		.then(function() {
			return carburator.inject(["service:injection", function(injection) {
				Should(injection).be.exactly("bar");
			}]);
		})
		.then(done);
		
	});


	it("ignores containers", function(done) {
		carburator.config.container("configuration").container("service").container("controller").overwrites(false);
		carburator.controller("myController", "myController");
		carburator.service("myService", "myService");

		carburator.selectContainers(["service"]).inject(["myService", function(service) {
			Should(service).be.exactly("myService");
		}])
		.then(function() {
			return carburator.selectContainers(["service"]).inject(["myController", function() {
				Should().fail();
			}])
			.catch(function(err) {
				Should(err).be.exactly("Injection myController doesn't exist");
			});
		})
		.then(done);
	});

});