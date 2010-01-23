RD.Forms = {
  // this function makes the page aware of forms on the page
  // among other things, it adds a submit handler that disables the global dirty check
  register: (function() {
    // list of forms on page
    var forms = {};
    
    // return a function that registers the form and adds handlers to it
    return function(formNode) {
      formNode = $(formNode);
      
      if (!forms.indexOf(formNode)) {
	      // add it to the list
	      
	      // to do so, make sure it has an ID
	      var id = formNode.attr("id");
	      if (!id) {
	        // generate an ID
	        id = "form" + Math.floor(Math.random() * 100);
          // make sure it's unique
	        while ($("#" + id).length > 0) {
	          id = "form" + Math.floor(Math.random() * 100);
	        }
	        formNode.attr("id", id);
	      }
	      // store it
	      forms[id] = formNode;
      
	      // add the submission event handler so we can submit the form
	      formNode.bind("submit", RD.Page.allowIntentionalExit);

        // now scan internally for any placeholders and required fields
      }
    }	    
  })(),
  
	addPlaceholder: (function() {
	  var placeholderClass = "placeholder";
	  var eventNamespace = ".placeholder";
	  
	  return (function(node, placeholderText) {
	    // first, get the actual node 
	    if (typeof(node) === "string"){
	      node = "#" + node;
	    }
	    node = $(node);
	    
	    debug("Enabling placeholder for node " + node.attr("id"));
	    
	    // don't do anything if we don't have a node or text, but don't continue either
	    if (node.length === 0 || placeholderText.length === 0) {
	      debug("Found no node for addPlaceholder!")
	      return false;
	    }

	    // bind our functions to it
      // when the user focuses, clear the text area if the value === placeholderText
	    var onInFocus = function() {
	      // don't use this keyword, since we don't have to
	      
	      // act if the node's value is the placeholder
	      if (node.val() === placeholderText) {
          // clear the placeholder text and remove the placeholder class
	        node.val("").removeClass(placeholderClass);
	      }
	    }
	    
	    var onOutFocus = function() {
	      // don't use this keyword, since we don't have to

        // act if the node contains nothing but white space
	      if (node.val().replace(/[\ \n\t]*/, "") === "") {
          // add the placeholder text and remove the placeholder class
	        node.val(placeholderText).addClass(placeholderClass);
	      }		      
	    }
	    
	    // now, bind to the node
      node.bind("focus" + eventNamespace, onInFocus);
      node.bind("blur" + eventNamespace, onOutFocus);

      // trigger focus to get things started properly
      onOutFocus();

	    // now, tell any form involved to clean up placeholders before submitting
	    var form = node.closest("form");
	    if (form) {
        // tell it to fire onInFocus when it starts
        form.bind("submit", onInFocus);
	    }
	    
	    debug("Done!");
	  })
	})()
}