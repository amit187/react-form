(function ($) {
    "use strict";
    
    $.fn.tautocomplete = function (options, args) {

        var _instance = this,

            // default parameters
            settings = {
                columns: [],
                onchange: null,
                norecord: "No Records Found",
                dataproperty: null,
                regex: "^[a-zA-Z0-9\b]+$",
                data: null,
                placeholder: null,
                theme: "default",
                ajax: null
            },

            //theme options
            cssClass = [["default", "adropdown"], ["classic", "aclassic"], ["white", "awhite"]],

            // initialize DOM elements
            el = {
                ddDiv: $("<div>", { "class": settings.theme }),
                ddSpan: $("<span></span>"),
                ddTable: $("<table></table>", { style: "width:" + settings.width }),
                ddTableCaption: $("<caption>" + settings.norecord + "</caption>"),
                ddTextbox: $("<input type='text'>"),
                filteredData: {},
                idField: '',
                nameField: '',
                hdnAutocompleteIdField: $("<input type='hidden'>"),
                selectedRow: {}
            },

            //key codes
            keys = {
                UP: 38,
                DOWN: 40,
                ENTER: 13,
                TAB: 9
            },

            errors = {
                columnNA: "Error: Columns Not Defined",
                dataNA: "Error: Data Not Available"
            },

            // delay function which listens to the textbox entry
            delay = (function () {
                var timer = 0;
                return function (callsback, ms) {
                    clearTimeout(timer);
                    timer = setTimeout(callsback, ms);
                };
            })(),

            focused = false;

        function Plugin(element, options) {
            // Store references to the selected element
            this.el = element;
            this.$el = $(element);

            // Merge passes options with defaults
            settings = $.extend({}, $.fn.tautocomplete.settings, options);
            // Initialize the plugin instance
            this.destroy();
            this.init();
        }

        //
        // Plugin prototype
        //
        Plugin.prototype = {

        	init: function() {

                // set theme
                cssClass.filter(function (v, i) {
                    if (v[0] == settings.theme) {
                        settings.theme = v[1];
                        return;
                    }
                });
                _instance.actual = function() { return 10};
                settings.width = settings.width ? settings.width : _instance.actual('width');

                // check if the textbox is focused.
                if (_instance.is(':focus')) {
                    focused = true;
                }
                
                _instance.addClass('tautocomplete_instance');
                _instance.wrap("<div style='line-height:0'></div>");

                var titleAttr = _instance.attr('title') ? _instance.attr('title') : '';
                 // wrap the div for style
                _instance.wrap("<div class='acontainer' style='line-height:1.43' title='" + titleAttr + "'></div>");

                // create input hidden for idField column
                _instance.after(el.hdnAutocompleteIdField);

                // create a textbox for input
                el.ddTextbox.attr('class', _instance.attr('class').replace('requiredComboGrid','') + ' tautocomplete_input');
                _instance.after(el.ddTextbox);
                el.ddTextbox.attr("autocomplete", "nope");
//                el.ddTextbox.css("width", _instance.width() + "px"); 
                el.ddTextbox.css("font-size", _instance.css("font-size"));
                el.ddTextbox.attr("placeholder", settings.placeholder);
                // check for mandatory parameters
                if (settings.columns == "" || settings.columns == null) {
                    el.ddTextbox.attr("placeholder", errors.columnNA);
                }
                else if ((settings.data == "" || settings.data == null) && settings.ajax == null) {
                    el.ddTextbox.attr("placeholder", errors.dataNA);
                }

                // append data property
                if (settings.dataproperty != null) {
                    for (var key in settings.dataproperty) {
                        el.ddTextbox.attr("data-" + key, settings.dataproperty[key]);
                    }
                }

                // append div after the textbox
                _instance.after(el.ddDiv);

                //allow user to scroll
                el.ddDiv.on('mousewheel', function(e, delta){
                    e.stopPropagation();
                });

                // hide the current text box (used for stroing the values)
                _instance.hide();

                el.ddDiv.addClass('adropdown');
                el.ddDiv.css('width', _instance.actual('width') + 30);

                // append table after the new textbox
                el.ddDiv.append(el.ddTable);
                el.ddTable.attr("cellspacing", "0");
                el.ddTable.css("min-width", settings.width);

                // append table caption
                el.ddTable.append(el.ddTableCaption);
                el.ddDiv.after(el.ddSpan);

                // create table columns
                var header = "<thead><tr class='headerRow'>";

                $.each(settings.columns, function(index, item){
                    header += (item.hidden ? "<th class='hidden'>" : "<th style='text-align:" + item.align + ";width:" + (item.width ? item.width + "px" : "auto") + ";'>") + item.name + "</th>";

                    if(item.idField)
                        el.idField = index;
                    
                    if(item.nameField)
                        el.nameField = index;
                });

                /*for (var i = 0; i <= cols - 1; i++) {
                    header = header + "<th>" + settings.columns[i] + "</th>";
                }*/
                header = header + "</tr></thead>";
                el.ddTable.append(header);
                
                _syncAttributes();

                // assign data fields to the textbox, helpful in case of .net postbacks
                {
                    var id = "", text = "";

                    if (_instance.val() != "") {
                        var val = _instance.val().split("#$#");
                        id = val[0];
                        text = val[1];
                    }

                    el.ddTextbox.attr("data-id", id);
                    el.ddTextbox.attr("data-text", text);
                    el.ddTextbox.val(text);
                }

                if (focused|| _instance.prop('autofocus')) {
                    el.ddTextbox.focus();
                }
                
                if(!settings.skipChaneOnRender){
                	var blankVal = {};
                    $.each(settings.columns, function(index, item){
                    	blankVal[index] = '';
                    });
                    
                    onChange(blankVal);
                }
            	
            },

            id: function () {
                return el.ddTextbox.data("id");
            },

            getValue: function() {
                return el.selectedRow;
            },

            setValue: function(idFieldValue) {
                //onChange(rowData);
            	
            	var found = false;
            	
                $.each(settings.data.call(this, true), function(index, item){
                    $.each(item, function(key, val){
                        if( settings.columns[key] && settings.columns[key].idField && val == idFieldValue ){
                            onChange(item);
                            found = true;
                            return false;
                        }
                    });
                });
                
                if(!found){
                	var blankVal = {};
                    $.each(settings.columns, function(index, item){
                    	blankVal[index] = '';
                    });
                    
                    onChange(blankVal);
                }
            },

            text: function () {
                return el.ddTextbox.data("text");
            },

            searchdata: function () {
                return el.ddTextbox.val();
            },

            isNull: function () {
            	return (el.ddTextbox.data("id") == "");
            },

            isOpen: function(){
                return el.ddTable.is(':visible');
            },
            
            addClass: function(className){
            	if(!el.ddTextbox.hasClass(className))
            		el.ddTextbox.addClass(className);
            	
            	if(!_instance.hasClass(className))
            		_instance.addClass(className);
            },
            
            removeClass: function(className){
            	el.ddTextbox.removeClass(className);
            	_instance.removeClass(className);
            },

            destroy: function(){
                if(_instance.parent().hasClass('acontainer')){
                    _instance.nextAll().remove();
                    _instance.val('');
                    _instance.unwrap();
                    _instance.unwrap();

                    this.$el.removeData();
                }
            },
            
            focus: function(){
            	window.setTimeout(function(){ el.ddTextbox.focus(); }, 200);
            }

        }
        
        //watch attributes to enable/disable/readonly combobox
        if ($(_instance)[0].attachEvent) {
        	$(_instance)[0].attachEvent('onpropertychange', _syncAttributes);
        }

        var observer = window.MutationObserver ||
        	window.WebKitMutationObserver ||
         	window.MozMutationObserver;

        if (observer != null) {
        	var _observer = new observer(function (mutations) {
        		$.each(mutations, _syncAttributes);
            });
            
        	_observer.observe($(_instance)[0], {
        		attributes: true,
        		subtree: false
            });
        } else if ($(_instance)[0].addEventListener) {
        	$(_instance)[0].addEventListener('DOMAttrModified', _syncAttributes, false);
        }
          
        if( !_instance.data('rendered') ){
        	_instance.data('rendered', 1);
          	
          	if( _instance.prop('readonly') ){
          		_instance.prop('readonly', false).prop('readonly', true);
          	} else {
          		_instance.prop('readonly', true).prop('readonly', false);
          	}
        }

        // event handlers
        el.ddTextbox.click(function(e) {
            var data = settings.data.call(this);
            jsonParser(data);
            showDropDown();
        });
        
        el.ddSpan.click(function(e) {
        	e.preventDefault();
        	e.stopPropagation();
        	if(!el.ddTable.is(':visible')){
            	var data = settings.data.call(this);
            	jsonParser(data);
            	showDropDown();
        		el.ddTextbox.focus();
        	} else{
        		hideDropDown();
        	}
        });

        // autocomplete key press
        el.ddTextbox.keyup(function (e) {
            //return if up/down/return key
            if ((e.keyCode < 46 || e.keyCode > 90) && (e.keyCode < 96 || e.keyCode > 105) && (e.keyCode != 8)) {
                e.preventDefault();
                return;
            }

            //delay for 1 second: wait for user to finish typing
            //delay(function () {
                if (el.ddTextbox.val() == "") {
                    //hideDropDown();
                    //return;
                }

                // hide no record found message
                el.ddTableCaption.hide();

                el.ddTextbox.addClass("loading");

                if (settings.ajax != null) {
                    var tempData = null;
                    if ($.isFunction(settings.ajax.data)) {
                        tempData = settings.ajax.data.call(this);
                    }
                    else{
                        tempData = settings.ajax.data;
                    }
                    // get json data
                    $.ajax({
                        type: settings.ajax.type || 'GET',
                        dataType: 'json',
                        contentType: settings.ajax.contentType || 'application/json; charset=utf-8',
                        headers: settings.ajax.headers || { 'Content-Type': 'application/x-www-form-urlencoded' },
                        data: tempData || null,
                        url: settings.ajax.url,
                        success: ajaxData,
                        error: function (xhr, ajaxOptions, thrownError) {
                            el.ddTextbox.removeClass("loading");
                            alert('Error: ' + xhr.status || ' - ' || thrownError);
                        }
                    });
                }
                else if ($.isFunction(settings.data)) {
                    var data = settings.data.call(this);
                    jsonParser(data);
                }
                else {
                    // default function
                    null;
                }
            //};, 1000);
        });

        // do not allow special characters
        el.ddTextbox.keypress(function (event) {
            var regex = new RegExp(settings.regex);
            var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);

            if (!regex.test(key)) {
                event.preventDefault();
                return false;
            }
        });

        // textbox keypress events (return key, up and down arrow)
        el.ddTextbox.keydown(function (e){

            var tbody = el.ddTable.find("tbody");
            var highlighted = tbody.find(".highlighted");

            if (e.keyCode == keys.ENTER) {
                e.preventDefault();
                
                if( el.ddTable.is(':visible') ){
                    select(highlighted, true);
                }else{
                    var data = settings.data.call(this);
                    jsonParser(data);
                    showDropDown();
                }
            } else if(e.keyCode == keys.TAB) {
            	el.ddDiv.removeClass('focused');
            } else {
            	var newSelection = null, direction = 'down', scrollTop = 0;
            	//el.ddTable.find(".selected").removeClass("selected");
            	
	            if (e.keyCode == keys.UP) {
	                newSelection = highlighted.prev();
	                direction = 'up';
	                
	                if (newSelection.length == 0)
	                	newSelection = tbody.find("tr:last");
	            } else if (e.keyCode == keys.DOWN) {
	                newSelection = highlighted.next();
	                direction = 'down';
	                
	                if (newSelection.length == 0)
	                	newSelection = tbody.find("tr:first");
	            }
	            
	            if(newSelection){
	                highlightRow(newSelection);
	                
	                if( !isDivHeightVisible(newSelection, el.ddDiv) ){
	                	
	                	if(direction == 'up' && newSelection.index() == 0)
	                		scrollTop = 0;
	                	else
	                		scrollTop = newSelection.index() * newSelection.height();
	                	
	                	el.ddDiv.animate({
	                        scrollTop: scrollTop
	                    }, 0);
	                }
	            }
            }
        });

        // row click event
        el.ddTable.delegate("tr", "mousedown", function () {
        	if( !$(this).hasClass('headerRow') ) {
	            select($(this), true);
        	}
        });
        
        // row hover event
        el.ddTable.delegate("tr", "mouseover", function () {
        	highlightRow($(this));
        });
        
        el.ddDiv.hover(
    		function() {
    		  	$(this).addClass('focused');
    		}, function() {
    			$(this).removeClass('focused');
    		}
        );
        
        // textbox blur event
        el.ddTextbox.focusout(function () {
        	/*if( el.ddDiv.hasClass('focused') && ( el.ddTextbox.data("id") == "" || el.filteredData.length <= 0 ) ){
        		el.ddDiv.removeClass('focused');
        	}*/
        	
        	if( !el.ddDiv.hasClass('focused') ){
        		hideDropDown();
        		
        		// clear if the text value is invalid 
                if ($(this).val() != $(this).data("text")) {

                    var change = true;
                    if ($(this).data("text") == "") {
                        change = false;
                    }

                    $(this).data("text", "");
                    $(this).data("id", "");
                    $(this).val("");
                    _instance.val("");

                    if (change) {
                    	var blankVal = {};
                        $.each(settings.columns, function(index, item){
                        	blankVal[index] = '';
                        });
                        
                        onChange(blankVal);
                    }
                }
        	} else {
        		$(this).focus();
        	}
        });
        
        function highlightRow(row){
        	if( !row.hasClass('headerRow') ){
	        	el.ddTable.find(".highlighted").removeClass("highlighted");
	        	row.addClass("highlighted");
        	}
        }

        // call on Ajax success
        function ajaxData(jsonData) {
            if (settings.ajax.success == null || settings.ajax.success == "" || (typeof settings.ajax.success === "undefined")) {
                jsonParser(jsonData);
            }
            else {
                if ($.isFunction(settings.ajax.success)) {
                    var data = settings.ajax.success.call(this, jsonData);
                    jsonParser(data);
                }
            }
        }

        function select(rowTr, isManualSelection) {
        	el.ddTable.find(".selected").removeClass("selected");
        	rowTr.addClass("selected");
        	
            var retVal = {};

            el.ddDiv.removeClass('focused');
            retVal = el.filteredData[rowTr.index()];
            
            onChange(retVal, isManualSelection);
            hideDropDown();
            setTimeout(function(){
            	el.ddTextbox.focus();
            },100);
            
        }

        function onChange(retVal, isManualSelection) {
            // onchange callback function
            el.selectedRow = retVal;

            el.ddTextbox.data("id", retVal[el.idField]);
            el.ddTextbox.data("text", retVal[el.nameField]);
            el.ddTextbox.val(retVal[el.nameField]);
            _instance.val(retVal[el.idField]);
            el.hdnAutocompleteIdField.val(retVal[el.idField]);
            
            if ($.isFunction(settings.onchange)) {
                settings.onchange.call(this, retVal, isManualSelection);
            }
            else {
                // default function for onchange
            }
        }

        function hideDropDown() {
        	el.ddSpan.css("z-index", 998);
            el.ddTable.hide();
            el.ddTextbox.removeClass("inputfocus");
            el.ddDiv.removeClass("highlight");
            el.ddTableCaption.hide();
            el.ddTable.find("tbody").find("tr").remove();
        }

        function showDropDown() {
        	
        	if( el.ddTextbox.prop('disabled') || el.ddTextbox.prop('readonly') )
        		return;
        	
        	var position = el.ddTextbox.offset();
        	var cssMarginTop = "0px";
            var cssPositionTop = (position.top + 27);
            var cssPositionLeft = position.left;

            el.ddTextbox.addClass("inputfocus");
            el.ddDiv.addClass("highlight");
            el.ddTable.show();

            // adjust div top according to the visibility
            if (!isDivHeightVisible(el.ddDiv)) {
            	cssPositionTop = (position.top - el.ddDiv.height());

            	$('html, body').animate({
                    scrollTop: (el.ddDiv.offset().top - 60)
                }, 250);
            }
            // adjust div left according to the visibility
            if (!isDivWidthVisible(el.ddDiv)) {
            	cssPositionLeft = (position.left - 120);
            }
            
            if( el.ddTextbox.parents('.ui-dialog').length > 0 ) {
            	el.ddTextbox.css('z-index', parseInt(el.ddTextbox.parents('.ui-dialog').css('z-index')) + 1);
            }
            
            el.ddTable.css("margin", cssMarginTop);
            
            if(_instance.hasClass('input-lg')) {
            	cssPositionTop += 20;
            }

            el.ddDiv.css("top", cssPositionTop + "px");
            el.ddDiv.css("left", cssPositionLeft + "px");
            
            el.ddSpan.css("z-index", 1001);
        }

        function jsonParser(jsonData) {
            try{
                // get number of columns
                var cols = Object.keys(settings.columns).length;//settings.columns.length;

                el.filteredData = jsonData;
                el.ddTextbox.removeClass("loading");

                // remove all rows from the table
                el.ddTable.find("tbody").find("tr").remove();

                var i = 0, j = 0;
                var row = null, cell = null, selected = false, rowEl = null;
                if (jsonData != null) {
                	
                    for (i = 0; i < jsonData.length; i++) {
                        // display only 15 rows of data
                        if (i >= 15)
                            continue;

                        var obj = jsonData[i];
                        row = "";
                        j = 0;

                        for (var key in settings.columns) {
                            // return on column count
                            if ( j <= cols ) {
                                cell = obj[key];
                                
                                if( !cell || cell == "null")
                                	cell = "";
                                
                                if( settings.columns[key].type ){
                                	switch(settings.columns[key].type){
                                		//more formats to be added as required
	                                	case 'date':
		                                		var d = new Date(cell);
		                                		
		                                		if(d != 'Invalid Date')
		                                			cell = $.datepicker.formatDate(settings.columns[key].format, d);
	                                		break;
                                	}
                                }
                                
                                if(settings.columns[key].hidden)
                                	row += "<td class='hidden'>";
                                else if(settings.columns[key].align && settings.columns[key].align != "")
                                	row += "<td style='text-align:" + settings.columns[key].align + ";'>";
                                else
                                	row += "<td>";
                                	
                               	row += cell + "</td>";
                            }
                            else
                                continue;

                            if( settings.columns[key].idField && el.hdnAutocompleteIdField.val() == cell )
                                selected = true;

                            j++;
                        }
                        // append row to the table
                        rowEl = $("<tr>" + row + "</tr>");

                        if(selected) {
                            rowEl.addClass('selected').addClass('highlighted');
                            selected = false;
                        }

                        el.ddTable.append(rowEl);
                    }
                }
                //debugger;
                // show no records exists
                if (i == 0)
                    el.ddTableCaption.show();

                // hide first column (ID row)
                //el.ddTable.find('td:nth-child(1)').hide();

                if( el.ddTable.find("tbody").find("tr.selected").length <= 0 )
                    el.ddTable.find("tbody").find("tr:first").addClass('selected').addClass('highlighted');

                showDropDown();
            }
            catch (e)
            {
                alert("Error: " + e);
            }
        }
        
        function _syncAttributes() {
            if (_instance.prop('disabled')) {
            	if ( el.ddTable.is(':visible') ) {
            		hideDropDown();
            	}

            	el.ddTextbox.prop('disabled', true);
            } else {
            	el.ddTextbox.prop('disabled', false);
            }
            
            if (_instance.prop('readonly')) {
            	if ( el.ddTable.is(':visible') ) {
            		hideDropDown();
            	}

            	el.ddTextbox.prop('readonly', true);
            } else {
            	el.ddTextbox.prop('readonly', false);
            }
            
        };
         
         var retval,
         	 $this = $(this[0]),
             data = $this.data('tautocomplete'),
             option = typeof options == 'object' && options;

         if (option)
        	 $this.data('tautocomplete', (data = new Plugin(this, option)));
         
         if (typeof options == 'string' && data)
        	 retval = data[options](args);
         
         if (typeof retval == 'undefined')
        	 retval = this;

         return retval;
    };
}(jQuery));

function isDivHeightVisible(elem, parent) {
	parent = parent ? parent : $(window);
    var docViewTop = parent.scrollTop();
    var docViewBottom = docViewTop + parent.height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom)
      && (elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}
function isDivWidthVisible(elem) {
    var docViewLeft = $(window).scrollLeft();
    var docViewRight = docViewLeft + $(window).width();

    var elemLeft = $(elem).offset().left;
    var elemRight = elemLeft + $(elem).width();

    return ((elemRight >= docViewLeft) && (elemLeft <= docViewRight)
      && (elemRight <= docViewRight) && (elemLeft >= docViewLeft));
}
