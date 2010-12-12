describe("AlbumUpload", function() {
    describe("image prototype", function() {
        // initialize the whole shebang
        RD.AlbumUpload.initialize();
        var uploader, image, testNodes;
        beforeEach(function() {
            // stub the album container
            testNodes = $("<div/>", {
                id: "testNode",
                style: "display: none;"
            })
            testNodes.append($("<div/>", {id: "sort"}));
            $("body").append(testNodes);
            
            spyOn(RD.UploadManager, "create")

            
            uploader = RD.AlbumUpload.newUploader({
                albumContainerID: "sort",
                swfuploadOptions: {}
            });

            // create the raw image
            image = RD.createObject(RD.AlbumUpload.imagePrototype);
        });
        
        afterEach(function() {
            testNodes.remove();
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
            
            it("should create the details object", function() {
                image.initialize(initOptions);
                expect(image.details).toBeDefined();
                expect(typeof(image.details)).toBe("object");
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
            
            it("should find the data node and set it to dataNode", function() {
                var result = $("<div/>"), result2 = $("<div/>");
                // image.node
                spyOn(RD, "jQuery").andReturn(result);
                // image.dataNode
                spyOn(result, "find").andReturn(result2);
                image.createNode();
                expect(image.node.find).toHaveBeenCalledWith("." + RD.AlbumUpload.cssClasses.imageData);
                expect(image.dataNode).toBe(result2);
            })
            
            describe("the sort order node", function() {
                var input;

                beforeEach(function() {
                    image.createNode();
                    input = image.dataNode.find("." + RD.AlbumUpload.imageSortList)[0];
                })
                
                it("should be an input", function() {
                    expect(input).toBeDefined();
                    expect(input.tagName).toBe("INPUT");
                })

                it("should be hidden", function() {
                    expect(input.type).toBe("hidden");
                })

                it("should have the sort list name as an array", function() {
                    expect(input.name).toBe(RD.AlbumUpload.imageSortList + "[]");
                })

                it("should have a unique ID composed of the sort list and the image's local ID", function() {
                    expect(input.id).toBe(RD.AlbumUpload.imageSortList + image.localID);
                })

                it("should have the local ID as the value", function() {
                    expect(input.value).toBe(image.localID + "");
                })
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
            var initFromDBArgs, requiredProperties = ["id", "fullImageURL", "thumbImageURL"], i;
            beforeEach(function() {
                image.initialize({
                    localID: 2,
                    uploader: uploader
                })

                initFromDBArgs = {
                    thumbImageURL: "foo",
                    fullImageURL: "bar",
                    id: "bar"
                }

                spyOn(RD, "debug");
            })

            it("should call badServerResponse if it's not passed a valid object", function() {
                spyOn(image, "badServerResponse");
                image.initFromDatabase();
                expect(image.badServerResponse).toHaveBeenCalledWith(undefined);
            })

            describe("required properties", function() {
                var testRequiredProperty = function(j) {
                    it("should call badServerResponse if the image details don't include " + requiredProperties[j], function() {
                        delete initFromDBArgs[requiredProperties[j]];
                        spyOn(image, "badServerResponse");
                        image.initFromDatabase(initFromDBArgs);
                        expect(image.badServerResponse).toHaveBeenCalledWith(initFromDBArgs);
                    })                    
                }

                for (var i = 0; i < requiredProperties.length; i++) {
                    testRequiredProperty(i);
                }
            })
            
            it("should copy all the details from the initialization into the details property", function() {
                var fake = {a: 3}, originalDetails = image.details;
                spyOn(RD.jQuery, "extend").andReturn(fake);
                image.initFromDatabase(initFromDBArgs);
                expect(RD.jQuery.extend).toHaveBeenCalledWith(originalDetails, initFromDBArgs);
                expect(image.details).toBe(fake);
            })
            
            it("should copy the id to the remoteID property", function() {
                image.initFromDatabase(initFromDBArgs);
                expect(image.remoteID).toBe(initFromDBArgs.id);
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
                image.initFromDatabase(initFromDBArgs);
                expect(image.node.attr("class")).toMatch(RD.AlbumUpload.cssClasses.horizontalImage);
            })

            it("should set the appropriate CSS class for vertical images", function() {
                initFromDBArgs.width = 2;
                initFromDBArgs.height = 3;
                image.initFromDatabase(initFromDBArgs);
                expect(image.node.attr("class")).toMatch(RD.AlbumUpload.cssClasses.verticalImage);
            })

            it("should remove the uploading class", function() {
                image.initFromDatabase(initFromDBArgs);
                expect(image.node.attr("class")).not.toMatch(RD.AlbumUpload.cssClasses.uploading);
            })

            it("should render the visible content", function() {
                spyOn(image, "renderContent");
                image.initFromDatabase(initFromDBArgs);
                expect(image.renderContent).toHaveBeenCalledWith("visible");
            })

            describe("link bindings", function() {
                // due to scoping with the for loop, we have a lot of nesting here
                var classes = RD.AlbumUpload.cssClasses, links = {}, fake, ignoredFake;
                // establish up the classes and associated methods we'll be looking at 
                links[classes.deleteLink] = "toggleDeletion";
                links[classes.magnifyLink] = "showFullImage";
                links[classes.makeKeyPicLink] = "setKeyPic";
                
                beforeEach(function() {
                    fake = $("<div/>"), ignoredFake = $("<div/>");
                    spyOn(fake, "bind");
                })

                var linkTests = function(cssClass, method) {
                    describe(cssClass + " => " + method, function() {
                        beforeEach(function() {
                            // find gets called three times each init, but we only care about the one that corresponds to the property we're looking at
                            // so if it's not the target we want, return an object we don't monitor
                            // if it is, return the one with the spy
                            spyOn(image.node, "find").andCallFake(function(css) {
                                return (css.match(cssClass)) ? fake : ignoredFake;
                            })
                        })
                        
                        it("should get to the " + cssClass + " link in the node", function() {
                            image.initFromDatabase(initFromDBArgs);
                            expect(image.node.find).toHaveBeenCalledWith("." + cssClass);
                        })

                        it("should bind a click listener to the " + cssClass + " link that triggers the " + method + " function", function() {
                            // setKeyPic is called on the image's uploader
                            var target = (cssClass === classes.makeKeyPicLink ? image.uploader : image);
                            
                            spyOn(target, method);
                            image.initFromDatabase(initFromDBArgs);
                            expect(fake.bind).toHaveBeenCalled();

                            var args = fake.bind.mostRecentCall.args;
                            // make sure it's a click method
                            expect(args[0]).toBe("click");

                            // now make sure the function calls the right method when invoked
                            expect(typeof(args[1])).toBe("function");
                            args[1]();
                            expect(target[method]).toHaveBeenCalled();
                        })
                    })
                }

                for (var link in links) {
                    linkTests(link, links[link]);
                }
            })
                        
            it("should set the status to visible", function() {
                image.initFromDatabase(initFromDBArgs);
                expect(image.status).toBe("visible");
            })
            
            it("should use addData to store the remote ID", function() {
                initFromDBArgs.id = "foo";
                spyOn(image, "addData");
                image.initFromDatabase(initFromDBArgs);
                expect(image.addData).toHaveBeenCalledWith("id", initFromDBArgs.id);
            })

            describe("key pic", function() {
                it("should become the key pic if there's no key pic set", function() {
                    delete image.uploader.keyPic;
                    spyOn(image.uploader, "setKeyPic");
                    image.initFromDatabase(initFromDBArgs);
                    expect(image.uploader.setKeyPic).toHaveBeenCalledWith(image);
                })
                
                it("should become the key pic if there's a previous key pic, but this is marked", function() {
                    delete image.uploader.keyPic;
                    initFromDBArgs.isKeyPic = true;
                    spyOn(image.uploader, "setKeyPic");
                    image.initFromDatabase(initFromDBArgs);
                    expect(image.uploader.setKeyPic).toHaveBeenCalledWith(image);
                })

                it("should not become the key pic if there's a previous key pic", function() {
                    image.uploader.keyPic = 2;
                    spyOn(image.uploader, "setKeyPic");
                    image.initFromDatabase(initFromDBArgs);
                    expect(image.uploader.setKeyPic).not.toHaveBeenCalled();
                })                
            })

            it("should return the image", function() {
                expect(image.initFromDatabase(initFromDBArgs)).toBe(image);
            })
        })

        describe("initFromUpload", function() {
            var uploadArgs;
            beforeEach(function() {
                image.initialize({
                    localID: 2,
                    uploader: uploader
                })
                
                uploadArgs = {
                    id: "SWFUpload1_0",
                    name: "bar.jpg"
                }
            })
            
            
            describe("if the right info isn't provided", function() {
                beforeEach(function() {
                    spyOn(image, "badFileUpload");                    
                })
                
                it("should switch to badFileUpload if there are no upload parameters", function() {
                    image.initFromUpload();
                    expect(image.badFileUpload).toHaveBeenCalledWith(undefined);
                })
            
                it("should throw an error if there's no ID parameter", function() {
                    delete uploadArgs.id;
                    image.initFromUpload(uploadArgs);
                    expect(image.badFileUpload).toHaveBeenCalledWith(uploadArgs);
                })

                it("should throw an error if there's no name parameter", function() {
                    delete uploadArgs.name;
                    image.initFromUpload(uploadArgs);
                    expect(image.badFileUpload).toHaveBeenCalledWith(uploadArgs);
                })
            })
            
            it("should save the filename on the image", function() {
                image.initFromUpload(uploadArgs);
                expect(image.filename).toBe(uploadArgs.name);
            })            
            
            it("should save the file object on the image", function() {
                image.initFromUpload(uploadArgs);
                expect(image.fileObject).toBe(uploadArgs);
            })      
            
            it("should set the status to queued", function() {
                image.initFromUpload(uploadArgs);
                expect(image.status).toBe("queued");
            })

            it("should render the queued content", function() {
                spyOn(image, "renderContent");
                image.initFromUpload(uploadArgs);
                expect(image.renderContent).toHaveBeenCalledWith("queued");
            })            
            
            it("should add the uploading class to the element", function() {
                image.node.attr("class", "")
                image.initFromUpload(uploadArgs);
                expect(image.node.attr("class")).toBe("uploading");
            })            
            
            it("should trigger the fileUploadStarted event on the albumContainer with {image: image}", function() {
                var triggered = false, args, evented = function(data) {
                    triggered = true;
                    args = arguments;
                }
                image.uploader.albumContainer.bind("fileUploadStarted", evented);
                image.initFromUpload(uploadArgs);
                
                expect(triggered).toBe(true);
                expect(!!args[1]).toBe(true);
                expect(args[1].image).toBe(image)
            })
            
            it("should return the image", function() {
                expect(image.initFromUpload(uploadArgs)).toBe(image);
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

        describe("badFileUpload", function() {
            beforeEach(function() {
                spyOn(RD, "debug");
            })

            it("should call uploadErrored with recoverable: false and a shortDescription", function() {
                spyOn(image, "uploadErrored");
                image.badFileUpload();
                expect(image.uploadErrored).toHaveBeenCalled();
                var callArgs = image.uploadErrored.mostRecentCall.args[0];
                expect(callArgs).toBeDefined();
                expect(callArgs.isRecoverable).toBe(false);
                expect(typeof(callArgs.shortDescription)).toBe("string");
            })
        })
        
        describe("inputName", function() {
            it("should create an input name value for the given key", function() {
                var str = "foo";
                expect(image.inputName(str)).toBe(RD.AlbumUpload.dataPrefix + "[" + image.localID + "][" + str + "]");
            })
        })
        
        describe("inputID", function() {
            it("should get the input name", function() {
                var str = "foo";
                spyOn(image, "inputName").andReturn(str);
                image.inputID(str);
                expect(image.inputName).toHaveBeenCalledWith(str);
            })
            
            it("should replace [] with _", function() {
                var str = "foo";
                spyOn(image, "inputName").andCallThrough();
                var result = image.inputID(str);
                expect(image.inputName).not.toMatch(/[\[\]]/);
            })

            it("should strip trailing _", function() {
                var str = "foo";
                spyOn(image, "inputName").andCallThrough();
                var result = image.inputID(str);
                expect(result).not.toMatch(/\_$/);
            })
            
            it("should be global", function() {
                var str = "foo";
                var result = image.inputID(str);
                expect(result).not.toMatch(/(\[|\])/);
            })
            
            it("should work", function() {
                image.localID = 2;
                expect(image.inputID("foo")).toBe(RD.AlbumUpload.dataPrefix + "_2_foo");
            })
        })
        
        describe("addData", function() {
            var result, name = "name", value = "value";
            
            beforeEach(function() {
                spyOn(RD, "jQuery").andCallThrough();
                image.initialize({
                    localID: 2,
                    uploader: uploader
                })
            })
            
            it("should append to the data node", function() {
                spyOn(image.dataNode, "append");
                image.addData(name, value);
                expect(image.dataNode.append).toHaveBeenCalled();
                var input = image.dataNode.append.mostRecentCall.args[0];
            })
            
            describe("the node appended to dataNode", function() {
                var input;

                beforeEach(function() {
                    spyOn(image.dataNode, "append");
                    image.addData(name, value);
                    input = $(image.dataNode.append.mostRecentCall.args[0])[0];                    
                })
                
                it("should be hidden", function() {
                    expect(input.type).toBe("hidden");
                })
                
                it("should have the right name", function() {
                    expect(input.name).toBe(image.inputName(name));
                })
                
                it("should have the right ID", function() {
                    expect(input.id).toBe(image.inputID(name));
                })
                
                it("should have the value", function() {
                    expect(input.value).toBe(value);
                })
            })
            
            it("should add that value to image.details", function() {
                delete image.details[name];
                image.addData(name, value);
                expect(image.details[name]).toBe(value);
            })
            
        })

        describe("removeData", function() {
            var result, name = "name", value = "value";
            
            beforeEach(function() {
                spyOn(RD, "jQuery").andCallThrough();
                image.initialize({
                    localID: 2,
                    uploader: uploader
                })
            })
            
            it("should remove the input from the data node", function() {
                spyOn(image.dataNode, "remove");
                var name = "foo";
                image.removeData(name);
                expect(image.dataNode.remove).toHaveBeenCalledWith("#" + image.inputID(name));
            })
            
            it("should remove the data from details", function() {
                var name = "foo";
                image.details.foo = "bar";
                image.removeData(name);
                expect(image.details.foo).not.toBeDefined();
            })
        })
    })
})