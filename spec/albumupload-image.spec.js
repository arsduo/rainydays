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
    })

})