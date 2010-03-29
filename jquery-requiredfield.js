$.widget("ui.requiredfield", {
	_init: function() {
		var type, validator, requiredFields, element = this.element, form = element.attr("form");
		
		// make sure this is an input element in a form
		type = element.attr("tagName");
		if ((type !== "SELECT" && type !== "INPUT" && type !== "textarea") || !form) {
			// nothing to do
			console.log("Rejected type! " + type);
			return;
		}

		// ensure this has a validator
		// we proxy the validation function to the element to provide a consistent and reasonable "this"
		// and also to protect against redefinition of global functions
		validator = this.options.validator;
		if (typeof(validator) !== "function") {
			console.log("Using default validator.");
			validator = this._defaultValidator;
		}
		this.options.validator = $.proxy(validator, element);
		
		// get any previously required elements for this form
		requiredFields = $(form).data("requiredFields") || [];

		// our first required field, so bind our handler onto the form's submit event 
		if (requiredFields.length === 0) {
			$(form).submit(this._validateForm);
		}
		
		// finally, add this element to the form's list of required fields
		if (requiredFields.indexOf(element) === -1) {
			requiredFields.push(element);
			$(form).data("requiredFields", requiredFields);
		}
		console.log("Validation done.");
	},
	
	// called when a form with required fields is submitted
	// runs the validation method on each field and returns the result
	// which will dis/allow the form submission
	_validateForm: function(event, ui) {
		var form = $(this), fields = form.data("requiredFields"), valid = true, i, currentField, fieldResult, validFields = [], invalidFields = [];
		console.log("Found " + fields);
		if (fields) {
			for (i = 0; i < fields.length; i++) {
				currentField = $(fields[i]);
				// tell the field it's being submitted, so that it can prepare itself (e.g. clear placeholders)
				currentField.trigger("beforesubmit");
				
				// validate the field
				// this action triggers the isValid or isNotValid event on each field
				console.log("Validating.");
				fieldResult = currentField.requiredfield("validate");
				console.log("Result: " + fieldResult);
				valid = valid && fieldResult;

				// add the element to the appropriate array
				(fieldResult ? validFields : invalidFields).push(fields[i]);
			}
		}
		console.log("final result: " + valid);
		
		// fire a form-level custom event to handle the whole validation
		// useful if, for instance, you want to show a high-level message or a dialog box
		console.log("Triggering validation event.");
		// this isn't bound to the widget, so we can't use this._formEventName
		form.trigger("formValidated", {result: valid, validFields: validFields, invalidFields: invalidFields});
		
		return valid;
	},
	
	testing: function() { 
		console.log("test");
	},
	
	// validates the field by calling its validator 
	// also triggers an event based on valid status, which can be used to highlight/erase formatting, etc.
	validate: function(event) {
		var result;
		console.log("Validating " + this.element.attr("id"));
		if (!this.options.disabled) {
			result = this.options.validator(event);
			// currently, we don't use callbackResult, but maybe we should
			callbackResult = this._trigger((result ? "foundValid" : "foundInvalid"), event); 
		}
		else {
			// disabled, so always return true
			result = true;
		}
		console.log("Validator result: " + result.toSource())
		return result;
	},


	// default validation used when no validation function is supplied
	_defaultValidator: function(event) {
		// validates that a field is 
		var value;
		console.log("Default validator firing!");
		if (this.type !== "checkbox") {
			// if it's not a checkbox, just see if it has a non-empty value
			value = $(this).value;
			if (!value || value.match(/^[\ \t]*$/)) {
				return false;
			}
			else {
				return true;
			}
		}
		else {
			// is the checkbox checked?
			if (!this.checked) {
				return false;
			}
			else {
				return true;
			}
		}
	},
	
	_formEventName: "formValidated",

	destroy: function() {
		// now do other stuff particular to this widget
		console.log("Destroying");
		var form = $(this.element.attr("form")), requiredFields = form.data("requiredFields"), index = requiredFields.indexOf(this.element[0]);
		if (index > -1) {
			requiredFields.splice(index, 1);
			form.data("requiredFields", requiredFields);
		}
		if (requiredFields.length === 0) {
			// if we hvae no more required fields, unbind the event
			form.unbind(this._formEventName);
		}

		// default destroy
		$.Widget.prototype.destroy.call( this );
	}
});
