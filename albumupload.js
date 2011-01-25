/*
RD.AlbumUpload Constructor
Creates a new RD.AlbumUpload and adds it to the DOM and the tracking array.  Also initializes some basic functions.
Assumptions:
- Jaml has a block called albumUploadBlock and it renders content (failure: throws exception w/ an alert, since the page itself is broken and we can't recover from that)

Other outcome / test cases:
- this initializes RD.AlbumUpload if it hasn't been (creates array, assigns the debug function)
- this returns an item of type RD.AlbumUpload (viewed by the constructor function)
- this adds that image to the RD.AlbumUpload.images() at the index of its localID (findable by RD.AlbumUpload.findByLocalID)
- this creates a new node in RD.AlbumUpload.albumContainer that matches the node object here
- the image's node is unique
- this sets the initial status to created

NOTE: by storing the image in the array using the last index, we subsequently require that that index in the array
always be occupied.  hence, clear replaces it with a null, rather than erasing it
*/
RD.AlbumUpload = {
    // properties
    retryLimit:  1,
    dataPrefix: "images",
    keyPicEvent: "keyPicRegistered",
    imageDataKey: "albumupload.image",
    imageSortList: "imagePosition",

    // list of available statuses
    statusMap: {

    },

    // default sortable options
    sortableOptions: {
        placeholder: "beingSorted inlineBlock",
        tolerance: "pointer",
        cursor: "move",
    },

    cssClasses: {
        horizontalImage: "forHorizontalImage",
        verticalImage: "forVerticalImage",
        imageNode: "albumUploadBlock",
        imageData: "imageData",
        imageContent: "imageContent",
        keyPic: "keyPic",
        uploading: "uploading",
        deleteLink: "deleteLink",
        magnifyLink: "magnifyLink",
        makeKeyPicLink: "makeKeyPicLink",
        progressbar: "progressbar",
        processingMessage: "processingMessage"
    },

    labels: {
        queued_retry: "Waiting to retry",
        queued_upload: "Waiting to upload",
        uploading_file: "Uploading file ",
        processing_uploaded_file: "Processing...",
        error_for: " for ",
        link_clear: "clear",
        is_album_pic: "album pic",
        make_album_pic: "make album pic",
        will_be_deleted: "Will be deleted<br/>click the X to undelete",
        upload_canceled: "Upload Canceled"
    },

    initialize: function() {
        if (!this.initialized) {
            this.registerJamlTemplates();
        }
    },

    newUploader: function(settings) {
      this.initialize();
      return RD.createObject(this.uploaderPrototype).initialize(settings);
    },

    uploaderPrototype: {
        images: [],

        initialize: function(settings) {
            // bring jQuery into the local context
            var jQuery = RD.jQuery;

            // make sure we got a settings
            if (!settings || typeof(settings) !== "object") {
                throw("RD.AlbumUpload.newUploader was not passed a settings hash!")
            }

            // then store the provided settings
            this.settings = jQuery.extend({}, settings);

            // now set up the DOM nodes we use
            this.setupDOM();

            // connect to the SWFUpload instance
            if (!settings.swfuploadOptions) {
                throw("RD.AlbumUpload.newUploader was not passed swfuploadOptions!");
            }
            this.uploadManager = RD.UploadManager.create(settings.swfuploadOptions, this);

            // set up the sortable options for properties that can't be set up at load time
            this.sortableOptions = jQuery.extend(RD.AlbumUpload.sortableOptions, {
                items: "div." + RD.AlbumUpload.cssClasses.imageNode
            });

            // set up the sortable for the first time
            this.refreshSortable();

            return this;
        },

        setupDOM: function() {
            // initialize all the different DOM nodes we use
            var settings = this.settings, jQuery = RD.jQuery;

            // albumContainer -- where all the visible action happens
            // this is required
            this.albumContainer = jQuery("#" + settings.albumContainerID);
            if (this.albumContainer.length === 0) {
                throw("InitializationError: Could not find AlbumUpload sortOrderStorageID #" + settings.albumContainerID + "!");
            }

            // get the key image (album cover) value store and visible location if provided
            this.keyPicStorage = settings.keyPicStorageID ? jQuery("#" + settings.keyPicStorageID) : jQuery();
            this.keyImageView = settings.keyImageViewID ? jQuery("#" + settings.keyImageViewID) : jQuery();

            // placeholder node will either be found or be an empty jQuery array
            this.placeholder = settings.placeholderID ? jQuery("#" + settings.placeholderID) : jQuery();
        },

        // create a new uploaded object per the UploadManager API
        newUploadObject: function() {
            var albumUpload = RD.AlbumUpload;

            // create and store the new image
            var image = RD.createObject(albumUpload.imagePrototype);
            this.images.push(image);

            // remove the placeholder node (no effect if not specified)
            this.placeholder.hide();

            // since we don't remove deleted images from the array, images.length is a good proxy for uniqueness
            image.initialize({
                localID: this.images.length,
                uploader: this
            });

            // notify the sortable we've added a node
            this.refreshSortable();

            RD.debug("Created image w/ local ID " + image.localID);

            return image;
        },

        /*
        refreshSortable
        Resets the sortable so it picks up new elements.

        Other outcomes / test cases:
        - sortable includes any new elements
        - updates the sort order to reflect the order on the page (can be tested by moving elements from the front to the back)
        */

        refreshSortable: function() {
            this.albumContainer.sortable(this.sortableOptions);
        },

        setKeyPic: function(image) {
            var currentKeyPic, keyPicClass, albumUpload = RD.AlbumUpload;

            if (this.keyPicStorage.length === 0) {
                // if we're not storing an image, no need to go further
                return false;
            }
            else {
                currentKeyPic = this.keyPic;
                keyPicClass = albumUpload.cssClasses.keyPic;
                RD.debug("become key pic called for " + image.localID + ", current: " + (currentKeyPic ? currentKeyPic.localID : "none") + ", same: " + (currentKeyPic === image));

                if (currentKeyPic === undefined || currentKeyPic !== image) {
                    // changing key pic!
                    // set the values
                    // we store the local ID, which is the key to the image detail hash
                    this.keyPicStorage.val(image.localID);
                    this.keyPic = image;

                    // handle classes
                    this.albumContainer.find("." + keyPicClass).removeClass(keyPicClass);
                    image.node.addClass(keyPicClass);

                    // trigger global event unless explicitly told not to, e.g. on page load
                    //console.log("Triggering event");
                    this.albumContainer.trigger(albumUpload.keyPicEvent, {uploader: this, image: image});
                }

                return true;
            }
        },

        /* FINDERS */

        /*
        findByLocalID
        Finds a image by its local ID.

        Assumptions:
        - RD.AlbumUpload.images() exists (failure: re-initialize, which creates an empty array, and hence returns null)

        Other outcomes / test cases:
        - returns null if id is null
        - returns null if imagesForimage does not have a RD.AlbumUpload by that local id
        - returns a RD.AlbumUpload if there's a match

        Question:
        - should findByLocalID return undefined if the value is clearedObject?
        */

        findByLocalID: function(id) {
            return this.images[id];
        },

        /*
        findByRemoteID
        Finds a image by its remote (server) ID.

        Assumptions:
        - RD.AlbumUpload.images() exists (failure: re-initialize, which creates an empty array, and hence returns null)

        Other outcomes / test cases:
        - returns null if id is null
        - returns null if imagesForimage does not have a RD.AlbumUpload by that remote id
        - returns a RD.AlbumUpload if there's a match
        */

        findByRemoteID: function(id) {
            var images, length, img, result;

            if (id || id === 0) {
                images = this.images;
                length = images.length;

                for (var i = 0; i < length && !result; i++) {
                    img = images[i];
                    if (img.id === id) {
                        result = img;
                    }
                }
            }

            // if we don't find a match, result will be undefined
            // which keeps things consistent with findByLocalID
            return result;
        },

        /*
        findByFileObject
        Finds a image using its SWFUpload file object (specifically, the ID parameter).  This allows us to distinguish between files with the same name.
        Used during uploads, will not find files uploaded previously.

        Assumptions:
        - RD.AlbumUpload.images() exists (failure: re-initialize, which creates an empty array, and hence returns null)

        Other outcomes / test cases:
        - returns null if file object is null
        - returns null if imagesForimage does not have a RD.AlbumUpload by that file object
        - will not return canceled images unless findOptions.includeCanceled === true
        - will not return errored images unless findOptions.includeErrored === true
        - will not find images created through initFromDatabase
        - returns a RD.AlbumUpload if there's a match
        */

        findByFileObject: function(fileObject, findOptions) {
            var i, length, result, img, match, images = this.images;
            
            if (fileObject && typeof(fileObject) === "object") {
                findOptions = findOptions || {};
                length = images.length;
                
                for (var i = 0; i < length && !result; i++) {
                    img = images[i];
                    // we need to match the object, then filter out errored or canceled uploads
                    // unless desired
                    match = img.fileObject && img.fileObject.id === fileObject.id;
                    match = match && (findOptions.includeCanceled || img.status !== "canceled");
                    match = match && (findOptions.includeErrored  || img.status !== "errored");
                    if (match) {
                        result = img;
                    }
                }
            }
            
            return result;
        },

        /*
        findByFilename
        Finds a file by its filename.  Useful to see if a duplicate file has already been uploaded.
        Used during uploads, will not find files uploaded previously.

        Assumptions:
        - RD.AlbumUpload.images() exists (failure: re-initialize, which creates an empty array, and hence returns null)

        Other outcomes / test cases:
        - returns null if filename is null
        - returns null if imagesForimage does not have a RD.AlbumUpload by that filename
        - will not return canceled images unless findOptions.includeCanceled === true
        - will not return errored images unless findOptions.includeErrored === true
        - will not find images created through initFromDatabase
        - returns a RD.AlbumUpload if there's a match
        */

        findByFilename: function(filename, findOptions) {
            var i, length, result, img, match, images = this.images;
            
            if (filename) {
                findOptions = findOptions || {};
                length = images.length;
                
                for (var i = 0; i < length && !result; i++) {
                    img = images[i];
                    // we need to match the object, then filter out errored or canceled uploads
                    // unless desired
                    match = img.filename === filename;
                    match = match && (findOptions.includeCanceled || img.status !== "canceled");
                    match = match && (findOptions.includeErrored  || img.status !== "errored");
                    if (match) {
                        result = img;
                    }
                }
            }
            
            return result;
        },
        
        /*
        doUnfinishedUploadsExist
        Check whether unfinished uploads exist to know whether to fire an alert when users exit / save.

        Outcomes / test cases:
        - if a image is uploading or queued, returns true
        - if no image matches that (or if there are no images) returns false
        */

        doUnfinishedUploadsExist: function() {
            var images = this.images, length = images.length, i, result; 
            for (i = 0; i < length && !result; i++) {
                img = images[i];
                if (img.status === "uploading" || img.status === "queued") {
                    result = true;
                }
            }
            return !!result;
        },

        /*
        doDeletedItemsExist
        Check whether deleted uploads exist to know whether to fire an alert when users save (since deletion is permanent).

        Outcomes / test cases:
        - if a image is marked to be deleted, returns true
        - if no image matches that (or if there are no images) returns false
        */

        doDeletedItemsExist: function() {
            var images = this.images, length = images.length, i, result; 
            for (i = 0; i < length && !result; i++) {
                img = images[i];
                if (img.status === "deleted") {
                    result = true;
                }
            }
            return !!result;
        }
    },

    imagePrototype: {
        initialize: function(settings) {
            this.localID = settings.localID;
            this.uploader = settings.uploader;

            // create the node
            this.createNode();

            // set the details array
            this.details = {};

            // set the status
            this.status = "created";

            return this;
        },

        createNode: function() {
            // render the outer block for our new image
            var content = Jaml.render("imageContainer", this);

            // create the jQuery object
            this.node = RD.jQuery(content);

            // associate the image object with the DOM node for later use
            this.node.data(RD.AlbumUpload.imageDataKey, this);

            // set up some data
            this.dataNode = this.node.find("." + RD.AlbumUpload.cssClasses.imageData);

            // and append it to our uploader
            this.uploader.albumContainer.append(this.node);
        },

        inputName: function(name) {
            return RD.AlbumUpload.dataPrefix + "[" + this.localID + "][" + name + "]";
        },

        inputID: function(name) {
            return this.inputName(name).replace(/[\[\]]+/g, "_").replace(/\_$/, "");
        },

        addData: function(name, value) {
            this.dataNode.append(RD.jQuery("<input/>", {
                type: "hidden",
                name: this.inputName(name),
                id: this.inputID(name),
                value: value
            }));

            // store the data on the image object as well
            this.details[name] = value;
        },

        removeData: function(name) {
            this.dataNode.remove("#" + this.inputID(name));
            delete this.details[name];
        },

        renderContent: function(templateName, details) {
            // replaces all content in the current node with the result of rendering the block
            if (!details) details = this;

            // render the content
            // while checking for missing Jaml templates
            var content = null, destination, existingContent;
            try {
                content = Jaml.render(templateName, details);
            } catch (e) {
                RD.debug("ERROR: Jaml encountered an error: " + RD.showSource(e));
                throw(e);
            }

            if (!content) {
                throw("Jaml returned null content for " + templateName);
            }

            // we have content, so get rid of everything in there
            destination = this.node.find("." + RD.AlbumUpload.cssClasses.imageContent);
            existingContent = destination.find("*");
            if (existingContent.length === 0) {
                destination.append(content);
            }
            else {
                existingContent.replaceWith(content)
            }

            return this;
        },

        /*
        initFromDatabase
        This initializes an existing RD.AlbumUpload image using information provided from the remote database.
        This is used both for initial page loads and for completed uploads.
        Assumptions:
        - imageDetails is not null and has thumb/full URLs (failure: triggers and returns badServerResponse)
        - Jaml template "visible" exists (failure: throws exception w/ an alert, since the page itself is broken we can't recover)
        - [remote] ID is unique (failure: the duplicate node is removed from the DOM, the original is returned, basic attempt at keeping things sane)

        Other external outcomes / test cases:
        - is findable by remote ID stored in imageDetails.id
        - has all keys from imageDetails locally
        - calculates whether the image is horizontal
        - sets the class appropriately to the dimensions
        - creates the dialog (getDialog returns content)
        - removes uploading class if present
        - replaces content with details from Jaml template (node has content w/ two links and an image)
        - links in node have bindings to this RD.AlbumUpload
        - if key, it's registered as key (RD.AlbumUpload.getKeyImage() === this)
        - removes the inactive class from images
        - status is visible
        - updates the sort order
        - * if there is no key image, sets the key image (animating if this is from upload)
        - returns this RD.AlbumUpload
        */

        initFromDatabase: function(imageDetails){
            // save details
            var debug = RD.debug, jQuery = RD.jQuery, classes = RD.AlbumUpload.cssClasses;
            debug("Initializing image " + this.localID + " from database.");

            // error check
            if (!(imageDetails && imageDetails.thumbImageURL != null && imageDetails.fullImageURL != null)) {
                debug("ERROR: Uploading images must have thumbImageURL and fullImageURL!\nGot %o", imageDetails);
                return this.badServerResponse(imageDetails); // which prints out the details
            }

            this.details = jQuery.extend(this.details, imageDetails);
            if (imageDetails.id) { 
                this.remoteID = imageDetails.id;

                // add the remote ID to the data node so the server will know
                this.addData("id", this.remoteID);
            }

            // determine if this is horizontal or vertical
            // if the height and width aren't properly detected by the server, we may be fudged here
            this.isHorizontal = (this.details.width > this.details.height);
            // then update the node
            this.node.addClass(this.isHorizontal ? classes.horizontalImage : classes.verticalImage);
            // remove uploading class in case it was from an upload
            this.node.removeClass(classes.uploading);

            // render content
            this.renderContent("visible");

            // initialize links
            var imageObject = this; // otherwise this gets misinterpreted when the function is applied
            this.node.find("." + classes.deleteLink).bind("click", function() { imageObject.toggleDeletion(); return false; });
            this.node.find("." + classes.magnifyLink).bind("click", function() { imageObject.showFullImage(); return false; });
            this.node.find("." + classes.makeKeyPicLink).bind("click", function() { imageObject.uploader.setKeyPic(imageObject); return false; });

            // set status
            this.status = "visible";

            if (!this.uploader.keyPic || this.details.isKeyPic) {
                // make it a key image if appropriate:
                // * there is no key picture (first upload)
                // * we're loading from the database, and this is the previously-designated key pic
                this.uploader.setKeyPic(this);
            }

            debug("Initialization done -- image has remote ID " + this.id);

            return this;
        },

        /*
        initFromUpload
        This initializes a new RD.AlbumUpload using information provided by the SWF uploader.

        Assumptions:
        - uploadDetails is not null and is a valid file object per SWF documentation (failure: triggers and returns _badFileUpload)
            - see http://demo.swfupload.org/Documentation/#fileobject
        - Jaml template "queued" exists (failure: throws exception w/ an alert, since the page itself is broken we can't recover)
        - two images uploaded with the same filename create new nodes

        Other outcomes / test cases:
        - this imageImage is findable by the fileObject (uploadDetails)
        - has a fileObject === uploadDetails
        - has .filename === uploadDetails.name
        - has queued status
        - has content from Jaml file
        - has uploading class
        - doesn't affect sort order
        - makes the overall images node dirty
        - returns this RD.AlbumUpload
        */

        initFromUpload: function(uploadDetails) {
            RD.debug("Initializing image " + this.localID + " from upload.");

            // error check
            // ID is used elsewhere
            if (!(uploadDetails && uploadDetails.id != null && uploadDetails.name != null)) {
                RD.debug("ERROR: Uploading images must exist (" + uploadDetails + ") and have an id (" + (uploadDetails ? uploadDetails.id : "obj is null") + ") and a filename (" + (uploadDetails ? uploadDetails.name : "obj is null") + ")");
                return this.badFileUpload(uploadDetails); // which prints out the details
            }

            // save details
            this.filename = uploadDetails.name;
            this.fileObject = uploadDetails;

            // set status
            this.status = "queued";

            // render and insert content
            this.renderContent("queued");
            this.node.addClass("uploading");

            // make the images node dirty since we've added an image
            this.uploader.albumContainer.trigger("fileUploadStarted", {image: this});

            // return
            RD.debug("Initialization done -- image has filename  " + this.filename);
            return this;
        },

        /*
        uploadStarted
        This marks when an upload starts, updating status and visuals.

        Assumptions:
        - Jaml template "uploading" exists (failure: throws exception w/ an alert, since the page itself is broken we can't recover)
        - Jaml template "uploading" includes an element with class of progressBar (failure: none outside testing-- we just don't show status bar)

        Other outcomes / test cases:
        - has uploading status
        - content replaced by uploading content
        - has progressBar attribute set with a length > 1 (jQuery result array)
        - progressBar returns 0 for .progressbar("option", "value") (returns null if no progressbar set)
        - returns this RD.AlbumUpload
        */

        uploadStarted: function() {
            RD.debug("Upload started for imageImage " + this.localID);

            // replace the markup with uploading
            this.renderContent("uploading");

            // generate the progress bar if jQuery.ui.progressbar available
            if (jQuery.ui.progressbar) {
                this.progressBar = this.node.find("." + RD.AlbumUpload.cssClasses.progressBar).progressbar({value: 0});
                RD.debug("Found progress bar " + RD.showSource(this.progressBar));
            }

            // set the status
            this.status = "uploading";

            return this;
        },

        /*
        uploadCanceled
        This marks when an upload starts, updating status and visuals.

        Assumptions:
        - Jaml template "canceled" exists (failure: throws exception w/ an alert, since the page itself is broken we can't recover)

        Other outcomes / test cases:
        - has canceled status
        - content replaced by canceled content
        - returns this RD.AlbumUpload
        */

        uploadCanceled: function() {
            // replace with the right markup
            this.renderContent("canceled");

            // set the status
            this.status = "canceled";

            return this;
        },


        /*
        uploadProgressed
        This is triggered when an upload has made progress, updating status and visuals.

        Assumptions:
        - Nothing external has removed the progressbar element (failure: reruns this.uploadStarted)

        Other outcomes / test cases:
        - this.progressBar.progressbar("option", "value") is equal to percentage * 100
        - when we hit 100%, throw up a processing message while the server thinks,
        - returns this RD.AlbumUpload
        */

        uploadProgressed: function(percentage) {
            RD.debug("Upload progressed to " + percentage + "% for imageImage " + this.localID);

            if (percentage) {
                // error check -- reset progress bar if it somehow gets deleted
                if (this.status !== "uploading") {
                    this.uploadStarted();
                }

                // update the progressbar
                this.progressBar.progressbar("option", "value", percentage * 100);

                // if percentage is 100%, say processing
                if (percentage > 0.99) {
                    this.node.find("." + RD.AlbumUpload.cssClasses.processingMessage).html(RD.AlbumUpload.labels.processing_uploaded_file);
                }
            }

            // return the item
            return this;
        },

        /*
        uploadErrored
        This is triggered when an upload encounters an error, and either aborts or gets queued again.

        Assumptions:
        - Jaml has a template called "errored" (failure: throws exception w/ an alert, since the page itself is broken we can't recover)

        Other outcomes / test cases:
        - errorCount is incremented (or set to 1 if it was null)
        - if the error is recoverable and it hasn't over-errored, it's set to queued again
        - if not, the status is set to errored
        - returns this RD.AlbumUpload
        */

        uploadErrored: function(errorDetails) {
            // add an error count
            this.errorCount = (this.errorCount || 0) + 1;

            if (errorDetails.isRecoverable && this.errorCount <= RD.AlbumUpload.retryLimit) {
                RD.debug("Retrying upload.");
                // if we're retrying it, reset the status
                this.status = "queued";
            }
            else {
                RD.debug("Error details shortDescription: " + errorDetails.shortDescription);
                this.status = "errored";

                errorDetails.image = this;
                this.renderContent("errored", errorDetails);
            }

            return this;
        },

        /*
        uploadCompleted
        Fired when the imageImage has finished uploading; triggers initialization from the database.

        Assumptions:
        - imageDetails is a valid object (failure: turns the image to an error)

        Other outcomes / test cases:
        - returns the same output as initFromDatabase
        */

        uploadCompleted: function(imageDetails) {
            RD.debug("Received results! " + imageDetails);

            if (!imageDetails || typeof(imageDetails) !== "object") {
                return this.badServerResponse(imageDetails);
            }
            
            // map responses to the types we need
            // different servers may return different keys for the thumb and full URLs
            var responseKey, localKey, responseMap = (this.uploader.settings.responseMap || {});
            for (responseKey in responseMap) {
                localKey = responseMap[responseKey];
                imageDetails[localKey] = imageDetails[responseKey];
            }

            // re-initialize this node from the image details
            this.initFromDatabase(imageDetails);

            // trigger an event
            this.node.trigger("fileUploadCompleted", {image: this});

            return this;
        },


        badServerResponse: function(response) {
            // used when the server responds successfully, but the content isn't what we expect
            // notify the console of the error, then render the error view
            // unfortunately, we can't recover since SWFUpload interpreted this as a successful upload and hence won't let it be requeued
            RD.debug("Bad server response: " + (response ? RD.showSource(response) : " null!"));
            return this.uploadErrored({isRecoverable: false, shortDescription: "Invalid server response"});
        },

        badFileUpload: function(fileObject) {
            // used when the SWFUploader adds a file, but that file is missing essential content
            // I expect this never to fire, but better to be secure than sorry
            // notify the console of the error, then render the error view
            // we can't recover, since SWFUpload doesn't requeue on file errors
            RD.debug("Bad file upload! " + (fileObject ? RD.showSource(fileObject) : "null!"));
            return this.uploadErrored({isRecoverable: false, shortDescription: "Problem uploading file!"});
        },

        /*
        toggleDeletion
        Sets the image to be deleted or not deleted.

        Assumptions:
        - imageImage is either in deleted or visible state (failure: returns with on changes)

        Other outcomes / test cases:
        - if it's not currently deleted, node gains the markedForDeletion class and status is DELETING
        - otherwise, status is VISIBLE and the class isn't present
        - executed an arbitrary number of times, the status and class are always in sync
        */

        toggleDeletion: function() {
            // make sure we're at the right states -- this should be filtered
            if (!(this.status === "visible" || this.status === "deleting")){
                // this has no effect on other states
                return;
            }

            // gets the dialog object for the image deletion option
            if (this.status === RD.AlbumUpload.statusMap["deleting"]) {
                this.node.removeClass("markedForDeletion");
                this.status = RD.AlbumUpload.statusMap["visible"];
                this.deletionFlag.remove();
            }
            else {
                this.node.addClass("markedForDeletion");
                this.status = RD.AlbumUpload.statusMap["deleting"];
                this.node.append(this.deletionFlag);
            }
        },

        showFullImage: function() {},

        /*
        isRetrying
        Accessor to see if the image is being reuploaded after an error.

        Outcomes / test cases:
        - returns true if the image is queued but has an errorCount
        */

        isRetrying: function() {
            return (this.status === "queued" && this.errorCount > 0);
        },
        
        isUploading: function() {
            return (this.status === "uploading");
        },

        /*
        shouldCancelUpload
        Accessor used by the upload manager to see if the image should be retried or canceled
        because it's been tried too many times.

        Outcomes / test cases:
        - returns true if the image has errored more than the retry limit
        */

        shouldCancelUpload: function() {
            return (this.errorCount > RD.AlbumUpload.retryLimit);
        }
    },

    // JAML TEMPLATES
    // since these are required in the RD.AlbumUpload class for view work, they're stored here
    // not really MVC, but this is Javascript
    // http://github.com/edspencer/jaml
    jamlTemplates: {
        imageContainer: function(image) {
            var albumUpload = RD.AlbumUpload, sortList = albumUpload.imageSortList;
            div({cls: albumUpload.cssClasses.imageNode, id: albumUpload.cssClasses.imageNode + image.localID},
                // provide a safe space for data as well as the visible content that gets replaced
                div({cls: albumUpload.cssClasses.imageData, id: albumUpload.cssClasses.imageData + image.localID},
                    input({
                        type: "hidden",
                        name: sortList + "[]",
                        id: sortList + image.localID,
                        value: image.localID,
                        cls: sortList
                    })
                ),
                div({cls: albumUpload.cssClasses.imageContent, id: albumUpload.cssClasses.imageContent + image.localID})
            );
        },

        queued: function(image) {
            div({cls: "uploadingText"}, RD.AlbumUpload.labels[image.errorCount ? "queued_retry" : "queued_upload"] + "<br/>" + image.filename)
        },

        uploading: function(image) {
            span(
                div({cls: "uploadingText"}, RD.AlbumUpload.labels.uploading_file + image.filename),
                div({cls: "progressBar"}),
                        div({cls: "processingMessage"})
            )
        },

        errored: function(errorData) {
            div({cls: "errorBlock"},
                div(span({cls: "description"}, errorData.shortDescription), span(RD.AlbumUpload.labels.error_for + " " + errorData.image.filename)),
                div(a({cls: "clearLink", href: "#", onclick:  "RD.AlbumUpload.clear(" + errorData.image.localID + ")"}, RD.AlbumUpload.labels.link_clear))
            )
        },

        magnifyDialog: function(imageURL) {
            div(img({src: imageURL, cls: "magnifyDialog"}));
        },

        canceled: function(image) {
            div(
                div({cls: "uploadingText"}, RD.AlbumUpload.labels.upload_canceled),
                div(a({cls: "clearLink", href: "#", onclick:  "RD.AlbumUpload.clear(" + image.localID + ")"}, RD.AlbumUpload.labels.link_clear))
            )
        },

        visible: function(image) {
            console.log("making visible! %o", image)
             span({cls: "verticalAligner"},
                div({cls: "keyPicText"},
                      span({cls: "isKeyPic"}, RD.AlbumUpload.labels.is_album_pic),
                    a({href: "#", cls: "keyPicLink"}, RD.AlbumUpload.labels.make_album_pic)
                ),
                div({cls: "image"},
                    img({cls: "thumbnail", id: "image" + image.localID, src: image.details.thumbImageURL}),
                    span({cls: "deleteText"}, RD.AlbumUpload.labels.will_be_deleted)
                ),
                div({cls: "actions"},
                    a({cls: "magnify", href: "#"}, div("&nbsp;")),
                    a({cls: "delete", href: "#"}, div("&nbsp;"))
                ),
                div({cls: "clearFloat"}, "&nbsp;")
             )
        }
    },

    registerJamlTemplates: function() {
        // register each template with Jaml
        var templateName, templateFunction, templates = RD.AlbumUpload.jamlTemplates;
        RD.debug("Loading Jaml...");

        for (templateName in templates) {
            templateFunction = templates[templateName];
            Jaml.register(templateName, templateFunction);
        }

        RD.debug("Loading Jaml done!");
    }
}

