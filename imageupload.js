/*
RD.ImageUpload Constructor
Creates a new RD.ImageUpload and adds it to the DOM and the tracking array.  Also initializes some basic functions.
Assumptions:
- Jaml has a block called imageUploadBlock and it renders content (failure: throws exception w/ an alert, since the page itself is broken and we can't recover from that)

Other outcome / test cases:
- this initializes RD.ImageUpload if it hasn't been (creates array, assigns the debug function)
- this returns an item of type RD.ImageUpload (viewed by the constructor function)
- this adds that image to the RD.ImageUpload.images() at the index of its localID (findable by RD.ImageUpload.findByLocalID)
- this creates a new node in RD.ImageUpload._imageUploadsNode that matches the node object here
- the meal image's node is unique
- this sets the initial status to created

NOTE: by storing the meal in the array using the last index, we subsequently require that that index in the array 
always be occupied.  hence, clear replaces it with a null, rather than erasing it
*/
RD.ImageUpload = function() {
	if (!RD.ImageUpload._initialized)
		RD.ImageUpload._initialize();
		
    // store it in the list
    this.localID = RD.ImageUpload.images().length;
    RD.ImageUpload.images()[this.localID] = this;
    
    // remove the placeholder if it 's present
    if (RD.ImageUpload._placeholderNode.parent().length > 0) {
      RD.ImageUpload._placeholderNode.remove();
    }
    
		// create the node
    this._replaceWithRender("imageUploadBlock");

		// notify the sortable we've added a node
		RD.ImageUpload.refreshSortable();

		this.status = RD.ImageUpload._STATUS["created"];
	
		RD.debug("Created meal w/ local ID " + this.localID);

    return this;
}

/* MEAL IMAGE STATUSES */
// internal use only.  To verify a status, use the accessor methods below.

RD.ImageUpload._STATUS = [];
RD.ImageUpload._STATUS["created"] = -1;
RD.ImageUpload._STATUS["queued"] = 0;
RD.ImageUpload._STATUS["uploading"] = 1;
RD.ImageUpload._STATUS["errored"] = 2;
RD.ImageUpload._STATUS["deleting"] = 3;
RD.ImageUpload._STATUS["canceled"] = 4;
RD.ImageUpload._STATUS["visible"] = 5;

RD.ImageUpload.RETRY_LIMIT = 1;

RD.ImageUpload.KEY_PIC_EVENT = "keyPicRegistered";
RD.ImageUpload.KEY_PIC_CLASS = "keyPic";

/* 
initFromDatabase
This initializes an existing RD.ImageUpload using information provided from the remote database.  
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
- links in node have bindings to this RD.ImageUpload
- if key, it's registered as key (RD.ImageUpload.getKeyImage() === this)
- removes the inactive class from images
- status is visible
- updates the sort order
- * if there is no key image, sets the key image (animating if this is from upload) 
- returns this RD.ImageUpload
*/

