describe("AlbumUpload", function() {
    describe("image prototype", function() {
        // initialize the whole shebang
        RD.AlbumUpload.initialize();
        var uploader, image;

        beforeEach(function() {			
            // stub the album container
            uploader = RD.createObject(RD.AlbumUpload.uploaderPrototype);
            uploader.albumContainer = $("<div/>");

            // create the raw image
            image = RD.createObject(RD.AlbumUpload.imagePrototype);			
        })

        describe("initialize", function() {
            var initOptions;
            beforeEach(function() {
                initOptions = {
                    localID: 2,
                    uploader: uploader
                }
                spyOn(image, "createNode");
            })

            it("should copy the provided localID from the settings", function() {
                image.initialize(initOptions);
                expect(image.localID).toBe(initOptions.localID);
            })

            it("should copy the provided uploader from the settings", function() {
                image.initialize(initOptions);
                expect(image.uploader).toBe(initOptions.uploader);
            })

            it("should call createNode", function() {
                image.initialize(initOptions);
                expect(image.createNode).toHaveBeenCalled();
            })

            it("should return the image", function() {
                expect(image.initialize(initOptions)).toBe(image);				
            })
            
            it("should set the status to created", function() {
                image.initialize(initOptions);
                expect(image.status).toBe("created");
            })
            
        })

        describe("createNode", function() {
            beforeEach(function() {
                // mock up the image
                image.uploader = uploader;
                image.localID = 2;
            })

            it("should render the imageContainer Jaml template", function() {
                spyOn(Jaml, "render").andCallThrough();
                image.createNode();
                expect(Jaml.render).toHaveBeenCalledWith("imageContainer", image);
            })

            it("should turn that markup into a jQuery node", function() {
                var result = "foo";
                spyOn(Jaml, "render").andReturn(result);
                spyOn(RD, "jQuery").andCallThrough();
                image.createNode();
                expect(RD.jQuery).toHaveBeenCalledWith(result);
            })

            it("should set image.node to that jQuery node", function() {
                var result = $("<div/>");
                spyOn(RD, "jQuery").andReturn(result);
                image.createNode();
                expect(image.node).toBe(result);
            })

            it("should append that node to the uploader's albumContainer", function() {
                var result = $("<div/>");
                spyOn(image.uploader.albumContainer, "append");
                image.createNode();
                expect(image.uploader.albumContainer.append).toHaveBeenCalledWith(image.node);
            })

            it("should associate the image with its node", function() {
                var result = $("<div/>");
                spyOn(RD, "jQuery").andReturn(result);
                spyOn(result, "data");
                image.createNode();
                expect(image.node.data).toHaveBeenCalledWith(RD.AlbumUpload.imageDataKey, image);
            })
        })

        describe("renderContent", function() {
            beforeEach(function() {
                image.initialize({
                    localID: 2,
                    uploader: uploader
                })
            })

            it("should call Jaml with the supplied template name and details", function() {
                spyOn(Jaml, "render").andReturn("foo");
                var templateName = "queued", details = {foo: "bar"};
                image.renderContent(templateName, details)
                expect(Jaml.render).toHaveBeenCalledWith(templateName, details);
            })

            it("should use the image as details if none are provided", function() {
                spyOn(Jaml, "render").andReturn("foo");
                var templateName = "queued";
                image.renderContent(templateName)
                expect(Jaml.render).toHaveBeenCalledWith(templateName, image);
            })

            it("should throw an error if Jaml returns a falsy value for content", function() {
                var falsy = null, fn = function() { image.renderContent("queued"); };
                spyOn(Jaml, "render").andCallFake(function() { return falsy; })
                expect(fn).toThrow();
                falsy = "";
                expect(fn).toThrow();
                falsy = undefined;
                expect(fn).toThrow();
            })

            it("should throw an error if Jaml throws an error", function() {
                var e = new Error(), fn = function() { image.renderContent("queued"); };
                spyOn(RD, "debug");
                spyOn(Jaml, "render").andThrow(e);
                expect(fn).toThrow(e);
            })
            
            it("should get the all the contents of the node's content child", function() {
                var fake = {replaceWith: function() {}}, content = {};
                spyOn(image.node, "find").andReturn(fake);
                spyOn(Jaml, "render").andReturn({});
                image.renderContent("queued");
                expect(image.node.find).toHaveBeenCalledWith("." + RD.AlbumUpload.cssClasses.imageContent + " *");
            })

            it("should not change the data child", function() {
                var content = "2", cssClass = RD.AlbumUpload.cssClasses.imageData;
                image.node.find("." + cssClass).html(content);
                image.renderContent("queued");
                expect(image.node.find("." + cssClass).html()).toBe(content);
            })
            
            it("should replace the node's innards with the content returned by Jaml", function() {
                var fake = {replaceWith: function() {}}, content = {};
                spyOn(image.node, "find").andReturn(fake);
                spyOn(Jaml, "render").andReturn(content);
                spyOn(fake, "replaceWith");
                image.renderContent("queued");
                expect(fake.replaceWith).toHaveBeenCalledWith(content);
            })
            
            it("should properly render content", function() {
                // make sure everything does work
                image.image = image; // mock stuff up for certain templates
                for (var type in RD.AlbumUpload.jamlTemplates) {
                    image.renderContent(type);
                }
            })
        })
        
        describe("initFromDatabase", function() {
            var initFromDBArgs;
            beforeEach(function() {
                image.initialize({
                    localID: 2,
                    uploader: uploader
                })

                initFromDBArgs = {
                    thumbImageURL: "foo",
                    fullImageURL: "bar"
                }
                
                spyOn(RD, "debug");
            })
            
            it("should call badServerResponse if it's not passed a valid object", function() {
                spyOn(image, "badServerResponse");
                image.initFromDatabase();
                expect(image.badServerResponse).toHaveBeenCalledWith(undefined);
            })
            
            it("should call badServerResponse if the image details don't include thumbURL and fullURL", function() {
                spyOn(image, "badServerResponse");
                var arg = {a: 2};
                image.initFromDatabase(arg);
                expect(image.badServerResponse).toHaveBeenCalledWith(arg);
            })
            
            it("should copy all the details from the initialization into the details property", function() {
                var fake = {a: 3};
                spyOn(RD.jQuery, "extend").andReturn(fake);
                image.initFromDatabase(initFromDBArgs);
                expect(RD.jQuery.extend).toHaveBeenCalledWith({}, initFromDBArgs);
                expect(image.details).toBe(fake);
            })
            
            it("should set isHorizontal appropriately for horizontal images", function() {
                initFromDBArgs.width = 3;
                initFromDBArgs.height = 2;
                image.initFromDatabase(initFromDBArgs);
                expect(image.isHorizontal).toBe(true);
            })
            
            it("should set isHorizontal appropriately for vertical images", function() {
                initFromDBArgs.width = 2;
                initFromDBArgs.height = 3;
                image.initFromDatabase(initFromDBArgs);
                expect(image.isHorizontal).toBe(false);
            })            
            
            it("should set the appropriate CSS class for horizontal images", function() {
                initFromDBArgs.width = 3;
                initFromDBArgs.height = 2;
                spyOn(image.node, "addClass");
                image.initFromDatabase(initFromDBArgs);
                expect(image.node.addClass).toHaveBeenCalledWith(RD.AlbumUpload.cssClasses.horizontalImage);
            })
            
            it("should set the appropriate CSS class for vertical images", function() {
                initFromDBArgs.width = 2;
                initFromDBArgs.height = 3;
                spyOn(image.node, "addClass");
                image.initFromDatabase(initFromDBArgs);
                expect(image.node.addClass).toHaveBeenCalledWith(RD.AlbumUpload.cssClasses.verticalImage);
            })            
            
        })
        
        describe("badServerResponse", function() {
            beforeEach(function() {
                spyOn(RD, "debug");
            })
            
            it("should call uploadErrored with recoverable: false and a shortDescription", function() {
                spyOn(image, "uploadErrored");
                image.badServerResponse();
                expect(image.uploadErrored).toHaveBeenCalled();
                var callArgs = image.uploadErrored.mostRecentCall.args[0];
                expect(callArgs).toBeDefined();
                expect(callArgs.isRecoverable).toBe(false);
                expect(typeof(callArgs.shortDescription)).toBe("string");
            })
        })
    })
})