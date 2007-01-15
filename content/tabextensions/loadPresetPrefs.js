var gMethod = (
		'arguments' in window &&
		window.arguments
	) ? window.arguments[0] : 'default' ;


const pref = Components.classes['@mozilla.org/preferences;1'].getService(Components.interfaces.nsIPrefBranch);

var gList;
var TS = TabbrowserService;

function init()
{
	document.documentElement.setAttribute('method', gMethod);

	gList = document.getElementById('presetPrefs');

	var restoreItem = document.getElementsByAttribute('name', '_restore')[0];
	if (gMethod == '_switch') {
		restoreItem.removeAttribute('hidden');
		restoreItem.removeAttribute('disabled');

		gList.selectedItem = restoreItem;
	}
	else {
		restoreItem.setAttribute('hidden', true);
		restoreItem.setAttribute('disabled', true);

		gList.selectedItem = document.getElementsByAttribute('name', TabbrowserService.getPref('browser.tabs.extensions.default.preset'))[0] || document.getElementsByAttribute('name', 'novice')[0];
	}


	onListSelect();


	var cancelButton = document.documentElement.getButton('cancel');

	if (gMethod == '_init') {
		window.setTimeout('window.moveTo((screen.availWidth-window.outerWidth)/2, (screen.availHeight-window.outerHeight)/2); window.focus();', 0);
		cancelButton.setAttribute('hidden', true);
	}
	else
		cancelButton.removeAttribute('hidden');

	gList.focus();
}

function accept()
{
	var preset;
	if (gMethod == '_switch') {
		preset = TabbrowserService.getPref('browser.tabs.extensions.default.preset');
		if (preset && preset.charAt(0) != '_')
			TabbrowserService.setPref('browser.tabs.extensions.default.preset.backup', preset);
	}


	if (document.getElementById('presetRadio').selectedItem == document.getElementById('fromList')) {
		preset = gList.selectedItem.getAttribute('name');
	}
	else {
		preset = '_import';
		TabbrowserService.setPref('browser.tabs.extensions.default.import', document.getElementById('importFileURL').value);
	}


	if (preset != '_restore') {
		TabbrowserService.setPref('browser.tabs.extensions.default.preset', '_recall');
		TabbrowserService.setPref('browser.tabs.extensions.default.preset.shouldLoad', preset);
	}

	window.close();
}


function isValidLeftClick(aEvent, aName)
{
	return (aEvent.button == 0 && aEvent.originalTarget.localName == aName);
}

function onListSelect()
{
	var item = gList.selectedItem;
	document.getElementById('caption').setAttribute('value', item.getAttribute('label'));

	var desc = document.getElementById('description');

	var range = document.createRange();
	range.selectNodeContents(desc);
	range.deleteContents();
	range.detach();

	desc.appendChild(document.createTextNode(item.getAttribute('description')));
}


function onChangeRadio()
{
	var group              = document.getElementById('presetRadio');
	var fromListItem       = document.getElementById('fromList');
	var shouldLoadFromList = group.selectedItem == fromListItem;

	var importFileURL = document.getElementById('importFileURL');

	var caption = document.getElementById('caption');
	var desc    = document.getElementById('description');


	var i;
	if (shouldLoadFromList) {
		gList.removeAttribute('disabled');
		for (i = 0; i < gList.childNodes.length; i++)
			gList.childNodes[i].removeAttribute('disabled');
		caption.removeAttribute('disabled');
		desc.removeAttribute('disabled');

		importFileURL.setAttribute('disabled', true);
	}
	else {
		gList.setAttribute('disabled', true);
		for (i = 0; i < gList.childNodes.length; i++)
			gList.childNodes[i].setAttribute('disabled', true);
		caption.setAttribute('disabled', true);
		desc.setAttribute('disabled', true);

		importFileURL.removeAttribute('disabled');

		importFileURL.value = getImportFileURL() || '';

		if (!importFileURL.value)
			window.setTimeout(function() {
				group.selectedItem = fromListItem;
				onChangeRadio();
			}, 0);
	}
}

function getImportFileURL()
{
	const DIR = Components.classes['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties);
	var home = DIR.get('Home', Components.interfaces.nsILocalFile);

	const nsIFilePicker = Components.interfaces.nsIFilePicker;
	var file = TS.chooseFile(
			TS.strbundle.GetStringFromName('importPrefs_chooseFile'),
			{
				displayDirectory : home
			},
			[
				{
					label   : TS.strbundle.GetStringFromName('importPrefs_chooseFileFilterLabel'),
					pattern : '*.js'
				},
				{ filter : nsIFilePicker.filterAll }
			]
		);
	if (!file) return null;


	var uri = TS.getURLSpecFromFile(file);
	var prefs = TS.readFromURI(uri);
	if (prefs.indexOf('// Tabbrowser Extensions preferences') != 0) {
		alert(TS.strbundle.GetStringFromName('importPrefs_invalidFile'));
		return null;
	}

	return uri;
}