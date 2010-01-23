/*jslint devel: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true */


// debug
function debug(message) {
	try {
		if (console)
			console.log(message);
	}
	catch (ex) {}
}


/* 
MealImageManager

MealImageManager is a singleton global object that manages all meal images.
It's built along the principles enumerated in Douglas Crockford's Javascript: The Good Parts:
- created using a function, through which we achieve the following:
- internal variables, such as the internal array of images, DOM nodes, and language text, 
  are made private by declaring in the function scope (which all methods can see) but are not bound
  to the object.  Hence, they're externally inaccessible.
- the object is constructed using an immediately-executed anonymous function, ensuring it to be a singleton

Individual methods and variables will be described as they are declared.
*/

var MealImageManager = (function() {
	// define the object that will become MealImageManager
	var that = {};
	
	/*************************************************
 	 * PART ONE: Declare private (unbound) variables *
     *************************************************/

	// our array of images
	var imageStore = [];
	
	// initialization state
	var mealImagesInitialized = false;
	
	// placeholder for cleared meals
	var clearedObject = {};
	
	// our required nodes
	var imageSortOrderNode, mealImagesNode;

	// texts
	var DEFAULT_LANGUAGE = "en", TEXTS = {
		en: {
			queued_retry: "Waiting to retry",
			queued_upload: "Waiting to upload",
			uploading_file: "Uploading file ",
			error_for: " for ",
			link_clear: "clear",
			is_album_pic: "album pic",
			make_album_pic: "make album pic",
			will_be_deleted: "Will be deleted<br/>click the X to undelete",
			upload_canceled: "Upload Canceled"
		}
	}
	
	// SECOND, global/singleton MealImageManager functions
	
	// 2.b define our functions
	/*
	Initialize (public)
	Assumptions:
	- #imageSortOrder exists (failure: throws exception, since we cannot continue)
	- #mealimages exists (failure: throws exception, since we cannot continue)

	Other outputs:
	- if initialized is already true, does nothing
	- sets MealImageManager.debug and MealImageManager.prototype.debug
	- pre-initializes images array
	- sets sort order node
	- sets mealImagesNode
	- sets clearedObject
	- sets up Jaml templates
	- sets initialized to true
	*/
	var initialize = function() {
		if (!mealImagesInitialized) {
			// make sure we have texts for the default language, which is used as a fall-back
			// #TODO move to language file
			if (!(TEXTS && TEXTS[DEFAULT_LANGUAGE]))
				throw("MealImageManager does not have texts for the default language!  Cannot continue.");

			// get the sort order node
			imageSortOrderNode = $("#imageSortOrder");
			if (imageSortOrderNode.length === 0)
				throw("MealImageManager.initialize could not find input #imageSortOrder! Cannot continue.");

			mealImagesNode = $("#mealImages");
			if (mealImagesNode.length === 0)
				throw("MealImageManager.initialize could not find #mealImages! Cannot continue.");		

			// load Jaml
			loadJaml();

			// create the sortable
			refreshSortable();

			mealImagesInitialized = true;
		}
	}
	
	/*
	registerMealImage
	Adds a new mealImage to the images array and returns its index to serve as the localID.
	
	Assumptions:
	- the newMealImage is stored at an index === previous length (failure: throws exception, since our code is off)

	Other outcome / test cases:
	- always returns a number
	- the new image is findable by the local ID once the initialization finishes

	NOTE: by storing the meal in the array using the last index, we subsequently require that that index in the array 
	always be occupied.  hence, clear replaces it with a null, rather than erasing it
	*/
	var registerMealImage = function(newMealImage) {
		// make sure meal image is initialized
		if (!mealImagesInitialized) {
			initialize();
		}
		
	  // store it in the list
		var idWillBe = imageStore.length;
	  imageStore.push(newMealImage); // this puts it at idWillBe

		// verify we stored the image properly
		if (imageStore[idWillBe] !== newMealImage)
	    throw({name: "ImproperIndexError", message: "newMealImage stored with id != previous imageStore.length!"})

		// now return the local ID of the new image so it can save it
	  return idWillBe;
	};

	// private 
	var loadJaml = function() { 
		debug("Loading Jaml...");

		for (var templateName in MealImageManager._JAML_TEMPLATES) {
			templateFunction = MealImageManager._JAML_TEMPLATES[templateName];
			Jaml.register(templateName, templateFunction);
		}

		debug("Loading Jaml done!");
	}
	
	/*
	refreshSortable (public)
	Resets the sortable so it picks up new elements.

	Other outcomes / test cases:
	- sortable includes any new elements
	- updates the sort order to reflect the order on the page (can be tested by moving elements from the front to the back)
	*/

	var refreshSortable = function() {
		mealImagesNode.sortable({update: MealImageManager.updateMealImagesOrder,
	                                placeholder: "beingSorted inlineBlock",
	                                tolerance: "pointer",
	                                cursor: "move",
	                                items: "div.mealImageBlock"
	                                });

		updateMealImagesOrder();
	}
	
	/*
	updateMealImagesOrder (private)
	Updates the order of the variable imageSortOrder to save the order in which images are stored for a meal.

	Assumptions:
	- imageSortOrder exists (failure: throw exception, since the page is malformed and we can't recover)

	Other outcomes / test cases:
	- does not include uploads, errors, or cancels
	- updates the sort order to reflect the order on the page (can be tested by moving elements from the front to the back)
	*/
	var updateMealImagesOrder = function() {
	    order = [];
	    mealImagesNode.find("div.mealImageBlock").each(function() {
	        if (this.mealImage && this.mealImage.id !== null)
	            order.push(this.mealImage.id);
	    });

	    imageSortOrderNode.val(order.join(","));
	}
	
	/* 
	hangMealImage
	Adds meal image to 
	*/
	var hangMealImage = function(nodeForImage) { 
		// verify it's a jQuery object by making sure jQuery has a node for it
		if (!$.data(nodeForImage)) {
			throw {name: "TypeError", message: "hangMealImage was not given a valid object for jQuery (data was falsy!)"};
		}
		
		mealImagesNode.append(nodeForImage);
	};
	
	/* 
	isMealImage
	Verifies that an object is a meal image.
	Returns true if: 
		- object is a non-null Object
		- object's constructor MealImage()
		- has a.getLocalID()
		- MealImageManager.findByLocalId returns the object
	Returns false if:
		- above is not true
	*/

	MealImageManager.isMealImageManager = function(object) {
		if (object && object.constructor === MealImageManager && object.getLocalID() !== null && MealImageManager.findByLocalId(object.getLocalID()) === object)
			return true;
		else
			return false;
	}



	MealImageManager.getSortOrder = function() {
		return MealImageManager.imageSortOrderNode.val();
	}


	MealImageManager.registerKeyImage = function(mealImg) {

	}

	/*
	clear
	Removes the element from the DOM.

	Outcomes / test cases:
	- when passed an invalid meal image ID, nothing happens
	- it removes the meal image's node from the DOM
	- it replaces the array entry for that mealImage with null (does NOT remove it from the array -- see note at top of file)
	*/

	MealImageManager.clear = function(localId) {
		// clears the meal image, removing it from the DOM
		debug("CLEAR called for meal with ID " + localId);
		if (mi = MealImageManager.findByLocalId(localId)) {
			debug("\tFound meal to clear (" + showSource(mi) + ").");

			mi.node.remove();
			// make it an empty hash but leave it in the array to keep numbering accurate
			// an empty hash (rather than null) avoids errors in for/each loops that check parameters
			MealImageManager.images()[mi.getLocalID()] = MealImageManager.clearedObject;
			mi = null;
		}
		else
			debug("\Unable to find meal to clear.");
	}
	
	
	// 2.a define our public interface
	that = {
		initialize: initialize,
		registerMealImage: registerMealImage,
		refreshSortable: refreshSortable,
		hangMealImage: hangMealImage,
	}
	
	return that;
})();

