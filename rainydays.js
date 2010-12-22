/*
Rainydays object
Namespace for other classes and container for key utilities.
*/
var RD = {
	// track the jQuery object
	jQuery: jQuery,

	// namespacing for jQuery events
	eventNamespace: ".rainydays",

	// some very common methods
	showSource: function(object) {
    	// use toSource when supported
    	// conveniently this throws an error for null just as toSource woulds
    	return object.toSource ? object.toSource() : (object.toString ? object.toString() : "[unable to show object source]")
    },

    // determine once whether we can use console.log, and go with it
    debug: (function() {
        var debugFunction;

        try {
            console.log("Setting debug function.");
            debugFunction = function() { console.log.apply(console, arguments) };
        }
        catch (ex) {
            debugFunction = function() {};
        }

        return debugFunction;
    }()),

    createObject: (function() {
        // use native Object.create if available
        if (typeof(Object.create) === "function") {
            return Object.create;
        }
        else {
            return function(object) {
                var F = function() {};
                F.prototype = object;
                return new F();
            }
        }
    }())
}

/*
Mealstrom.Page class
Handles managing page dirty/clean status to prevent users from accidentally leaving a dirty page.

Built according to the Javascript: The Good Parts paradigm.
*/
RD.Page = (function() {
	/************************************************
 	 * PRIVATE CLASS VARIABLES                      *
   ************************************************/
	// list of dirty fields
	// allows us to push/remove specific fields
	var dirtyFields = [];
	// whether we're allowing for exit now
    var surpressExitDialog = false;

	/************************************************
 	 * PRIVATE CLASS FUNCTIONS                      *
   ************************************************/

	// get a standard field name from anything we might be passed
	function getIDFromParameter(field) {
		// if we're passed a jQuery object or a DOM node, get its ID
		// if a string, just return it
		if (field && typeof field == "object") {
			field = (typeof field.attr === "function" ? field.attr("id") : field.id);
		}
		return field;
	}

	/************************************************
 	 * PUBLIC CLASS FUNCTIONS                       *
   ************************************************/
	var pageManager = {
		/* manage dirty status */
		isPageDirty: function(){
			return dirtyFields.length > 0;
		},

		numberOfDirtyFields: function() {
			return dirtyFields.length;
		},

		getDirtyFields: function() {
			return ([]).concat(dirtyFields);
		},

		addDirtyField: function(field) {
			// add the field if it's valid and not already in the index
			field = getIDFromParameter(field);
			if (field && dirtyFields.indexOf(field) === -1) {
				dirtyFields.push(field);
			}
		},

		isFieldDirty: function(field) {
			return (dirtyFields.indexOf(getIDFromParameter(field)) > -1);
		},

		removeDirtyField: function(field) {
			// if it's in the list, remove it; if not, do nothing
			var fieldID = getIDFromParameter(field), index = dirtyFields.indexOf(fieldID);
			if (index > -1) {
				dirtyFields.splice(index, 1);
			}
		},

		/* browser interaction/exit management */

		// default text for the alert
		text: "You have unsaved changes on this page.\n\Do you want to abandon your work?",
		// you can set this to a function that takes a list of IDs
		// if you want to compose a more elaborate text
		composeText: null,

		isIntentionalExitActivated: function() {
			return surpressExitDialog;
		},

		allowIntentionalExit: function() {
		  surpressExitDialog = true;
		},

		cancelIntentionalExit: function() {
		  surpressExitDialog = false;
		},

		// this function gets bound to beforeunload to fire the dialog
		alertForDirtyPage: function(e) {
			// if the page is dirty, fires an alert to make sure the user intends to leave
			if (RD.Page.isPageDirty() && !surpressExitDialog) {
			  var text = typeof(RD.Page.composeText) === "function" ? RD.Page.composeText(RD.Page.getDirtyFields()) : pageManager.text;
			
			  var e = e || window.event;
			  if (e) { // For IE and Firefox
			    e.returnValue = text;
			  }

			  // For Safari
			  return text;
			}
		},


		/* initialization */
		initialize: function() {
			// tasks to run when the page is loaded
			// we expose this to allow users whose jQuery variable isn't available under jQuery to still use this
			var jQuery = RD.jQuery;
			jQuery(document).ready(function() {
			  	// bind the dirty page alert to window beforeunload
				jQuery(window).bind("beforeunload" + RD.eventNamespace, function(event) {
				  	// use the global object rather than private internals so it can be tested
					RD.Page.alertForDirtyPage(event)
				});
			});
		}
	}

	/************************************************
 	 * RETURN                                       *
     ************************************************/

	// finally, return our public interface
	return pageManager;
	// execute immediately, creating our singleton object
}())

/*
RainyDays core extensions
Adjusting IE to meet our needs.
*/
// ensure indexOf compatibility -- taken directly from Mozilla's MDC site
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(elt /*, from*/) {
        var len = this.length >>> 0;

        var from = Number(arguments[1]) || 0;
        from = (from < 0) ? Math.ceil(from) : Math.floor(from);
        if (from < 0) {
            from += len;
        }

        for (; from < len; from++) {
            if (from in this && this[from] === elt) {
                return from;
            }
        }
        return -1;
    };
}