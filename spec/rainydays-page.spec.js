// code located in rainydays.js
describe("RD.Page", function() {
  // ensure we always have a unique ID, to avoid any possible residual effects
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
			// reset the intentional exit status
			RD.Page.cancelIntentionalExit();
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

		describe("addDirtyField", function() {
			it("should add a field when provided with a string ID", function() {
				var id = makeID();
				RD.Page.addDirtyField(id);
				expect(RD.Page.numberOfDirtyFields()).toBe(1);
				expect(RD.Page.getDirtyFields()).toContain(id);
			})
			
			it("should add a field when provided with a DOM node", function() {
				var id = makeID();
				RD.Page.addDirtyField({id: id}); // mock DOM node
				expect(RD.Page.numberOfDirtyFields()).toBe(1);
				expect(RD.Page.getDirtyFields()).toContain(id);
			})
			
			it("should add a field when provided with a jQuery node", function() {
				var id = makeID();
				RD.Page.addDirtyField({attr: function() { return id; }}); // fake jQuery node
				expect(RD.Page.numberOfDirtyFields()).toBe(1);
				expect(RD.Page.getDirtyFields()).toContain(id);
			})
			
			it("should not add a field when provided with a ID-less value", function() {
				RD.Page.addDirtyField(null);
				RD.Page.addDirtyField("");
				RD.Page.addDirtyField();
				expect(RD.Page.numberOfDirtyFields()).toBe(0);
			})
			
			it("should not add a duplicate field when provided with a string ID", function() {
				var id = makeID();
				RD.Page.addDirtyField(id);
				RD.Page.addDirtyField({attr: function() { return id; }}); // fake jQuery node
				expect(RD.Page.numberOfDirtyFields()).toBe(1);
			})
			
			it("should not add a duplicate field when provided with a DOM node", function() {
				var id = makeID();
				RD.Page.addDirtyField({id: id}); // mock DOM node
				RD.Page.addDirtyField(id); // fake jQuery node
				expect(RD.Page.numberOfDirtyFields()).toBe(1);
			})
			
			it("should not add a duplicate field when provided with a jQuery node", function() {
				var id = makeID();
				RD.Page.addDirtyField({attr: function() { return id; }}); // fake jQuery node
				RD.Page.addDirtyField(id); // fake jQuery node
				expect(RD.Page.numberOfDirtyFields()).toBe(1);
			})
			
			
		})

		describe("isFieldDirty", function() {
			describe("if the field is dirty", function() {
				it("should answer true if a DOM node is provided", function() {
					var id = makeID();
					RD.Page.addDirtyField(id); // mock DOM node
					expect(RD.Page.isFieldDirty({id: id})).toBe(true);
				})
			
				it("should answer true if a jQuery node is provided", function() {
					var id = makeID();
					RD.Page.addDirtyField(id);
					expect(RD.Page.isFieldDirty({attr: function() { return id; }})).toBe(true);
				})
			
				it("should answer true if a string ID is provided", function() {
					var id = makeID();
					RD.Page.addDirtyField(id); // fake jQuery node
					expect(RD.Page.isFieldDirty(id)).toBe(true);
				})
			})
			
			describe("if the field was never added", function() {
				it("should answer true if a DOM node is provided", function() {
					var id = makeID();
					expect(RD.Page.isFieldDirty({id: id})).toBe(false);
				})
			
				it("should answer true if a jQuery node is provided", function() {
					var id = makeID();
					expect(RD.Page.isFieldDirty({attr: function() { return id; }})).toBe(false);
				})
			
				it("should answer true if a string ID is provided", function() {
					var id = makeID();
					expect(RD.Page.isFieldDirty(id)).toBe(false);
				})
			})
			
			describe("if the field was removed", function() {			
				it("should answer true if a DOM node is provided", function() {
					var id = makeID();
					RD.Page.addDirtyField({id: id}); // mock DOM node
					RD.Page.removeDirtyField(id);
					expect(RD.Page.isFieldDirty({id: id})).toBe(false);
				})
			
				it("should answer true if a jQuery node is provided", function() {
					var id = makeID();
					RD.Page.addDirtyField({attr: function() { return id; }}); // fake jQuery node
					RD.Page.removeDirtyField(id);
					expect(RD.Page.isFieldDirty({attr: function() { return id; }})).toBe(false);
				})
			
				it("should answer true if a string ID is provided", function() {
					var id = makeID();
					RD.Page.addDirtyField(id); // fake jQuery node
					RD.Page.removeDirtyField(id);
					expect(RD.Page.isFieldDirty(id)).toBe(false);
				})
			})
		})

		describe("removeDirtyField", function() {
			describe("for dirty fields", function() { 
				var id;
				beforeEach(function() {
					id = makeID();
					RD.Page.addDirtyField(id);
					RD.Page.addDirtyField(makeID())
				})
				
				it("should remove a field when provided an ID", function() {
					RD.Page.removeDirtyField(id);
					expect(RD.Page.numberOfDirtyFields()).toBe(1);
				})
				
				it("should remove a field when provided a DOM node", function() {
					RD.Page.removeDirtyField({id: id});
					expect(RD.Page.numberOfDirtyFields()).toBe(1);
				})
				
				it("should remove a field when provided a jQuery node", function() {
					RD.Page.removeDirtyField({attr: function() { return id }});
					expect(RD.Page.numberOfDirtyFields()).toBe(1);
				})	
			})
			
			describe("for not dirty fields", function() { 
				var id;
				beforeEach(function() {
					id = makeID();
					RD.Page.addDirtyField(id);
					RD.Page.addDirtyField(makeID())
				})
				
				it("should remove a field when provided an ID", function() {
					RD.Page.removeDirtyField(makeID());
					expect(RD.Page.numberOfDirtyFields()).toBe(2);
				})
				
				it("should remove a field when provided a DOM node", function() {
					RD.Page.removeDirtyField({id: makeID()});
					expect(RD.Page.numberOfDirtyFields()).toBe(2);
				})
				
				it("should remove a field when provided a jQuery node", function() {
					RD.Page.removeDirtyField({attr: function() { return makeID() }});
					expect(RD.Page.numberOfDirtyFields()).toBe(2);
				})	
			})  
		})
	
		describe("allowIntentionalExit", function() {
			it("should cause alertForDirtyPage to return undefined")
		})
	
	  describe("intentional exit functions", function() {
	    describe("isIntentionalExitActivated", function() {
	      it("should return false by default", function() {
	        expect(RD.Page.isIntentionalExitActivated()).toBe(false);
	      })
	    })
	    
	    describe("allowIntentionalExit", function() {
	      it("should enable intentional exiting", function() {
  	      RD.Page.allowIntentionalExit();
          expect(RD.Page.isIntentionalExitActivated()).toBe(true);	      
        })
	    })
	    
	    describe("allowIntentionalExit", function() {
	      it("should cancel intentional exiting", function() {
	        RD.Page.allowIntentionalExit();
          RD.Page.cancelIntentionalExit();
          expect(RD.Page.isIntentionalExitActivated()).toBe(false);	      
        })
	    })
	    
	  })
	
		describe("alertForDirtyPage", function() {
		  var text, e, eventHolder = window.event;
		  beforeEach(function() {
		    text = RD.Page.text, testText = "extra";
		    RD.Page.text = testText;
	      e = {};
        window.event = {};
		  })
	  
		  afterEach(function() {
		    RD.Page.text = text;
		    window.event = eventHolder;
		  })
		  
		  // collect all the negative tests, since they're used three times
		  var negativeTests = function() {
		    describe("when there's no composeText function", function() {
  			  it("should return the value of the RD.Page.text property", function() {
  			    expect(RD.Page.alertForDirtyPage(e)).not.toBeDefined();
  			  })
	  
  			  it("should set the returnValue of the e argument", function() {
  			    RD.Page.alertForDirtyPage(e)
  			    expect(e.returnValue).not.toBeDefined();
  			  })
	  
  			  it("should set the returnValue of window.event if e is not provided", function() {
  			    RD.Page.alertForDirtyPage();
  			    expect(window.event.returnValue).not.toBeDefined();
  			  })
			  })
			  
			  describe("when there's a composeText function", function() {
  			  var otherText;
  			  beforeEach(function() {
  			    otherText = "foobar";
  			    RD.Page.composeText = function() { return otherText; }
  			  })

  			  afterEach(function() {
  			    delete RD.Page.composeText;
  			  })
  			  
  			  it("should not the value from the composeText function", function() {
  			    spyOn(RD.Page, "composeText");
  			    expect(RD.Page.composeText).not.toHaveBeenCalled();
  			    RD.Page.alertForDirtyPage(e);
  			  })
  			  
  			  it("should return the value of the otherText function", function() {
  			    expect(RD.Page.alertForDirtyPage(e)).not.toBeDefined();
  			  })
	  
  			  it("should set the returnValue of the e argument", function() {
  			    RD.Page.alertForDirtyPage(e)
  			    expect(e.returnValue).not.toBeDefined();
  			  })
	  
  			  it("should set the returnValue of window.event if e is not provided", function() {
  			    RD.Page.alertForDirtyPage();
  			    expect(window.event.returnValue).not.toBeDefined();
  			  })
			  })		    
		  }
      
			describe("when there are dirty fields", function() {			  
        beforeEach(function() {
          RD.Page.addDirtyField(makeID());
        })
        
  		  describe("when there's no deliberate exit", function() {
  		    beforeEach(function() {
    		    RD.Page.cancelIntentionalExit();
  		    })
		    
			    describe("when there's no composeText function", function() {
    			  it("should return the value of the RD.Page.text property", function() {
    			    expect(RD.Page.alertForDirtyPage(e)).toBe(testText);
    			  })
		  
    			  it("should set the returnValue of the e argument", function() {
    			    RD.Page.alertForDirtyPage(e)
    			    expect(e.returnValue).toBe(testText);
    			  })
		  
    			  it("should set the returnValue of window.event if e is not provided", function() {
    			    RD.Page.alertForDirtyPage();
    			    expect(window.event.returnValue).toBe(testText);
    			  })
  			  })
  			  
  			  describe("when there's a composeText function", function() {
    			  var otherText;
    			  beforeEach(function() {
    			    otherText = "foobar";
    			    RD.Page.composeText = function() { return otherText; }
    			  })

    			  afterEach(function() {
    			    delete RD.Page.composeText;
    			  })
    			  
    			  it("should call the composeText with list of dirty fields", function() {
    			    spyOn(RD.Page, "composeText");
    			    expect(RD.Page.composeText).toHaveBeenCalledWith(RD.Page.getDirtyFields());
    			    RD.Page.alertForDirtyPage(e);
    			  })
    			  
    			  it("should return the value of the otherText function", function() {
    			    expect(RD.Page.alertForDirtyPage(e)).toBe(otherText);
    			  })
		  
    			  it("should set the returnValue of the e argument", function() {
    			    RD.Page.alertForDirtyPage(e)
    			    expect(e.returnValue).toBe(otherText);
    			  })
		  
    			  it("should set the returnValue of window.event if e is not provided", function() {
    			    RD.Page.alertForDirtyPage();
    			    expect(window.event.returnValue).toBe(otherText);
    			  })
  			  })
  			})
  			
  			describe("when there is a deliberate exit", function() {
          beforeEach(function() {
            RD.Page.allowIntentionalExit();
          })
                    
          negativeTests();
  			})
			})
			
			describe("when there are no dirty fields", function() {			  
  		  describe("when there's no deliberate exit", function() {
  		    beforeEach(function() {
    		    RD.Page.cancelIntentionalExit();
  		    })
  		    
  		    negativeTests();		    
  			})
  			
  			describe("when there is a deliberate exit", function() {
          beforeEach(function() {
            RD.Page.allowIntentionalExit();
          })

          negativeTests();
  			})
			})
			
		})

    describe("initialize", function() {
      var fakeDocument = {ready: function(){} }

      beforeEach(function() {
        spyOn(RD, "jQuery").andReturn(fakeDocument);
        spyOn(fakeDocument, "ready");
      })
      
      it("should add a document/ready function", function() {
        expect(RD.jQuery).toHaveBeenCalled() // With(document);
        //expect(fakeDocument.ready).toHaveBeenCalled();
        RD.Page.initialize();
      })
    })
	})
})