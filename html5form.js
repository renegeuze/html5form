/**
 * Html5 Form Plugin - jQuery plugin
 * Version 2.2
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
 * modernizr.input - Might be removed in v3
 * modernizr.inputtypes - Might be removed in v3
 * jquery.ui.datepicker
 * jquery.ui.timepicker
 *
 */

(function($) {
    // Uncomment string below during testing
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
                    'email': 'Please type a valid email address.',
                    'pattern': 'Pattern missmatch on [title].',
                    'length': 'Prevented paste because of maximum field length'
                },
                'nl': {
                    'empty': '[title] is een verplicht veld.',
                    'email': '[value] is geen geldig e-mailadres.',
                    'pattern': '[title] bevat een ongeldige tekenreeks.',
                    'length': 'Plakken geblokkeerd wegens maximale veldgrootte'
                },
                'es': {
                    'empty': 'El campo [title] es requerido.',
                    'email': 'Ingrese una dirección de correo válida por favor.'
                },
                'it': {
                    'empty': 'Il campo [title] é richiesto.',
                    'email': 'L\'indirizzo e-mail non é valido.'
                },
                'de': {
                    'empty': '[title] ist ein Pflichtfeld.',
                    'email': 'Bitte eine gültige E-Mail-Adresse eintragen.'
                },
                'fr': {
                    'empty': 'Le champ [title] est requis.',
                    'email': 'Entrez une adresse email valide s&rsquo;il vous plait.'
                },
                'br': {
                    'empty': 'O campo [title] é obrigatório.',
                    'email': 'Insira um email válido por favor.'
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
            Modernizr = window.Modernizr || false,
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
            if (string.match('[title]') && $(element).attr('title')) {
                string = string.replace('[title]', $(element).attr('title'));
            } else if (string.match('[title]')) {
                string = string.replace('[title]', '[label]');
            }
            if (string.match('[label]') && $('label[for="' + ($(element).attr('id')) + '"]').length > 0 ) {
                string = string.replace('[label]', $('label[for="' + ($(element).attr('id')) + '"]').get(0).innerHTML);
            } else if($(element).parent().text().replace(/\s+/gim, ' ').length > 3) {
                string =  string.replace('[label]', $(element).parent().text().replace(/\s+/gim, ' '));
            } else if (string.match('[label]')) {
                string = string.replace('[label]', '[name]');
            }
            
            if (string.match('[name]') && $(element).attr('name')) {
                string = string.replace('[name]', $(element).attr('name'));
            }
            if (string.match('[value]')) {
                string = string.replace('[value]', $(element).val());
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
                var name = $(this).attr('name'),
                    value = $(this).val();
                
                if (value === $(this).attr('placeholder') || value === '') {
                    emptyInput[name] = value;
                    debug('Empty input error');
                    if (opts.onerror(this) === false){
                        return false;
                    }
                    // Show message
                    if (opts.emptyMessage !== false && opts.responseElement !== null){
                        addResponse(opts.emptyMessage, $(this));
                    }
                }
            });
            
            // Check for pattern
            $(':input:visible[pattern]', form).each(function() {
                var name, value, pattern;
                
                name    = $(this).attr('name');
                value   = $(this).val();
                pattern = new RegExp($(this).attr('pattern'));
                    
                if (!value.match(pattern)) {
                    patternError[name] = value;
                    debug('Pattern mismatch');
                    if (opts.onerror(this) === false) {
                        return false;
                    }
                    
                    // Show message
                    if (opts.patternMessage !== false && opts.responseDiv !== null) {
                        addResponse(opts.patternMessage, $(this));
                    }
                }
            });
            
            // check email type inputs with regular expression
            $(':input:visible[type="email"]', form).each(function(index, element) {
                var name, value;
                
                name  = $(this).attr('name');
                value = $(this).val();
                
                // If empty, skip
                if (value === '' || value === element.defaultValue) {
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
                        addResponse(opts.emailMessage, $(this));
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
            var input = $(':input:visible:not(:button, :submit, :radio, select)', form),
                url = opts.action,
                method = opts.method,
                formData;
            
            if(url === false) {
                url = $(form).attr('action') || './';
            }
            if(method === false) {
                method = $(form).attr('method') || 'get';
            }
            
            debug('Sending form');
            
            // Clear all empty value fields before Submit 
            $(input).each(function() {
                if ($(this).val() === $(this).attr('placeholder')) {
                    $(this).val($(this).get(0).defaultValue);
                }
            });
            
            // Submit data by Ajax
            if (opts.async === true) {
                formData = $(form).serialize();
                $.ajax({
                    url  : opts.action,
                    type : opts.method,
                    data : formData,
                    success : function(data){
                        opts.onajaxsuccess(this);
                        opts.ajaxready(data);
                        debug('Success sending');
                        //Reset form
                        $(':input', form).each(function() {
                            $(this).val($(this).get(0).defaultValue);
                        });
                    },
                    error: function() {
                        opts.onajaxerror(this);
                        debug('Error sending');
                    }
                });
            } else {
                $(form).submit();
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
            // If we have modernizr, use this smart stuff :-)
            else if (Modernizr !== false && Modernizr.inputtypes && Modernizr.inputtypes[feature]) {
                debug('Modernizr test');
                result = !Modernizr.inputtypes[feature];
            }
            else if (Modernizr !== false && Modernizr.input && Modernizr.input[feature]) {
                debug('Modernizr test');
                result = !Modernizr.input[feature];
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
            var $clone;
            $('[type="' + type + '"]', scope).each(function() {
                $clone = $(this).clone( true, true );
                $clone.attr('data-' + type + 'type', type + 'type').attr('type', 'text');
                $(this).replaceWith($clone);
            });
        }
        
        // Loop over all forms requested
        return this.each(function() {
            // Private properties
            var form = $(this),
                result = false;
            
            // Callback initialize
            opts.oninitialize(this);
            debug('oninitialize');
            
            // Label hiding (if required)
            if (opts.labels === 'hide') {
                $(this).find('label').hide();
            }
            
            // Placeholder
            if (fixThisOrNot('placeholder') === true) {
                debug('fixing placeholder');
                $(':input[placeholder]:not(:button, :submit)', form).each(function() {
                    $(this).attr('data-startcolor', $(this).css('color'));
                    checkPlaceholder($(this), 'start');
                }).on('focus', function() {
                    checkPlaceholder($(this), 'focus');
                }).on('blur', function() {
                    checkPlaceholder($(this), 'blur');
                });
            }
            
            // Textarea maxlength
            if (fixThisOrNot('maxLength') === true) {
                (function(form) {
                    $('textarea', form).on('keydown', function(event) {
                        var maxlength = ($(this).attr('maxlength')) * 1,
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
                })(form);
            }
            if (fixThisOrNot('number') === true) {
                // Number type
                $('input[type="number"]', form).on('keydown', function(event) {
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
                    var value = $(this).val(),
                        min = ($(this).attr('min')) ? ($(this).attr('min')) * 1 : false,
                        max = ($(this).attr('max')) ? ($(this).attr('max')) * 1 : false;
                    
                    // Return if empty
                    if (value === '') {
                        return true;
                    }
                    
                    // Check for invalid chars(somehow)
                    if (value.match(/[^\-\.0-9]+/)) {
                        value = value.replace(/[^\-\.0-9]+/, '');
                        $(this).val(value);
                    }
                    
                    // Check for min
                    if (min !== false && ($(this).val()) * 1 < min) {
                        $(this).val(min);
                    }
                    
                    // Check for max
                    if (max !== false && ($(this).val()) * 1 > max) {
                        $(this).val(max);
                    }
                }).on('change', function() {
                    var value = $(this).val();
                    // Check for invalid chars(somehow)
                    if (value.match(/[^\-\.0-9]+/)) {
                        value.replace(/[^\-\.0-9]+/g, '');
                        $(this).val(value);
                    }
                });
            }
            
            // Progressive enhancement on time picker
            if (fixThisOrNot('time') === true && $.ui && $.ui.datepicker && $.ui.timepicker) {
                replaceType('time', form);
                $('input[type="time"], input[data-timetype]', form).timepicker({});
            }
            // Progressive enhancement on datetime picker
            if (fixThisOrNot('datetime') === true && $.ui && $.ui.datepicker && $.ui.timepicker) {
                replaceType('datetime', form);
                $('input[type="datetime"], input[data-datetimetype]', form).datetimepicker();
            }
            // Progressive enhancement on date picker
            if (fixThisOrNot('date') === true && $.ui && $.ui.datepicker) {
                replaceType('date', form);
                $('input[type="date"], input[data-datetype]', form).datepicker();
            }
            
            // Some things are just different when all browsers have to be checked :-)
            if (opts.allBrowsers === true) {
                // Prevent default validation methods
                if (!$(this).attr('novalidate')) {
                    $(this).attr('novalidate', 'novalidate').attr('data-forced-html5form-validate', 'validate');
                }
                // Always prevent default required
                $(':input[required]', form).attr('data-required', 'required').removeAttr('required');
            }
            
            // Normal submit functionality :-)
            form.submit(function(event) {
                if (tmp.finished === true) {
                    return true;
                }
                event.preventDefault();
                opts.onsubmit(this);
                if ($(this).attr('novalidate') && !$(this).attr('data-forced-html5form-validate')) {
                    result = true;
                } else {
                    result = testForm(form);
                }
                if (result === true) {
                    tmp.finished = true;
                    if (opts.onfinish(form) !== false ) {
                        sendForm(form);
                    }
                    tmp.finished = false;
                }
                return false;
            });
        });
        
        // Find first autofocus to activate - must stay below placeholder fixer, which is in the loop
        if (fixThisOrNot('autofocus') === true && !$(document.activeElement).is('body')) {
            $(':input[autofocus]').first().val('').focus().val(autoFocusHelper);
        }
    };
})(jQuery);