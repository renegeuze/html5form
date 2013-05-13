/**
 * Html5 Form Plugin - jQuery plugin
 * Version 3a
 *  New structure,
 * 	removed modernizr usage,
 * 	removed languages I don't know and use
 * 
 *  
 * @Author: René Geuze http://geuze.name
 * 
 * Built for the jQuery library
 * http://jquery.com
 * 
 * Supports the following attributes:
 * autofocus
 * required
 * pattern
 * placeholder - Not on password and select
 * maxlength - textarea only
 * novalidate - this is a form attribute
 * min - number type only
 * max - number type only
 * 
 * Supports the following (new) types
 * email
 * number
 * date - needs datepicker
 * datetime - needs datepicker and timepicker
 * time - needs timepicker
 *
 * Uses the following plugins if installed
 * jquery.ui.datepicker
 * jquery.ui.timepicker
 *
 */

(function($) {
    "use strict";
    $.fn.html5form = function(options) {
        var tmp = {},
        	// Default configuration properties
            defaults = {
                async: false,
                method: false, 
                responseElement: null,
                labels: 'show',
                placeholderColor: '#a1a1a1', 
                action: false,
                language: 'en',
                emptyMessage: false,
                emailMessage: false,
                patternMessage: false,
                lengthMessage: false,
                allBrowsers: false,
                debug: false
            },
            response = {
                'en': {
                    'empty': 'The [title] field is required.',
                    'email': '[value] is not a valid email address.',
                    'pattern': 'Pattern missmatch on [title].',
                    'length': 'Prevented paste because of maximum field length'
                },
                'nl': {
                    'empty': '[title] is een verplicht veld.',
                    'email': '[value] is geen geldig e-mailadres.',
                    'pattern': '[title] bevat een ongeldige tekenreeks.',
                    'length': 'Plakken geblokkeerd wegens maximale veldgrootte'
                }
            },
            callbacks = {
                ajaxready:     function() {},// Runs when retrieving data on async
                oninitialize:  function() {},// Runs once per form
                onsubmit:      function() {},// Runs on submit action
                onerror:       function() {},// Runs on each error
                onerrors:      function() {},// Runs once for all errors
                onfinish:      function() {},// Runs once after no errors
                onajaxsuccess: function() {},// Runs once if form was sent(only async:true)
                onajaxerror:   function() {} // Runs once on failure(only async:true)
            },
            opts = $.extend(
                    {},
                    defaults,
                    callbacks,
                    options
            ),
            autoFocusHelper = $(':input[autofocus]').first().val(),
            dummyInput = document.createElement('input'),
            dummyForm = document.createElement('form'),
            dummyTextarea = document.createElement('textarea');
        
        // Force debug false on sucky browsers
        if (typeof window.console === 'undefined' || typeof window.console.info === 'undefined') {
            opts.debug = false;
        }
        // Our debug output
        function debug(str) {
            if (opts.debug === true) {
                window.console.info(str);
            }
        }
        // Helper function to determine object size
        function objSize(obj) {
            var size = 0, key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    size++;
                }
            }
            return size;
        }
        
        // Figure out what the correct message is for empty field and error field
        (function() {
            var types, len, i, a, b = 'Message';
            // Go to english if the chosen language does not exist
            if (typeof response[opts.language] !== 'object') {
                opts.language = 'en';
            }
            types = ['empty', 'email', 'pattern', 'length'];
            for (i = 0, len = types.length; i < len; i++) {
                a = types[i];
                if (opts[a + b] === false) {
                    opts[a + b] = response[opts.language][a] || response.en[a];
                }
            }
        })();
        
        // Allow some sort of bbcode in messages function
        function bbcode(string, element) {
            var $element = $(element),
                title = $element.attr('title'),
                $label = $('label[for="' + ($element.attr('id')) + '"]'),
                $parentText = $element.parent().text();
            
            // Replace title
            if (string.match('[title]') && title) {
                string = string.replace(/\[title\]/gim, title);
            } else if (string.match('[title]')) {
                string = string.replace(/\[title\]/gim, '[label]');
            }
            
            // Replace label
            if (string.match('[label]') && $label.length > 0 ) {
                string = string.replace(/\[label\]/gim, $('label[for="' + ($element.attr('id')) + '"]').get(0).innerHTML);
            } else if(string.match('[label]') && $parentText && $parentText.replace(/\s+/gim, ' ').length > 3) {
                string =  string.replace(/\[label\]/gim, $parentText.replace(/\s+/gim, ' '));
            } else if (string.match('[label]')) {
                string = string.replace(/\[label\]/gim, '[name]');
            }
            
            // Replace name
            if (string.match('[name]') && $element.attr('name')) {
                string = string.replace(/\[name\]/gim, $element.attr('name'));
            }
            
            // Replace value
            if (string.match('[value]')) {
                string = string.replace(/\[value\]/gim, $element.val());
            }
            
            return string;
        }
        
        // Responses
        function addResponse(string, element) {
            return $(opts.responseElement).append('<p>' + bbcode(string, element) + '</p>').find('p:last');
        }
        
        function testForm(form) {
            var emptyInput = {},
                emailError = {},
                patternError = {};
            
            debug('Testing form');
            
            // Clean up current responseElement
            $(opts.responseElement).html('');
            
            // Search for empty fields & value same as placeholder
            $(':input:visible[required], :input:visible[data-required]', form).each(function() {
                var $this = $(this),
                    name = $this.attr('name'),
                    value = $this.val();
                
                if (value === $this.attr('placeholder') || value === '') {
                    emptyInput[name] = value;
                    debug('Empty input error');
                    if (opts.onerror(this) === false){
                        return false;
                    }
                    // Show message
                    if (opts.emptyMessage !== false && opts.responseElement !== null){
                        addResponse(opts.emptyMessage, $this);
                    }
                }
            });
            
            // Check for pattern
            $(':input:visible[pattern]', form).each(function() {
                var $this = $(this),
                    name, value, pattern;
                
                name    = $this.attr('name');
                value   = $this.val();
                pattern = new RegExp($this.attr('pattern'));
                    
                if (!value.match(pattern)) {
                    patternError[name] = value;
                    debug('Pattern mismatch');
                    if (opts.onerror(this) === false) {
                        return false;
                    }
                    
                    // Show message
                    if (opts.patternMessage !== false && opts.responseDiv !== null) {
                        addResponse(opts.patternMessage, $this);
                    }
                }
            });
            
            // check email type inputs with regular expression
            $(':input:visible[type="email"]', form).each(function(index) {
                var $this = $(this),
                    name, value;
                
                name  = $this.attr('name');
                value = $this.val();
                
                // If empty, skip
                if (value === '' || value === this.defaultValue) {
                    return true;
                }
                
                if (value.search(/^.+@.+\.[\w]{2,7}$/i)) {
                    emailError[name] = value;
                    debug('Mail error');
                    if (opts.onerror(this) === false) {
                        return false;
                    }
                    // Show message
                    if (opts.emailMessage !== false && opts.responseElement !== null) {
                        addResponse(opts.emailMessage, $this);
                    }
                }
            });
            
            
            // Callback on any errors
            if (objSize(emptyInput) > 0 || objSize(emailError) > 0 || objSize(patternError) > 0) {
                opts.onerrors(this);
                return false;
            } else {
                return true;
            }
        }
        
        // Send form
        function sendForm(form) {
            var $form = $(form),
                input = $(':input:visible:not(:button, :submit, :radio, select)', form),
                url = opts.action,
                method = opts.method,
                formData;
            
            if (url === false) {
                url = $form.attr('action') || './';
            }
            if (method === false) {
                method = $form.attr('method') || 'get';
            }
            
            debug('Sending form');
            
            // Clear all empty value fields before Submit 
            $(input).each(function() {
                var $this = $(this);
                if ($this.val() === $this.attr('placeholder')) {
                    $this.val(this.defaultValue);
                }
            });
            
            // Submit data by Ajax
            if (opts.async === true) {
                formData = $form.serialize();
                $.ajax({
                    url  : action,
                    type : method,
                    data : formData,
                    success : function(data) {
                        opts.onajaxsuccess(this);
                        opts.ajaxready(data);
                        debug('Success sending');
                        //Reset form
                        form.reset();
                    },
                    error: function() {
                        opts.onajaxerror(this);
                        debug('Error sending');
                    }
                });
            } else {
                $form.submit();
            }
        }
        
        // Setup color & placeholder function
        function checkPlaceholder(input, action) {
            var type = input.attr('type');
            
            // No placeholder and colorchanging on checkbox, select, password and radio
            if (type === 'checkbox' || type === 'select' || type === 'radio' || type === 'password') {
                return false;
            }
            // Add placeholder on blur and start
            if (action === 'blur' || action === 'start') {
                // Do nothing if field has a value
                if (input.val() !== '') {
                    return false;
                }
                // Change color
                input.css('color', opts.placeholderColor);
                // Change value
                input.val(input.attr('placeholder'));
            } else if (action === 'focus'){
                if (input.val() === input.attr('placeholder')) {
                    input.val('');
                }
                input.css('color', input.attr('data-startcolor'));
            }
        }
        
        // Check if feature needs to be fixed or not. Using dumb or feature detection
        function fixThisOrNot(feature) {
            var result = true;
            // Always fix if allbrowsers is set to true.
            if (opts.allBrowsers === true) {
                debug('Forced to be fixed: ' + feature);
                result = true;
            }
            // Test input/textarea/form attributes
            else if (feature === 'placeholder' || feature === 'min' || feature === 'max' || feature === 'autofocus' ||
                    feature === 'required' || feature === 'pattern') {
                debug('Input attribute test: ' + feature);
                result = feature in dummyInput ? false : true;
            }
            else if (feature === 'novalidate') {
                debug('Form attribute test: ' + feature);
                result = feature in dummyForm ? false : true;
            }
            else if (feature === 'maxLength') {
                debug('Textarea attribute test: ' + feature);
                result = feature in dummyTextarea ? false : true;
            }
            // Test input types
            else if (feature === 'email' || feature === 'number' || feature === 'date' || feature === 'datetime' ||
                     feature === 'time') {
                debug('Type test: ' + feature);
                dummyInput.setAttribute('type', feature);
                result = dummyInput.type === feature ? false : true;
            }
            // For all the stuff I was too lazy
            else {
                debug('Missing test, please report');
            }
            
            return result;
        }
        
        // Replaces special type input fields with normal ones for good enough reasons
        function replaceType(type, scope) {
            var clone;
            $('[type="' + type + '"]', scope).each(function() {
                var $this = $(this);
                try {
                    // Bypass jQuery to set type on browsers that allow changing it
                   this.type = 'text';
                   $this.attr('data-' + type + 'type', type + 'type');
                } catch(err) {
                    debug(err + ' :: Fixing it anyway');
                    clone = document.createElement('input');
                    $(clone).data($this.data())
                        .attr('data-' + type + 'type', type + 'type')
                        .attr('type', 'text')
                        .attr('placeholder', $(this).attr('placeholder'))
                        .attr('name', $(this).attr('name'))
                        .attr('value', $(this).attr('value'));
                        console.info(clone);
                    $this.replaceWith(clone);
                }
            });
        }
        
        // Loop over all forms requested
        return this.each(function() {
            // Private properties
            var $this = $(this),
                 form = $this,// REMOVE WHEN CHECKED
                result = false;
            
            // Callback initialize
            opts.oninitialize(this);
            debug('oninitialize');
            
            // Label hiding (if required)
            if (opts.labels === 'hide') {
                $('label', this).hide();
            }
            
            
            // Textarea maxlength
            if (fixThisOrNot('maxLength') === true) {
                (function(form) {
                    $('textarea', form).on('keydown', function(event) {
                        var $this = $(this),
                            maxlength = ($this.attr('maxlength')) * 1,
                            keycode = event.which || event.charCode || event.keyCode;
                        
                        if (keycode === 37 || keycode === 39 || keycode === 8 || keycode === 46) {
                            return true;
                        } else if (this.value.length >= maxlength) {
                            return false;
                        }
                    }).on('paste', function(event) {
                        var $this = $(this),
                            currentStr = $this.val();
                        // Need timeout, no other decent way to find pasted text
                        setTimeout(function() {
                            var maxlength = ($this.attr('maxlength')) * 1,
                                newStr = $this.val(),
                                el;
                            if(newStr.length > maxlength) {
                                // TODO Check the spec on what to do. Is cancel ok?
                                $this.val(currentStr);//newStr.substr(0, maxlength)
                                el = addResponse(opts.lengthMessage, $this);
                                setTimeout(function() {
                                    el.fadeOut(500, function() {
                                        $(this).remove();
                                    });
                                }, 1500);
                            }
                        }, 0);
                    });
                })($this);
            }
            if (fixThisOrNot('number') === true) {
                // Number type
                $('input[type="number"]', this).on('keydown', function(event) {
                    var keycode = event.which || event.charCode || event.keyCode,
                        shift   = event.shiftKey || false,
                        ctrl    = event.ctrlKey  || false,
                        alt     = event.altKey   || false;
                        
                    // Allow pasting etc while not allowing special ctrl+alt chars
                    if (ctrl === true && alt === false) {
                        return true;
                    // Match numbers
                    } else if (keycode >= 48 && keycode <= 57 && shift === false) {
                        return true;
                    // Match numpad numbers
                    } else if (keycode >= 96 && keycode <= 105) {
                        return true;
                    // Match arrows
                    } else if ((keycode >= 37 && keycode <= 40) || keycode === 9) {
                        return true;
                    // Match .
                    } else if (keycode === 110 || keycode === 190) {
                        return true;
                    // Match -
                    } else if (keycode === 189 || keycode === 109) {
                        return true;
                    // Match del(46) and backspace(8) and enter(13) and tab (9)
                    } else if (keycode === 46 || keycode === 8 || keycode === 13) {
                        return true;
                    // Match home(36) and end(35)
                    } else if (keycode === 35 || keycode === 36) {
                        return true;
                    // Not a valid key pressed
                    } else {
                        return false;
                    }
                }).on('keyup', function() {
                    var $this = $(this),
                        value = $this.val(),
                        min = ($this.attr('min')) ? ($this.attr('min')) * 1 : false,
                        max = ($this.attr('max')) ? ($this.attr('max')) * 1 : false;
                    
                    // Return if empty
                    if (value === '') {
                        return true;
                    }
                    
                    // Check for invalid chars(somehow)
                    if (value.match(/[^\-\.0-9]+/)) {
                        value = value.replace(/[^\-\.0-9]+/, '');
                        $this.val(value);
                    }
                    
                    // Check for min
                    if (min !== false && ($this.val()) * 1 < min) {
                        $this.val(min);
                    }
                    
                    // Check for max
                    if (max !== false && ($this.val()) * 1 > max) {
                        $this.val(max);
                    }
                }).on('change', function() {
                    var $this = $(this),
                        value = $this.val();
                    debug('change');
                    // Check for invalid chars(somehow)
                    if (value.match(/[^\-\.0-9]+/)) {
                        value.replace(/[^\-\.0-9]+/g, '');
                        $this.val(value);
                    }
                }).on('paste', function() {
                    var $this = $(this);
                    setTimeout(function() {
                        $this.trigger('change');
                    }, 100);
                });
            }
            
            // Progressive enhancement on time picker
            if (fixThisOrNot('time') === true && $.ui && $.ui.timepicker) {
                replaceType('time', this);
                $('input[type="time"], input[data-timetype]', this).timepicker({});
            }
            // Progressive enhancement on datetime picker
            if (fixThisOrNot('datetime') === true && $.ui && $.ui.datepicker && $.ui.timepicker) {
                replaceType('datetime', this);
                $('input[type="datetime"], input[data-datetimetype]', this).datetimepicker();
            }
            // Progressive enhancement on date picker
            if (fixThisOrNot('date') === true && $.ui && $.ui.datepicker) {
                replaceType('date', this);
                $('input[type="date"], input[data-datetype]', this).datepicker();
            }
            
            // Some things are just different when all browsers have to be checked :-)
            if (opts.allBrowsers === true) {
                // Prevent default validation methods
                if (!$this.attr('novalidate')) {
                    $this.attr('novalidate', 'novalidate').attr('data-forced-html5form-validate', 'validate');
                }
                // Always prevent default required
                $(':input[required]', this).attr('data-required', 'required').removeAttr('required');
            }
            
            // Placeholder - after type replacers
            if (fixThisOrNot('placeholder') === true) {
                debug('fixing placeholder');
                $(':input[placeholder]:not(:button, :submit)', this).each(function() {
                    var $this = $(this);
                    $this.attr('data-startcolor', $this.css('color'));
                    checkPlaceholder($this, 'start');
                }).on('focus', function() {
                    checkPlaceholder($(this), 'focus');
                }).on('blur', function() {
                    checkPlaceholder($(this), 'blur');
                });
            }
            
            // Find first autofocus to activate - must stay below placeholder fixer
            if (fixThisOrNot('autofocus') === true && document.activeElement && document.activeElement.nodeName.toLowerCase() === 'body') {
                // Timeout as IE8 fix
                setTimeout(function() {
                    $(':input[autofocus]').first().val('').focus().val(autoFocusHelper);
                }, 100);
            }
            
            // Normal submit functionality :-)
            form.submit(function(event) {
                var $this = $(this),
                    data = $this.data();
                if (data.finished === true) {
                    return true;
                }
                event.preventDefault();
                opts.onsubmit(this);
                if ($this.attr('novalidate') && !$this.attr('data-forced-html5form-validate')) {
                    result = true;
                } else {
                    result = testForm(this);
                }
                if (result === true) {
                    data.finished = true;
                    if (opts.onfinish(this) !== false ) {
                        sendForm(this);
                    }
                    data.finished = false;
                }
                return false;
            });
        });
    };
})(jQuery);