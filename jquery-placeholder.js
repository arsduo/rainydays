/* 
Copyright 2010 Alex Koppel.
Part of the Rainydays project (http://github.com/arsduo/rainydays)
* Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
* and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
*/

$.widget("ui.placeholder", {
	options: {
			placeholderText: "Enter text here",
			placeholderClass: "ui-placeholder",
			eventNamespace: ".ui-placeholder",
			clearOnSubmit: true
	},
	
	_init: function() {
		// bind focus and blur to achieve the placeholder effect
		this._bindPlaceholder();
		// tell the nearest form to clear this on submission
		// so placeholder data isn't sent back to the server
		if (this.options.clearOnSubmit) {
			this._setSubmitHandlers();
		}
		
		// now trigger it, so the default state is right
		this._outFocus();
	},
	
	_setSubmitHandlers: function() {
		var element = this.element, form = $(this.element.attr("form")), clearFn, submitFailFn;
		if (form) {
			// make this an anonymous event specific to this instsance
			clearFn = $.proxy(this._inFocus, this);
			submitFailFn = $.proxy(this._outFocus, this);
			
			element.data("onSubmitFunction", clearFn);
			element.data("submitFailFunction", submitFailFn);

			// tell the nearest form to clear this on submission
			form.bind("submit" + this.options.eventNamespace, clearFn);
			// also listen to a submission failed event
			// which will restore the text (e.g. for unsatisfied required fields)
			form.bind("submitfailed.placeholder", submitFailFn);
			
			// also tell this element to listen to beforesubmit events
			// which can be triggered by other handlers to clear this element
			element.bind("beforesubmit.placeholder", clearFn);
		}
	},
	
	_removeSubmitHandlers: function() {
		var element = this.element, form = $(this.element.attr("form")), clearFn, submitFailFn;
		if (form) {
			clearFn = element.data("onSubmitFunction");
			submitFailFn = element.data("submitFailFunction");
			
			if (clearFn) {
				// unbind this from the form and from the element
				form.unbind("submit" + this.options.eventNamespace, clearFn);
				form.unbind("beforesubmit.placeholder", clearFn);
			}
			if (submitFailFn) {
				element.unbind("submitfailed.placeholder", submitFailFn)
			}
			
			element.data("onSubmitFunction", undefined);
			element.data("submitFailFunction", undefined);
		}		
	},
	
	_inFocus: function() {
		if (!this.options.disabled && this.element.val() === this.options.placeholderText) {
			// clear the placeholder text and remove the placeholder class
			this.element.val("").removeClass(this.options.placeholderClass);
		}
	},

	_outFocus: function() {
		// act if the node contains nothing but white space
		if (!this.options.disabled && (this.element.val().replace(/[\ \n\t]*/, "") === "" || this.element.val() === this.options.placeholderText)) {
			// add the placeholder text and remove the placeholder class
			this.element.val(this.options.placeholderText).addClass(this.options.placeholderClass);
		}
	},
	
	_bindPlaceholder: function() {		
		// define that node's specific bindings for being in and out of focus 
		this.element.bind("focus" + this.options.eventNamespace, $.proxy(this._inFocus, this));
		this.element.bind("blur" + this.options.eventNamespace, $.proxy(this._outFocus, this));	
	},

	_unbindPlaceholder: function() {
		// unbind all placeholder events
		this.element.unbind(this.options.eventNamespace);
	},
	

	disable: function() {
		// call outfocus to get rid of the class and any placeholder text
		this._inFocus();
		// then disable it (if order were reversed, outfocus would do nothing)
		// default disable
		$.Widget.prototype.disable.call( this );
	},
	
	enable: function() {
		// call infocus to add placeholder text if appropriate
		this._outFocus();
		// default enable
		$.Widget.prototype.enable.call( this );
	},

	destroy: function() {
		// now do other stuff particular to this widget
		// unbind events
		this._unbindPlaceholder();
		
		// remove clear on submit
		this._removeSubmitHandlers();
		
		// default destroy
		$.Widget.prototype.destroy.call( this );
	},
	
	getter: "placeholderText placeholderClass"

});