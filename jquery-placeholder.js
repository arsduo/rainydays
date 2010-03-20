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
			this._setClearOnSubmit();
		}
		
		// now trigger it, so the default state is right
		this._outFocus();
	},
	
	_setClearOnSubmit: function() {
		var nearestForm = this.element.closest("form");
		if (nearestForm.length > 0) {
			// make this an anonymous event specific to this instsance
			var clearFn = $.proxy(function() { this._inFocus() }, this);
			
			$.data(this.element, "onSubmitFunction", clearFn);
			// tell the nearest form to clear this on submission
			nearestForm.bind("submit" + this.options.eventNamespace, clearFn);
		}
	},
	
	_removeClearOnSubmit: function() {
		var nearestForm = this.element.closest("form");
		if (nearestForm.length > 0) {
			var clearFn = $.data(this.element, "onSubmitFunction");
			if (clearFn) {
				nearestForm.bind("submit" + this.options.eventNamespace, clearFn);
			}
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
		this._outFocus();
		// then disable it (if order were reversed, outfocus would do nothing)
		return this._setOption( "disabled", true );
	},
	
	enable: function() {
		return this._setOption( "disabled", false );
		// call infocus to add placeholder text if appropriate
		this._inFocus();
	},

	destroy: function() {
		// now do other stuff particular to this widget
		// unbind events
		this._unbindPlaceholder();
		
		// remove clear on submit
		this._removeClearOnSubmit();
		
		// default destroy
		$.Widget.prototype.destroy.call( this );
	},
	
	getter: "placeholderText placeholderClass"

});