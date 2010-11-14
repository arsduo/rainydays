describe("AlbumUpload", function() {
    it("should exist", function() {
        expect(typeof(RD.AlbumUpload)).toEqual("object");
    })

    describe("properties", function() {
        it("should define a retry limit", function() {
            expect(RD.AlbumUpload.retryLimit).toBeDefined();
        })

        it("should define the event fired when the key picture is changed", function() {
            expect(RD.AlbumUpload.keyPicEvent).toBeDefined();
        })

        it("should define the class for the key picture", function() {
            expect(RD.AlbumUpload.keyPicClass).toBeDefined();
        })

        it("should define the class for the uploading markup", function() {
            expect(RD.AlbumUpload.uploadNodeClass).toBeDefined();
        })
        
        it("should provide a set of labels which the user can change out", function() {
            expect(RD.AlbumUpload.labels).toBeDefined();
        })
        
    })

    describe("JAML", function() {
        var jamlTemplates = RD.AlbumUpload.jamlTemplates;

        describe("templates", function() {
            it("should exist", function() {
                expect(typeof(jamlTemplates)).toBe("object");
            })  
            
            it("should provide a template for the whole album upload block", function() {
                expect(jamlTemplates.albumUploadBlock).toBeDefined();    
            })

            it("should provide a template matching the uploading markup class", function() {
                expect(jamlTemplates[RD.AlbumUpload.uploadNodeClass]).toBeDefined();
            })

            it("should provide a template matching the magnification view", function() {
                expect(jamlTemplates.magnifyDialog).toBeDefined();
            })

            it("should define templates for certain statuses", function() {
                var statusesWithTemplates = ["queued", "uploading", "errored", "canceled", "visible"];
                for (var i = 0; i < statusesWithTemplates; i++) {
                    expect(typeof(jamlTemplates[statusesWithTemplates[i]])).toBe("function");
                }              
            })
        })
        
        describe("initializer function", function() {
            beforeEach(function() {
                spyOn(Jaml, "register");                
            })
            
            it("should exist", function(){
                expect(typeof(RD.AlbumUpload.registerJamlTemplates)).toBe("function");
            })
            
            it("should call Jaml.register once for every Jaml template", function() {
                // first find out how many templates we have, since objects don't have .length
                var templateCount = 0;
                for (var templateName in jamlTemplates) { templateCount++ }
                
                RD.AlbumUpload.registerJamlTemplates();
                expect(Jaml.register.callCount).toBe(templateCount);
            })
            
            it("should provide Jaml.register with the info for each template", function() {
                var name, fn;
                RD.AlbumUpload.registerJamlTemplates();
                
                // now make sure that for each template, we passed the appropriate function
                for (var i = 0; i < Jaml.register.callCount; i++) {
                    name = Jaml.register.argsForCall[i][0];
                    fn = Jaml.register.argsForCall[i][1];
                    expect(fn).toBe(jamlTemplates[name])
                }
            })
        })
    })
    
    describe("newUploader", function() {
		var uploader;
		
		beforeEach(function() {
			uploader = RD.createObject(RD.AlbumUpload.uploaderPrototype);
            spyOn(RD, "createObject").andReturn(uploader);
			spyOn(uploader, "initialize").andReturn(uploader);
		})
		
        it("should create a new uploader object", function() {
            RD.AlbumUpload.newUploader({});
            expect(RD.createObject).toHaveBeenCalledWith(RD.AlbumUpload.uploaderPrototype);
        })
        
        it("should initialize that new uploader object", function() {
            var settings = {a: 2};
            RD.AlbumUpload.newUploader(settings);
            expect(uploader.initialize).toHaveBeenCalledWith(settings);
            
        })
        
        it("should return that new uploader object", function() {
            expect(RD.AlbumUpload.newUploader()).toBe(uploader)
        })
    })

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
		            placeholderNodeID: "placeholder"
				}

				var initArgs, resultWithNode = $("<div/>"), resultWithoutNode = $();
			
				beforeEach(function() {
					initArgs = $.extend({}, requiredNodes, optionalNodes);
				})

				for (var node in requiredNodes) {
					var nodeProperty = requiredNodes[node];
				
					it("should get " + node + " and assign it to the appropriate property", function() {
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