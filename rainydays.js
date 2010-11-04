/* 
Rainydays object
Namespace for other classes and container for key utilities.
*/
var Rainydays = RD = {
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