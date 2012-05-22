

// Function.prototype.bind polyfill
if ( !Function.prototype.bind ) {

	Function.prototype.bind = function( obj ) {
		if(typeof this !== 'function') // closest thing possible to the ECMAScript 5 internal IsCallable function
			throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');

		var slice = [].slice,
			args = slice.call(arguments, 1), 
			self = this, 
			nop = function () {}, 
			bound = function () {
				return self.apply( this instanceof nop ? this : ( obj || {} ), 
					args.concat( slice.call(arguments) ) );    
			};

		bound.prototype = this.prototype;

		return bound;
	};
}


/**
 * @class Abstracts a web storage object so that arbitrary objects can be saved via JSON.
 * @property {bool} firstRun true if this is the first time the extension has been
 *		run (this.init() has never been called for this object)
 *	
 *	@property {mixed} someSettingName If you set a default value for a setting, 
 *		a property with the same name will be created. You can use these 
 *		properties to get and set settings without using the get() method. 
 *		The name of each property will be the same as the name used when defining
 *		default values (it will not be "someSettingName").
 * 
 * @constructor
 * @param [defaults] An array of default setting values. Each default value 
 *		should be a two-element array where index 0 contains the setting name and 
 *		index 1 contains its default value. ex: [['setting 1', null], ['setting 2', 'foo']]
 *	@param [options] An object containing extra options
 *	@param [options.initSetting] The name of a setting used to determine whether 
 *		storage has been initialized. If storage has not been initialized, all
 *		settings with default values will be set to their defaults and initSetting
 *		will be set to "true". Defaults to "__initialized". 
 *	@param [options.prefix] A string to place before all setting names. This can 
 *		be used to allow multiple SettingStorage objects in one web storage space.
 *	@param [options.globalInit] Set to "true" to make initSetting ignore the setting
 *		prefix. This option mostly exists to make this library compatible with 
 *		Tab Vault's storage format.
 *	@param [options.useAccessors] Set to "false" to disable creating accessor
 *		properties for each setting. You should disable this if you plan to support
 *		old versions of Opera which do not support Object.defineProperties().
 *	@param [options.storage] The web storage object to use. Defaults to widget.preferences
 */
function SettingStorage() {
	// defaults: [name, defaultValue]
	this.defaults = [];
	this.prefix = '';
	this.storage = widget.preferences;
	this.initSetting = '__initialized';
	this.globalInit = false;
	this.useAccessors = true;

	var firstRun = false;
	this.__defineGetter__('firstRun', function() {return firstRun});

	/**
	 * @private
	 */
	function isDefined(value) {
		return value !== undefined;
	}
	
	/**
	 * @private
	 * Initializes settings
	 */
	function init(defaults, options) {
		if (isDefined(defaults))
			this.defaults = defaults || [];
		
		if (isDefined(options)) {
			if (isDefined(options.prefix))
				this.prefix = options.prefix;
			if (isDefined(options.storage))
				this.storage = options.storage;
			if (isDefined(options.initSetting))
				this.initSetting = options.initSetting;
			if (isDefined(options.globalInit))
				this.globalInit = options.globalInit;
			if (isDefined(options.useAccessors))
				this.useAccessors = options.useAccessors;
		}
		
		if (!getInit.bind(this)())
			firstRun = true;
		
		if (this.useAccessors)
			defineAccessors.bind(this)();
	}
	
	/**
	 * @private
	 * Gets the init flag
	 */
	function getInit() {
		if (this.globalInit) {
			var temp = this.prefix;
			this.prefix = '';
			var init = this.get(this.initSetting);
			this.prefix = temp;
			return init;
		}
		else return this.get(this.initSetting);
	}
	
	/**
	 * @private
	 * Sets the init flag
	 */
	function setInit(value) {
		if (this.globalInit) {
			var temp = this.prefix;
			this.prefix = '';
			this.set(this.initSetting, value);
			this.prefix = temp;
		}
		else
			this.set(this.initSetting, value);
	}

	/**
	 * @private
	 * Defines properties so settings can be referred to by name
	 */
	function defineAccessors() {
		var descriptors = {};
		var reserved = ['init', 'reset', 'resetAll', 'fillDefaults', 'get', 'set', 'getAll', 'setAll'];
		
		/** @private */
		function desc(name) {
			return {
				get: function() { return this.get(name) },
				set: function(x) { this.set(name, x) },
				enumerable: true,
			}
		}
		
		for (var i = 0; i < this.defaults.length; i++) {
			var name = this.defaults[i][0];
			if (reserved.indexOf(name) == -1)
				descriptors[name] = desc(name);
		}
		
		Object.defineProperties(this, descriptors);
	}


	/**
	 * Initializes the storage object. This should be called inside the 
	 * background script only and before any other calls to this object are made.
	 */
	this.init = function() {
		// Fill all uninitialized settings with their default values
		// If 1st time, set the initialized flag.	
		this.fillDefaults();
		if (this.firstRun)
			setInit.bind(this)(true);
	}

	/**
	 * Resets a setting to its default value
	 * @param {String} name The setting to reset
	 */
	this.reset = function(name) {
		for (var i = 0; i < this.defaults.length; i++) {
			if (this.defaults[i][0] == name) {
				this.set(name, this.defaults[i][1]);
				return;
			}
		}
		this.set(name, null);
	}

	/**
	 * Resets all settings to their default values
	 */
	this.resetAll = function() {
		for (var i = 0; i < this.defaults.length; i++)
			this.set(this.defaults[i][0], this.defaults[i][1]);
	}

	/**
	 * Finds any undefined settings and fills them with their default values
	 */
	this.fillDefaults = function() {
		for (var i = 0; i < this.defaults.length; i++) {
			if (!isDefined(this.storage[this.prefix + this.defaults[i][0]]))
				this.set(this.defaults[i][0], this.defaults[i][1]);
		}
	}

	/**
	 * Gets the value of a setting
	 * @param {String} name The setting to get
	 */
	this.get = function(name) {
		var data = this.storage[this.prefix + name];
		if (!isDefined(data))
			return null;
		return JSON.parse(data);
	}

	/**
	 * Sets the value of a setting
	 * @param {String} name The setting to set
	 * @param value The value to save
	 */
	this.set = function(name, value) {
		var temp = JSON.stringify(value);
		this.storage[this.prefix + name] = temp;
	}

	/**
	 * Gets an object with the values of all settings as key-value pairs.
	 * This only retrieves settings that have defined default values.
	 */
	this.getAll = function() {
		var data = {};
		for (var i = 0; i < this.defaults.length; i++) 
			data[this.defaults[i][0]] = this.get(this.defaults[i][0]);
		return data;
	}

	/**
	 * Sets all the settings defined in the data object
	 * @param {Object} data An object containing the names and values of settings
	 *		as key-value pairs
	 */
	this.setAll = function(data) {
		for (var name in data) 
			this.set(name, data[name]);
	}
	
	
	init.bind(this)(arguments[0], arguments[1]);
}




/*
Example initializations:

var storage = new SettingStorage();

var storage = new SettingStorage([
	['setting_1', 'default'],
	['setting_2', null],
]);

var storage = new SettingStorage([
	['setting_1', 1],
	['setting_2', null],
], { prefix: 'st_', storage: localStorage });
*/
