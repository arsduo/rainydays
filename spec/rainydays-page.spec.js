// code located in rainydays.js
describe("RD.Page", function() {
	var makeID = (function() {
		var count = 0;
		return function() {
			count++;
			return "foo" + count;
		}
	}());
	
	it("should exist", function() {
		expect(typeof(RD.Page)).toBe("object");
	})
	
	describe("properties", function() {
		it("should not expose the dirtyFields list", function() {
			expect(RD.Page.dirtyFields).not.toBeDefined();
		})
		
		it("should not expose whether the exit dialog is disabled", function() {
			expect(RD.Page.surpressExitDialog).not.toBeDefined();			
		})
		
		it("should expose the text shown when a user leaves a dirty page", function() {
			expect(typeof(RD.Page.text)).toBe("string");
		})		
	})
	
	describe("functions", function() {
		var resetDirtyFields = function() {
			// remove any fields in the list
			var fields = RD.Page.getDirtyFields();
			for (var i = 0; i < fields.length; i++) {
				RD.Page.removeDirtyField(fields[i]);
			}
		}
		
		beforeEach(resetDirtyFields);
		
		describe("isPageDirty", function() {
			it("should answer false if there are no dirty fields", function() {
				// we know this is empty because of the beforeFilter
				expect(RD.Page.isPageDirty()).toBe(false)
			})
			
			it("should answer true if are dirty fields", function() {
				var foo = "bar2"; // different value from other tests, to be visible in case remove is broken
				RD.Page.addDirtyField(foo);
				expect(RD.Page.isPageDirty()).toBe(true);
			})
			
			it("should answer false if there were dirty field but they were removed", function() {
				// technically this is what happens each time with the resetDirtyFields function
				// but I want to test this explicitly
				var foo = makeID();
				RD.Page.addDirtyField(foo);
				RD.Page.removeDirtyField(foo);
				expect(RD.Page.isPageDirty()).toBe(false);
			})			
		})
		
		describe("numberOfDirtyFields", function() {
			it("should return 0 to start", function() {
				expect(RD.Page.numberOfDirtyFields()).toBe(0);
			})
			
			it("should return the number of dirty fields there are", function() {
				var count = Math.round(Math.random() * 200);
				for (var i = 0; i < count; i++) {
					RD.Page.addDirtyField(makeID());
				}
				expect(RD.Page.numberOfDirtyFields()).toBe(count);
			})
		})
		
		describe("getDirtyFields", function() {
			it("should return an array", function() {
				var fields = RD.Page.getDirtyFields();
				expect(typeof(fields)).toBe("object");
				expect(fields.length).toBeDefined();
			})
			
			it("should by default be empty", function() {
				expect(RD.Page.getDirtyFields().length).toBe(0);
			})
			
			it("should return an array with the names of the dirty fields", function() {
				// represent the three expected types of arguments
				var foo = makeID(), bar = {id: makeID()}, bazID = makeID(); baz = {attr: function() { return bazID }};
				RD.Page.addDirtyField(foo);
				RD.Page.addDirtyField(bar);
				RD.Page.addDirtyField(baz);

				// expectations
				var dirtyFields = RD.Page.getDirtyFields();
				expect(dirtyFields.length).toBe(3);
				expect(dirtyFields).toContain(foo);
				expect(dirtyFields).toContain(bar.id);
				expect(dirtyFields).toContain(baz.attr("id"));
			})
			
			it("should not return names of previously-removed fields", function() {
				// represent the three expected types of arguments
				var foo = makeID(), bar = {id: makeID()}, bazID = makeID(); baz = {attr: function() { return bazID }};
				RD.Page.addDirtyField(foo);
				RD.Page.addDirtyField(bar);
				RD.Page.addDirtyField(baz);
				RD.Page.removeDirtyField(bar);
				RD.Page.removeDirtyField(baz);

				// expectations
				var dirtyFields = RD.Page.getDirtyFields();
				expect(dirtyFields.length).toBe(1);
				expect(dirtyFields).toContain(foo);
				expect(dirtyFields).not.toContain(bar.id);
				expect(dirtyFields).not.toContain(baz.attr("id"));
			})
		
			it("should not remove fields that don't exist", function() {
				// represent the three expected types of arguments
				var foo = makeID(), bar = {id: makeID()}, bazID = makeID(); baz = {attr: function() { return bazID }};
				RD.Page.addDirtyField(foo);
				RD.Page.addDirtyField(bar);
				RD.Page.addDirtyField(baz);
				RD.Page.removeDirtyField(makeID());
				RD.Page.removeDirtyField(makeID());

				// expectations
				var dirtyFields = RD.Page.getDirtyFields();
				expect(dirtyFields.length).toBe(3);
			})
			
			it("should not change the actual list of dirty fields", function() {
				// represent the three expected types of arguments
				var foo = makeID(), bar = {id: makeID()}, bazID = makeID(); baz = {attr: function() { return bazID }};
				RD.Page.addDirtyField(foo);
				RD.Page.addDirtyField(bar);
				RD.Page.addDirtyField(baz);

				// expectations
				var dirtyFields = RD.Page.getDirtyFields();
				dirtyFields.splice(1, 2);
				expect(RD.Page.getDirtyFields().length).toBe(3);
			})
		
			
		})
	})
})