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
            
            it("should get the all the contests of the node", function() {
                var fake = {replaceWith: function() {}}, content = {};
                spyOn(image.node, "find").andReturn(fake);
                spyOn(Jaml, "render").andReturn({});
                image.renderContent("queued");
                expect(image.node.find).toHaveBeenCalledWith("*");
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
    })
})