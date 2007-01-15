function initExtraDialog()
{
	var TS = TabbrowserService;


	// status section

	initCheckbox('Locked', 'locked' in gInfo && gInfo.locked);
	initCheckbox('ReferrerBlocked', 'referrerBlocked' in gInfo && gInfo.referrerBlocked);
	initCheckbox('AutoReload', ('autoreloadInterval' in gInfo && gInfo.autoreloadInterval ? true : false ));

	document.getElementById('AutoReloadInterval').value = 'autoreloadInterval' in gInfo ? Math.max(Number(gInfo.autoreloadInterval)/1000, 0) : 0 ;

	initCheckbox('AllowPlugins', 'allowPlugins' in gInfo && gInfo.allowPlugins);
	initCheckbox('AllowJavascript', 'allowJavascript' in gInfo && gInfo.allowJavascript);
	initCheckbox('AllowMetaRedirects', 'allowMetaRedirects' in gInfo && gInfo.allowMetaRedirects);
	initCheckbox('AllowSubframes', 'allowSubframes' in gInfo && gInfo.allowSubframes);
	initCheckbox('AllowImages', 'allowImages' in gInfo && gInfo.allowImages);


	showHideItem('status-groupbox', TS.shouldSaveBookmarksStatus);
	showHideItem('allow-groupbox', TS.shouldSaveBookmarksStatus && TS.shouldSaveBookmarksPermissions);
	showHideItem('description-disabled', !TS.shouldSaveBookmarksStatus);

	controlLinkedItems(document.getElementById('AutoReload'));


	// referrer and favicon
	document.getElementById('IconURI').value = getIcon();
	document.getElementById('ReferrerURI').value = 'referrerURI' in gInfo ? (gInfo.referrerURI || '') : '' ;



	// others
	var checkbox = document.getElementById('UseFixedLabel');
	if (TS.getPref('browser.tabs.extensions.bookmarks.use_fixed_label')) {
		checkbox.setAttribute('disabled', true);
	}
	else {
		checkbox.removeAttribute('disabled');
		initCheckbox('UseFixedLabel', 'useFixedLabel' in gInfo && gInfo.useFixedLabel);
	}

	var box = document.getElementById('TextZoom-box');
	var i;
	if (!TS.getPref('browser.tabs.extensions.bookmarks.save_textZoom')) {
		for (i = 0; i < box.childNodes.length; i++)
			box.childNodes[i].setAttribute('disabled', true);
	}
	else {
		for (i = 0; i < box.childNodes.length; i++)
			box.childNodes[i].removeAttribute('disabled');

		document.getElementById('TextZoom').value = 'textZoom' in gInfo ? Math.min(Math.max(Number(gInfo.textZoom), TabbrowserService.ZOOM_MIN), TabbrowserService.ZOOM_MAX) : 100 ;
	}

	var title = document.documentElement.getAttribute('title').replace(/%s/g, TS.getNameForBookmark(gBookmarkID));
	document.documentElement.setAttribute('title', title);
	document.title = title;
}

function initCheckbox(aID, aFlag)
{
	var node = document.getElementById(aID);
	if (node) {
		if (aFlag)
			node.setAttribute('checked', true);
		else
			node.removeAttribute('checked');
	}
}

function showHideItem(aID, aFlag)
{
	var node = document.getElementById(aID);
	if (node) {
		if (aFlag)
			node.removeAttribute('hidden');
		else
			node.setAttribute('hidden', true);
	}
}


function chooseIcon()
{
	var icon = window.parent.TabbrowserService.chooseIcon();
	if (icon)
		document.getElementById('IconURI').value = icon;
}


function onAccept()
{
	window.opener.document.getElementById('description').value = document.getElementById('description').value;
	window.opener.document.getElementById('IconURI').value = document.getElementById('IconURI').value;
	window.opener.gInfo = window.gInfo;
	window.close();
}



function controlLinkedItems(elem)
{
	var target = elem.getAttribute('linked').split(/ +/);
	var item;

	var disabled = (elem.localName == 'textbox' ? (!elem.value || !Number(elem.value)) : !elem.checked );

	for (var i in target)
	{
		item = document.getElementById(target[i]);
		item.disabled = disabled;
	}
}


function updateDescription(aProperty, aValue)
{
	if (aProperty == 'autoreloadInterval')
		aValue = Math.max(Number(aValue)*1000, 0);

	gInfo[aProperty] = aValue;

	var desc = document.getElementById('description');
	desc.value = TabbrowserService.createNewBookmarkDescription(gBookmarkID, gInfo, desc.value);
}




function activateRelationOfBookmarksAndTabs()
{
	TabbrowserService.setPref('browser.tabs.extensions.bookmarks.save_status', true);
	window.opener.setTimeout('tabextensionsOpenExtraDialog()', 0);
	window.setTimeout('window.close()', 0);
}
