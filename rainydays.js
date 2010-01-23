/* RainyDays Object and Page Manager Class */

/* 
RainyDays object
Namespace for other classes and container for modules.
*/
var RainyDays = RD = {
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

  	addModule: function(target, recipient) {
      // run the jQuery extend method but box this up 
  	  $.extend(true, target, recipient);
  	}
	},
	
	// some methods very commonly used
	showSource: function(object) {
  	// use toSource when supported
  	// conveniently this throws an error for null just as toSource woulds
  	return object.toSource ? object.toSource() : (object.toString ? object.toString() : "[unable to show object source]")
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
  })()
};

