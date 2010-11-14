describe("AlbumUpload", function() {
    describe("uploader prototype", function() {
        var prototype;
        beforeEach(function() {
            prototype = RD.createObject(RD.AlbumUpload.uploaderPrototype);            
        })

        it("should provide a prototype", function() {
            expect(typeof(RD.AlbumUpload.uploaderPrototype)).toBe("object");
        })

        describe("properties", function() {
            it("should provide an image array", function() {
                // make sure it's an array
                expect(typeof(prototype.images)).toBe("object");
                expect(prototype.images.length).toBeDefined();
            })
        })

        describe("initialization methods", function() {
	        describe("initialize", function() {
				// fake the jQuery calls so the checks pass
				beforeEach(function() {
					spyOn(prototype, "setupDOM");
				})
			
	            it("should copy the provided settings", function() {
	                spyOn(RD.jQuery, "extend");
	                var arg = {a: 3};
	                prototype.initialize(arg);
	                // aguments should be blank hash, arg
	                expect(RD.jQuery.extend).toHaveBeenCalledWith({}, arg);
	            })
           
	            it("should store the copied settings in the settings property", function() {
	                var arg = {a: 3};
	                spyOn(RD.jQuery, "extend").andReturn(arg);
	                prototype.initialize(arg);
	                expect(prototype.settings).toBe(arg);
	            })

				it("should throw an error if not passed a setting object", function() {
					expect(function() { prototype.initialize() }).toThrow();
					expect(function() { prototype.initialize("foo") }).toThrow();
					expect(function() { prototype.initialize(null) }).toThrow();
					expect(function() { prototype.initialize(2) }).toThrow();
				})
			
				it("should call the setupDOM method", function() {
					prototype.initialize({});
					expect(prototype.setupDOM).toHaveBeenCalled();
				})
			})
		
			describe("setupDOM", function() {
				// make sure it handles dom nodes right
				var requiredNodes = {
					sortOrderStorageID: "sortOrderStorage",
					albumContainerID: "albumContainer"
				}
			
				var optionalNodes = {
					keyImageStorageID: "keyImageStorage",
					keyImageViewID: "keyImageView",
		            placeholderID: "placeholder"
				}

				var initArgs, resultWithNode = $("<div/>"), resultWithoutNode = $();
			
				beforeEach(function() {
					initArgs = $.extend({}, requiredNodes, optionalNodes);
				})
				
				var node;
				describe("required nodes", function() {
					for (node in requiredNodes) {
						nodeProperty = requiredNodes[node];
				
						it("should get " + node + " and assign it to the appropriate property", function() {
							var lookedForNode = false, nodeValue = nodeProperty;
							// rather than track down the value in the list of calls and their arguments,
							// just check that the right node was called for here
							spyOn(RD, "jQuery").andCallFake(function(arg) {
								if (arg === "#" + nodeValue) {
									lookedForNode = true;
								}
								return resultWithNode;
							})
							RD.jQuery.extend = $.extend;

							prototype.initialize(initArgs);
							// jQuery should get the node, and assign it to the right property
							expect(lookedForNode).toBe(true);
							expect(prototype[nodeProperty]).toBe(resultWithNode);
						})
				
						it("should throw an exception if " + node + " doesn't point to a DOM node", function() {
							spyOn(RD, "jQuery").andCallFake(function(arg) {
								// every other node's okay, but not that one
								return arg === "#" + nodeProperty ? resultWithNode : resultWithNode;
							});
							RD.jQuery.extend = function() {}
					
							expect(function() { prototype.initialize(initArgs); }).toThrow();
						})
					}
				})
				
				describe("optional nodes", function() {
					var optionalNodeTests = function(nodeName) {
						var nodeProperty = optionalNodes[nodeName];
						
						it("if " + nodeName + " is provided, it should look for it and assign it to the appropriate property", function() {
							var lookedForNode = false;
							// rather than track down the value in the list of calls and their arguments,
							// just check that the right node was called for here
							spyOn(RD, "jQuery").andCallFake(function(arg) {
								if (arg === "#" + nodeProperty) {
									lookedForNode = true;
								}
								return resultWithNode;
							})
							RD.jQuery.extend = $.extend;

							prototype.initialize(initArgs);
							// jQuery should get the node, and assign it to the right property
							expect(lookedForNode).toBe(true);
							expect(prototype[nodeProperty]).toBe(resultWithNode);
						})

						it("if " + nodeName + " is not provided, it just get an empty jQuery object", function() {
							var emptyResult = {};
							spyOn(RD, "jQuery").andCallFake(function(arg) {
								// every other node's okay, but not that one
								return arg ? resultWithNode : emptyResult;
							});
							RD.jQuery.extend = $.extend;

							delete initArgs[nodeName];
							prototype.initialize(initArgs);
							expect(prototype[nodeProperty]).toBe(emptyResult);
						})
					}
					
					for (node in optionalNodes) {
						optionalNodeTests(node);
					}
				})
			})
		})
        
		describe("methods", function() {
			beforeEach(function() {
                // reset the images array
        		spyOn(prototype, "setupDOM").andCallFake(function() {
					// manually set up the DOM nodes
					prototype.sortOrderStorage = $("<div/>");
					prototype.albumContainer = $("<div/>");
					prototype.keyImageStorage = $();
					prototype.keyImageView = $();
		            prototype.placeholderNode = $();            
				});
				
        		prototype.initialize({});
			})
	        describe("newImage", function() {
				var imgMock;
				
				beforeEach(function() {
					imgMock = RD.createObject(RD.AlbumUpload.imagePrototype);
					spyOn(RD, "createObject").andReturn(imgMock);
					spyOn(imgMock, "initialize");
				})
            

	            it("should create a new image object from the prototype", function() {
	                prototype.newImage();
	                expect(RD.createObject).toHaveBeenCalledWith(RD.AlbumUpload.imagePrototype);
	            })
        
	            it("should return that image", function() {
	                expect(prototype.newImage()).toBe(imgMock);
	            })
        
	            it("should add that image to the array", function() {
	                spyOn(prototype.images, "push");
	                prototype.newImage();
	                expect(prototype.images.push).toHaveBeenCalledWith(imgMock);
	            })
        
				describe("call to image.initialize", function() {
					it("should happen", function() {
						var img = prototype.newImage();
						expect(img.initialize).toHaveBeenCalled()
					})
				
		            it("should include localID: number of images in the array", function() {
		                var img, initializeArgs;
		                for (var i = 0; i < 10; i++) {
		                    img = prototype.newImage();
		                    initializeArgs = img.initialize.mostRecentCall.args[0];
							expect(initializeArgs.localID).toBe(prototype.images.length)
		                }
		            })
		
		            it("should include uploader: the uploader", function() {
	                    img = prototype.newImage();
	                    initializeArgs = img.initialize.mostRecentCall.args[0];
						expect(initializeArgs.uploader).toBe(prototype)
		            })			
				})
            
	            it("should hide the placeholderNode", function() {
	                spyOn(prototype.placeholderNode, "hide");
	                prototype.newImage();
	                expect(prototype.placeholderNode.hide).toHaveBeenCalled();
	            })
            
	        })
		})
    })
})