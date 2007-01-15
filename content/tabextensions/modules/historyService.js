// start of definition 
if (!window.TBEHistoryService) {
	
// static class "TBEHistoryService" 
var TBEHistoryService =
{
	get service()
	{
		return TabbrowserService;
	},
	
	onBeforeInit : function() 
	{
		var nodes, i;
		var b = this.service.browser;

		// Toolbar Items
		if (this.service.isNewTypeBrowser) {
			nodes = document.getElementsByTagName('toolbar');
			for (i = 0; i < nodes.length; i++) {
				nodes[i].__tabextensions__insertItem = nodes[i].insertItem;
				nodes[i].insertItem = this.insertItem;
				nodes[i].addEventListener('TSToolbarItemInserted', gTSToolbarItemsInsertedEventListener, false);
			}
		}


		// History
		if ('gHistoryTree' in window && !this.service.isNewTypeBrowser) {
			if ('OpenURL' in window) {
				window.__tabextensions__OpenURL = window.OpenURL;
				window.OpenURL = this.OpenURL;
			}
			if ('historyOnClick' in window) {
				window.__tabextensions__historyOnClick = window.historyOnClick;
				window.historyOnClick = this.historyOnClick;
			}
		}
		if (this.service.isNewTypeBrowser && 'OpenURL' in window) {
			window.__tabextensions__OpenURL = window.OpenURL;
			window.OpenURL = this.OpenURL;
		}

		// for Firefox 1.1 or later?
		if ('gHistoryTree' in window &&
			'openURL' in window && 'whereToOpenLink' in window) {
			window.__tabextensions__openURL = window.openURL;
			window.openURL = this.openURL;
		}

		if ('gotoHistoryIndex' in window) {
//			window.__tabextensions__gotoHistoryIndex = window.gotoHistoryIndex;
			window.gotoHistoryIndex = this.gotoHistoryIndex;

			if (navigator.platform.indexOf('Mac') < 0) {
				var buttons = {
						back    : null,
						forward : null
					};

				nodes = document.getElementsByAttribute('oncommand', 'gotoHistoryIndex(event);');
				for (i = 0; i < nodes.length; i++)
				{
					nodes[i].addEventListener('click', gotoHistoryIndex, true);
					if (nodes[i].id == 'back-button')
						buttons.back = nodes[i];
					else if (nodes[i].id == 'forward-button')
						buttons.forward = nodes[i];
				}

				// back and forward buttons
				if (this.service.isNewTypeBrowser) {
					gTSToolbarItemsInsertedEventListener(null, 'back-button');
					gTSToolbarItemsInsertedEventListener(null, 'forward-button');
				}
				else {
					for (i in buttons) {
						if (buttons[i]) continue;

						buttons[i] = document.getElementById(i+'-button');
						if (buttons[i])
							buttons[i].addEventListener('click', gotoHistoryIndex, true);
					}
				}
			}
		}
	},
 
	onBeforeDestruct : function() 
	{
		if (this.service.isNewTypeBrowser) {
			var toolbars = document.getElementsByTagName('toolbar');
			for (i = 0; i < toolbars.length; i++)
				toolbars[i].removeEventListener('TSToolbarItemInserted', gTSToolbarItemsInsertedEventListener, false);
		}
	},
 
	// Toolbars (Firefox) 
	
	insertItem : function(aId, aBeforeElt, aWrapper, aBeforePermanent) 
	{
		var ret = this.__tabextensions__insertItem(aId, aBeforeElt, aWrapper, aBeforePermanent);

		// dispatch "TSToolbarItemInserted" event
		var event = document.createEvent('Events');
		event.initEvent('TSToolbarItemInserted', false, true);
		event.targetItem = ret ? ret : null ;
		this.dispatchEvent(event);

		return ret;
	},
  
	// History 
	
	OpenURL : function(aWhereOrInNewTabFlag, aEvent) 
	{
		var inNewTab = (typeof aWhereOrInNewTabFlag != 'number') ? aWhereOrInNewTabFlag : (aWhereOrInNewTabFlag > 1) ;
		if (typeof inNewTab == 'string')
			inNewTab = (inNewTab == 'tab' || inNewTab == 'window');

		var TS = TabbrowserService;

		var currentIndex = gHistoryTree.currentIndex;
		var count        = ('selection' in gHistoryTree.treeBoxObject ? gHistoryTree.treeBoxObject.selection : gHistoryTree.view.selection).count; // "view.selection" is for 1.8a or later. "treeBoxObject.selection" is for 1.7x.

		var behavior = inNewTab ? TS.getPref('browser.tabs.opentabfor.history.middleClickBehavior') :
						!TS.checkToLoadInCurrentTabOf(TS.browserWindow.TabbrowserService.browser) ? TS.getPref('browser.tabs.opentabfor.history.behavior' ) :
						0;

		if (
			!TS.browserWindow ||
			count != 1 ||
			isContainer(gHistoryTree, currentIndex)
			) {
			if (behavior < 0)
				return false;
			else
				return __tabextensions__OpenURL(aWhereOrInNewTabFlag, aEvent);
		}

		if (behavior < 0) return false;


		var builder = gHistoryTree.builder.QueryInterface(Components.interfaces.nsIXULTreeBuilder);
		var uri = builder.getResourceAtIndex(currentIndex).Value;
		var b = TS.browserWindow.TabbrowserService.browser;

		if (behavior == 0) {
			TS.browserWindow.loadURI(uri);
			b.setFocusInternal();
		}
		else if (behavior > 0) {
			var t = b.addTab(uri);
			if (behavior == 1) {
				b.selectedTab = t;
				b.scrollTabbarToTab(t);
				b.setFocusInternal();
			}
		}

		if (!TS.loadInBackgroundWindow)
			TS.browserWindow.focus();

		return true;
	},
 
	openURL : function(aEvent) // for Firefox 1.1 or later? 
	{
		var TS = TabbrowserService;
		var behavior = (
				aEvent.button == 1 ||
				(
					aEvent.button == 0 &&
					(aEvent.ctrlKey || aEvent.metaKey)
				)
			) ? TS.getPref('browser.tabs.opentabfor.history.middleClickBehavior') :
				TS.getPref('browser.tabs.opentabfor.history.behavior') ;

		var b = TS.browserWindow ? TS.browserWindow.gBrowser : null ;


//		if (behavior < 0) return __tabextensions__openURL(aEvent);
		if (behavior < 0) return false;


		var count = gHistoryTree.view.selection.count;
		if (count != 1)
			return;

		var currentIndex = gHistoryTree.currentIndex;
		if (isContainer(gHistoryTree, currentIndex))
			return;

		var builder = gHistoryTree.builder.QueryInterface(Components.interfaces.nsIXULTreeBuilder);
		var uri = builder.getResourceAtIndex(currentIndex).ValueUTF8;

		if (!checkURLSecurity(uri))
			return;

		if (behavior > 0 && !TS.checkToLoadInCurrentTabOf(b)) {
			var t = b.addTab(uri);
			if (t && behavior == 1) {
				b.selectedTab = t;
				b.scrollTabbarToTab(t);
				b.setFocusInternal();
			}
		}
		else {
			TS.browserWindow.loadURI(uri);
		}

		if (!TS.loadInBackgroundWindow)
			TS.browserWindow.focus();
	},
 
	historyOnClick : function(aEvent) // for Mozilla Suite 
	{
		var TS = TabbrowserService;

		var currentIndex = gHistoryTree.currentIndex;
		var count        = ('selection' in gHistoryTree.treeBoxObject ? gHistoryTree.treeBoxObject.selection : gHistoryTree.view.selection).count; // "view.selection" is for 1.8a or later. "treeBoxObject.selection" is for 1.7x.

		var b = TS.browserWindow ? TS.browserWindow.TabbrowserService.browser : null ;

		var middleClick = (
				aEvent.button == 1 ||
				(
					aEvent.button == 0 && (aEvent.ctrlKey || aEvent.metaKey)
				)
			);
		var behavior = middleClick ? TS.getPref('browser.tabs.opentabfor.history.middleClickBehavior') :
				(
					aEvent.button == 0 &&
					!aEvent.shiftKey &&
					!aEvent.ctrlKey &&
					!aEvent.altKey &&
					!aEvent.metaKey &&
					!TS.checkToLoadInCurrentTabOf(b)
				) ? TS.getPref('browser.tabs.opentabfor.history.behavior' ) :
				0;

		if (
			aEvent.button > 1 ||
			(aEvent.button == 0 && !middleClick) ||
			!b ||
			count != 1 ||
			isContainer(gHistoryTree, currentIndex)
			) {
			if (behavior < 0)
				return false;
			else
				return __tabextensions__historyOnClick(aEvent);
		}


		if (behavior < 0) return false;


		var builder = gHistoryTree.builder.QueryInterface(Components.interfaces.nsIXULTreeBuilder);
		var uri = builder.getResourceAtIndex(currentIndex).Value;

		if (behavior == 0) {
			TS.browserWindow.loadURI(uri);
		}
		else {
			var t = b.addTab(uri);
			if (behavior == 1) {
				b.selectedTab = t;
				b.scrollTabbarToTab(t);
				b.setFocusInternal();
			}
		}

		if (!TS.loadInBackgroundWindow)
			TS.browserWindow.focus();
	},
 
	gotoHistoryIndex : function(aEvent, aIndex, aNode) 
	{
		var index = aIndex || aEvent.target.getAttribute('index');
		if (!index) return false;

		var TS    = TabbrowserService,
			TBEHS = TBEHistoryService,
			node  = aNode || aEvent.target;

		if (aEvent.type == 'click' && aEvent.button != 1) return false;


		// Mozilla for MacOS has a bug...it handles a wrong event from the menubar.
		if (navigator.platform.indexOf('Mac') > -1 &&
			aEvent.ctrlKey &&
			aEvent.altKey &&
			aEvent.metaKey) {
			aEvent = {
				type     : aEvent.type,
				button   : aEvent.button,
				ctrlKey  : false,
				metaKey  : false,
				altKey   : false,
				shiftKey : false,
				target   : aEvent.target
			};
		}


		try {
			var b = TS.browser;

			var behavior = (aEvent.type != 'click') ? 0 :
				(
					aEvent.button == 1 ||
					(aEvent.button == 0 && (aEvent.ctrlKey || aEvent.metaKey))
				) ? TS.getPref('browser.tabs.opentabfor.goToHistoryIndex.middleClickBehavior') :
					TS.checkToLoadInCurrentTabOf(b) ? TS.getPref('browser.tabs.opentabfor.goToHistoryIndex.behavior') :
					0;

			if (index == 'back')
				b.goBackGroup();
			else if (index == 'forward')
				b.goForwardGroup();
			else if (behavior > 0) {
				var SH = null;
				try {
					SH = b.sessionHistory;
				}
				catch(ex) {
					return false;
				}

				var entry = SH.getEntryAtIndex(index, false);
				if (!entry) return false;

				entry = entry.QueryInterface(Components.interfaces.nsISHEntry);
				var t = b.addTab(entry.URI.spec, entry.referrerURI);

				if (behavior == 1) {
					b.selectedTab = t;
					b.scrollTabbarToTab(b.selectedTab);
					b.setFocusInternal();
				}
			}
			else if (behavior == 0)
				b.webNavigation.gotoIndex(index);
			else
				return false;
		}
		catch(e) {
			return false;
		}


		if (node) {
			var parent = node;
			while (parent)
			{
				if ('hidePopup' in parent)
					parent.hidePopup();
				else if ('closePopup' in parent)
					parent.closePopup();

				parent = parent.parentNode;
			}
		}
		return true;
	}
    
}; 

 
// Listeners 
	
var gTSToolbarItemsInsertedEventListener = function(aEvent, aId) 
{
	if (!aEvent && !aId) return;

	var node = aId ? document.getElementById(aId) : aEvent.targetItem ;
	if (!node) return;

	switch (node.id)
	{
		case 'back-button':
			node.setAttribute('onclick', 'if (event.target != this) gotoHistoryIndex(event); event.stopPropagation();');
			break;

		case 'forward-button':
			node.setAttribute('onclick', 'if (event.target != this) gotoHistoryIndex(event); event.stopPropagation();');
			break;

		default:
			break;
	}
};
  
// end of definition 

if (!window.TabbrowserServiceModules)
	window.TabbrowserServiceModules = [];

TabbrowserServiceModules.push(TBEHistoryService);
}
 
