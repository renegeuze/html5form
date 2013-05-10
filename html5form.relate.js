/**
 *  Form Relationship Plugin - jQuery plugin
 *  Version 0.21
 * 
 * Built for the jQuery library
 * http://jquery.com
 * 
 * Plugin allows you to easily add smart relations between form fields and other elements
 * 
 *
 */

(function($){
	$.fn.relate = function(options) {
		// Uncomment string below during testing
		"use strict";
		var tmp = {},
		// Default configuration properties
			defaults = {
				scoreRequired: 1,
				scoreOnTrue: 1,
				scoreOnFalse: 0,
				globalScope: true,
				debug: false
			},
			callbacks = {
				oninitialize:  function() {},// Runs once per form
				onfinish:      function() {} // Runs once after no errors
			},
			opts = $.extend(
					{},
					defaults,
					callbacks,
					options
			);
		// Force debug false on sucky browsers
		if(typeof console  === 'undefined' || typeof console.info  === 'undefined') {
			opts.debug = false;
		}
		// Our debug output
		function debug(str) {
			if(opts.debug === true) {
				console.info(str);
			}
		}
		// Helper function to determine object size
		function objSize(obj) {
			var size = 0, key;
			for (key in obj) {
				if (obj.hasOwnProperty(key)) size++;
			}
			return size;
		}
		
		// Update per element
		// Easier would be to always loop over everything, but I assume this is faster
		function update(form) {
			var related,
			    currentScore = 0,
			    scoreOnTrue = 1,
			    scoreOnFalse = 0;
			
			// Reset score
			$('[data-currentscore]').removeAttr('data-currentscore');
			// Loop all possible smart elements
			$('select[data-relate], select:has(option[data-relate]), input[data-relate], textarea[data-relate]', form).each(function() {
				if($(this).is('select')){
					$('option', this).each(function() {
						// Find relation
						related = $(this).attr('data-relate');
						// If no relation, no points to anything
						if(!related ||related.length < 2) {
							return true;
						}
						// Maybe the element has a higher scoreOnTrue set
						scoreOnTrue = $(this).filter('[data-scoreontrue]').length > 0 ? $(this).attr('data-scoreontrue') * 1 : opts.scoreOnTrue;
						scoreOnFalse = $(this).filter('[data-scoreonfalse]').length > 0 ? $(this).attr('data-scoreonfalse') * 1 : opts.scoreOnFalse;
						if($(this).is(':selected')){
							$(related).each(function() {
								currentScore = $(this).filter('[data-currentscore]').length > 0 ? $(this).attr('data-currentscore') * 1 : 0;
								$(this).attr('data-currentscore', currentScore + scoreOnTrue);
							});
						} else {
							$(related).each(function() {
								currentScore = $(this).filter('[data-currentscore]').length > 0 ? $(this).attr('data-currentscore') * 1 : 0;
								$(this).attr('data-currentscore', currentScore - scoreOnFalse);
							});
						}
					});
				} else {
					// Find relation
					related = $(this).attr('data-relate');
					// If no relation, no points to anything
					if(!related ||related.length < 2) {
						return true;
					}
					// Maybe the element has a higher scoreOnTrue set
					scoreOnTrue = $(this).filter('[data-scoreontrue]').length > 0  ? $(this).attr('data-scoreontrue') * 1 : opts.scoreOnTrue;
					scoreOnFalse = $(this).filter('[data-scoreonfalse]').length > 0  ? $(this).attr('data-scoreonfalse') * 1 : opts.scoreOnFalse;
					if($(this).is('input:radio') || $(this).is('input:checkbox')){
						if($(this).is(':checked')){
							$(related).each(function() {
								currentScore = $(this).filter('[data-currentscore]').length > 0 ? $(this).attr('data-currentscore') * 1 : 0;
								$(this).attr('data-currentscore', currentScore + scoreOnTrue);
							});
						} else {
							$(related).each(function() {
								currentScore = $(this).filter('[data-currentscore]').length > 0 ? $(this).attr('data-currentscore') * 1 : 0;
								$(this).attr('data-currentscore', currentScore + scoreOnFalse);
							});
						}
					} else if($(this).val() !== '' && $(this).val() != $(this).attr('placeholder')){
						$(related).each(function() {
							currentScore = $(this).filter('[data-currentscore]').length > 0 ? $(this).attr('data-currentscore') * 1 : 0;
							$(this).attr('data-currentscore', currentScore + scoreOnTrue);
						});
					} else {
						$(related).each(function() {
							currentScore = $(this).filter('[data-currentscore]').length > 0 ? $(this).attr('data-currentscore') * 1 : 0;
							$(this).attr('data-currentscore', currentScore + scoreOnFalse);
						});
					}
				}
			});
			// Finaly loop over all fields with some sort of score
			$('[data-currentscore]').each(function() {
				var scoreRequired = $(this).has('[data-scorerequired]') ? $(this).attr('data-scorerequired') * 1 : opts.scoreRequired;
				if($(this).attr('data-currentscore') * 1 >= scoreRequired * 1){
					$(this).show();
				} else {
					$(this).hide();
				}
			});
			
		}
		
		// Loop over all forms requested
		return this.each(function() {
			// Private properties
			var form = $(this);
			
			// Init / change / keyup(fixes some browsers on select)
			update(form);
			$('select[data-relate], select:has(option[data-relate]), input[data-relate], textarea[data-relate]')
			.on('change', function() {
				update(form);
			}).on('keyup', function() {
				update(form);
			});
		});
	}
})(jQuery);