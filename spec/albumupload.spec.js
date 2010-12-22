describe("AlbumUpload", function() {
    it("should exist", function() {
        expect(typeof(RD.AlbumUpload)).toEqual("object");
    })

    describe("properties", function() {
        it("should define a retry limit", function() {
            expect(RD.AlbumUpload.retryLimit).toBeDefined();
        })

        describe("cssClasses", function() {
            it("should provide a hash of classes", function() {
                expect(typeof(RD.AlbumUpload.cssClasses)).toBe("object");
            })

            it("should define the class for the key picture", function() {
                expect(RD.AlbumUpload.cssClasses.keyPic).toBeDefined();
            })

            it("should define the class for the markup for each image", function() {
                expect(RD.AlbumUpload.cssClasses.imageNode).toBeDefined();
            })

            it("should provide a class for the data stored related to each image", function() {
                expect(RD.AlbumUpload.cssClasses.imageData).toBeDefined();
            })

            it("should provide a class for the visible content for each image", function() {
                expect(RD.AlbumUpload.cssClasses.imageContent).toBeDefined();
            })

            it("should provide a class for the vertical images", function() {
                expect(RD.AlbumUpload.cssClasses.verticalImage).toBeDefined();
            })

            it("should provide a class for the horizontal images", function() {
                expect(RD.AlbumUpload.cssClasses.horizontalImage).toBeDefined();
            })
        })
        
        it("should define the prefix for the image data array", function() {
            expect(RD.AlbumUpload.dataPrefix).toBeDefined();
        })

        it("should define the event fired when the key picture is changed", function() {
            expect(RD.AlbumUpload.keyPicEvent).toBeDefined();
        })

        it("should provide a set of labels which the user can change out", function() {
            expect(RD.AlbumUpload.labels).toBeDefined();
        })

        it("should provide a placeholder for cleared objects", function() {
            expect(RD.AlbumUpload.clearedObject).toBeDefined();
        })
        
        it("should provide the ID/name for the order of images", function() {
            expect(RD.AlbumUpload.imageSortList).toBeDefined();
        })
        
        it("should provide default options for uploader sortables", function() {
            expect(typeof(RD.AlbumUpload.sortableOptions)).toBe("object");
        })
    })

    describe("JAML", function() {
        var jamlTemplates = RD.AlbumUpload.jamlTemplates;

        describe("templates", function() {
            it("should exist", function() {
                expect(typeof(jamlTemplates)).toBe("object");
            })

            it("should provide a template for the image upload container", function() {
                expect(jamlTemplates.imageContainer).toBeDefined();
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
                for (var templateName in jamlTemplates) { templateCount++; }

                RD.AlbumUpload.registerJamlTemplates();
                expect(Jaml.register.callCount).toBe(templateCount);
            })


			// not yet working
            xit("should provide Jaml.register with the info for each template", function() {
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

	describe("initialize", function() {
		it("should call registerJamlTemplates", function() {
			spyOn(RD.AlbumUpload, "registerJamlTemplates");
			RD.AlbumUpload.initialize();
			expect(RD.AlbumUpload.registerJamlTemplates).toHaveBeenCalled();
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
})