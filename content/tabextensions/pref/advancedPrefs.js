var gData     = window.arguments[0];
var gModified = false;

function init()
{
	initNewTypeLabel();
	initMacLabel();

	var node;
	var nodes;
	var value;
	var i, j;
	for (i in gData)
	{
		node = document.getElementById(i);
		if (!node) continue;

		nodes = node.getElementsByTagName('*');
		if (gData[i].disabled) {
			node.setAttribute('disabled', true);
			if (nodes && nodes.length)
				for (j = 0; j < nodes.length; j++)
					nodes[j].setAttribute('disabled', true);
		}
		else {
			node.removeAttribute('disabled');
			if (nodes && nodes.length)
				for (j = 0; j < nodes.length; j++)
					nodes[j].removeAttribute('disabled');
		}

		if (gData[i].hidden)
			node.setAttribute('hidden', true);
		else
			node.removeAttribute('hidden');

		value = null;
		if (gData[i].node) {
			switch (gData[i].node.localName)
			{
				case 'checkbox':
					value = gData[i].node.checked;
					break;
				case 'textbox':
					value = String(gData[i].node.value);
					break;
				case 'radiogroup':
					value = gData[i].node.value;
					break;
			}
		}

		switch (node.localName)
		{
			case 'checkbox':
				node.checked = value;
				break;
			case 'textbox':
				node.value = value;
				break;
			case 'radiogroup':
				node.selectedItem = node.getElementsByAttribute('value', value)[0];
				break;
		}
	}
}

function apply()
{
	if (gModified &&
		window.opener &&
		window.opener.top &&
		window.opener.top.PrefDialogService)
		window.opener.top.PrefDialogService.onModified();

	window.close();
}

function cancel()
{
	for (var i in gData)
	{
		delete gData[i].newValue;
	}
	window.close();
}



function onCommand(aEvent)
{
	var node = aEvent.target;

	switch (node.localName)
	{
		case 'checkbox':
			updateValue(node.id, node.checked);
			break;

		case 'radio':
			while (node.localName != 'radiogroup')
				node = node.parentNode;
		case 'radiogroup':
		case 'textbox':
			updateValue(node.id, node.value);
			break;
	}
}

function updateValue(aID, aValue)
{
	if (!(aID in gData) || !gData[aID])
		return;

	gData[aID].newValue = aValue;
	gModified = true;
}


function inputToTextField(aID)
{
	gData[aID].newValue = document.getElementById(aID).value;
}


