RD.Forms = {
	// this function makes the page aware of forms on the page
	// among other things, it adds a submit handler that disables the global dirty check
	// list of forms on page
	forms: [],
	
	scanPage: function() {
		// register every form on the page
		RD.debug("Scanning the page for forms.");

		$("form").each(function() {
			RD.Forms.register(this);
		})
	},

	// this function scans a form for placeholders and required fields
	scanForm: function(form) {
		form = $(form);
		
		// for each element required, enforce the requirement
		form.find("input[required], textarea[required]").each(this.enableRequired);

		// for each element with a placeholder set, initialize the placeholder
		form.find("input[placeholder], textarea[placeholder]").each(this.enablePlaceholder)

	},
	
	register: function(formNode) {
		// make sure the form has an ID
		var formArray  = this.forms;
		formNode = $(formNode);

		// if we haven't already stored the form, register it
		if (formArray.indexOf(formNode) === -1) {
			// connect and store it
			this.forms.push(formNode);

			// add the submission event handler so we can submit the form
			formNode.bind("submit", RD.Page.allowIntentionalExit);

			// finally, listen for form validation
			formNode.bind("formValidated", $.proxy(this.handleFormValidation, formNode));
			
			// now scan the form for any placeholders and required fields
			this.scanForm(formNode);
		}
	},

	handleFormValidation: function(validationResult) {
		// if the form is successfully validated, we do nothing -- just let it go
		var that = this, i, goodFields = validationResult.validFields || [], badFields = validationResult.invalidFields || [];
		if (!validationResult.result) {
			// but if it's not, we send it an event to tell it it failed
			// this is somewhat duplicative with the validation event
			// but other functions may also cancel submission and should be able to use the same event

			// we use a timeout to let any other submithandlers finish first
			// (necessary because placeholder has its own submit listener, which otherwise gets called after this)
			setTimeout(function() { that.trigger("submitfailed"); }, 0)
			
			// restart the page exit warning
			RD.Page.cancelIntentionalExit()
			
			for (var i = 0; i < goodFields.length; i++) {
          goodFields[i].removeClass(this.invalidFieldClass);
      }

      // default for bad fields: add invalid class and pulse out yellow slowly
      for (var i = 0; i < badFields.length; i++) {
          badFields[i].addClass(this.invalidFieldClass).effect("highlight", {color: "#FF0"}, 3000)
      }
		}
	},

	enableRequired: function() {
		var requiredInput = $(this), requirement = requiredInput.attr("required"), method;
		if (requirement) {
			// look for a matching function
			// by tracing the .'s in the attribute string, we let any function be specified without having to use eval
			method = window;
			requirement = requirement.split(".");
			for (var j = 0; j < requirement.length; j++) {
				method = method[requirement[j]];
				if (method) {
					// we're tracing through the object chain
					continue;
				}
				else {
					// we've hit a dead end -- the requirement field did not describe a function
					method = undefined;
					break;
				}
			}
		}
		
		requiredInput.requiredfield({validator: null});
	},
	
	enablePlaceholder: function() {
		var inputWithPlaceholder = $(this);
		inputWithPlaceholder.placeholder({placeholderText: inputWithPlaceholder.attr("placeholder")})
	},
	
	// class for invalid fields
	invalidFieldClass: "rd-invalidfield"
	
};