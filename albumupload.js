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
- the meal image's node is unique
- this sets the initial status to created

NOTE: by storing the meal in the array using the last index, we subsequently require that that index in the array 
always be occupied.  hence, clear replaces it with a null, rather than erasing it
*/
RD.AlbumUpload = {
    // properties 
    retryLimit:  1,
    keyPicEvent: "keyPicRegistered",
    keyPicClass: "keyPic",
    imageNodeClass: "albumUploadBlock",
 	imageDataKey: "albumupload.image",
    // list of available statuses
    statusMap: {
        
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
		this.registerJamlTemplates();
	},
	
    newUploader: function(settings) {
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
    		this.uploadManager = RD.UploadManager.create(settings.swfuploadOptions);
    		
    		// set up the sortable options for properties that can't be set up at load time
    		this.sortableOptions = jQuery.extend({
    		    items: "div." + RD.AlbumUpload.imageNodeClass,
                update: this.updateAlbumUploadsOrder
    		});
    		
            return this; 
        },

		setupDOM: function() {
			// initialize all the different DOM nodes we use
			var settings = this.settings, jQuery = RD.jQuery;
			
			// sort order storage -- where we keep track of the order of elements
			// this is required
			this.sortOrderStorage = jQuery("#" + settings.sortOrderStorageID);
			if (this.sortOrderStorage.length === 0) {
				throw("InitializationError: Could not find AlbumUpload sortOrderStorageID #" + settings.sortOrderStorageID + "!")
			}

			// albumContainer -- where all the visible action happens
			// this is required
			this.albumContainer = jQuery("#" + settings.albumContainerID);
			if (this.albumContainer.length === 0) {
				throw("InitializationError: Could not find AlbumUpload sortOrderStorageID #" + settings.sortOrderStorageID + "!");
			}

			// get the key image (album cover) value store and visible location if provided
			this.keyImageStorage = settings.keyImageStorageID ? jQuery("#" + settings.keyImageStorageID) : jQuery();
			this.keyImageView = settings.keyImageViewID ? jQuery("#" + settings.keyImageViewID) : jQuery();
			
            // placeholder node will either be found or be an empty jQuery array
            this.placeholder = settings.placeholderID ? jQuery("#" + settings.placeholderID) : jQuery();            
		},
        
        newImage: function() {
            var albumUpload = RD.AlbumUpload;

            // create and store the new image
            var image = RD.createObject(albumUpload.imagePrototype);
            this.images.push(image);
            
            // remove the placeholder node (no effect if not specified)
            this.placeholderNode.hide();

            // since we don't remove deleted images from the array, images.length is a good proxy for uniqueness
			image.initialize({
	            localID: this.images.length,
				uploader: this
			});

    		// notify the sortable we've added a node
            this.refreshSortable();

            return image;
            
        		this.status = RD.AlbumUpload.statusMap["created"];

        		RD.debug("Created meal w/ local ID " + this.localID);

            return this;
        },
        
        /*
        refreshSortable
        Resets the sortable so it picks up new elements.

        Other outcomes / test cases:
        - sortable includes any new elements
        - updates the sort order to reflect the order on the page (can be tested by moving elements from the front to the back)
        */

        sortableOptions: {
            placeholder: "beingSorted inlineBlock",
            tolerance: "pointer",
            cursor: "move",
        },
        
        refreshSortable: function() {	
        	this.albumContainer.sortable(this.sortableOptions);

        	//this.updateAlbumUploadsOrder();
        },
        
        /*
        updateAlbumUploadsOrder
        Updates the order of the variable imageSortOrder to save the order in which images are stored for a meal.

        Assumptions:
        - imageSortOrder exists (failure: throw exception, since the page is malformed and we can't recover)

        Other outcomes / test cases:
        - does not include uploads, errors, or cancels
        - updates the sort order to reflect the order on the page (can be tested by moving elements from the front to the back)
        * /

        updateAlbumUploadsOrder: function() {
          order = [];
          RD.AlbumUpload.albumContainer.find("div.albumUploadBlock").each(function() {
              if (this.mealImage && this.mealImage.id != null)
                  order.push(this.mealImage.id);
          });

          RD.AlbumUpload.sortOrderStorage.val(order.join(","));
        },

        getSortOrder: function() {
        	return RD.AlbumUpload.sortOrderStorage.val();
        }
        */

    },
    
    imagePrototype: {
        initialize: function(settings) {
			this.localID = settings.localID;
			this.uploader = settings.uploader;
			
			// create the node
			this.createNode();
			
			return this;
		},
		
		createNode: function() {
			// render the outer block for our new image
			var content = Jaml.render("imageContainer", this);

			// create the jQuery object
			this.node = RD.jQuery(content);			

			// associate the image object with the DOM node for later use
			this.node.data(RD.AlbumUpload.imageDataKey, this);

			// and append it to our uploader
			this.uploader.albumContainer.append(this.node);
		},
		
		renderContent: function(templateName, details) {
		    // replaces all content in the current node with the result of rendering the block
			if (!details) details = this;

			// render the content
			// while checking for missing Jaml templates
			content = null;
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
			this.node.find("*").replaceWith(content);

		    return this;
		}
    },
    
	// JAML TEMPLATES
	// since these are required in the RD.AlbumUpload class for view work, they're stored here
	// not really MVC, but this is Javascript
	// http://github.com/edspencer/jaml
    jamlTemplates: {
		imageContainer: function(image) {
		    div({cls: RD.AlbumUpload.imageNodeClass, id: "albumUpload" + image.localID});
		},
		
		queued: function(image) {
		    div({cls: "uploadingText"}, RD.AlbumUpload.labels[image.retryCount ? "queued_retry" : "queued_upload"] + "<br/>" + image.filename)
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
		     span({cls: "verticalAligner"}, 
		        div({cls: "keyPicText"},
	          	span({cls: "isKeyPic"}, RD.AlbumUpload.labels.is_album_pic),
	            a({href: "#", cls: "keyPicLink"}, RD.AlbumUpload.labels.make_album_pic)
		        ),
		        div({cls: "image"},
		            img({cls: "thumbnail", id: "image" + image.localID, src: image.thumbImageURL}),
		            span({cls: "deleteText"}, RD.AlbumUpload.labels.will_be_deleted)
		        ),
		        div({cls: "actions inactive"}, 
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

/*
RD.AlbumUpload.initialize
Assumptions:
- gets an options hash that contains certain required nodes and certain optional nodes (failure: throws exception)
- #imageSortOrder exists (failure: throws exception, since we cannot continue)
- #mealimages exists (failure: throws exception, since we cannot continue)
- if options.keyImageId is provided, the corresponding node exists (failure: throws exception, since we cannot continue)
- if options.placeholderNodeID is provided, the corresponding node exists (failure: throws exception, since we cannot continue)

Other outputs:
- if initialized is already true, does nothing
- pre-initializes images array
- sets sort order node
- sets albumContainer
- sets clearedObject
- sets up Jaml templates
- sets initialized to true
* /
RD.AlbumUpload.initialize = function(options) {
	if (!RD.AlbumUpload._initialized) {
		if (!options || typeof(options) !== "object") {
			throw("RD.AlbumUpload was not passed an options hash!")
		}
		
		// get the sort order node
		
		
		// set up the sortable
		RD.AlbumUpload.refreshSortable();
			
		// set the cleared placeholder
		RD.AlbumUpload.clearedObject = {};
		
		// load Jaml
		RD.AlbumUpload._registerJamlTemplates();
		
		RD.AlbumUpload._initialized = true;
	}
}

/* MEAL IMAGE statusMapES * /
// internal use only.  To verify a status, use the accessor methods below.



/* 
initFromDatabase
This initializes an existing RD.AlbumUpload using information provided from the remote database.  
This is used both for initial page loads and for completed uploads.
Assumptions:
- imageDetails is not null and has remoteID and thumb/full URLs (failure: triggers and returns badServerResponse)
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
* /

RD.AlbumUpload.prototype.initFromDatabase = function(imageDetails){
    // save details
	RD.debug("Initializing meal " + this.localID + " from database.");

    // error check
    if (!(imageDetails && imageDetails.id != null && imageDetails.thumbImageURL != null && imageDetails.fullImageURL != null)) {
        debug("ERROR: Uploading Meal Images must have id, thumbImageURL, and fullImageURL!");
		return this._badServerResponse(imageDetails); // which prints out the details
    }

	// make sure this isn't a duplicate
	var original;
	if (original = RD.AlbumUpload.findByRemoteId(imageDetails.id)) {
		// we have a duplicate!  remove this node
		// this should never happen on upload, unless the same file is uploaded twice
		// should it then show a note?
		RD.debug("WARNING: duplicate found (id " + imageDetails.id + ")!  Clearing node for the duplicate.");
		RD.AlbumUpload.clear(this.localID);
		return original;
	}

	for (key in imageDetails){
		this[key] = imageDetails[key];
	}

  // set status
  this.status = RD.AlbumUpload.statusMap["visible"];

    // determine if this is horizontal or vertical
	// if the height and width aren't properly detected by the server, we may be fudged here
	// but in that case, the server doesn't know which thumbnail to send down, and all's weird anyway
	this.isHorizontal = (this.width > this.height);
	
	// set up the dialog
	this._getDialog();

	RD.debug("Horizontal: " + this.isHorizontal);
	
	// then update the node
	this.node.addClass((this.isHorizontal ? "forHorizontalImage" : "forVerticalImage"));

	// remove uploading class in case it was from an upload
	this.node.removeClass("uploading");

	// render content and insert
	this._replaceWithRender("visible");
	// initialize links
	var tempObject = this; // otherwise this gets misinterpreted when the function is applied
	this.node.find("a.delete").bind("click", function() { tempObject.toggleDeletion(); return false; });
	this.node.find("a.magnify").bind("click", function() { tempObject.showFullImage(); return false; });
	this.node.find("a.keyPicLink").bind("click", function() { tempObject.becomeKeyPic(); return false; });

	// mark this as active
	this.node.find(".actions").removeClass("inactive");

	// create deletion marker
	// this gets inserted when the image is marked for deletion, removed otherwise
	this.deletionFlag = $("<input type='hidden' name='picsToDelete[]' id='deletedPic" + this.id + "' value='" + this.id + "'>");

	// update the sort order
	RD.AlbumUpload.updateAlbumUploadsOrder();
	
	// make it a key image if there is none
	if (RD.AlbumUpload.keyImageStorage && !RD.AlbumUpload.getKeyPic()) {
		// surpress the event if this isn't from an upload (e.g. is from a previous image)
		// for such images this should never be fired but is a safety check
		this.becomeKeyPic({surpressEvent: (this.filename ? false : true)});
	}

	// return
	RD.debug("Initialization done -- image has remote ID " + this.id);
	
	return this;
}

/*
initFromUpload
This initializes a new RD.AlbumUpload using information provided by the SWF uploader.  

Assumptions:
- uploadDetails is not null and is a valid file object per SWF documentation (failure: triggers and returns _badFileUpload)
	- see http://demo.swfupload.org/Documentation/#fileobject
- Jaml template "queued" exists (failure: throws exception w/ an alert, since the page itself is broken we can't recover) 
- two images uploaded with the same filename create new nodes

Other outcomes / test cases:
- this mealImage is findable by the fileObject (uploadDetails)
- has a fileObject === uploadDetails
- has .filename === uploadDetails.name
- has queued status
- has content from Jaml file
- has uploading class
- doesn't affect sort order
- makes the overall meal images node dirty
- returns this RD.AlbumUpload
* /

RD.AlbumUpload.prototype.initFromUpload = function(uploadDetails) {
	RD.debug("Initializing meal " + this.localID + " from upload.");

  // error check
  if (!(uploadDetails && uploadDetails.id != null && uploadDetails.name != null)) {
   	debug("ERROR: Uploading Meal Images must exist (" + uploadDetails + " and have an id (" + (uploadDetails ? uploadDetails.id : "obj is null") + ") and a filename (" + (uploadDetails ? uploadDetails.filename : "obj is null") + ")");
		return this._badFileUpload(uploadDetails); // which prints out the details
  }

  // save details
  this.filename = uploadDetails.name;
  this.fileObject = uploadDetails;

  // set status
  this.status = RD.AlbumUpload.statusMap["queued"];

  // render and insert content
  this._replaceWithRender("queued");
  this.node.addClass("uploading");
   
	// make the meal images node dirty since we've added an image
	RD.AlbumUpload.albumContainer.trigger("fileUploadStarted", {fileHandler: this, details: uploadDetails});

  // return
  RD.debug("Initialization done -- image has filename  " + this.filename);
  return this;        
}

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
* /

RD.AlbumUpload.prototype.uploadStarted = function() {
    RD.debug("Upload started for mealImage " + this.localID);

    // replace the markup with uploading
    this._replaceWithRender("uploading");
    
    // generate the progress bar
    this.progressBar = this.node.find(".progressBar");
	debug("Found progress bar " + RD.showSource(this.progressBar));
	this.progressBar.progressbar({value: 0});
    
    // set the status
    this.status = RD.AlbumUpload.statusMap["uploading"];
    
    return this;
}

/*
uploadCanceled
This marks when an upload starts, updating status and visuals.

Assumptions:
- Jaml template "canceled" exists (failure: throws exception w/ an alert, since the page itself is broken we can't recover) 

Other outcomes / test cases:
- has canceled status
- content replaced by canceled content
- returns this RD.AlbumUpload
* /

RD.AlbumUpload.prototype.uploadCanceled = function() {
	// replace with the right markup
	this._replaceWithRender("canceled");

	// set the status
	this.status = RD.AlbumUpload.statusMap["canceled"];

	return this;
}

/*
uploadProgressed
This is triggered when an upload has made progress, updating status and visuals.

Assumptions:
- Nothing external has removed the progressbar element (failure: reruns this.uploadStarted) 

Other outcomes / test cases:
- this.progressBar.progressbar("option", "value") is equal to percentage * 100
- when we hit 100%, throw up a processing message while the server thinks, 
- returns this RD.AlbumUpload
* /

RD.AlbumUpload.prototype.uploadProgressed = function(percentage) {
    RD.debug("Upload progressed to " + percentage + "% for mealImage " + this.localID);

    // error check -- reset progress bar if it somehow gets deleted
    //if (!this.progressBar)
    //    throw("uploadProgress called for meal image " + this.localID + " but this.progressBar is null!");
    if (!this.progressBar)
		this.uploadStarted();

    // update the progressbar
    this.progressBar.progressbar("option", "value", percentage * 100);
    
		// if percentage is 100%, say processing
		if (percentage > 0.99) {
			this.node.find(".processingMessage").html(RD.AlbumUpload.labels.processing_uploaded_file);
		}
		
    // return the item
    return this;
}

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
* /

RD.AlbumUpload.prototype.uploadErrored = function(errorDetails) {
	errorDetails.mealImage = this;
	this.status = RD.AlbumUpload.statusMap["errored"];
	
	// add an error count
	if (!this.errorCount)
		this.errorCount = 1;
	else
		this.errorCount++;
	
	if (errorDetails.isRecoverable && this.errorCount <= RD.AlbumUpload.retryLimit) {
		debug("Retrying upload.");
		this.status = RD.AlbumUpload.statusMap["queued"]; // if we're retrying it
	}	
	
	RD.debug("Error details shortDescription: " + errorDetails.shortDescription);
	this._replaceWithRender("errored", errorDetails);

	return this;
}

/*
uploadCompleted
Fired when the mealImage has finished uploading; triggers initialization from the database.

Assumptions:
- imageDetails is a valid object (failure: turns the meal image to an error)

Other outcomes / test cases:
- returns the same output as initFromDatabase
* /

RD.AlbumUpload.prototype.uploadCompleted = function(imageDetails) {
	var result;
	debug("Received results! " + imageDetails);
	if (!imageDetails || typeof(imageDetails) != "object") {
		return this._badServerResponse(imageDetails);
  }
  
	result = this.initFromDatabase(imageDetails);
	
	// trigger an event
	this.node.trigger("fileUploadCompleted", result);
	
	// re-initialize this node from the image details
  return result;
}

/*
toggleDeletion
Sets the image to be deleted or not deleted.

Assumptions:
- mealImage is either in deleted or visible state (failure: returns with on changes)

Other outcomes / test cases:
- if it's not currently deleted, node gains the markedForDeletion class and status is DELETING
- otherwise, status is VISIBLE and the class isn't present
- executed an arbitrary number of times, the status and class are always in sync
* /

RD.AlbumUpload.prototype.toggleDeletion = function() {
	// make sure we're at the right states -- this should be filtered
	if (!(this.status === RD.AlbumUpload.statusMap["visible"] || this.status === RD.AlbumUpload.statusMap["deleting"])){
		// this has no effect on other states 
		return;
	}
	 
  // gets the dialog object for the meal deletion option
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
}

/*
showFullImage
Shows the image magnification dialog.

Assumptions:
- mealImage is visible or deleted (failure: nothing happens)

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
- mealImage.getDialog() returns an object (failure: returns without action)

Other outcomes / test cases:
- dialog object returns false from .dialog("isOpen")
* /
RD.AlbumUpload.prototype.hideFullImage = function() {
	if (dialogObject = this._getDialog())
		dialogObject.dialog("close");
}


/* statusMap ACCESSORS * /

/*
isRetrying
Accessor to see if the meal image is being reuploaded after an error.

Outcomes / test cases:
- returns true if the meal is queued but has an errorCount
* /

RD.AlbumUpload.prototype.isRetrying = function() {
	return (this.status === RD.AlbumUpload.statusMap["queued"] && this.errorCount > 0);
}

/*
shouldCancelUpload
Accessor to see if the meal image should be canceled because it's been tried too many times.

Outcomes / test cases:
- returns true if the meal has errored more than the retry limit
* /

RD.AlbumUpload.prototype.shouldCancelUpload = function() {
	return (this.errorCount > RD.AlbumUpload.retryLimit);
}


/*
Status Accessors
Accessors to check the state of the meal.

Outcomes / test cases:
- returns true if the appropriate status is set
* /

RD.AlbumUpload.prototype.isCreated = function() { return this.status === RD.AlbumUpload.statusMap["created"]; }
RD.AlbumUpload.prototype.isVisible = function() { return this.status === RD.AlbumUpload.statusMap["visible"]; }
RD.AlbumUpload.prototype.isErrored = function() { return this.status === RD.AlbumUpload.statusMap["errored"]; }
RD.AlbumUpload.prototype.isCanceled = function() { return this.status === RD.AlbumUpload.statusMap["canceled"]; }
RD.AlbumUpload.prototype.isQueued = function() { return this.status === RD.AlbumUpload.statusMap["queued"]; }
RD.AlbumUpload.prototype.isUploading = function() { return this.status === RD.AlbumUpload.statusMap["uploading"]; }
RD.AlbumUpload.prototype.isDeleting = function() { return this.status === RD.AlbumUpload.statusMap["deleting"]; }

/* CLASS FUNCTIONS * /

/*
findByLocalId
Finds a meal by its local ID.

Assumptions:
- RD.AlbumUpload.images() exists (failure: re-initialize, which creates an empty array, and hence returns null)

Other outcomes / test cases:
- returns null if id is null
- returns null if imagesForMeal does not have a RD.AlbumUpload by that local id
- returns a RD.AlbumUpload if there's a match

Question: 
- should findByLocalID return undefined if the value is clearedObject?
* /

RD.AlbumUpload.findByLocalId = function(id) {
	return RD.AlbumUpload.images()[id];
}

/*
findByRemoteId
Finds a meal by its remote (server) ID.

Assumptions:
- RD.AlbumUpload.images() exists (failure: re-initialize, which creates an empty array, and hence returns null)

Other outcomes / test cases:
- returns null if id is null
- returns null if imagesForMeal does not have a RD.AlbumUpload by that remote id
- returns a RD.AlbumUpload if there's a match
* /

RD.AlbumUpload.findByRemoteId = function(id) {
	// eliminate null and undefined inputs, which will otherwise match to in progress uploads with undefined remote IDs
	if (id === null || id === undefined)
		return undefined;
		
	for (localID in RD.AlbumUpload.images()) {
		mi = RD.AlbumUpload.images()[localID];
		if (mi.id === id)
			return mi;
	}
	
	// keep results consistent with findByLocalId, which returns undefined for undefined for bad queries
	return undefined;
}

/*
findByFileObject
Finds a meal using its SWFUpload file object (specifically, the ID parameter).  This allows us to distinguish between files with the same name.  
Used during uploads, will not find files uploaded previously.

Assumptions:
- RD.AlbumUpload.images() exists (failure: re-initialize, which creates an empty array, and hence returns null)

Other outcomes / test cases:
- returns null if file object is null
- returns null if imagesForMeal does not have a RD.AlbumUpload by that file object
- will not return canceled meals unless findOptions.includeCanceled === true
- will not return errored meals unless findOptions.includeErrored === true
- will not find meals created through initFromDatabase
- returns a RD.AlbumUpload if there's a match
* /

RD.AlbumUpload.findByFileObject = function(fileObject, findOptions) {
	if (fileObject === null || fileObject === undefined)
		return undefined;		

	// set default find options
	if (!findOptions) findOptions = {};
	if (!findOptions.includeCanceled) findOptions.includeCanceled = false;
	if (!findOptions.includeErrored) findOptions.includeErrored = false;
	
	for (localID in RD.AlbumUpload.images()) {
		mi = RD.AlbumUpload.images()[localID];
		if (mi.fileObject && mi.fileObject.id === fileObject.id && (findOptions.includeCanceled || mi.status !== RD.AlbumUpload.statusMap.canceled) && (findOptions.includeErrored || mi.status !== RD.AlbumUpload.statusMap.errored)) {
			return mi;
		}
	}
	return undefined;
}

/*
findByFilename
Finds a file by its filename.  Useful to see if a duplicate file has already been uploaded.
Used during uploads, will not find files uploaded previously.

Assumptions:
- RD.AlbumUpload.images() exists (failure: re-initialize, which creates an empty array, and hence returns null)

Other outcomes / test cases:
- returns null if filename is null
- returns null if imagesForMeal does not have a RD.AlbumUpload by that filename
- will not return canceled meals unless findOptions.includeCanceled === true
- will not return errored meals unless findOptions.includeErrored === true
- will not find meals created through initFromDatabase
- returns a RD.AlbumUpload if there's a match
* /

RD.AlbumUpload.findByFilename = function(filename, findOptions) {
	if (filename === null || filename === undefined)
		return undefined;		

	// set default find options
	if (!findOptions) findOptions = {};
	if (!findOptions.includeCanceled) findOptions.includeCanceled = false;
	if (!findOptions.includeErrored) findOptions.includeErrored = false;
	
	for (localID in RD.AlbumUpload.images()) {
		mi = RD.AlbumUpload.images()[localID];
		if (mi.filename === filename && (findOptions.includeCanceled || mi.status !== RD.AlbumUpload.statusMap.canceled) && (findOptions.includeErrored || mi.status !== RD.AlbumUpload.statusMap.errored)) {
			return mi;
		}
	}
	debug("Could not find file!")
	return undefined;
}

/* 
isAlbumUpload
Verifies that an object is a meal image.
Returns true if: 
	- object is a non-null Object
	- object's constructor RD.AlbumUpload()
	- has a localID
	- RD.AlbumUpload.findByLocalId returns the object
Returns false if:
	- above is not true
* /

RD.AlbumUpload.isAlbumUpload = function(object) {
	if (object && object.constructor === RD.AlbumUpload && object.localID != null && RD.AlbumUpload.findByLocalId(object.localID) === object)
		return true;
	else
		return false;
}


/*
becomeKey
Makes this meal image the key image.

Outcomes:
- returns true immediately if the image is already the key pic
- RD.AlbumUpload.keyImageStorage has a value === the mealImg's id
- RD.AlbumUpload._keyPic === this.localID
- afterward, the meal image node has class keyPic
- afterward, no other image nodes have class keyPic
- unless told not to, a keyPicRegistered event is fired to let any handlers know a keyPic was registered
- returns true if it succeeds
* /

RD.AlbumUpload.prototype.becomeKeyPic = function(options) {
	if (RD.AlbumUpload.keyImageStorage) {
		var currentKeyPicId = RD.AlbumUpload._keyPic;
		debug("become key pic called for " + this.localID + ", current: " + currentKeyPicId + ", same: " + (currentKeyPicId === this.localID));
	
		if (currentKeyPicId !== undefined && currentKeyPicId === this.localID) {
			return true;
		}
	
		// set the values
	  RD.AlbumUpload.keyImageStorage.val(this.id);
		RD.AlbumUpload._keyPic = this.localID;
	
		// set up default options if not supplied
		if (!options) {
			options = {};
		}
	
		// handle classes
		RD.AlbumUpload.albumContainer.find("." + RD.AlbumUpload.keyPicClass).removeClass(RD.AlbumUpload.keyPicClass);
		this.node.addClass(RD.AlbumUpload.keyPicClass);

		// trigger global event unless explicitly told not to, e.g. on page load
		// eventually this might be a call to a global Mealstrom
		// is it dangerous to pass the meal image?
		if (options.surpressEvent !== true) {
			//console.log("Triggering event");
			this.node.trigger("keyImageChange", {albumUpload: this});
		}
	}
		
  return true;
}

/*
getKeyPic
Gets the key pic object.

Outcomes:
- if the previous key image was cleared (e.g. === clearedObject) returns undefined
- otherwise returns mealImage corresponding to the value of RD.AlbumUpload._keyPic (via findByLocalId, so the same results for invalid/undefined IDs)
* /

RD.AlbumUpload.getKeyPic = function() {
	return RD.AlbumUpload.findByLocalId(RD.AlbumUpload._keyPic);
}

/*
clear
Removes the element from the DOM.

Outcomes / test cases:
- when passed an invalid meal image ID, nothing happens
- it removes the meal image's node from the DOM
- it replaces the array entry for that mealImage with clearedObject (does NOT remove it from the array -- see note at top of file)
- if all images are removed and there's a placeholder, it's returned to the DOM
* /

RD.AlbumUpload.clear = function(localId) {
	// clears the meal image, removing it from the DOM
	RD.debug("CLEAR called for meal with ID " + localId);
	if (mi = RD.AlbumUpload.findByLocalId(localId)) {
		RD.debug("\tFound meal to clear (" + RD.showSource(mi) + ").");

		var keyPic = RD.AlbumUpload.getKeyPic();
		if (keyPic && keyPic.localID === mi.localID) {
			// remove this from being key pic
			delete RD.AlbumUpload._keyPic;
			RD.AlbumUpload.keyImageStorage.val("");
		}

		mi.node.remove();
		// make it an empty hash but leave it in the array to keep numbering accurate
		// an empty hash (rather than null) avoids errors in for/each loops that check parameters
		RD.AlbumUpload.images()[mi.localID] = RD.AlbumUpload.clearedObject;
		mi = null;
		
		// add the placeholder node back if this is the last image and we have a placeholder node
		if (RD.AlbumUpload._placeholderNode) {
			var otherActiveImages = false, imageList = RD.AlbumUpload.images();
			for (var i = 0; i < imageList.length && !otherActiveImages; i++) {
			  var testMI = imageList[i];
			  if (RD.AlbumUpload.isAlbumUpload(testMI)) {
			    otherActiveImages = true;
			  }
			}
			if (!otherActiveImages) {
	 			RD.AlbumUpload.albumContainer.append(RD.AlbumUpload._placeholderNode)
		  }
		}
	}
	else {
		RD.debug("Unable to find meal to clear.");
	}
}

/*
doUnfinishedUploadsExist
Check whether unfinished uploads exist to know whether to fire an alert when users exit / save.

Outcomes / test cases:
- if a meal image is uploading or queued, returns true
- if no meal image matches that (or if there are no images) returns false
* /

RD.AlbumUpload.doUnfinishedUploadsExist = function() {
  result = false;
  for (var index in RD.AlbumUpload.images()) {
	var mi = RD.AlbumUpload.images()[index];
      if (mi.status === RD.AlbumUpload.statusMap.uploading || mi.status === RD.AlbumUpload.statusMap.queued)
          return true; // no point in looping more than needed
  }
  
  return result;
}

/*
doDeletedItemsExist
Check whether deleted uploads exist to know whether to fire an alert when users save (since deletion is permanent).

Outcomes / test cases:
- if a meal image is marked to be deleted, returns true
- if no meal image matches that (or if there are no images) returns false
* /


RD.AlbumUpload.doDeletedItemsExist = function() {
    result = false;
    for (var index in RD.AlbumUpload.images()) {
        var mi = RD.AlbumUpload.images()[index];
				if (mi.status === RD.AlbumUpload.statusMap["deleting"])
            return true;
    }

		return false;
}


RD.AlbumUpload.images = function() {
	if (!RD.AlbumUpload._imagesForMeal)
		RD.AlbumUpload._imagesForMeal = [];
	
	return RD.AlbumUpload._imagesForMeal;
}




RD.AlbumUpload.prototype._badServerResponse = function(response) {
	// used when the server responds successfully, but the content isn't what we expect
	// notify the console of the error, then render the error view
	// unfortunately, we can't recover since SWFUpload interpreted this as a successful upload and hence won't let it be requeued
	debug("Bad server response! " + (response ? RD.showSource(response) : " null!"));
	return this.uploadErrored({isRecoverable: false, shortDescription: "Invalid server response"});
}

RD.AlbumUpload.prototype._badFileUpload = function(data) {
	// used when the SWFUploader adds a file, but that file is missing essential content
	// I expect this never to fire, but better to be secure than sorry
	// notify the console of the error, then render the error view
	// we can't recover, since SWFUpload doesn't requeue on file errors
	debug("Bad file upload! " + (data ? RD.showSource(data) : "null!"));
	return this.uploadErrored({isRecoverable: false, shortDescription: "Problem uploading file!"});	
}

RD.AlbumUpload.prototype._getDialog = function() {
	// make sure we're at the right states -- this should be filtered
	if (!(this.status === RD.AlbumUpload.statusMap["visible"] || this.status === RD.AlbumUpload.statusMap["deleting"])){
		// this has no effect on images 
		return;
	}
	
    // gets the dialog object for the meal image
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