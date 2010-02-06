/*
 * jQuery UI Autocomplete 1.8rc1
 *
 * Copyright (c) 2010 AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://docs.jquery.com/UI/Autocomplete
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 */
(function( $ ) {

$.widget( "ui.autocompeteWithFilter", {
	options: {
		minLength: 1,
		delay: 300
	},
	_create: function() {
		var self = this;
		this.element
			.addClass( "ui-autocomplete" )
			.attr( "autocomplete", "off" )
			// TODO verify these actually work as intended
			.attr({
				role: "textbox",
				"aria-autocomplete": "list",
				"aria-haspopup": "true"
			})
			.bind( "keydown.autocomplete", function( event ) {
				var keyCode = $.ui.keyCode;
				switch( event.keyCode ) {
				case keyCode.PAGE_UP:
					self._move( "previousPage", event );
					break;
				case keyCode.PAGE_DOWN:
					self._move( "nextPage", event );
					break;
				case keyCode.UP:
					self._move( "previous", event );
					// prevent moving cursor to beginning of text field in some browsers
					event.preventDefault();
					break;
				case keyCode.DOWN:
					self._move( "next", event );
					// prevent moving cursor to end of text field in some browsers
					event.preventDefault();
					break;
				case keyCode.ENTER:
					// when menu is open or has focus
					if ( self.menu && self.menu.active ) {
						event.preventDefault();
					}
				case keyCode.TAB:
					if ( !self.menu || !self.menu.active ) {
						return;
					}
					self.menu.select();
					break;
				case keyCode.ESCAPE:
					self.element.val( self.term );
					self.close( event );
					break;
				case 16:
				case 17:
				case 18:
					// ignore metakeys (shift, ctrl, alt)
					break;
				default:
					// keypress is triggered before the input value is changed
					clearTimeout( self.searching );
					self.searching = setTimeout(function() {
						self.search( null, event );
					}, self.options.delay );
					break;
				}
			})
			.bind( "focus.autocomplete", function() {
				self.previous = self.element.val();
			})
			.bind( "blur.autocomplete", function( event ) {
				clearTimeout( self.searching );
				// clicks on the menu (or a button to trigger a search) will cause a blur event
				// TODO try to implement this without a timeout, see clearTimeout in search()
				self.closing = setTimeout(function() {
					self.close( event );
				}, 150 );
			});
		this._initSource();
		this.response = function() {
			return self._response.apply( self, arguments );
		};
	},

	destroy: function() {
		this.element
			.removeClass( "ui-autocomplete ui-widget ui-widget-content ui-corner-all" )
			.removeAttr( "autocomplete" )
			.removeAttr( "role" )
			.removeAttr( "aria-autocomplete" )
			.removeAttr( "aria-haspopup" );
		if ( this.menu ) {
			this.menu.element.remove();
		}
		$.Widget.prototype.destroy.call( this );
	},

	_setOption: function( key ) {
		$.Widget.prototype._setOption.apply( this, arguments );
		if ( key == "source" ) {
			this._initSource();
		}
	},

	_initSource: function() {
		if ( $.isArray(this.options.source) ) {
			var array = this.options.source;
			this.source = function( request, response ) {
				// check each potential source against all of the individual terms entered
				// by splitting the terms by spaces, we let "buz ald" and "ald buz" both match "buzz aldrin"
				var terms = request.term.split(" ");
				var matchers = [];
				for (var i = 0; i < terms.length; i++) {
					// escape regex characters
					matchers.push(new RegExp( $.ui.autocomplete.escapeRegex(terms[i]), "i" ))
				}
				
				var result = $.grep( array, function(value) {
    			var isMatch = true;
					for (var i = 0; i < matchers.length; i++) {
						//console.log("Testing value against " + terms[i] + ", result: " + matchers[i].test( value.value || value.label || value ))
						isMatch = isMatch && matchers[i].test( value.value || value.label || value );
					}
					console.log("Match for value " + value + " is " + isMatch);
					return isMatch;
				});
				console.log("Result has " + result.length + " elements.");
				
				// run the match
				response(result);
			};
		} else if ( typeof this.options.source == "string" ) {
			var url = this.options.source;
			this.source = function( request, response ) {
				$.getJSON( url, request, response );
			};
		} else {
			this.source = this.options.source;
		}
	},

	search: function( value, event ) {
		value = value != null ? value : this.element.val();
		if ( value.length < this.options.minLength ) {
			return this.close( event );
		}

		clearTimeout( this.closing );
		if ( this._trigger("search") === false ) {
			return;
		}

		return this._search( value );
	},

	_search: function( value ) {
		this.term = this.element
			.addClass( "ui-autocomplete-loading" )
			// always save the actual value, not the one passed as an argument
			.val();

		this.source( { term: value }, this.response );
	},

	_response: function( content ) {
		if ( content.length ) {
			content = this._normalize( content );
			// allow the site to act on the matches
		    // and interrupt the default action (displaying a list) if desired
		    // this allows activities like filtering in place 
			if (this._trigger( "open", null, {content: content}) !== false) {
    			this._suggest( content );
		    }
		    else {
		        this.close()
		    }
		} else {
			this.close();
		}
		this.element.removeClass( "ui-autocomplete-loading" );
	},

	close: function( event ) {
		clearTimeout( this.closing );
		if ( this.menu ) {
			this._trigger( "close", event );
			this.menu.element.remove();
			this.menu = null;
		}
		if ( this.previous != this.element.val() ) {
			this._trigger( "change", event );
		}
	},

	_normalize: function( items ) {
		// assume all items have the right format when the first item is complete
		if ( items.length && items[0].label && items[0].value ) {
			return items;
		}
		return $.map( items, function(item) {
			if ( typeof item == "string" ) {
				return {
					label: item,
					value: item
				};
			}
			return $.extend({
				label: item.label || item.value,
				value: item.value || item.label
			}, item );
		});
	},

	_suggest: function( items ) {
		if (this.menu) {
			this.menu.element.remove();
		}
		var self = this,
			ul = $( "<ul></ul>" ),
			parent = this.element.parent();

		$.each( items, function( index, item ) {
			$( "<li></li>" )
				.data( "item.autocomplete", item )
				.append( "<a>" + item.label + "</a>" )
				.appendTo( ul );
		});
		this.menu = ul
			.addClass( "ui-autocomplete-menu" )
			.appendTo( parent )
			.menu({
				focus: function( event, ui ) {
					var item = ui.item.data( "item.autocomplete" );
					if ( false !== self._trigger( "focus", null, { item: item } ) ) {
						// use value to match what will end up in the input
						self.element.val( item.value );
					}
				},
				selected: function( event, ui ) {
					var item = ui.item.data( "item.autocomplete" );
					if ( false !== self._trigger( "select", event, { item: item } ) ) {
						self.element.val( item.value );
					}
					self.close( event );
					self.previous = self.element.val();
					// only trigger when focus was lost (click on menu)
					if ( self.element[0] != document.activeElement ) {
						self.element.focus();
					}
				}
			})
			.zIndex( this.element.zIndex() + 1 )
			// workaround for jQuery bug #5781 http://dev.jquery.com/ticket/5781
			.css({ top: 0, left: 0 })
			.position({
				my: "left top",
				at: "left bottom",
				of: this.element
			})
			.data( "menu" );
		if ( ul.width() <= this.element.width() ) {
			ul.width( this.element.width() );
		}
		if ( $.fn.bgiframe ) {
			ul.bgiframe();
		}
	},

	_move: function( direction, event ) {
		if ( !this.menu ) {
			this.search( null, event );
			return;
		}
		if ( this.menu.first() && /^previous/.test(direction) ||
				this.menu.last() && /^next/.test(direction) ) {
			this.element.val( this.term );
			this.menu.deactivate();
			return;
		}
		this.menu[ direction ]();
	},

	widget: function() {
		// return empty jQuery object when menu isn't initialized yet
		return this.menu ? this.menu.element : $([]);
	}
});

$.extend( $.ui.autofilter, {
	escapeRegex: function( value ) {
		return value.replace( /([\^\$\(\)\[\]\{\}\*\.\+\?\|\\])/gi, "\\$1" );
	}
});

})( jQuery );
