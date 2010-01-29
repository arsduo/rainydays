RD.Forms = {
  // this function makes the page aware of forms on the page
  // among other things, it adds a submit handler that disables the global dirty check
  // list of forms on page
    forms: {},

    register: function(formNode) {
      // make sure the form has an ID
      formNode = $(formNode);
      if (!formNode.attr("id")) {
          formNode.attr("id", RD.Utils.randomID());
      }
  
      // if we haven't already stored the form, register it
      if (!this.forms[formNode.attr("id")]) {
        // create a new form class object
        var formObject = RD.createObject(RD.Forms._formPrototype);
        // store its DOM node
        formObject.node = formNode;

        // add it to the list
        this.forms[formNode.attr("id")] = formObject;
  
        // add the required fields checker
        formNode.bind("submit", formObject.submissionCheck);
    
    	// add the submission event handler so we can submit the form
    	formNode.bind("submit", RD.Page.allowIntentionalExit);

        // give it management attributes for failed required fields
        RD.Utils.addEventManagement(formObject, "RequiredFields");
        // add default event handler
        formObject.handleRequiredFields(formObject.requiredFieldsProcessed);
    
        // now scan the form for any placeholders and required fields
        formObject.scan();
      }
    },
  
    // proxy function for adding placeholder
    // finds the appropriate form object, and tells it to register the placeholder
    addPlaceholder: function(node, placeholderText) {
        // add this to the appropriate form
        var containingFormNode = node.closest("form");
        if (containingFormNode.length > 0) {
          // make sure we have this form registered
          var containingFormObject = RD.Forms.getOrRegisterFormNode();
          containingFormObject.registerPlaceholder(node, placeholderText);
        }
    },
  
    scanPage: function() {
        // register every form on the page
        RD.debug("Scanning the page for forms.");

        $("form").each(function() {
            RD.Forms.register(this);
        })
    },
  
  // class used for placeholders
  placeholderClass: "rd-placeholder",
  
  // methods for each individual form
  _formPrototype: {
    // since arrays are passed by reference
    // there's no point in convolutedly hiding these lists
    // we want to avoid overly complex repeated closures
    placeholders: [],
    requiredFields: [],
    invalidFieldClass: "rd-invalidfield",
    
    // this function scans a form for placeholders and required fields
    scan: function() {
      // allow the form object to be used in the each functions
      var formObject = this;
      
      // create named functions, rather than anonymous ones
      // no easy way to avoid closures since we need to know the form object
      function enablePlaceholder() {
        inputWithPlaceholder = $(this);
        formObject.registerPlaceholder(inputWithPlaceholder, inputWithPlaceholder.attr("placeholder"));
      }
      
      function enableRequired() {
        requiredInput = $(this);
        formObject.registerRequiredField(requiredInput);
      }
        
      // for each element with a placeholder set, initialize the placeholder
      this.node.find("input[placeholder]").each(enablePlaceholder);
      this.node.find("textarea[placeholder]").each(enablePlaceholder);
    
      // for each element required, enforce the requirement
      this.node.find("input[required]").each(enableRequired);
      this.node.find("textarea[required]").each(enableRequired);
    },
    
    submissionCheck: function() {
        // check all required fields
        var allowSubmission = true;
        var goodFields = [], badFields = [];
        
        RD.debug("Checking on " + this.requiredFields.length + " fields.");  
        for (var i = 0; i < this.requiredFields.length; i++) {
            var field = this.requiredFields[i];
            var fieldIsValid = true;
            var requirement = field.attr("required");

            // make sure we're still required
            // allow the app to change that midway
            if (requirement) {
                // determine what method to use to check the requirement
                // we want to allow users to specify the name of a function
                // so RD.MyModule.foo would be valid, as would a global function bar
                requirement = requirement.split(".");
                var method = window;
                for (var j = 0; j < requirement.length; j++) {
                    method = method[requirement[j]];
                    if (method) {
                        // we're tracing through the object chain
                        continue;
                    }
                    else {
                        // we've hit a dead end -- the requirement field did not describe a function
                        break;
                    }
                }
                
                // now check whether it's valid
                if (method && typeof(method) === "function") {
                    RD.debug("Custom requirement")
                    fieldIsValid = method(field);
                }
                else {
                    // basic check: has a value !== any placeholder
                    RD.debug("Basic requirement")
                    fieldIsValid = field.val().length > 0 && field.val() !== field.attr("placeholder");
                }
                
                // and process accordingly
                allowSubmission = allowSubmission && fieldIsValid;
                (fieldIsValid ? goodFields : badFields).push(field);
                RD.debug("Field is valid: " + fieldIsValid)
            }
            else {
                RD.debug("Field no longer required.");
            }
        }
        
        // now trigger our event handlers, since we've done a validation check
        this.fireRequiredFields({goodFields: goodFields, badFields: badFields});
        
        return allowSubmission;
    },

    registerRequiredField: function(node) {
  	    // sanity check the node -- placeholder makes no sense for checkbox
  	    node = RD.nodify(node);
  	    if (node.attr("tagName") === "INPUT" && node.attr("type") === "checkbox") {
            RD.debug("WARNING: required field attribute set on a checkbox is ignored.");
  	    }
  	    else {
  	        // add it to the placeholder list
      	    if (this.requiredFields.indexOf(node) === -1) {
      	      this.requiredFields.push(node);
      	    }
        }
    },
    
    requiredFieldsProcessed: function(eventDetails, form) {
        var goodFields = eventDetails.goodFields, badFields = eventDetails.badFields;
        
        // default for good fields: remove the invalidFieldClass
        for (var i = 0; i < goodFields.length; i++) {
            goodFields[i].removeClass(this.invalidFieldClass);
        }
        
        // default for bad fields: add invalid class and pulse out yellow slowly
        for (var i = 0; i < badFields.length; i++) {
            badFields[i].addClass(this.invalidFieldClass).effect("highlight", {color: "#FF0"}, 3000)
        }
    },
    
    removeDefaultRequiredFieldsHandler: function() {
        this.abandonRequiredFields(this.requiredFieldsProcessed);
    },
    
    registerPlaceholder: (function() {
      var eventNamespace = ".rd_placeholder";
      
      return function(node, placeholderText) {
   	    // first, get the actual node 
  	    node = RD.nodify(node);
  	    
  	    // sanity check the node -- placeholder makes no sense for checkbox and radio
  	    if (node.attr("tagName") === "INPUT" && (node.attr("type") === "checkbox" || node.attr("type") === "radio")) {
            RD.debug("WARNING: placeholder set on radio buttons or checkboxes are ignored.");
  	    }
  	    else {
      	    // add it to the placeholder list
      	    if (this.placeholders.indexOf(node) === -1) {
      	      this.placeholders.push(node);
      	    }

      	    RD.debug("Enabling placeholder for node " + node.attr("id"));

      	    // don't do anything if we don't have a node or text, but don't continue either
      	    if (node.length === 0 || placeholderText.length === 0) {
      	      RD.debug("Found no node for addPlaceholder!")
      	      return false;
      	    }

      	    // define that node's specific bindings for being in and out of focus 
      	    function onInFocus() {
      	      // act if the node's value is the placeholder
      	      if (node.val() === placeholderText) {
                // clear the placeholder text and remove the placeholder class
      	        node.val("").removeClass(RD.Forms.placeholderClass);
      	      }
      	    }

      	    function onOutFocus() {
              // act if the node contains nothing but white space
      	      if (node.val().replace(/[\ \n\t]*/, "") === "" || node.val() === placeholderText) {
                // add the placeholder text and remove the placeholder class
      	        node.val(placeholderText).addClass(RD.Forms.placeholderClass);
      	      }		      
      	    }

      	    // now, bind to the node
            node.bind("focus" + eventNamespace, onInFocus);
            node.bind("blur" + eventNamespace, onOutFocus);

            // bind our functions to it
            // when the user focuses, clear the text area if the value === placeholderText

            // trigger focus to get things started properly
            onOutFocus();
        }
      }
    })()
  }
}