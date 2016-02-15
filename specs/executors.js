describe("Executors", function() {

	beforeEach(function() {
		diapason.reset();
	});


	it("Runs custom executor", function(done) {
		diapason.config.container("controller")
			.container("service")
			.executor("controller", function(obj) {
			if (obj === "foo") {
				return "foo executed !";
			}
		});
		
		diapason.controller("ctrl", "foo");
		diapason.service("srvc", "bar");

		diapason.inject(["ctrl", "srvc", function(ctrl, srvc) {
			Should(ctrl).be.exactly("foo executed !");
			Should(srvc).be.exactly("bar");
			done();
		}]);
	});


});