/*
showFullImage
Shows the image magnification dialog.

Assumptions:
- imageImage is visible or deleted (failure: nothing happens)

Other outcomes / test cases:
- creates the zoom dialog if it doesn't exist -- issue?
- object returned is a dialog (verified by .dialog("isOpen") != null)
- after firing, this.zoomDialog().dialog("isOpen") is true
* /

RD.AlbumUpload.prototype.showFullImage = function() {
    if (dialogObject = this._getDialog()) {
        debug("Showing full image dialog");
        dialogObject.dialog('open');
    }
}

/*
closeFullImage
Closes the full image dialog

Assumptions:
- imageImage.getDialog() returns an object (failure: returns without action)

Other outcomes / test cases:
- dialog object returns false from .dialog("isOpen")
* /
RD.AlbumUpload.prototype.hideFullImage = function() {
    if (dialogObject = this._getDialog())
        dialogObject.dialog("close");
}


RD.AlbumUpload.prototype._getDialog = function() {
    // make sure we're at the right states -- this should be filtered
    if (!(this.status === RD.AlbumUpload.statusMap["visible"] || this.status === RD.AlbumUpload.statusMap["deleting"])){
        // this has no effect on images
        return;
    }

    // gets the dialog object for the image
    if (!this._zoomDialog) {
            debug("Creating dialog for " + this.remoteId + " with url " + this.fullImageURL);

        dialogNode = Jaml.render("magnifyDialog", this.fullImageURL)
        $("#dialogHolder").append(dialogNode);
        this._zoomDialog = $(dialogNode);

        this._zoomDialog.dialog({autoOpen: false,
                             dialogClass: "previewDialog " + (this.isHorizontal ? "previewDialogHorizontal" : "previewDialogVertical"),
                             resizable: false,
                                                      width: "" // don't overwrite the class width
                             });
    }

    return this._zoomDialog;
}
*/