RD.ImageUpload.prototype.initFromDatabase = function(imageDetails){
    // save details
	RD.debug("Initializing meal " + this.localID + " from database.");

    // error check
    if (!(imageDetails && imageDetails.id != null && imageDetails.thumbImageURL != null && imageDetails.fullImageURL != null)) {
        debug("ERROR: Uploading Meal Images must have id, thumbImageURL, and fullImageURL!");
		return this._badServerResponse(imageDetails); // which prints out the details
    }

	// make sure this isn't a duplicate
	var original;
	if (original = RD.ImageUpload.findByRemoteId(imageDetails.id)) {
		// we have a duplicate!  remove this node
		// this should never happen on upload, unless the same file is uploaded twice
		// should it then show a note?
		RD.debug("WARNING: duplicate found (id " + imageDetails.id + ")!  Clearing node for the duplicate.");
		RD.ImageUpload.clear(this.localID);
		return original;
	}

	for (key in imageDetails){
		this[key] = imageDetails[key];
	}

  // set status
  this.status = RD.ImageUpload._STATUS["visible"];

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

	// update the sort order
	RD.ImageUpload.updateImageUploadsOrder();
	
	// make it a key image if there is none
	if (!RD.ImageUpload.getKeyPic()) {
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
This initializes a new RD.ImageUpload using information provided by the SWF uploader.  

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
- returns this RD.ImageUpload
*/

RD.ImageUpload.prototype.initFromUpload = function(uploadDetails) {
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
  this.status = RD.ImageUpload._STATUS["queued"];

  // render and insert content
  this._replaceWithRender("queued");
  this.node.addClass("uploading");
   
	// make the meal images node dirty since we've added an image
	RD.Page.addDirtyField(RD.ImageUpload._imageUploadsNode);

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
- returns this RD.ImageUpload
*/

RD.ImageUpload.prototype.uploadStarted = function() {
    RD.debug("Upload started for mealImage " + this.localID);

    // replace the markup with uploading
    this._replaceWithRender("uploading");
    
    // generate the progress bar
    this.progressBar = this.node.find(".progressBar");
	debug("Found progress bar " + RD.showSource(this.progressBar));
	this.progressBar.progressbar({value: 0});
    
    // set the status
    this.status = RD.ImageUpload._STATUS["uploading"];
    
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
- returns this RD.ImageUpload
*/

RD.ImageUpload.prototype.uploadCanceled = function() {
	// replace with the right markup
	this._replaceWithRender("canceled");

	// set the status
	this.status = RD.ImageUpload._STATUS["canceled"];

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
- returns this RD.ImageUpload
*/

RD.ImageUpload.prototype.uploadProgressed = function(percentage) {
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
			this.node.find(".processingMessage").html(RD.ImageUpload.text("processing_uploaded_file"));
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
- returns this RD.ImageUpload
*/

RD.ImageUpload.prototype.uploadErrored = function(errorDetails) {
	errorDetails.mealImage = this;
	this.status = RD.ImageUpload._STATUS["errored"];
	
	// add an error count
	if (!this.errorCount)
		this.errorCount = 1;
	else
		this.errorCount++;
	
	if (errorDetails.isRecoverable && this.errorCount <= RD.ImageUpload.RETRY_LIMIT) {
		debug("Retrying upload.");
		this.status = RD.ImageUpload._STATUS["queued"]; // if we're retrying it
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
*/

RD.ImageUpload.prototype.uploadCompleted = function(imageDetails) {
	debug("Received results! " + imageDetails);
	if (!imageDetails || typeof(imageDetails) != "object")
		return this._badServerResponse(imageDetails);
    
    // re-initialize this node from the image details
    return this.initFromDatabase(imageDetails);  
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
*/

RD.ImageUpload.prototype.toggleDeletion = function() {
	// make sure we're at the right states -- this should be filtered
	if (!(this.status === RD.ImageUpload._STATUS["visible"] || this.status === RD.ImageUpload._STATUS["deleting"])){
		// this has no effect on other states 
		return;
	}
	 
    // gets the dialog object for the meal deletion option
    this.node.toggleClass("markedForDeletion");
	this.status = (this.status === RD.ImageUpload._STATUS["deleting"] ? RD.ImageUpload._STATUS["visible"] : RD.ImageUpload._STATUS["deleting"]);
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
*/

RD.ImageUpload.prototype.showFullImage = function() {
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
*/
RD.ImageUpload.prototype.hideFullImage = function() {
	if (dialogObject = this._getDialog())
		dialogObject.dialog("close");
}


/* STATUS ACCESSORS */

/*
isRetrying
Accessor to see if the meal image is being reuploaded after an error.

Outcomes / test cases:
- returns true if the meal is queued but has an errorCount
*/

RD.ImageUpload.prototype.isRetrying = function() {
	return (this.status === RD.ImageUpload._STATUS["queued"] && this.errorCount > 0);
}

/*
shouldCancelUpload
Accessor to see if the meal image should be canceled because it's been tried too many times.

Outcomes / test cases:
- returns true if the meal has errored more than the retry limit
*/

RD.ImageUpload.prototype.shouldCancelUpload = function() {
	return (this.errorCount > RD.ImageUpload.RETRY_LIMIT);
}


/*
Status Accessors
Accessors to check the state of the meal.

Outcomes / test cases:
- returns true if the appropriate status is set
*/

RD.ImageUpload.prototype.isCreated = function() { return this.status === RD.ImageUpload._STATUS["created"]; }
RD.ImageUpload.prototype.isVisible = function() { return this.status === RD.ImageUpload._STATUS["visible"]; }
RD.ImageUpload.prototype.isErrored = function() { return this.status === RD.ImageUpload._STATUS["errored"]; }
RD.ImageUpload.prototype.isCanceled = function() { return this.status === RD.ImageUpload._STATUS["canceled"]; }
RD.ImageUpload.prototype.isQueued = function() { return this.status === RD.ImageUpload._STATUS["queued"]; }
RD.ImageUpload.prototype.isUploading = function() { return this.status === RD.ImageUpload._STATUS["uploading"]; }
RD.ImageUpload.prototype.isDeleting = function() { return this.status === RD.ImageUpload._STATUS["deleting"]; }

/* CLASS FUNCTIONS */

/*
findByLocalId
Finds a meal by its local ID.

Assumptions:
- RD.ImageUpload.images() exists (failure: re-initialize, which creates an empty array, and hence returns null)

Other outcomes / test cases:
- returns null if id is null
- returns null if imagesForMeal does not have a RD.ImageUpload by that local id
- returns a RD.ImageUpload if there's a match

Question: 
- should findByLocalID return undefined if the value is clearedObject?
*/

RD.ImageUpload.findByLocalId = function(id) {
	return RD.ImageUpload.images()[id];
}

/*
findByRemoteId
Finds a meal by its remote (server) ID.

Assumptions:
- RD.ImageUpload.images() exists (failure: re-initialize, which creates an empty array, and hence returns null)

Other outcomes / test cases:
- returns null if id is null
- returns null if imagesForMeal does not have a RD.ImageUpload by that remote id
- returns a RD.ImageUpload if there's a match
*/

RD.ImageUpload.findByRemoteId = function(id) {
	// eliminate null and undefined inputs, which will otherwise match to in progress uploads with undefined remote IDs
	if (id === null || id === undefined)
		return undefined;
		
	for (localID in RD.ImageUpload.images()) {
		mi = RD.ImageUpload.images()[localID];
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
- RD.ImageUpload.images() exists (failure: re-initialize, which creates an empty array, and hence returns null)

Other outcomes / test cases:
- returns null if file object is null
- returns null if imagesForMeal does not have a RD.ImageUpload by that file object
- will not return canceled meals unless findOptions.includeCanceled === true
- will not return errored meals unless findOptions.includeErrored === true
- will not find meals created through initFromDatabase
- returns a RD.ImageUpload if there's a match
*/

RD.ImageUpload.findByFileObject = function(fileObject, findOptions) {
	if (fileObject === null || fileObject === undefined)
		return undefined;		

	// set default find options
	if (!findOptions) findOptions = {};
	if (!findOptions.includeCanceled) findOptions.includeCanceled = false;
	if (!findOptions.includeErrored) findOptions.includeErrored = false;
	
	for (localID in RD.ImageUpload.images()) {
		mi = RD.ImageUpload.images()[localID];
		if (mi.fileObject && mi.fileObject.id === fileObject.id && (findOptions.includeCanceled || mi.status !== RD.ImageUpload._STATUS.canceled) && (findOptions.includeErrored || mi.status !== RD.ImageUpload._STATUS.errored)) {
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
- RD.ImageUpload.images() exists (failure: re-initialize, which creates an empty array, and hence returns null)

Other outcomes / test cases:
- returns null if filename is null
- returns null if imagesForMeal does not have a RD.ImageUpload by that filename
- will not return canceled meals unless findOptions.includeCanceled === true
- will not return errored meals unless findOptions.includeErrored === true
- will not find meals created through initFromDatabase
- returns a RD.ImageUpload if there's a match
*/

RD.ImageUpload.findByFilename = function(filename, findOptions) {
	if (filename === null || filename === undefined)
		return undefined;		

	// set default find options
	if (!findOptions) findOptions = {};
	if (!findOptions.includeCanceled) findOptions.includeCanceled = false;
	if (!findOptions.includeErrored) findOptions.includeErrored = false;
	
	for (localID in RD.ImageUpload.images()) {
		mi = RD.ImageUpload.images()[localID];
		if (mi.filename === filename && (findOptions.includeCanceled || mi.status !== RD.ImageUpload._STATUS.canceled) && (findOptions.includeErrored || mi.status !== RD.ImageUpload._STATUS.errored)) {
			return mi;
		}
	}
	debug("Could not find file!")
	return undefined;
}

/* 
isImageUpload
Verifies that an object is a meal image.
Returns true if: 
	- object is a non-null Object
	- object's constructor RD.ImageUpload()
	- has a localID
	- RD.ImageUpload.findByLocalId returns the object
Returns false if:
	- above is not true
*/

RD.ImageUpload.isImageUpload = function(object) {
	if (object && object.constructor === RD.ImageUpload && object.localID != null && RD.ImageUpload.findByLocalId(object.localID) === object)
		return true;
	else
		return false;
}

/*
updateImageUploadsOrder
Updates the order of the variable imageSortOrder to save the order in which images are stored for a meal.

Assumptions:
- imageSortOrder exists (failure: throw exception, since the page is malformed and we can't recover)

Other outcomes / test cases:
- does not include uploads, errors, or cancels
- updates the sort order to reflect the order on the page (can be tested by moving elements from the front to the back)
*/

RD.ImageUpload.updateImageUploadsOrder = function() {
  order = [];
  RD.ImageUpload._imageUploadsNode.find("div.imageUploadBlock").each(function() {
      if (this.mealImage && this.mealImage.id != null)
          order.push(this.mealImage.id);
  });

  RD.ImageUpload._imageSortOrderNode.val(order.join(","));
}

RD.ImageUpload.getSortOrder = function() {
	return RD.ImageUpload._imageSortOrderNode.val();
}

/*
refreshSortable
Resets the sortable so it picks up new elements.

Other outcomes / test cases:
- sortable includes any new elements
- updates the sort order to reflect the order on the page (can be tested by moving elements from the front to the back)
*/

RD.ImageUpload.refreshSortable = function() {	
	RD.ImageUpload._imageUploadsNode.sortable({update: RD.ImageUpload.updateImageUploadsOrder,
                                placeholder: "beingSorted inlineBlock",
                                tolerance: "pointer",
                                cursor: "move",
                                items: "div.imageUploadBlock"
                                });

	RD.ImageUpload.updateImageUploadsOrder();
}

/*
becomeKey
Makes this meal image the key image.

Outcomes:
- returns true immediately if the image is already the key pic
- RD.ImageUpload._keyImageDataNode has a value === the mealImg's id
- RD.ImageUpload._keyPic === this.localID
- afterward, the meal image node has class keyPic
- afterward, no other image nodes have class keyPic
- unless told not to, a keyPicRegistered event is fired to let any handlers know a keyPic was registered
- returns true if it succeeds
*/

RD.ImageUpload.prototype.becomeKeyPic = function(options) {
	var currentKeyPicId = RD.ImageUpload._keyPic;
	debug("become key pic called for " + this.localID + ", current: " + currentKeyPicId + ", same: " + (currentKeyPicId === this.localID));
	
	if (currentKeyPicId !== undefined && currentKeyPicId === this.localID) {
		return true;
	}
	
	// set the values
  RD.ImageUpload._keyImageDataNode.val(this.id);
	RD.ImageUpload._keyPic = this.localID;
	
	// set up default options if not supplied
	if (!options) {
		options = {};
	}
	
	// handle classes
	RD.ImageUpload._imageUploadsNode.find("." + RD.ImageUpload.KEY_PIC_CLASS).removeClass(RD.ImageUpload.KEY_PIC_CLASS);
	this.node.addClass(RD.ImageUpload.KEY_PIC_CLASS);

	// trigger global event unless explicitly told not to, e.g. on page load
	// eventually this might be a call to a global Mealstrom
	// is it dangerous to pass the meal image?
	if (options.surpressEvent !== true) {
		RD.Page.publishEvent(RD.ImageUpload.KEY_PIC_EVENT, {imageUpload: this});
	}
	
  return true;
}

/*
getKeyPic
Gets the key pic object.

Outcomes:
- if the previous key image was cleared (e.g. === clearedObject) returns undefined
- otherwise returns mealImage corresponding to the value of RD.ImageUpload._keyPic (via findByLocalId, so the same results for invalid/undefined IDs)
*/

RD.ImageUpload.getKeyPic = function() {
	return RD.ImageUpload.findByLocalId(RD.ImageUpload._keyPic);
}


/*
clear
Removes the element from the DOM.

Outcomes / test cases:
- when passed an invalid meal image ID, nothing happens
- it removes the meal image's node from the DOM
- it replaces the array entry for that mealImage with clearedObject (does NOT remove it from the array -- see note at top of file)
- if the image was the cleared image, it nulls that out
*/

RD.ImageUpload.clear = function(localId) {
	// clears the meal image, removing it from the DOM
	RD.debug("CLEAR called for meal with ID " + localId);
	if (mi = RD.ImageUpload.findByLocalId(localId)) {
		RD.debug("\tFound meal to clear (" + RD.showSource(mi) + ").");

		var keyPic = RD.ImageUpload.getKeyPic();
		if (keyPic && keyPic.localID === mi.localID) {
			// remove this from being key pic
			delete RD.ImageUpload._keyPic;
			RD.ImageUpload._keyImageDataNode.val("");
		}

		mi.node.remove();
		// make it an empty hash but leave it in the array to keep numbering accurate
		// an empty hash (rather than null) avoids errors in for/each loops that check parameters
		RD.ImageUpload.images()[mi.localID] = RD.ImageUpload.clearedObject;
		mi = null;
		
		// add the placeholder node back if this is the last image
		var otherActiveImages = false, imageList = RD.ImageUpload.images();
		for (var i = 0; i < imageList.length && !otherActiveImages; i++) {
		  var testMI = imageList[i];
		  if (RD.ImageUpload.isImageUpload(testMI)) {
		    otherActiveImages = true;
		  }
		}
		if (!otherActiveImages) {
      RD.ImageUpload._imageUploadsNode.append(RD.ImageUpload._placeholderNode)
	  }
	}
	else
		RD.debug("\Unable to find meal to clear.");
}

/*
doUnfinishedUploadsExist
Check whether unfinished uploads exist to know whether to fire an alert when users exit / save.

Outcomes / test cases:
- if a meal image is uploading or queued, returns true
- if no meal image matches that (or if there are no images) returns false
*/

RD.ImageUpload.doUnfinishedUploadsExist = function() {
  result = false;
  for (var index in RD.ImageUpload.images()) {
	var mi = RD.ImageUpload.images()[index];
      if (mi.status === RD.ImageUpload._STATUS.uploading || mi.status === RD.ImageUpload._STATUS.queued)
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
*/


RD.ImageUpload.doDeletedItemsExist = function() {
    result = false;
    for (var index in RD.ImageUpload.images()) {
        var mi = RD.ImageUpload.images()[index];
				if (mi.status === RD.ImageUpload._STATUS["deleting"])
            return true;
    }

		return false;
}


RD.ImageUpload.images = function() {
	if (!RD.ImageUpload._imagesForMeal)
		RD.ImageUpload._imagesForMeal = [];
	
	return RD.ImageUpload._imagesForMeal;
}


/* PRIVATE FUNCTIONS */
/*
Assumptions:
- #imageSortOrder exists (failure: throws exception, since we cannot continue)
- #mealimages exists (failure: throws exception, since we cannot continue)
- #keyImageStore exists (failure: throws exception, since we cannot continue)

Other outputs:
- if initialized is already true, does nothing
- sets RD.ImageUpload.debug and RD.ImageUpload.prototype.debug
- pre-initializes images array
- sets sort order node
- sets _imageUploadsNode
- sets clearedObject
- sets up Jaml templates
- sets initialized to true
*/
RD.ImageUpload._initialize = function() {
	if (!RD.ImageUpload._initialized) {
		// add language support
		RD.Utils.addLanguageSupport(RD.ImageUpload, RD.ImageUpload.internals)
		
		// preinitialize images
		RD.ImageUpload.images();
		
		// get the sort order node
		RD.ImageUpload._imageSortOrderNode = $("#imageSortOrder");
		if (RD.ImageUpload._imageSortOrderNode.length === 0)
			throw("RD.ImageUpload._initialize could not find input #imageSortOrder! Cannot continue.");
		
		// get the meal images node
		RD.ImageUpload._imageUploadsNode = $("#imageUploads");
		if (RD.ImageUpload._imageUploadsNode.length === 0)
			throw("RD.ImageUpload._initialize could not find #imageUploads! Cannot continue.");		
		
		// get the key image value store
		RD.ImageUpload._keyImageDataNode = $("#meal_key_picture_id");
		if (RD.ImageUpload._keyImageDataNode.length === 0)
			throw("RD.ImageUpload._initialize could not find input #meal_key_picture_id! Cannot continue.");		

    // get the placeholder node
    RD.ImageUpload._placeholderNode = RD.ImageUpload._imageUploadsNode.find("#imageUploadsPlaceholder");
		if (RD.ImageUpload._placeholderNode.length === 0)
			throw("RD.ImageUpload._initialize could not find input #imageUploadsPlaceholder! Cannot continue.");		    

		// set up the sortable
		RD.ImageUpload.refreshSortable();
			
		// set the cleared placeholder
		RD.ImageUpload.clearedObject = {};
		
		// load Jaml
		RD.ImageUpload._loadJaml();
		
		RD.ImageUpload._initialized = true;
	}
}

RD.ImageUpload._shutdown = function() {
	// used for testing
	// reset all initialized variables to nothing
	delete RD.ImageUpload._imagesForMeal;
	delete RD.ImageUpload.prototype.debug;
	delete RD.ImageUpload._initialized;
	delete RD.ImageUpload._imageSortOrderNode;
	delete RD.ImageUpload._keyImageDataNode;
	delete RD.ImageUpload._keyPic;
	delete RD.ImageUpload._imageUploadsNode;
	delete RD.ImageUpload.clearedObject;
	
	for (var templateName in RD.ImageUpload.internals._JAML_TEMPLATES) {
		if (RD.ImageUpload.internals._JAML_TEMPLATES.hasOwnProperty(templatesName)) {
		  delete Jaml.templates[templateName];
	  }
	}
}

RD.ImageUpload.prototype._badServerResponse = function(response) {
	// used when the server responds successfully, but the content isn't what we expect
	// notify the console of the error, then render the error view
	// unfortunately, we can't recover since SWFUpload interpreted this as a successful upload and hence won't let it be requeued
	debug("Bad server response! " + (response ? RD.showSource(response) : " null!"));
	return this.uploadErrored({isRecoverable: false, shortDescription: "Invalid server response"});
}

RD.ImageUpload.prototype._badFileUpload = function(data) {
	// used when the SWFUploader adds a file, but that file is missing essential content
	// I expect this never to fire, but better to be secure than sorry
	// notify the console of the error, then render the error view
	// we can't recover, since SWFUpload doesn't requeue on file errors
	debug("Bad file upload! " + (data ? RD.showSource(data) : "null!"));
	return this.uploadErrored({isRecoverable: false, shortDescription: "Problem uploading file!"});	
}

RD.ImageUpload.prototype._getDialog = function() {
	// make sure we're at the right states -- this should be filtered
	if (!(this.status === RD.ImageUpload._STATUS["visible"] || this.status === RD.ImageUpload._STATUS["deleting"])){
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

RD.ImageUpload.prototype._replaceWithRender = function(blockName, details) {
    // replaces all content in the current node with the result of rendering the block
	if (!details) details = this;
	
	// render the content
	// while checking for missing Jaml templates
	content = null;
	try {
    	content = Jaml.render(blockName, details);
	}
	catch (e) {
		console.log("ERROR: Jaml encountered an error: " + RD.showSource(e));
	}
	
	if (!content) {
		if (!Jaml.templates[blockName]) {
			templates = [];
			for (var i in Jaml.templates) { templates.push(i) }
			throw("Jaml does not have template " + blockName + " registered!  Unable to continue.  Templates: " + templates.join(","));
		}
		else {
			throw("Jaml returned null content for " + blockName + "!");
		}
	}
	
	if (!this.node) {
		// rendering for the first time 
		this.node = $(content);			
	    RD.ImageUpload._imageUploadsNode.append(this.node);

		// associate the node with this image
		// so we can sort it later
		this.node[0].mealImage = this;
	}
	// replace existing content
	else {
	    if (this.node.children().length > 0)
			this.node.find("*").remove("*");

	    this.node.append(content);
	}

    return this;
}

// internal data
RD.ImageUpload.TEXT = {
	en: {
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
	}
}
	
	/* JAML TEMPLATES */
	// since these are required in the RD.ImageUpload class for view work, they're stored here
	// not really MVC, but this is Javascript
	// http://github.com/edspencer/jaml
RD.ImageUpload.internals = {
	JAML_TEMPLATES: {
		"imageUploadBlock": function(mealImage) {
		    div({cls: "imageUploadBlock", id: "imageUpload" + mealImage.localID});
		},
		"queued": function(mealImage) {
		    div({cls: "uploadingText"}, RD.ImageUpload.text(mealImage.retryCount ? "queued_retry" : "queued_upload") + "<br/>" + mealImage.filename)
		},
		"uploading": function(mealImage) {
		    span(
		        div({cls: "uploadingText"}, RD.ImageUpload.text("uploading_file") + mealImage.filename),
		        div({cls: "progressBar"}),
						div({cls: "processingMessage"})
		    )
		},
		"errored": function(errorData) {
		    div({cls: "errorBlock"},
		        div(span({cls: "description"}, errorData.shortDescription), span(RD.ImageUpload.text("error_for") + " " + errorData.mealImage.filename)),
		        div(a({cls: "clearLink", href: "#", onclick:  "RD.ImageUpload.clear(" + errorData.mealImage.localID + ")"}, RD.ImageUpload.text("link_clear")))             
		    )
		},
		"magnifyDialog": function(imageURL) {
		    div(img({src: imageURL, cls: "magnifyDialog"}));
		},
		"canceled": function(mealImage) {
		    div(
		        div({cls: "uploadingText"}, RD.ImageUpload.text("upload_canceled")),
		        div(a({cls: "clearLink", href: "#", onclick:  "RD.ImageUpload.clear(" + mealImage.localID + ")"}, RD.ImageUpload.text("link_clear")))             
		    )
		},
		"visible": function(mealImage) {
		     span({cls: "verticalAligner"}, 
		        div({cls: "keyPicText"},
	          	span({cls: "isKeyPic"}, RD.ImageUpload.text("is_album_pic")),
	            a({href: "#", cls: "keyPicLink"}, RD.ImageUpload.text("make_album_pic"))
		        ),
		        div({cls: "image"},
		            img({cls: "mealImage", id: "image" + mealImage.localID, src: mealImage.thumbImageURL}),
		            span({cls: "deleteText"}, RD.ImageUpload.text("will_be_deleted"))
		        ),
		        div({cls: "actions inactive"}, 
		            a({cls: "magnify", href: "#"}, div("&nbsp;")),
		            a({cls: "delete", href: "#"}, div("&nbsp;"))
		        ),
		        div({cls: "clearFloat"}, "&nbsp;")
		     )
		}
	}
}

RD.ImageUpload._loadJaml = function() { 
	RD.debug("Loading Jaml...");

	for (var templateName in RD.ImageUpload.internals.JAML_TEMPLATES) {
		templateFunction = RD.ImageUpload.internals.JAML_TEMPLATES[templateName];
		Jaml.register(templateName, templateFunction);
	}
	
	RD.debug("Loading Jaml done!");
}