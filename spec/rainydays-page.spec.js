// code located in rainydays.js
describe("RD.Page", function() {
	it("should exist", function() {
		expect(typeof(RD.Page)).toBe("object");
	})
	
	describe("public interface", function() {
		it("should not expose the dirtyFields list", function() {
			expect(RD.Page.dirtyFields).not.toBeDefined();
		})
	})
})