describe("AlbumUpload", function() {
    describe("uploader prototype", function() {
        var uploader;
        beforeEach(function() {
            uploader = RD.createObject(RD.AlbumUpload.uploaderPrototype);
            spyOn(RD, "debug");
        })

        it("should provide a prototype", function() {
            expect(typeof(RD.AlbumUpload.uploaderPrototype)).toBe("object");
        })

        describe("properties", function() {
            it("should provide an image array", function() {
                // make sure it's an array
                expect(typeof(uploader.images)).toBe("object");
                expect(uploader.images.length).toBeDefined();
            })
        })

        // fake interaction with the upload manager object
        var fakeUploadManager, args;
        beforeEach(function() {
            // fake the jQuery calls so the checks pass
            fakeUploadManager = {fakeMgr: true};
            spyOn(RD.UploadManager, "create").andReturn(fakeUploadManager);
            args = {
                swfuploadOptions: {swfOptions: true}
            };
        })

        describe("initialization methods", function() {
            describe("initialize", function() {
                beforeEach(function() {
                    // fake the jQuery calls so the checks pass
                    spyOn(uploader, "setupDOM").andCallFake(function() {
                        uploader.albumContainer = $("<div/>");
                    });
                    spyOn(uploader, "refreshSortable")
                })

                it("should copy the provided settings", function() {
                    spyOn(RD.jQuery, "extend");
                    uploader.initialize(args);
                    // aguments should be blank hash, args
                    expect(RD.jQuery.extend).toHaveBeenCalledWith({}, args);
                })

                it("should store the copied settings in the settings property", function() {
                    spyOn(RD.jQuery, "extend").andReturn(args);
                    uploader.initialize(args);
                    expect(uploader.settings).toBe(args);
                })

                it("should throw an error if not passed a setting object", function() {
                    expect(function() { uploader.initialize() }).toThrow();
                    expect(function() { uploader.initialize("foo") }).toThrow();
                    expect(function() { uploader.initialize(null) }).toThrow();
                    expect(function() { uploader.initialize(2) }).toThrow();
                })

                it("should call the setupDOM method", function() {
                    uploader.initialize(args);
                    expect(uploader.setupDOM).toHaveBeenCalled();
                })

                it("should throw an exception unless settings include swfuploadOptions", function() {
                    delete args.swfuploadOptions;
                    expect(function() { uploader.initialize(args) }).toThrow();
                })

                it("should create an UploadManager to handle interaction with the SWFUpload", function() {
                    uploader.initialize(args);
                    expect(RD.UploadManager.create).toHaveBeenCalledWith(args.swfuploadOptions);
                })

                it("should add the UploadManager as uploader.uploadManager", function() {
                    uploader.initialize(args);
                    expect(uploader.uploadManager).toBe(fakeUploadManager);
                })

                it("should copy all the data from RD.AlbumUpload.sortableOptions to the local sortableOptions", function() {
                    uploader.initialize(args);
                    expect(uploader.sortableOptions).toBeDefined();
                    for (var k in RD.AlbumUpload.sortableOptions) {
                        expect(RD.AlbumUpload.sortableOptions[k]).toBe(uploader.sortableOptions[k])
                    }
                })

                it("should add the items property for the sortable options", function(){
                    uploader.initialize(args);
                    expect(uploader.sortableOptions.items).toBeDefined();
                })

                it("should set up the sortable", function() {
                    uploader.initialize(args);
                    expect(uploader.refreshSortable).toHaveBeenCalled();
                })
            })

            describe("setupDOM", function() {
                // make sure it handles dom nodes right
                var requiredNodes = {
                    albumContainerID: "albumContainer"
                }

                var optionalNodes = {
                    keyPicStorageID: "keyPicStorage",
                    keyImageViewID: "keyImageView",
                    placeholderID: "placeholder"
                }

                var initArgs, resultWithNode = $("<div/>"), resultWithoutNode = $();

                beforeEach(function() {
                    initArgs = $.extend({}, args, requiredNodes, optionalNodes);
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

                            uploader.initialize(initArgs);
                            // jQuery should get the node, and assign it to the right property
                            expect(lookedForNode).toBe(true);
                            expect(uploader[nodeProperty]).toBe(resultWithNode);
                        })

                        it("should throw an exception if " + node + " doesn't point to a DOM node", function() {
                            spyOn(RD, "jQuery").andCallFake(function(arg) {
                                // every other node's okay, but not that one
                                return arg === "#" + nodeProperty ? resultWithNode : resultWithNode;
                            });
                            RD.jQuery.extend = function() {}

                            expect(function() { uploader.initialize(initArgs); }).toThrow();
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

                            uploader.initialize(initArgs);
                            // jQuery should get the node, and assign it to the right property
                            expect(lookedForNode).toBe(true);
                            expect(uploader[nodeProperty]).toBe(resultWithNode);
                        })

                        it("if " + nodeName + " is not provided, it just get an empty jQuery object", function() {
                            var emptyResult = {};
                            spyOn(RD, "jQuery").andCallFake(function(arg) {
                                // every other node's okay, but not that one
                                return arg ? resultWithNode : emptyResult;
                            });
                            RD.jQuery.extend = $.extend;

                            delete initArgs[nodeName];
                            uploader.initialize(initArgs);
                            expect(uploader[nodeProperty]).toBe(emptyResult);
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
                spyOn(uploader, "setupDOM").andCallFake(function() {
                    // manually set up the DOM nodes
                    uploader.albumContainer = $("<div/>");
                    uploader.keyPicStorage = $();
                    uploader.keyImageView = $();
                    uploader.placeholderNode = $();
                });

                uploader.initialize(args);
            })
            describe("newImage", function() {
                var imgMock;

                beforeEach(function() {
                    imgMock = RD.createObject(RD.AlbumUpload.imagePrototype);
                    spyOn(RD, "createObject").andReturn(imgMock);
                    spyOn(imgMock, "initialize");
                })


                it("should create a new image object from the prototype", function() {
                    uploader.newImage();
                    expect(RD.createObject).toHaveBeenCalledWith(RD.AlbumUpload.imagePrototype);
                })

                it("should return that image", function() {
                    expect(uploader.newImage()).toBe(imgMock);
                })

                it("should add that image to the array", function() {
                    spyOn(uploader.images, "push");
                    uploader.newImage();
                    expect(uploader.images.push).toHaveBeenCalledWith(imgMock);
                })

                describe("call to image.initialize", function() {
                    it("should happen", function() {
                        var img = uploader.newImage();
                        expect(img.initialize).toHaveBeenCalled()
                    })

                    it("should include localID: number of images in the array", function() {
                        var img, initializeArgs;
                        for (var i = 0; i < 10; i++) {
                            img = uploader.newImage();
                            initializeArgs = img.initialize.mostRecentCall.args[0];
                            expect(initializeArgs.localID).toBe(uploader.images.length)
                            expect(typeof(initializeArgs.localID)).toBe("number");
                        }
                    })

                    it("should include uploader: the uploader", function() {
                        img = uploader.newImage();
                        initializeArgs = img.initialize.mostRecentCall.args[0];
                        expect(initializeArgs.uploader).toBe(uploader)
                    })
                })

                it("should hide the placeholderNode", function() {
                    spyOn(uploader.placeholderNode, "hide");
                    uploader.newImage();
                    expect(uploader.placeholderNode.hide).toHaveBeenCalled();
                })
            })

            describe("refreshSortable", function() {
                it("should call sortable on the node with the options", function() {
                    spyOn(uploader.albumContainer, "sortable");
                    uploader.refreshSortable();
                    expect(uploader.albumContainer.sortable).toHaveBeenCalledWith(uploader.sortableOptions);
                })
            })

            describe("setKeyPic", function() {
                var image, triggered;

                beforeEach(function () {
                    image = uploader.newImage();
                    triggered = false;
                    spyOn(uploader.albumContainer, "trigger").andCallFake(function() {
                        triggered = true;
                    })
                })

                it("should do nothing if we're not tracking the key pic", function() {
                    uploader.keyPicStorage = [];
                    expect(uploader.setKeyPic(image)).toBe(false);
                    expect(uploader.keyPic).not.toBeDefined();
                })

                describe("if we are tracking the key pic", function() {
                    beforeEach(function() {
                        uploader.keyPicStorage = $("<input/>");
                    })

                    it("should do nothing if the key pic is the current image", function() {
                        uploader.keyPic = image;
                        expect(uploader.setKeyPic(image)).toBe(true);
                        expect(triggered).toBe(false);
                    })

                    it("should proceed if there is no key pic", function() {
                        delete uploader.keyPic;
                        expect(uploader.setKeyPic(image)).toBe(true);
                        expect(triggered).toBe(true);
                    })

                    it("should proceed if the image isn't already the key pic", function() {
                        uploader.keyPic = uploader.newImage();
                        expect(uploader.setKeyPic(image)).toBe(true);
                        expect(triggered).toBe(true);
                    })

                    it("should remove the key image class from any elements in the album container", function() {
                        var cls = RD.AlbumUpload.cssClasses.keyPic, div = $("<div class='" + cls + "'/>")
                        uploader.albumContainer.append(div);
                        uploader.setKeyPic(image);
                        expect(div.attr("class")).not.toMatch(cls);
                    })

                    it("should add the key image class to the specific image", function() {
                        var cls = RD.AlbumUpload.cssClasses.keyPic;
                        uploader.setKeyPic(image);
                        expect(image.node.attr("class")).toMatch(cls);
                    })

                    it("should store the localID of the new keyPic in the storage node", function() {
                        uploader.keyPicStorage.val(image.localID + 1);
                        uploader.setKeyPic(image);
                        expect(uploader.keyPicStorage.val()).toBe(image.localID + "");

                    })

                    it("should trigger the RD.AlbumUpload.keyPicEvent event with a hash containing the uploader and the image", function() {
                        uploader.setKeyPic(image);
                        var args = uploader.albumContainer.trigger.mostRecentCall.args;
                        expect(args[0]).toBe(RD.AlbumUpload.keyPicEvent);
                        expect(args[1].uploader).toBe(uploader);
                        expect(args[1].image).toBe(image);
                    })

                })
            })

            describe("finders", function() {
                describe("findByLocalID", function() {
                    it("should return the image in the provided index", function() {
                        var result = {};
                        uploader.images = [1, 2, result];
                        expect(uploader.findByLocalID(2)).toBe(result);
                        expect(uploader.findByLocalID(1)).toBe(2);
                        expect(uploader.findByLocalID(3)).not.toBeDefined()
                    })
                })

                describe("findByRemoteID", function() {
                    it("should find an image with the matching .id property", function() {
                        var result = {id: 3};
                        uploader.images = [{id: 2}, result];
                        expect(uploader.findByRemoteID(3)).toBe(result);
                    })

                    it("should return the first image with the matching id, if there are somehow > 1", function() {
                        var result = {id: 3};
                        uploader.images = [{id: 2}, result, {id: 3}];
                        expect(uploader.findByRemoteID(3)).toBe(result);
                    })

                    it("should return undefined if there is no match", function() {
                        var result = {id: 3};
                        uploader.images = [{id: 2}, result];
                        expect(uploader.findByRemoteID(4)).not.toBeDefined()
                    })
                })

                describe("findByFileObject", function() {
                    beforeEach(function() {
                        console.log(uploader);
                    })

                    it("should return undefined if there are no images with file objects (e.g. only previous images)", function() {
                        uploader.images = [{id: 2}, {id: 4}, {id: 3}];
                        expect(uploader.findByFileObject({id: 2})).not.toBeDefined();
                    })
                    
                    it("should return an object who's file object matches", function() {
                        var fileObject = {id: 3}, img = {id: 4, fileObject: fileObject};
                        uploader.images = [{id: 2}, img, {id: 3}];
                        expect(uploader.findByFileObject(fileObject)).toBe(img);
                    })
                    
                    it("should return the first image with the matching object, if there are somehow > 1", function() {
                        var fileObject = {id: 3}, img = {id: 4, fileObject: fileObject};
                        uploader.images = [{id: 2}, img, {id: 3, fileObject: fileObject}];
                        expect(uploader.findByFileObject(fileObject)).toBe(img);
                    })

                    describe("by default", function() {
                        it("should not return a matching object if it's canceled", function() {
                            var fileObject = {id: 3}, img = {id: 4, fileObject: fileObject, status: "canceled"};
                            uploader.images = [{id: 2}, img, {id: 3}];
                            expect(uploader.findByFileObject(fileObject)).not.toBeDefined();
                        })
                        
                        it("should not return a matching object if it's errored", function() {
                            var fileObject = {id: 3}, img = {id: 4, fileObject: fileObject, status: "errored"};
                            uploader.images = [{id: 2}, img, {id: 3}];
                            expect(uploader.findByFileObject(fileObject)).not.toBeDefined();
                        })
                    })

                    it("should return a matching object even if it's canceled if the includeCanceled option is specified", function() {
                        var fileObject = {id: 3}, img = {id: 4, fileObject: fileObject, status: "canceled"};
                        uploader.images = [{id: 2}, img, {id: 3}];
                        expect(uploader.findByFileObject(fileObject, {includeCanceled: true})).toBe(img);
                    })
                    
                    it("should return a matching object even if it's canceled if the includeErrored option is specified", function() {
                        var fileObject = {id: 3}, img = {id: 4, fileObject: fileObject, status: "errored"};
                        uploader.images = [{id: 2}, img, {id: 3}];
                        expect(uploader.findByFileObject(fileObject, {includeErrored: true})).toBe(img);
                    })
                })
                
                describe("findByFilename", function() {
                    beforeEach(function() {
                        console.log(uploader);
                    })

                    it("should return undefined if there are no images with file objects (e.g. only previous images)", function() {
                        uploader.images = [{id: 2}, {id: 4}, {id: 3}];
                        expect(uploader.findByFilename("abc")).not.toBeDefined();
                    })
                    
                    it("should return an object who's file object matches", function() {
                        var filename = "abc", img = {id: 4, filename: filename};
                        uploader.images = [{id: 2}, img, {id: 3}];
                        expect(uploader.findByFilename(filename)).toBe(img);
                    })
                    
                    it("should return the first image with the matching object, if there are somehow > 1", function() {
                        var filename = "abc", img = {id: 4, filename: filename};
                        uploader.images = [{id: 2}, img, {id: 3, filename: filename}];
                        expect(uploader.findByFilename(filename)).toBe(img);
                    })

                    describe("by default", function() {
                        it("should not return a matching object if it's canceled", function() {
                            var filename = "abc", img = {id: 4, filename: filename, status: "canceled" };
                            uploader.images = [{id: 2}, img, {id: 3}];
                            expect(uploader.findByFilename(filename)).not.toBeDefined();
                        })
                        
                        it("should not return a matching object if it's errored", function() {
                            var filename = "abc", img = {id: 4, filename: filename, status: "errored"};
                            uploader.images = [{id: 2}, img, {id: 3}];
                            expect(uploader.findByFilename(filename)).not.toBeDefined();
                        })
                    })

                    it("should return a matching object even if it's canceled if the includeCanceled option is specified", function() {
                        var filename = "abc", img = {id: 4, filename: filename, status: "canceled"};
                        uploader.images = [{id: 2}, img, {id: 3}];
                        expect(uploader.findByFilename(filename, {includeCanceled: true})).toBe(img);
                    })
                    
                    it("should return a matching object even if it's canceled if the includeErrored option is specified", function() {
                        var filename = "abc", img = {id: 4, filename: filename, status: "errored"};
                        uploader.images = [{id: 2}, img, {id: 3}];
                        expect(uploader.findByFilename(filename, {includeErrored: true})).toBe(img);
                    })
                })
            })
        })
    })
})