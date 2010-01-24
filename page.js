/* 
Mealstrom.Page class
Handles global browser and page management tasks:
- page dirty/clean status
- registering and unregistering global events

Built according to the Javascript: The Good Parts paradigm.
*/

RD.Page = (function() {
	/************************************************
 	 * PRIVATE CLASS VARIABLES                      *
   ************************************************/
	// internals holder
	var internals = {};

	// list of dirty fields
	// allows us to push/remove specific fields 
	internals.dirtyFields = [];

	internals.eventNamespace = ".rainydays";
	internals.bindingNode = $(window);
  internals.surpressExitDialog = false;

	/************************************************
 	 * PRIVATE CLASS FUNCTIONS                      *
   ************************************************/
	
	// get a standard field name from anything we might be passed
	function getFieldFromParameter(fieldParam) {
		// if we're passed a jQuery object or a DOM node, get its ID
		if (typeof field == "object") {
			fieldParam = (typeof field.attr === "function" ? field.attr("id") : field.id);
		}
		return fieldParam;
	}
	
	/************************************************
 	 * PUBLIC CLASS FUNCTIONS                       *
   ************************************************/ 	
	/* dirty status */
	function isPageDirty(){
		return internals.dirtyFields.length > 0;
	}
	
	function numberOfDirtyFields() {
		return internals.dirtyFields.length;
	}
	
	function addDirtyField(field) {
		field = getFieldFromParameter(field);
		// if we don't have a valid field, return false
		if (!field) return false;
		
		// return if we've already added it to the array
		if (internals.dirtyFields.indexOf(field) > -1) return true;
		
		// otherwise, add it
		internals.dirtyFields.push(field);
	}
	
	// check if a field is dirty
	function isFieldDirty(field) {
		field = getFieldFromParameter(field);
		
		if (internals.dirtyFields.indexOf(field) > -1) {
			return true;
		}
		
		return false;
	}
	
	function removeDirtyField(field) {
		field = getFieldFromParameter(field);
		// if we don't have a valid field, return false
		if (!field) return false;
		
		// return if it's not in the array
		var index = internals.dirtyFields.indexOf(field);
		if (index === -1) return true;
		
		// otherwise, remove it from the array
		internals.dirtyFields.splice(index, 1);
	}
	
	function alertForDirtyPage(e) {
		// if the page is dirty, fires an alert to make sure the user intends to leave
		if (isPageDirty() && !internals.surpressExitDialog) {
		  var e = e || window.event;
		  // For IE and Firefox
		  if (e) {
		    e.returnValue = pageManagerObject.text("page_dirty_confirmation");
		  }

		  // For Safari
		  return pageManagerObject.text("page_dirty_confirmation");
		}	
	};
	
	// stops the beforeunload dialog from displaying
	// what happens if submission fails, though?
	function allowIntentionalExit() {
	  internals.surpressExitDialog = true;
	}
	
	function cancelIntentionalExit() {
	  internals.surpressExitDialog = false;
	}
	
	
	/************************************************
 	 * PACKAGE AND INITIALIZE THE OBJECT            *
   ************************************************/
	var pageManagerObject = {
 	  // text we might use
   	TEXT: {
   		en: {
   			page_dirty_confirmation: "You have unsaved changes on this page.\n\Do you want to abandon your work?"
   		}
   	},
   	// page dirty/clean status
   	isPageDirty: isPageDirty,
   	numberOfDirtyFields: numberOfDirtyFields,
   	addDirtyField: addDirtyField,
   	isFieldDirty: isFieldDirty,
   	removeDirtyField: removeDirtyField,
   	alertForDirtyPage: alertForDirtyPage,
   	allowIntentionalExit: allowIntentionalExit,
   	cancelIntentionalExit: cancelIntentionalExit
 	};
	

 	// add language support
 	RD.debug("Adding language to page manager.")
 	RD.Utils.addLanguageSupport(pageManagerObject);
	
	// tasks to run when the page is loaded
	function onReadyTasks() {
  	// bind the dirty page alert to window onunload
  	// use the global object rather than private internals so it can be tested
  	$(window).bind("beforeunload" + internals.eventNamespace, function(event) { RD.Page.alertForDirtyPage(event) });

    // initialize any forms
    //RD.Forms.scanPage();	  
	}
	$(document).ready(onReadyTasks);
	


	/************************************************
 	 * RETURNING THE OBJECT                         *
   ************************************************/
	
	// finally, return our object
	return pageManagerObject;	
})(); // execute immediately, creating our singleton object