describe("Containers", function() {

	beforeEach(function() {
		diapason.reset();
	});

	it("Rejects container with wrong name", function() {
		Should(function() {
			diapason.config.container("wrong integerName");
		}).throw();
	});

	it("Rejects container with same name", function() {
		diapason.config.container("myContainer");
		Should(function() {
			diapason.config.container("myContainer");
		}).throw();
	});

	it("Clears one type", function(done) {
		diapason.config.container("controller").container("service");
		
		diapason.controller("ctrl", "foo");
		diapason.service("srvc", "bar");
		diapason.clear("controller");

		diapason.inject(["srvc", function(srvc) {
			Should(srvc).be.exactly("bar");
			return diapason.inject(["ctrl", function(ctrl) {
			}]);
		}])
		.catch(function(err) {
			Should(err).be.exactly("Injection ctrl doesn't exist");
			done();
		});
	});

	it("Clears all types", function(done) {
		diapason.config.container("controller").container("service");
		
		diapason.controller("ctrl", "foo");
		diapason.service("srvc", "bar");
		diapason.clear();

		diapason.inject(["ctrl", function(ctrl) {
		}])
		.catch(function(err) {
			Should(err).be.exactly("Injection ctrl doesn't exist");		
			return diapason.inject(["srvc", function(srvc) {
			}]);
		})
		.catch(function(err) {
			Should(err).be.exactly("Injection srvc doesn't exist");
			done();
		});
	});

	it("Resets one type", function(done) {
		diapason.config.container("controller").container("service");
		
		diapason.controller("ctrl", "foo");
		diapason.service("srvc", "bar");
		diapason.reset("controller");

		Should(diapason.controller).be.exactly(undefined);

		diapason.inject(["srvc", function(srvc) {
			Should(srvc).be.exactly("bar");
		}])
		.then(function() {
			return diapason.inject(["ctrl", function(ctrl) {
			}]);
		})
		.catch(function(err) {
			Should(err).be.exactly("Injection ctrl doesn't exist");
			done();
		});

	});

	it("Resets all types", function(done) {
		diapason.config.container("controller").container("service");
		
		diapason.controller("ctrl", "foo");
		diapason.service("srvc", "bar");

		diapason.reset();

		Should(diapason.controller).be.exactly(undefined);
		Should(diapason.service).be.exactly(undefined);

		diapason.inject(["ctrl", "srvc", function(ctrl, srvc) {
		}])
		.catch(function(err) {
			Should(err).be.exactly("Injection ctrl doesn't exist");
			done();
		});
	});

	it("Cannot overwrite", function() {
		diapason.config.container("controller").overwrites(false);
		
		Should(function() {
			diapason.controller("ctrl", "foo");
			diapason.controller("ctrl", "foo");
		}).throw();
		
	});

	it("Founds specific injection", function(done) {
		diapason.config.container("controller").container("service").overwrites(false);
		diapason.controller("injection", "foo");
		diapason.service("injection", "bar");

		diapason.inject(["controller:injection", function(injection) {
			Should(injection).be.exactly("foo");
		}])
		.then(function() {
			return diapason.inject(["service:injection", function(injection) {
				Should(injection).be.exactly("bar");
			}]);
		})
		.then(done);
		
	});


	it("ignores containers", function(done) {
		diapason.config.container("configuration").container("service").container("controller").overwrites(false);
		diapason.controller("myController", "myController");
		diapason.service("myService", "myService");

		diapason.selectContainers(["service"]).inject(["myService", function(service) {
			Should(service).be.exactly("myService");
		}])
		.then(function() {
			return diapason.selectContainers(["service"]).inject(["myController", function() {
				Should().fail();
			}])
			.catch(function(err) {
				Should(err).be.exactly("Injection myController doesn't exist");
			});
		})
		.then(done);
	});

});