var gExceptions;

var gExceptionsList;
var gListShouldAcceptWindowOpen;
var gURIBox;
var gAddButton;
var gRemoveButton;
var gRemoveAllButton;

var gAllowPopupWithOption;
var gAllowPopupWithOptionValue;

function init()
{
	gListShouldAcceptWindowOpen = ('arguments' in window && window.arguments.length > 1) ? window.arguments[1] : (TabbrowserService.opentabforJS || TabbrowserService.winHookMode > 0) ;

	gExceptionsList  = document.getElementById('exceptions');
	gURIBox          = document.getElementById('URIBox');
	gAddButton       = document.getElementById('addButton');
	gRemoveButton    = document.getElementById('removeButton');
	gRemoveAllButton = document.getElementById('removeAllButton');

	document.documentElement.addEventListener('keypress', onReturnHit, true);

	gAllowPopupWithOption = document.getElementById('allowPopupWithOption');
	gAllowPopupWithOptionValue = document.getElementById('allowPopupWithOptionValue');
	gAllowPopupWithOptionValue.value = TabbrowserService.getPref(gAllowPopupWithOptionValue.getAttribute('prefstring'));
	if (Number(gAllowPopupWithOptionValue.value) == 0)
		gAllowPopupWithOption.removeAttribute('checked');
	else
		gAllowPopupWithOption.setAttribute('checked', true);


	window.sizeToContent();
	window.setTimeout(initWithDelay, 0);
}
function initWithDelay()
{
	if ('arguments' in window &&
		window.arguments[0])
		gURIBox.value = window.arguments[0];

	initList();
}


function initList(aListShouldAcceptWindowOpen)
{
	var shouldAcceptWindowOpen = (aListShouldAcceptWindowOpen !== void(0)) ? aListShouldAcceptWindowOpen : gListShouldAcceptWindowOpen ;
	gExceptions = shouldAcceptWindowOpen ? TabbrowserPopupController.JSWindowOpenExceptionsWhite : TabbrowserPopupController.JSWindowOpenExceptionsBlack ;

	initMessages(shouldAcceptWindowOpen);

	var range = document.createRange();
	range.selectNodeContents(gExceptionsList);
	range.deleteContents();
	range.detach();

	var item;
	var node;
	for (var i = 0; i < gExceptions.length; i++)
	{
		node = gExceptions.item(i);

		item = document.createElement('listitem');
		item.setAttribute('label', gExceptions.getData(node, 'Rule'));
		gExceptionsList.appendChild(item);
	}

	gRemoveButton.setAttribute('disabled', true);
	if (gExceptionsList.hasChildNodes())
		gRemoveAllButton.removeAttribute('disabled');
	else
		gRemoveAllButton.setAttribute('disabled', true);
}

function initMessages(aShouldAcceptWindowOpen)
{
	var type = aShouldAcceptWindowOpen ? 'white' : 'black' ;
	window.title = document.getElementById('labelTitle-'+type).getAttribute('label');

	var range = document.createRange();

	var desc = document.getElementById('description');
	range.selectNodeContents(desc);
	range.deleteContents();
	desc.appendChild(document.createTextNode(document.getElementById('labelDesc-'+type).getAttribute('label')));

	var note = document.getElementById('note');
	range.selectNodeContents(note);
	range.deleteContents();
	note.appendChild(document.createTextNode(document.getElementById('labelNote-'+type).getAttribute('label')));

	var onlyForWhiteListGroup = document.getElementById('exceptionsForAnyWebPage');
	if (type == 'white')
		onlyForWhiteListGroup.removeAttribute('collapsed');
	else
		onlyForWhiteListGroup.setAttribute('collapsed', true);

	range.detach();

	window.sizeToContent();
}


function addURI()
{
	var uri = gURIBox.value;
	if (!uri) return;

	gExceptions.setData(uri, 'Rule', uri);
	gURIBox.value = '';
	initList();
}

function removeURI()
{
	if (!gExceptionsList.selectedItem) return;

	var uri = gExceptionsList.selectedItem.getAttribute('label');

	gExceptions.removeData(uri);
	initList();
}

function removeAllURIs()
{
	gExceptions.clearData();
	initList();
}




function onSelect()
{
	if (gExceptionsList.selectedItem)
		gRemoveButton.removeAttribute('disabled');
	else
		gRemoveButton.setAttribute('disabled', true);
}

function onReturnHit(aEvent)
{
	var focusedElement = document.commandDispatcher.focusedElement;

	if (!focusedElement ||
		(aEvent.keyCode != aEvent.DOM_VK_ENTER &&
		aEvent.keyCode != aEvent.DOM_VK_RETURN)) return;

	aEvent.stopPropagation();
	if (focusedElement == gURIBox.inputField)
		gAddButton.doCommand();
}



function onAccept()
{
	if (Number(gAllowPopupWithOptionValue.value) != TabbrowserService.getPref(gAllowPopupWithOptionValue.getAttribute('prefstring')))
		TabbrowserService.setPref(gAllowPopupWithOptionValue.getAttribute('prefstring'), Number(gAllowPopupWithOptionValue.value));

	window.close();
}
