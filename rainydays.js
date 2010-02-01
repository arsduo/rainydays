/* 
Rainydays object
Namespace for other classes and container for key utilities.
*/
var Rainydays = RD = {
	Utils: {
		addLanguageSupport: (function() {
			// define the methods to be added to the prototype
			var DEFAULT_TONGUE = "en";
		  
		  function getTongue() {
				return (RD.tongue ? RD.tongue : DEFAULT_TONGUE);
			}

		  var languageModule = {
		    text: function(key) {
		      corpus = this.TEXT[getTongue()];
					if (corpus && corpus[key]) {
						return corpus[key];
					}
					else {
						// we know TEXT[DEFAULT_LANGUAGE] exists because we checked for when language was applied
						return this.TEXT[DEFAULT_TONGUE][key];
					}
				}
		  }
		
			return function(recipient) {
				// language module -- adds language info to other objects		

				// validate it has a text object
				if (!recipient.TEXT) {
					throw("Module addLanguageSupport called for an object without TEXT hash!");
				}
				// and that it supports, at minimum, the default language
				if (!recipient.TEXT[DEFAULT_TONGUE]) {
					throw("Module addLanguageSupport called for an object without TEXT info for the default language!");			
				}

				// finally, add our methods to class prototype
                RD.Utils.addModule(recipient, languageModule);
			}
		})(),

        addEventManagement: function(recipient, eventName) {
          // allows an object to manage a specific event (subscriptions, publishing, etc.)
          // can be called multiple times on the same object
          RD.debug("Adding " + eventName + " handlers to an object.");
      
          // first, validate the event name
          if (eventName.match(/\W/)) {
            // if isn't a valid Javascript name, throw an error
            throw({name: "ArgumentError", message: "Event name " + eventName + " is not valid!  Can only be alphanumeric and _!"});
          }
      
          // set up the listeners
          var listeners = [];
      
          // give an add handler event
          recipient["handle" + eventName] = function(fn) {
            if ($.isFunction(fn) && listeners.indexOf(fn) === -1) {
              listeners.push(fn);
            }
          }
      
          // give a remove handler event
          recipient["abandon" + eventName] = function(fn) {
            var index = listeners.indexOf(fn);
            if (index > -1) {
              listeners.splice(index, -1);
            }
          }
      
          // mostly used for testing, but might be useful in other cases
          recipient["_removeAll" + eventName + "Handlers"] = function() {
            listeners = [];
          }
      
          // add a fire mechanism
          recipient["fire" + eventName] = function(eventData) {
            for (var i = 0; i < listeners.length; i++) {
              listeners[i](eventData, recipient);
            }
          }
        },

      	addModule: function(recipient, module) {
          // run the jQuery extend method but box this up 
      	  $.extend(true, recipient, module);
      	},
      	
      	randomID: function randomID() {
            id = "element" + Math.floor(Math.random() * 100);
            // make sure it's unique
            if ($("#" + id).length > 0) {
              randomID(formNode);
            }
            else {
              return id;
            }
        }
    },
	
	// some methods very commonly used
	showSource: function(object) {
    	// use toSource when supported
    	// conveniently this throws an error for null just as toSource woulds
    	return object.toSource ? object.toSource() : (object.toString ? object.toString() : "[unable to show object source]")
    },
  
    nodify: function(possibleNode) {
        if (typeof possibleNode === "string") {
            return $("#" + possibleNode);
        }
        else {
            return $(possibleNode);
        }
    },

    // determine once whether we can use console.log, and go with it
    debug: (function() {
        var debugFunction;

        try {
            if (console)
            console.log("Setting debug function.");
            debugFunction = function(string) { console.log(string) };
        }
        catch (ex) {
            debugFunction = function() {};
        }

        return debugFunction;
    })(),

    createObject: function(object) {
        var F = function() {};
        F.prototype = object;
        return new F();
    }
};

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