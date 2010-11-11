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

    describe("uploader prototype", function() {
        var prototype = RD.createObject(RD.AlbumUpload.uploaderPrototype);

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
        
        describe("newImage", function() {
            beforeEach(function() {
                // reset the images array
                prototype.images = [];
            })
            
            it("should create a new image object from the prototype", function() {
                spyOn(RD, "createObject").andCallThrough();
                prototype.newImage();
                expect(RD.createObject).toHaveBeenCalledWith(RD.AlbumUpload.imagePrototype);
            })
            
            it("should return that image", function() {
                var result = "foo";
                spyOn(RD, "createObject").andReturn(result);
                expect(prototype.newImage()).toBe(result);
            })
            
            it("should add that image to the array", function() {
                var result = "foo";
                spyOn(RD, "createObject").andReturn(result);
                spyOn(prototype.images, "push");
                prototype.newImage();
                expect(prototype.images.push).toHaveBeenCalledWith(result);
            })
            
            
            it("should set the image's localID to the number of images in the array", function() {
                var img;
                for (var i = 0; i < 10; i++) {
                    img = prototype.newImage();
                    expect(img.localID).toBe(prototype.images.length)
                }
            })
            
            
            
        })
    })
})