/*
MealImageManager.newMealImage

newMealImage is a constructor method that creates new meal image objects.  These objects represent and manage
images as they are added to a meal -- managing DOM interaction, the upload process, internal state, etc.

Like MealImageManager, this is built using the Javascript: The Good Parts paradigm; in this case, however, 
instead of returning a singleton object, it returns a single function that can be used multiple times to create
meal images.

This is defined outside the MealImageManager function to shield the manager object's private variables 
(accessible by anything defined inside the MealImageManager constructor) from individual MealImage objects.
It also cleanly separates the code of the two "classes".
*/

MealImageManager.newMealImage = (function() {
	// define the object that will become the meal image
	// also define the object that will hold prototype methods
	var that = {};
	
	/*************************************************
 	 * PART ONE: Declare private CLASS variables     *
     *************************************************/

	// statuses
	var STATUS = {
		created: -1,
		queued:  0,
		uploading: 1,
		errored: 2,
		deleting: 3,
		canceled: 4,
		visible: 5	
	}
	
	// retry limit
	RETRY_LIMIT = 1;
	
	// JAML templates
	JAML_TEMPLATES = {
		"mealImageBlock": function(mealImage) {
		    div({cls: "mealImageBlock", id: "mealImage" + mealImage.getLocalID()});
		},
		"queued": function(mealImage) {
		    div({cls: "uploadingText"}, MealImageManager.text(mealImage.retryCount ? "queued_retry" : "queued_upload") + "<br/>" + mealImage.filename)
		},
		"uploading": function(mealImage) {
		    span(
		        div({cls: "uploadingText"}, MealImageManager.text("uploading_file") + mealImage.filename),
		        div({cls: "progressBar"})
		    )
		},
		"errored": function(errorData) {
		    div({cls: "errorBlock"},
		        div(span({cls: "description"}, errorData.shortDescription), span(MealImageManager.text("error_for") + " " + errorData.mealImage.filename)),
		        div(a({cls: "clearLink", href: "#", onclick:  "MealImageManager.clear(" + errorData.mealImage.getLocalID() + ")"}, MealImageManager.text("link_clear")))             
		    )
		},
		"magnifyDialog": function(imageURL) {
		    div(img({src: imageURL, cls: "magnifyDialog"}));
		},
		"canceled": function(mealImage) {
		    div(
		        div({cls: "uploadingText"}, MealImageManager.text("upload_canceled")),
		        div(a({cls: "clearLink", href: "#", onclick:  "MealImageManager.clear(" + mealImage.getLocalID() + ")"}, MealImageManager.text("link_clear")))             
		    )
		},
		"visible": function(mealImage) {
		     span({cls: "verticalAligner"}, 
		        div({cls: "keyPicText " + (mealImage.isKeyPic ? "keyPic" : "")},
		            a({href: "#"},
		                span({cls: "isKeyPic"}, MealImageManager.text("is_album_pic")),
		                span({cls: "notKeyPic"}, MealImageManager.text("make_album_pic"))
		            )
		        ),
		        div({cls: "image"},
		            img({cls: "mealImage", id: "image" + mealImage.getLocalID(), src: mealImage.thumbImageURL}),
		            span({cls: "deleteText"}, MealImageManager.text("will_be_deleted"))
		        ),
		        div({cls: "actions inactive"}, 
		            a({cls: "magnify", href: "#"}, div("&nbsp;")),
		            a({cls: "delete", href: "#"}, div("&nbsp;"))
		        ),
		        div({cls: "clearFloat"}, "&nbsp;")
		     )
		}
	};

	/************************************************
 	 * PART 3: Create the prototype for a mealImage *
    ***********************************************/
	
	// since we will create multiple meal images, we want to give them all the same prototype
	var mealImagePrototype = {
		/* 
		initFromDatabase
		This initializes an existing MealImageManager using information provided from the remote database.  
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
		- links in node have bindings to this MealImage
		- if key, it's registered as key (MealImageManager.getKeyImage() === this)
		- removes the inactive class from images
		- status is visible
		- updates the sort order
		- returns this MealImage
		*/

		initFromDatabase: function(imageDetails){
		    // save details
			debug("Initializing meal " + this.getLocalID() + " from database.");

		    // error check
		    if (!(imageDetails && imageDetails.id !== null && imageDetails.thumbImageURL !== null && imageDetails.fullImageURL !== null)) {
		        debug("ERROR: Uploading Meal Images must have id, thumbImageURL, and fullImageURL!");
						return this._badServerResponse(imageDetails); // which prints out the details
		    }

			// make sure this isn't a duplicate
			var original;
			if (original = MealImageManager.findByRemoteId(imageDetails.id)) {
				// we have a duplicate!  remove this node
				// this should never happen on upload, unless the same file is uploaded twice
				// should it then show a note?
				debug("WARNING: duplicate found (id " + imageDetails.id + ")!  Clearing node for the duplicate.");
				MealImageManager.clear(this.getLocalID());
				return original;
			}

			for (key in imageDetails){
				// these keys are not stored securely, but for now we accept that
				// at some point in the future we could create a mechanism to store them inside the private scope
				this[key] = imageDetails[key];
			}

		  // set status
		  this.setStatus("visible");

		    // determine if this is horizontal or vertical
			// if the height and width aren't properly detected by the server, we may be fudged here
			// but in that case, the server doesn't know which thumbnail to send down, and all's weird anyway
			this.isHorizontal = (this.width > this.height);

			// set up the dialog
			this.getDialog();

			debug("Horizontal: " + this.isHorizontal);

	    // then update the node
	    this.node.addClass((this.isHorizontal ? "forHorizontalImage" : "forVerticalImage"));

	    // remove uploading class in case it was from an upload
	    this.node.removeClass("uploading");

	    // render content and insert
	    this.replaceWithRender("visible");
	    // initialize links
	    var tempObject = this; // otherwise this gets misinterpreted when the function is applied
	  	this.node.find("a.delete").bind("click", function() { tempObject.toggleDeletion(); return false; });
	    this.node.find("a.magnify").bind("click", function() {  tempObject.showFullImage(); return false; });

	    // if this is key, act on it
	    if (this.isKey)
	        MealImageManager.registerKeyImage(this);

	    // mark this as active
	    this.node.find(".actions").removeClass("inactive");

			// update the sort order
			MealImageManager.updateMealImagesOrder();

	    // return
	    debug("Initialization done -- image has remote ID " + this.id);
			return this;
		}
		
		// private getDialog function
		getDialog: function() {
			// FIXME: this whole thing to be replaced by the image display system
			
			// make sure we're at the right states -- this should be filtered
			var currentStatus = this.getStatus();
			if (!(currentStatus === STATUS.visible || this.status === STATUS.deleting)){
				// this has no effect on images not in one of those two states
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
		
		// private function
		replaceWithRender: function(blockName, details) {
		    // replaces all content in the current node with the result of rendering the block
			if (!details) details = this;

			// render the content
			// while checking for missing Jaml templates
			content = null;
			try {
		    	content = Jaml.render(blockName, details);
			}
			catch (e) {
				console.log("ERROR: Jaml encountered an error: " + showSource(e));
			}

			if (!content) {
				if (!Jaml.templates[blockName]) {
					templates = [];
					for (var i in Jaml.templates) { 
						if (Jaml.templates.hasOwnProperty(i))
							templates.push(i) 
					}
					throw("Jaml does not have template " + blockName + " registered!  Unable to continue.  Templates: " + templates.join(","));
				}
				else {
					throw("Jaml returned null content for " + blockName + "!");
				}
			}

			if (!this.node) {
				// rendering for the first time 
				this.node = $(content);			
			  MealImageManager.hangMealImage(this.node);

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
	}

	


	/****************************************************************
 	 * PART N: Return the function that actually creates new images *
     ****************************************************************/
	
	return function() {
		// we're going to use the Good Parts Method again (triple nesting!) 
		// to create privately-scoped individual variables for this particular object

		/****************************************************************
	 	 * PART N.A: Private instance functions *
	     ****************************************************************/

		// so first, set our private variables
		var localID, status;

		/****************************************
	 	 * PART N.B: Private instance functions *
	   ****************************************/


		// now create and return the object, which can see the above but not use them
		/*
		Constructor
		Creates a new MealImageManager and adds it to the DOM and the tracking array.  Also initializes some basic functions.
		Assumptions:

		Other outcome / test cases:
		- this returns a MealImage object (e.g. MealImageManager.findByLocalID(mi.getLocalID()) returns the same object)
		- this creates a new node in MealImageManager.mealImagesNode that matches the node object here
		- the meal image's node is unique
		- this sets the initial status to created
		*/
		return (function () {
			// create the object returned as the new image
			var newImage = {};

			// add the prototype methods defined above
			newImage.prototype = mealImagePrototype;
			
			// register the object with the manager, which gives us its.getLocalID()
			localID = MealImageManager.registerNewImage(newImage);
			// make sure we got a valid, numeric.getLocalID()
			if (!localID !== null && localID !== undefined && typeof localID !== "number")) {
				throw {name: "MissingParameterError", message: "registerNewImage did not return a numeric value!"};
			}
			// define a function to get the local ID, since it's not otherwise accessible
			newImage.getLocalID = function() { return localID };
			
			// set the status and make it accessible
			status = STATUS.created;
			newImage.getStatus = function() { return status };
			newImage.setStatus = function(statusName) { 
				// only change the status if it's a valid one
				// this is a compromise between hiding status setting behind a set of setter functions and exposing it blindly
				if (STATUS[statusName]) {
					status = STATUS[statusName];					
				}
			};
			
			// create the node
			newImage.replaceWithRender("mealImageBlock");		
			
			// notify the sortable we've added a node
			MealImageManager.refreshSortable();
			
			// return our new object
			return newImage;
		})();
	};
	

})();

/*
initFromUpload
This initializes a new MealImageManager using information provided by the SWF uploader.  

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
- returns this MealImage
*/

initFromUpload: function(uploadDetails) {
	debug("Initializing meal " + this.getLocalID() + " from upload.");

    // error check
    if (!(uploadDetails && uploadDetails.id !== null && uploadDetails.name !== null)) {
    	debug("ERROR: Uploading Meal Images must exist (" + uploadDetails + " and have an id (" + (uploadDetails ? uploadDetails.id : "obj is null") + ") and a filename (" + (uploadDetails ? uploadDetails.filename : "obj is null") + ")");
		return this._badFileUpload(uploadDetails); // which prints out the details
    }

    // save details
    this.filename = uploadDetails.name;
    this.fileObject = uploadDetails;
	
    // set status
    this.status = STATUS.queued;

    // render and insert content
    this.replaceWithRender("queued");
    this.node.addClass("uploading");
    
    // return
    debug("Initialization done -- image has filename  " + this.filename);
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
- returns this MealImage
*/

uploadStarted: function() {
    debug("Upload started for mealImage " + this.getLocalID());

    // replace the markup with uploading
    this.replaceWithRender("uploading");
    
    // generate the progress bar
    this.progressBar = this.node.find(".progressBar");
	debug("Found progress bar " + showSource(this.progressBar));
	this.progressBar.progressbar({value: 0});
    
    // set the status
    this.status = STATUS.uploading;
    
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
- returns this MealImage
*/

uploadCanceled: function() {
	// replace with the right markup
	this.replaceWithRender("canceled");

	// set the status
	this.status = STATUS.canceled;

	return this;
}

/*
uploadProgressed
This is triggered when an upload has made progress, updating status and visuals.

Assumptions:
- Nothing external has removed the progressbar element (failure: reruns this.uploadStarted) 

Other outcomes / test cases:
- this.progressBar.progressbar("option", "value") is equal to percentage * 100
- returns this MealImage
*/

uploadProgressed: function(percentage) {
    debug("Upload progressed to " + percentage + "% for mealImage " + this.getLocalID());

    // error check -- reset progress bar if it somehow gets deleted
    //if (!this.progressBar)
    //    throw("uploadProgress called for meal image " + this.getLocalID() + " but this.progressBar is null!");
    if (!this.progressBar)
		this.uploadStarted();

    // update the progressbar
    this.progressBar.progressbar("option", "value", percentage * 100);
    
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
- returns this MealImage
*/

uploadErrored: function(errorDetails) {
	errorDetails.mealImage = this;
	this.status = STATUS.errored;
	
	// add an error count
	if (!this.errorCount)
		this.errorCount = 1;
	else
		this.errorCount++;
	
	if (errorDetails.isRecoverable && this.errorCount <= MealImageManager.RETRY_LIMIT) {
		debug("Retrying upload.");
		this.status = STATUS.queued; // if we're retrying it
	}	
	
	debug("Error details shortDescription: " + errorDetails.shortDescription);
	this.replaceWithRender("errored", errorDetails);

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

uploadCompleted: function(imageDetails) {
	debug("Received results! " + imageDetails);
	if (!imageDetails || typeof(imageDetails) !== "object")
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

toggleDeletion: function() {
	// make sure we're at the right states -- this should be filtered
	if (!(this.status === STATUS.visible || this.status === STATUS.deleting)){
		// this has no effect on other states 
		return;
	}
	 
    // gets the dialog object for the meal deletion option
    this.node.toggleClass("markedForDeletion");
	this.status = (this.status === STATUS.deleting ? STATUS.visible : STATUS.deleting);
}

/*
showFullImage
Shows the image magnification dialog.

Assumptions:
- mealImage is visible or deleted (failure: nothing happens)

Other outcomes / test cases:
- creates the zoom dialog if it doesn't exist -- issue?
- object returned is a dialog (verified by .dialog("isOpen") !== null)
- after firing, this.zoomDialog().dialog("isOpen") is true
*/

showFullImage: function() {
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
hideFullImage: function() {
	if (dialogObject = this._getDialog())
		dialogObject.dialog("close");
}


/* STATUS ACCESSORS */

/*
isRetrying
Accessor to see if the meal image is being reuploaded after an error.  
(Separate from determining if this should be canceled due to too many retries.)

Outcomes / test cases:
- returns true if the meal is queued but has an errorCount > 0
*/

isRetrying: function() {
	return (this.status === STATUS.queued && this.errorCount > 0);
}

/*
shouldCancelUpload
Accessor to see if the meal image should be canceled because it's been tried too many times.

Outcomes / test cases:
- returns true if the meal has errored more than the retry limit
*/

shouldCancelUpload: function() {
	return (this.errorCount > MealImageManager.RETRY_LIMIT);
}


/*
Status Accessors
Accessors to check the state of the meal.

Outcomes / test cases:
- returns true if the appropriate status is set
*/

isCreated: function() { return this.status === STATUS.created; }
isVisible: function() { return this.status === STATUS.visible; }
isErrored: function() { return this.status === STATUS.errored; }
isCanceled: function() { return this.status === STATUS.canceled; }
isQueued: function() { return this.status === STATUS.queued; }
isUploading: function() { return this.status === STATUS.uploading; }
isDeleting: function() { return this.status === STATUS.deleting; }

/* CLASS FUNCTIONS */

/*
findByLocalId
Finds a meal by its local ID.

Assumptions:
- MealImageManager.images() exists (failure: re-initialize, which creates an empty array, and hence returns null)

Other outcomes / test cases:
- returns null if id is null or undefined
- returns undefined if imagesForMeal does not have a MealImageManager by that local id
- returns a MealImageManager if there's a match
*/

MealImageManager.findByLocalId = function(id) {
	return MealImageManager.images()[id];
}

/*
findByRemoteId
Finds a meal by its remote (server) ID.

Assumptions:
- MealImageManager.images() exists (failure: re-initialize, which creates an empty array, and hence returns null)

Other outcomes / test cases:
- returns null if id is null or undefined
- returns undefined if imagesForMeal does not have a MealImageManager by that remote id
- returns a MealImageManager if there's a match
*/

MealImageManager.findByRemoteId = function(id) {
	// eliminate null and undefined inputs, which will otherwise match to in progress uploads with undefined remote IDs
	if (id === null || id === undefined)
		return undefined;
		
	for .getLocalID() in MealImageManager.images()) {
		mi = MealImageManager.images().getLocalID()];
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
- MealImageManager.images() exists (failure: re-initialize, which creates an empty array, and hence returns null)

Other outcomes / test cases:
- returns null if file object is null
- returns null if imagesForMeal does not have a MealImageManager by that file object
- will not return canceled meals unless findOptions.includeCanceled === true
- will not return errored meals unless findOptions.includeErrored === true
- will not find meals created through initFromDatabase
- returns a MealImageManager if there's a match
*/

MealImageManager.findByFileObject = function(fileObject, findOptions) {
	if (fileObject === null || fileObject === undefined)
		return undefined;		

	// set default find options
	if (!findOptions) findOptions = {};
	if (!findOptions.includeCanceled) findOptions.includeCanceled = false;
	if (!findOptions.includeErrored) findOptions.includeErrored = false;
	
	for .getLocalID() in MealImageManager.images()) {
		mi = MealImageManager.images().getLocalID()];
		if (mi.fileObject && mi.fileObject.id === fileObject.id && (findOptions.includeCanceled || mi.status !== STATUS.canceled) && (findOptions.includeErrored || mi.status !== STATUS.errored)) {
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
- MealImageManager.images() exists (failure: re-initialize, which creates an empty array, and hence returns null)

Other outcomes / test cases:
- returns null if filename is null
- returns null if imagesForMeal does not have a MealImageManager by that filename
- will not return canceled meals unless findOptions.includeCanceled === true
- will not return errored meals unless findOptions.includeErrored === true
- will not find meals created through initFromDatabase
- returns a MealImageManager if there's a match
*/

MealImageManager.findByFilename = function(filename, findOptions) {
	if (filename === null || filename === undefined)
		return undefined;		

	// set default find options
	if (!findOptions) findOptions = {};
	if (!findOptions.includeCanceled) findOptions.includeCanceled = false;
	if (!findOptions.includeErrored) findOptions.includeErrored = false;
	
	for .getLocalID() in MealImageManager.images()) {
		mi = MealImageManager.images().getLocalID()];
		if (mi.filename === filename && (findOptions.includeCanceled || mi.status !== STATUS.canceled) && (findOptions.includeErrored || mi.status !== STATUS.errored)) {
			return mi;
		}
	}
	debug("Could not find file!")
	return undefined;
}


/*
doUnfinishedUploadsExist
Check whether unfinished uploads exist to know whether to fire an alert when users exit / save.

Outcomes / test cases:
- if a meal image is uploading or queued, returns true
- if no meal image matches that (or if there are no images) returns false
*/

MealImageManager.doUnfinishedUploadsExist = function() {
    result = false;
    for (var index in MealImageManager.images()) {
		var mi = MealImageManager.images()[index];
        if (mi.status === STATUS.uploading || mi.status === STATUS.queued)
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


MealImageManager.doDeletedItemsExist = function() {
    result = false;
    for (mi in MealImageManager.images()) {
        if (mi.status === STATUS.deleting)
            result = true;
    }
    
    return result;
}


MealImageManager.images = function() {
	if (!MealImageManager._imagesForMeal)
		MealImageManager._imagesForMeal = [];
	
	return MealImageManager._imagesForMeal;
}


//throw("MealImageManager language22 stuff needs documentation and test cases!");
MealImageManager.language = function() {
	if (!MealImageManager._language) {
		// set the language
		try {
			// try to get it from the global settings
			// later, this should fail on lack of Mealstrom
			MealImageManager._language = Mealstrom.language;
		} catch (e) {}

		// if language isn't set there, set it to English
		if (!MealImageManager._language) MealImageManager._language = "en";
	}

	return MealImageManager._language;
}

MealImageManager.text = function(key) {
	var corpus = MealImageManager._TEXTS[MealImageManager.language()];
	if (corpus && corpus[key])
		return corpus[key];
	else
		return MealImageManager._TEXTS[MealImageManager._DEFAULT_LANGUAGE][key];
}

/* PRIVATE FUNCTIONS */


MealImageManager._shutdown = function() {
	// used for testing
	// reset all initialized variables to nothing
	delete MealImageManager._imagesForMeal;
	delete MealImageManager.prototype.debug;
	delete MealImageManager._initialized;
}

_badServerResponse: function(response) {
	// used when the server responds successfully, but the content isn't what we expect
	// notify the console of the error, then render the error view
	// unfortunately, we can't recover since SWFUpload interpreted this as a successful upload and hence won't let it be requeued
	debug("Bad server response! " + (response ? showSource(response) : " null!"));
	return this.uploadErrored({isRecoverable: false, shortDescription: "Invalid server response"});
}

_badFileUpload: function(data) {
	// used when the SWFUploader adds a file, but that file is missing essential content
	// I expect this never to fire, but better to be secure than sorry
	// notify the console of the error, then render the error view
	// we can't recover, since SWFUpload doesn't requeue on file errors
	debug("Bad file upload! " + (data ? showSource(data) : "null!"));
	return this.uploadErrored({isRecoverable: false, shortDescription: "Problem uploading file!"});	
}

// default language, and all text strings
MealImageManager._DEFAULT_LANGUAGE = "en";
MealImageManager._

/* JAML TEMPLATES */
// since these are required in the MealImageManager class for view work, they're stored here
// not really MVC, but this is Javascript
// http://github.com/edspencer/jaml
MealImageManager._

MealImageManager._

/* SOURCE ANALYSIS */

// define a source function to smooth over toSource not being universally available
// should eventually live in my globals file
if (typeof showSource === "undefined") {
	showSource = function(object) {
		// use toSource when supported
		// conveniently this throws an error for null just as toSource woulds
		return object.toSource ? object.toSource() : (object.toString ? object.toString() : "[unable to show object source]")
	}
}

// define some specific source functions
if (!MealImageManager.toSource)
	MealImageManager.toSource = function() { return "Meal Image Class" };
if (!MealImageManager.prototype.toSource)
	toSource: function() { return "Meal Image instance " + this.getLocalID() };
