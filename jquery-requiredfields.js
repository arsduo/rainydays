$.widget("ui.requiredfields", {
	_init: function() {
		var type, validator, requiredFields, element = this.element, form = element.form;
		
		// make sure this is an input element in a form
		type = element.tagName;
		if (type !== "SELECT" && type !== "INPUT" && type !== "textarea" || !form) {
			// nothing to do
			return;
		}

		// ensure this has a validator
		// we proxy the validation function to the element to provide a consistent and reasonable "this"
		// and also to protect against redefinition of global functions
		validator = this.options.validator;
		if (typeof(validator) !== "function") {
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
	},
	
	// called when a form with required fields is submitted
	// runs the validation method on each field and returns the result
	// which will dis/allow the form submission
	_validateForm: function(event, ui) {
		var fields = $(this).data("requiredFields"), valid = true, i;
		if (fields) {
			for (i = 0; i < fields.length; i++) {
				// validate the field
				// this action triggers the isValid or isNotValid event on each field
				valid = valid && $(fields[i]).requiredfields("validate");
			}
		}
		
		return valid;
	},
	
	// validates the field by calling its validator 
	// also triggers an event based on valid status, which can be used to highlight/erase formatting, etc.
	validate: function(event) {
		var result = this.options.validator(event), callbackResult;
		callbackResult = result ? this._trigger("foundValid", event) : this._trigger("foundInvalid", event) 

		// currently, we don't use callbackResult, but maybe we should
		return result;
	},


	// default validation used when no validation function is supplied
	_defaultValidator: function(event) {
		// validates that a field is 
		var value;
		if (this.type !== checkbox) {
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
	}
	
	options: {
	}
});

