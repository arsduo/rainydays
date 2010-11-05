describe("RD global object", function() {
	it("should store the global jQuery object as RD.jQuery", function() {
		expect(RD.jQuery).toBe(jQuery)
	})
	
	describe("debug function", function() {
		// make sure there's a console object available, native or not
		var console = window.console || {}; 

		// see if we have a native console
		var nativeConsole = false;
		try {
			window.console.log("Determining native console status for RD.debug tests.");
			nativeConsole = true;
		} catch (e) {};

		// this avoids any unnecessary output for the console
		beforeEach(function() {
			spyOn(console, "log");
		})
		
		it("should create a debug function", function() {
			expect(typeof(RD.debug)).toBe("function");
		})	
		
		it("should accept multiple arguments without error", function() {
			expect(function() { RD.debug("abc %s", "2") }).not.toThrow();
		})
		
		// this isn't a great test since it depends on browser function
		// but it's all we can do
		if (nativeConsole) {
			it("should call console.log with the arguments", function() {
				var arg1 = "abc %s", arg2 = "2"
				RD.debug(arg1, arg2);
				expect(console.log).toHaveBeenCalledWith(arg1, arg2);
			})
		}
	})
	
	describe("createObject function", function() {
		it("should create a new object based on the old one", function() {
			// not sure how best to test this
			// the Javascript: The Good Parts Object.create method doesn't seem to leave a trackable prototype or constructor
			// but this passes, so we'll take it as okay for now
			var proto = {
				a: function() {},
				b: function() {},
				c: function() {}, 
				d: 2
			}
			var child = RD.createObject(proto);
			for (var property in proto) {
				expect(child[property]).toBe(proto[property]);
			}
		})
	})
})