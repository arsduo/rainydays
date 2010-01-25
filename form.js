RD.Forms = {
  // this function makes the page aware of forms on the page
  // among other things, it adds a submit handler that disables the global dirty check
  register: (function() {
    // list of forms on page
    var forms = {};
    
    // private function
    function ensureID(formNode) {
      var id = formNode.attr("id");
      if (!id) {
        // generate an ID
        id = "form" + Math.floor(Math.random() * 100);
        // make sure it's unique
        if ($("#" + id).length > 0) {
          ensureID(formNode);
        }
        else {
          formNode.attr("id", id);
        }
      }
    }
    
    // return a function that registers the form and adds handlers to it
    return function(formNode) {
      // make sure the form has an ID
      formNode = $(formNode);
      ensureID(formNode);
      
      // if we haven't already stored the form, register it
      if (!forms[formNode.attr("id")]) {
        // create a new form class object
        var formObject = RD.createObject(RD.Forms._formPrototype);
        // store its DOM node
        formObject.node = formNode;
  
        // add it to the list
	      forms[formNode.attr("id")] = formObject;
      
  	    // add the submission event handler so we can submit the form
  	    formNode.bind("submit", RD.Page.allowIntentionalExit);

        // now scan the form for any placeholders and required fields
        formObject.scan();
      }
    }	    
  })(),
  
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

    debug("Done!");
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
        //formObject.registerRequiredField(this);
      }
        
      // for each element with a placeholder set, initialize the placeholder
      this.node.find("input[placeholder]").each(enablePlaceholder);
      this.node.find("textarea[placeholder]").each(enablePlaceholder);
    
      // for each element required, enforce the requirement
      this.node.find("input[required]").each(enableRequired);
    },

    registerPlaceholder: (function() {
      var eventNamespace = ".rd_placeholder";
      
      return function(node, placeholderText) {
   	    // first, get the actual node 
  	    if (typeof(node) === "string"){
  	      node = "#" + node;
  	    }
  	    node = $(node);
	    
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
  	      if (node.val().replace(/[\ \n\t]*/, "") === "") {
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
    })()
  }
}