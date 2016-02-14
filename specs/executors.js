describe("Executors", function() {

	beforeEach(function() {
		carburator.reset();
	});


	it("Runs custom executor", function(done) {
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
			Should(ctrl).be.exactly("foo executed !");
			Should(srvc).be.exactly("bar");
			done();
		}]);
	});


});