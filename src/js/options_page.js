


/**
 * @namespace
 * Object that automates loading and saving settings in an Opera extension's options page
 * 
 * @property {SettingStorage} storage the SettingStorage object used to initialize the page
 */
var OptionsPage = new function OptionsPage() {
	
	var storage = null;
	var initialized = false;
	
	this.__defineGetter__('storage', function() {return storage});
	
	// list of FORM elements
	var formElements;
	
	// types of form elements
	// skip: ignore these. 
	// checkable: element has the "checked" property
	// radio: setting value should be calculated via getRadioValue()
	var skip      = hash('hidden,submit,image,file,reset,button');
	var numeric   = hash('number,range');
	var checkable = hash('checkbox,radio');
	var radio     = hash('radio');
	
	
	
	/**
	 * @private
	 * Turns a string into a hash table
	 */
	function hash(str, sep) {
		var obj = {};
		var tmp = str.split(sep || ',');

		while( tmp.length ) 
			obj[ tmp.pop() ] = true;

		return obj;
	}
	
	/**
	 * @private
	 * Returns true if the element is a <input>,  <select>, or <textarea> element
	 */
	function isInput(element) {
		var tagname = element.tagName.toLowerCase();
		return tagname == 'input' || tagname == 'select' || tagname == 'textarea';
	}
	
	/**
	 * @private
	 * Gets the value of a set of radio buttons
	 */
	function getRadioValue(element) {
		var name = element.name;
		var inputs = element.form ? element.form.elements[name] : 
			document.querySelectorAll('input[type=radio][name="' + name + '"]');
		for (var i = 0; i < inputs.length; i++) {
			if (inputs[i].checked)
				return inputs[i].value;
		}
		return null;
	}
	
	/**
	 * @private
	 * Gets a transform function set on an input
	 */
	function getTransformFunction(element, type) {
		var func = element.getAttribute('data-' + type);
		if (func === undefined)
			return null;
		if (typeof func == 'function')
			return func;
		if (typeof func == 'string') 
			return window[func];
		return null;
	}
	
	/**
	 * @private
	 * walk the elements and apply a callback method to them
	 */
	function walkElements(callback)
	{
		var obj = [];
		for(var i = 0, element = null; element = formElements[i]; i++)
		{
			// skip the element if it has no name, is of a type with no useful value,
			// or has the data-nosave attribute set
			var type = element.type.toLowerCase();
			var name = element.name || '';
			if(skip[type] === true || name == '' || element.hasAttribute('data-nosave')) 
				continue;

			var tmp = callback(element, name, type);
			if(tmp != null)
				obj.push(tmp);
		}
		return obj;
	}
	
	/**
	 * @private 
	 * sets the value of an element to its saved value
	 */
	function updateElement(element, name, type) {
		var name = name || element.name || '';
		var type = type || element.type.toLowerCase();
		var value = storage.get(name);
		
		var filter = getTransformFunction(element, 'loadfunc');
		if (filter) 
			value = filter(value);
		
		if(checkable[type] === true) {
			if (radio[type] === true)
				element.checked = (element.value == value);
			else
				element.checked = value;
		}
		else {
			element.value = value;
			if (numeric[type] === true && coerceToLimits(element) != value)
				elementChanged(element);
		}
	}
	
	/**
	 * @private 
	 * Fixes the value of a control if it is outside of its min/max
	 */
	function coerceToLimits(element, value) {
		var value = value || element.valueAsNumber;
		if (element.min && value < parseFloat(element.min)) 
			value = element.value = element.min;
		if (element.max && value > parseFloat(element.max)) 
			value = element.value = element.max;
		
		// coerce NaN to 0
		if (isNaN(value))
			value = element.value = 0;
		
		return value;
	}
	
	/**
	 * @private
	 * save the new value of an element
	 */
	function elementChanged(e) {
		var element = e.currentTarget || e;
		var type = element.type.toLowerCase();
		var name = element.name || '';
		var value;
		if (checkable[type] === true)
			value = (radio[type] === true) ? getRadioValue(element) : element.checked;
		else if (numeric[type] === true) {
			value = element.valueAsNumber;
			value = coerceToLimits(element, value);
		}
		else
			value = element.value;
		
		var filter = getTransformFunction(element, 'savefunc');
		if (filter) 
			value = filter(value);
		
		storage.set(name, value);	
	}
	
	/**
	 * @private
	 */
	function setupElement(element, name, type) {
		var type = type || element.type.toLowerCase();
		var name = name || element.name || '';
		
		element.addEventListener('change', elementChanged, true);
		updateElement(element, name, type);
	}
	
	/**
	 * @private 
	 * Makes a button reset the value of an element to its default
	 */
	function addResetButton(button, element) {
		button.addEventListener('click', function() {
			storage.reset(element.name);
			updateElement(element);
		}, false);
	}
	
	/**
	 * @private 
	 * Finds all reset buttons and attaches them to their settings
	 */
	function setupAllResetButtons() {
		var resets = document.querySelectorAll('[data-resets]');
		for (var i = 0; i < resets.length; i++) {
			var elements = document.getElementsByName(resets[i].dataset.resets);
			for (var j = 0; j < elements.length; j++) 
				addResetButton(resets[i], elements[j]);
		}
	}
	
	/**
	 * @private
	 * Finds a reset button linked to a setting
	 */
	function findResetButton(name) {
		try {
			return document.querySelector('[data-resets="' + name + '"]');
		}
		catch (e) {
			return null;
		}
	}
	
	/**
	 * @private
	 */
	function onDOMContentLoaded() {		
		// walk and set the elements accordingly to the storage
		formElements = document.querySelectorAll('input,select,textarea')
		walkElements(setupElement);
		
		setupAllResetButtons();
		
		initialized = true;
	}
	
	
	
	
	/**
	 * Initializes the options page
	 * @param {SettingStorage} [settingstorage] The storage object to use when 
	 *		loading and saving settings. If unused, a new SettingStorage object
	 *		with default settings will be used.
	 */
	this.init = function(settingstorage) {
		storage = settingstorage || new SettingStorage();
		
		window.addEventListener('DOMContentLoaded', onDOMContentLoaded, false);
	}
	
	/**
	 * Updates the value of an element to its value saved in storage
	 * @param {String|HTMLElement|HTMLElement[]} element The name of a setting, a
	 *		specific element to update, or a list of elements to update
	 */
	this.update = function(element) {
		if (!element)
			return;
		
		if (typeof element === 'string')
			element = document.getElementsByName(element);
		if (element.length === undefined)
			updateElement(element);
		else
			for (var i = 0; i < element.length; i++)
				updateElement(element[i]);
	}
	
	/**
	 * Saves the current value of an element to storage
	 * @param {String|HTMLElement|HTMLElement[]} element The name of a setting, a
	 *		specific element to save, or a list of elements to save
	 */
	this.save = function(element) {
		if (!element)
			return;
		
		if (typeof element === 'string')
			element = document.querySelector('[name="' + element + '"]');
		if (element.length === undefined)
			elementChanged(element);
		else
			for (var i = 0; i < element.length; i++)
				elementChanged(element[i]);
	}
	
	/**
	 * Sets up a new &lt;input&gt;, &lt;select&gt; or &lt;textarea&gt; element. 
	 * Use this if an element is dynamically added after the options page loads.
	 * @param {HTMLElement} element The element to add
	 * @param {HTMLElement} [resetbutton] A &lt;button&gt; or other clickable element
	 *		that should reset the setting when clicked. If this parameter is unused and a
	 *		reset button for the setting already exists on the page, it will be used.
	 */
	this.addInput = function(element, resetbutton) {
		if (!initialized) 
			throw new Error('OptionsPage.addInput cannot be called before the DOMContentLoaded event has fired.')
		
		if (element.tagName && isInput(element)) {
			setupElement(element);
			
			var reset = resetbutton || findResetButton(element.name);
			if (reset)
				addResetButton(reset, element);
		}
	}
	
	/**
	 * Returns a &lt;dl&gt; element containing each of the key-value pairs stored in 
	 * the web storage object used by the options page's SettingStorage object.
	 * @param {Function} [sortfunction] A function used to sort the list. If 
	 *		unused, the list will be sorted alphabetically.
	 */
	this.debugStorage = function(sortfunction) {
		var keys = [];
		for (var key in storage.storage)
			keys.push(key);
		
		keys.sort(sortfunction);
		
		var list = document.createElement('dl');
		for (var i = 0; i < keys.length; i++) {
			var term = document.createElement('dt');
			var desc = document.createElement('dd');
			term.textContent = keys[i];
			desc.textContent = storage.storage[keys[i]];
			list.appendChild(term);
			list.appendChild(desc);
		}
		
		return list;
	}
}

