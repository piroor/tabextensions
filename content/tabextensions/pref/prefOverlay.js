
function advancedPrefs(aURI, aData)
{
	window.openDialog(aURI, '_blank', 'chrome,dialog,modal,centerscreen', aData);

	var count = 0;

	for (var i in aData)
	{
		if (!('newValue' in aData[i])) continue;

		if ('node' in aData[i]) {
			switch (aData[i].node.localName)
			{
				case 'checkbox':
					switch (typeof aData[i].newValue)
					{
						case 'string':
							aData[i].newValue = aData[i].newValue == 'true';
							break;
						case 'number':
							aData[i].newValue = aData[i].newValue != 0;
							break;
						default:
							break;
					}
					aData[i].node.checked = aData[i].newValue;
					break;
				case 'textbox':
					aData[i].node.value = aData[i].newValue;
					break;
				case 'radiogroup':
					aData[i].node.selectedItem = aData[i].node.getElementsByAttribute('value', aData[i].newValue)[0];
					break;
			}
		}

		if ('onModified' in aData[i])
			aData[i].onModified();

		delete aData[i].newValue;
		count++;
	}

	return (count > 0);
}


function controlLinkedItems(elem, aShouldEnable, aAttr) 
{
	var target = elem.getAttribute(aAttr || 'linked').split(/ +/);
	var item;

	var disabled = (aShouldEnable !== void(0)) ? !aShouldEnable :
				(elem.localName == 'textbox' ? (!elem.value || !Number(elem.value)) : !elem.checked );

	for (var i in target)
	{
		item = document.getElementById(target[i]);
		if (item) {
			if (disabled)
				item.setAttribute('disabled', true);
			else
				item.removeAttribute('disabled');
		}
	}
}

function spinButtonsUpDown(aEvent, aTargetID, aMin, aMax)
{
	var eventNode = aEvent.target;
	while (eventNode.localName != 'spinbuttons')
		eventNode = eventNode.parentNode;

	var buttonNode = aEvent.originalTarget;
	while (buttonNode.localName != 'image')
		buttonNode = buttonNode.buttonNode;

	if (eventNode.getAttribute('disabled') == 'true' ||
		eventNode.disabled) return;


	var node = document.getElementById(aTargetID);
	var val = Number(node.value);
	if (isNaN(val)) val = 0;

	if (buttonNode.getAttribute('class') == 'up')
		val++;
	else if (buttonNode.getAttribute('class') == 'down')
		val--;

	if (
		(aMin !== void(0) && val < aMin) ||
		(aMax !== void(0) && val > aMax)
		)
		return;

	node.value = val;
}


function isModified(aKey, aPageURI)
{
	if (!aPageURI) aPageURI = location.href;

	var pageData = parent.hPrefWindow.wsm.dataManager.pageData;
	if (aPageURI in pageData) {
		var data = pageData[aPageURI];
		return (data && 'modifiedData' in data && aKey in data.modifiedData && data.modifiedData[aKey].value);
	}
	return false;
}

function onModified(aKey, aNewValue, aPanel)
{
	if (!aPanel) aPanel = location.href;

	var pageData = parent.hPrefWindow.wsm.dataManager.pageData;
	if (!(aPanel in pageData))
		pageData[aPanel] = [];

	var data = pageData[aPanel];
//	if (!('modifiedData' in data))
//		data.modifiedData = [];
	if (!('valueData' in data))
		data.valueData = [];

//	if (aKey in data.modifiedData)
//		data.modifiedData[aKey].value = !data.modifiedData[aKey].value;
//	else
//		data.modifiedData[aKey] = { value : true };

	data.valueData[aKey] = { value : aNewValue };
}

function getModifiedValue(aKey, aPanel)
{
	if (!aPanel) aPanel = location.href;

	var pageData = parent.hPrefWindow.wsm.dataManager.pageData;
	if (aPanel in pageData) {
		var data = pageData[aPanel];
		if (data && 'valueData' in data && aKey in data.valueData)
			return data.valueData[aKey].value;
	}

	return TabbrowserService.getPref(aKey);
}



function initNewTypeLabel()
{
	if (TabbrowserService.isNewTypeBrowser) {
		var newTypeLabels = document.getElementsByAttribute('newtypelabel-for', '*');
		var node;

		for (var i = 0; i < newTypeLabels.length; i++)
		{
			node = document.getElementById(newTypeLabels[i].getAttribute('newtypelabel-for'));
			if (!node) continue;
			node.setAttribute('label', newTypeLabels[i].getAttribute('value'));
			if (node.localName != 'caption')
				node.setAttribute('flex', 1);
		}
	}
}

function initMacLabel()
{
	if (navigator.platform.match(/Mac/)) {
		var macLabels = document.getElementsByAttribute('maclabel-for', '*');
		var node;

		for (var i = 0; i < macLabels.length; i++)
		{
			node = document.getElementById(macLabels[i].getAttribute('maclabel-for'));
			if (!node) continue;
			node.setAttribute('label', macLabels[i].getAttribute('value'));
			if (node.localName != 'caption')
				node.setAttribute('flex', 1);
		}
	}
}



function activateAllControlsIn(aNode, aEnabled)
{
	var nodes = document.evaluate(
			'descendant::*[contains("label,textbox,spinbuttons,radio,radiogroup,caption,tab,description", local-name()) or contains(concat(" ", @class, " "), " control ")]',
			aNode,
			{
				lookupNamespaceURI : function(aPrefix)
				{
					return 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
				}
			},
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null
		);

	for (var i = 0, max = nodes.snapshotLength; i < max; i++)
		if (aEnabled)
			nodes.snapshotItem(i).removeAttribute('disabled');
		else
			nodes.snapshotItem(i).setAttribute('disabled', true);
}
