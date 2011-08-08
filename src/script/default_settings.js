
// Initialize a storage object with all our settings and their default values.
// The default values only need to be set when initializing for the background
// script (so settings can be initialized on the first run) and for the options
// page (so settings can be reset to their default values).

// There is another optional argument which can be filled with configuration 
// options. For example, you can store settings in localStorage instead of
// widget.preferences. See the documentation for more details.

var storage = new SettingStorage([
	['checkbox', true],
	['textbox', 'foo'],
	['numeric', 42],
	['range', 0],
	['color', '#ff0000'],
	['textarea', 'This is a <textarea>.\r\nIt has multiple lines.'],
	['transform', [ 'foo', 'bar', 'baz' ]],
	['radio', 'one'],
	['formradio', 'two'],
	['select', 'bar'],
	['date', '1970-01-01'],
	['dynamic1', 'dynamic textbox'],
	['dynamic2', '4'],
]);

// For pages that do not need default values, you can initialize like this:
// var storage = new SettingStorage()