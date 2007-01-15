// start of definition 
if (!window.TBEMiscOverlay) {
	
// static class "TBEMiscOverlay" 
var TBEMiscOverlay =
{
	get service()
	{
		return TabbrowserService;
	},
	
	onBeforeInit : function() 
	{
		var nodes, i;
		var b = this.service.browser;


		window.__tabextensions__goQuitApplication = window.goQuitApplication;
		window.goQuitApplication = this.goQuitApplication;


		window.BrowserOpenTab = this.BrowserOpenTab;

		// for Netscape 7
		if (b) b.newTab = this.BrowserOpenTab;

		if (window.BrowserCloseTabOrWindow) {
			window.BrowserCloseTabOrWindow = this.BrowserCloseTabOrWindow;
		}


		if (this.service.isNewTypeBrowser &&
			this.service.isBrowserWindow &&
			'ctrlNumberTabSelection' in window)
			window.ctrlNumberTabSelection = this.ctrlNumberTabSelection;


		// native tabbed browsing (Firefox 1.0 or later)
		if ('nsBrowserAccess' in window) {
			nsBrowserAccess.prototype.__tabextensions__openURI = nsBrowserAccess.prototype.openURI;
			nsBrowserAccess.prototype.openURI = this.nsBrowserAccessOpenURI;

			// old method for Firefox 1.1 or later.
			try {
				window.QueryInterface(Components.interfaces.nsIDOMChromeWindow).browserDOMWindow = null;
				window.QueryInterface(Components.interfaces.nsIDOMChromeWindow).browserDOMWindow = new nsBrowserAccess();
			}
			catch(e) {
				if (this.service.debug) dump('NOTE: The NEW METHOD to override nsBrowserAccess is skipped.\n'+e+'\n');
			}

			// old method for Firefox 1.0 or before.
			try {
				var util = gBrowser.docShell
					.QueryInterface(nsCI.nsIDocShellTreeItem)
					.rootTreeItem
					.QueryInterface(nsCI.nsIInterfaceRequestor)
					.getInterface(nsCI.nsIDOMWindow)
					.QueryInterface(nsCI.nsIInterfaceRequestor)
					.getInterface(nsCI.nsIDOMWindowUtils);
				if (util) {
					util.browserDOMWindow = null;
					util.browserDOMWindow = new nsBrowserAccess();
				}
			}
			catch(e) {
				if (this.service.debug) dump('NOTE: The OLD METHOD to override nsBrowserAccess is skipped.\n'+e+'\n');
			}
		}


		// kill original confirming
		if ('WindowIsClosing' in window) {
			window.WindowIsClosing = function() { return true; };
		}
		if ('BrowserTryToCloseWindow' in window) {
			window.BrowserTryToCloseWindow = function() {
				if (TBEBrowserService.onWindowClose()) {
					if ('BrowserCloseWindow' in window)
						window.BrowserCloseWindow();
					else
						window.close();
				}

				return true;
			};
		}



		window.__tabextensions__BrowserBack = window.BrowserBack;
		window.BrowserBack = this.BrowserBack;

		window.__tabextensions__BrowserForward = window.BrowserForward;
		window.BrowserForward = this.BrowserForward;

		window.__tabextensions__FillHistoryMenu = window.FillHistoryMenu;
		window.FillHistoryMenu = this.FillHistoryMenu;

		window.__tabextensions__UpdateBackForwardButtons = window.UpdateBackForwardButtons;
		window.UpdateBackForwardButtons = this.UpdateBackForwardButtons;
	},
 
	// native tabbed browsing (Firefox 1.0 or later) 
	nsBrowserAccessOpenURI : function(aURI, aOpener, aWhere, aContext)
	{
		var TS = TabbrowserService;
		if (TS.debug)
			dump('TBEMiscOverlay::nsBrowserAccessOpenURI CALLED!!\n');

		const nsIBrowserDOMWindow = 'nsIBrowserDOMWindow' in Components.interfaces ? Components.interfaces.nsIBrowserDOMWindow : 'nsIBrowserWindow' in Components.interfaces ? Components.interfaces.nsIBrowserWindow : null ;


		var uri = aURI ? aURI.spec : 'about:blank';
		var loadInBackground;
		var loadInBackgroundWindow;

		switch (aContext)
		{
			case nsIBrowserDOMWindow.OPEN_EXTERNAL:
				if (aWhere == nsIBrowserDOMWindow.OPEN_DEFAULTWINDOW)
	//				aWhere = TS.getPref('browser.link.open_external');
					aWhere = TS.platformNativeBehavior == 2 ? nsIBrowserDOMWindow.OPEN_NEWTAB :
							TS.platformNativeBehavior == 3 ? nsIBrowserDOMWindow.OPEN_NEWWINDOW :
							nsIBrowserDOMWindow.OPEN_CURRENTWINDOW;
				loadInBackground       = TS.getPref('browser.tabs.extensions.loadInBackgroundPlatformNative');
				loadInBackgroundWindow = TS.getPref('browser.tabs.extensions.loadInBackgroundWindow.platformNative');
				break;

			/*
				This section will be called from links[target], form[target],
				or javascript. But likns are handled in "contentAreaClick".
				We can ignore cases from links in this section.
			*/
			default:
				if (aWhere == nsIBrowserDOMWindow.OPEN_DEFAULTWINDOW)
					aWhere = TS.getPref('browser.link.open_newwindow');

				// see "hookContentAreaEvents" in tabextensions.xml
				if (aOpener) {
//					alert('@TBEMiscOverlay.nsBrowserAccessOpenURI()\n'+aOpener.__tabextensions__lastTarget+'\n'+aOpener.__tabextensions__lastAction+'\n'+aOpener.__tabextensions__lastHref+'\n'+uri);
					if (
						aOpener.__tabextensions__lastTarget &&
						(
							TS.makeURLAbsolute(aOpener.location.href, aOpener.__tabextensions__lastAction) == uri ||
							TS.makeURLAbsolute(aOpener.location.href, aOpener.__tabextensions__lastHref) == uri
						)
						) {
						loadInBackground = TS.getPref('browser.tabs.opentabfor.links.targetBehavior');
						loadInBackground = (loadInBackground < 0) ? TS.loadInBackground : (loadInBackground == 2) ;
					}
					else
						loadInBackground = TS.getPref('browser.tabs.extensions.loadInBackgroundJS');
				}
				else
					loadInBackground = TS.loadInBackground;

				loadInBackgroundWindow = TS.loadInBackgroundWindow;
				break;
		}

		if (TS.winHookMode == 2 &&
			aWhere != nsIBrowserDOMWindow.OPEN_CURRENTWINDOW) {
			aWhere = nsIBrowserDOMWindow.OPEN_NEWTAB;
		}

		if (
			aWhere == nsIBrowserDOMWindow.OPEN_NEWTAB &&
			TS.checkToLoadInCurrentTabOf(gBrowser)
			)
			aWhere = nsIBrowserDOMWindow.OPEN_CURRENTWINDOW;


		var referrer = null;
		try {
			if (aOpener)
				referrer = TS.makeURIFromSpec(Components.lookupMethod(aOpener, 'location').call(aOpener));
		}
		catch(e) {
		}


		try {
			if (referrer)
				TS.uriSecurityCheck(uri, referrer.spec);
		}
		catch(e) {
			return;
		}

		/*
			When new tab is loaded, the top-level XUL window always gets focus.
			If there is only the browser window, the window is focused even if
			we wish it to stay in background.
			This dummy window gets the focus instead of the browser window,
			and closes itself after a while.
		*/
		var dummyWindow;
		if (loadInBackgroundWindow) {
			dummyWindow = window.openDialog('chrome://tabextensions/content/dummyWindow.xul', '', 'chrome,width=1,height=1,titlebar=no,screenX=16777216,screenY=16777216');
			try { // ”O‚Ì‚½‚ßB
				dummyWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShell)
					.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
					.treeOwner
					.QueryInterface(Components.interfaces.nsIBaseWindow)
					.visibility = false;
			}
			catch(e) {
			}
		}


		var newWindow = null;

		switch (aWhere)
		{
			case nsIBrowserDOMWindow.OPEN_NEWWINDOW:
				newWindow = window.openDialog(TS.browserURI, '_blank', 'chrome,all,dialog=no', uri);
				if (!loadInBackgroundWindow) newWindow.focus();
				break;

			case nsIBrowserDOMWindow.OPEN_NEWTAB:
				var info = {};
				if (aOpener && gBrowser.tabGroupsAvailable) {
					var topWin = Components.lookupMethod(aOpener, 'top').call(aOpener);
					var max = gBrowser.mTabs.length;
					for (var i = 0; i < max; i++)
					{
						if (gBrowser.mTabs[i].mBrowser.contentWindow == topWin) {
							info.parentTab           = gBrowser.mTabs[i].tabId;
							info.openedAutomatically = true;

							var openIn = TS.getPref('browser.tabs.extensions.open_tab_in_link');
							if (openIn > -1) info.openIn = openIn;
							break;
						}
					}
				}

				var newTab = gBrowser.addTabInternal('about:blank', null, info);
				if (!loadInBackground) gBrowser.selectedTab = newTab;
				if (!loadInBackgroundWindow) window.focus();

				newWindow = newTab.mBrowser.docShell
							.QueryInterface(Components.interfaces.nsIWebNavigation)
							.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
							.getInterface(Components.interfaces.nsIDOMWindow);

				newTab.mBrowser.docShell
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIWebNavigation)
					.loadURI(
						uri,
						Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
						referrer,
						null,
						null
					);

				if (aOpener && info.parentTab)
					newTab.parentTab = gBrowser.getTabByTabId(info.parentTab);


				window.setTimeout(
					function() {
						try {
							var name = Components.lookupMethod(newWindow, 'name').call(newWindow);
							if (name) {
								newTab.browserName = name;
							}
						}
						catch(e) {
						}
					},
					10
				);
				break;

			default: // OPEN_CURRENTWINDOW or an illegal value
				try {
					if (aOpener) {
						newWindow = Components.lookupMethod(aOpener, 'top').call(aOpener);
						newWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
							.getInterface(Components.interfaces.nsIWebNavigation)
							.loadURI(
								uri,
								Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
								referrer,
								null,
								null
							);
					}
					else {
						newWindow = gBrowser.docShell
									.QueryInterface(Components.interfaces.nsIWebNavigation)
									.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
									.getInterface(Components.interfaces.nsIDOMWindow);
						loadURI(uri, null);
					}
				}
				catch(e) {
				}
				if (!loadInBackgroundWindow) window.focus();
				break;
		}

		if (dummyWindow && loadInBackgroundWindow) {
			dummyWindow.focus();
			window.setTimeout(function() { dummyWindow.close(); }, 100);
		}


		if (
			TabbrowserService.browser.mTabs.length > 1 ||
			aWhere == nsIBrowserDOMWindow.OPEN_NEWTAB
			)
			TabbrowserService.preventModifyWindowState(newWindow);

		return newWindow;
	},
   
	// General Functions 
	
	BrowserOpenTab : function() 
	{
		if ('gInPrintPreviewMode' in window && window.gInPrintPreviewMode)
			return;

		var TS = TabbrowserService;
		var b  = TS.browser;

		// 0 = blank, 1 = home, 2 = last, -1 = inherit
		var startup = TS.getPref('browser.tabs.loadOnNewTab');
		if (startup === null) // for 1.4a or earlier
			startup = TS.getPref('browser.tabs.extensions.startup.page');

		if (startup == -1 ||
			startup == 100) /* old implementation (for 1.4a or earlier) */
			startup = (TS.isNewTypeBrowser) ? 1 : TS.getPref('browser.startup.page') ;

		var uri = 'about:blank';

		var replaceURI = null;
		switch (startup)
		{
			default:
			case 0:
				if (!TS.getPref('browser.tabs.extensions.clear_location_bar'))
					replaceURI = b.currentURI.spec;
				else
					replaceURI = '';
				break;

			case 1:
				uri = 'getHomePage' in window ? getHomePage() :
						'gHomeButton' in window && 'getHomePage' in gHomeButton ? gHomeButton.getHomePage() :
						'about:blank' ;
				if (typeof uri != 'string')
					uri = uri[0];
				if (TS.isNewTypeBrowser && uri.search(/.\|./) > -1)
					uri = uri.split('|')[0];

				if (uri == 'about:blank' &&
					TS.getPref('browser.tabs.extensions.clear_location_bar'))
					replaceURI = '';

				break;

			case 2:
				uri = b.currentURI.spec;
				break;
		}

		var newTab = b.addTab(uri);

		if (!TS.getPref('browser.tabs.extensions.loadInBackgroundNewTab')) {
			b.selectedTab = newTab;
			b.scrollTabbarToTab(b.selectedTab);
			window.setTimeout(TBEMiscOverlay.BrowserOpenTabCallBack, 0, replaceURI, uri);
		}
	},
	BrowserOpenTabCallBack : function(aShouldBeDisplayedURI, aLoadedURI)
	{
		if (aShouldBeDisplayedURI !== null)
			gURLBar.value = aShouldBeDisplayedURI;

		var navBar = document.getElementById('nav-bar');
		if (aLoadedURI == 'about:blank' &&
			!navBar.hidden &&
			window.locationbar.visible)
			window.setTimeout('Components.lookupMethod(gURLBar, \'focus\').call(gURLBar);', 0);
		else
			gBrowser.setFocusInternal();
	},
 
	BrowserCloseTabOrWindow : function() 
	{
		var browser = TabbrowserService.browser;
		if (
			browser &&
			browser.localName == 'tabbrowser' &&
			browser.canRemoveCurrentTab()
			) {
			browser.removeCurrentTab();
			return;
		}

		if (!TabbrowserService.getPref('browser.tabs.extensions.close_only_tab'))
			BrowserCloseWindow();
	},
 
	BrowserBack : function(aEvent, aIgnoreAlt) 
	{
		var targetTab = TBEMiscOverlay.getTabForBackToAncestor();
		if (targetTab) {
			gBrowser.selectedTab = targetTab;
			gBrowser.scrollTabbarToTab(gBrowser.selectedTab);
			return;
		}
		__tabextensions__BrowserBack(aEvent, aIgnoreAlt);
	},
	getTabForBackToAncestor : function(aForce) {
		var parentTab;
		if (
			TabbrowserService.getPref('browser.tabs.extensions.back_to_ancestor') &&
			(aForce || !gBrowser.canGoBack) &&
			(parentTab = gBrowser.selectedTab.parentTab)
			)
			return parentTab;

		return null;
	},
 
	BrowserForward : function(aEvent, aIgnoreAlt) 
	{
		var targetTab = TBEMiscOverlay.getTabForForwardToFollowing();
		if (targetTab) {
			gBrowser.selectedTab = targetTab;
			gBrowser.scrollTabbarToTab(gBrowser.selectedTab);
			return;
		}
		__tabextensions__BrowserForward(aEvent, aIgnoreAlt);
	},
	getTabForForwardToFollowing : function(aForce) {
		var targetTab = null;;
		if (TabbrowserService.getPref('browser.tabs.extensions.forward_to_following') &&
			(aForce || !gBrowser.canGoForward)) {
			if (gBrowser.selectedTab.hasChildTabs()) {
				targetTab = gBrowser.selectedTab.childTabs[0];
			}
			else if (targetTab = gBrowser.selectedTab.parentTab) {
				var tabs = targetTab.childTabs;
				targetTab = null;
				for (var i = 0, max = tabs.length; i < max; i++)
				{
					if (tabs[i] == gBrowser.selectedTab && i < max-1) {
						targetTab = tabs[i+1];
						break;
					}
				}
			}
		}
		return targetTab;
	},
 
	FillHistoryMenu : function(aParent, aMenu)
	{
		var range = document.createRange();
		range.selectNodeContents(aParent);
		var customItems = aParent.getElementsByAttribute('targetTab', '*');
		if (customItems.length) {
			range.setStartBefore(customItems[0].previousSibling || customItems[0]);
			range.deleteContents();
			range.detach();
		}

		__tabextensions__FillHistoryMenu(aParent, aMenu);

		var tab;
		if (
			(aMenu == 'back' && (tab = TBEMiscOverlay.getTabForBackToAncestor(true))) ||
			(aMenu == 'forward' && (tab = TBEMiscOverlay.getTabForForwardToFollowing(true)))
			) {

			if (aParent.hasChildNodes()) {
				aParent.appendChild(document.createElement('menuseparator'));
			}

			var menuitem;
			var tabs = [tab];
			if (aMenu == 'back') {
				while (tab = tab.parentTab)
				{
					tabs.push(tab);
				}
			}
			else {
				if (gBrowser.selectedTab.hasChildTabs() &&
					tab == gBrowser.selectedTab.childTabs[0]) {
					tabs = gBrowser.selectedTab.descendantTabs;
				}
				else {
					tabs = tabs.concat(tab.descendantTabs);
					if (tab = tab.parentTab) {
						var siblingTabs = tab.childTabs;
						var afterSelectedTab = false;
						for (var i = 0, max = siblingTabs.length; i < max; i++)
						{
							if (siblingTabs[i] == gBrowser.selectedTab) {
								afterSelectedTab = true;
								continue;
							}
							if (afterSelectedTab && siblingTabs[i] != tabs[0]) {
								tabs.push(siblingTabs[i]);
								tabs = tabs.concat(siblingTabs[i].descendantTabs);
							}
						}
					}
				}
			}

			for (var i = 0, max = tabs.length; i < max; i++)
			{
				menuitem = document.createElement('menuitem');
				menuitem.setAttribute('label',     tabs[i].label);
				menuitem.setAttribute('targetTab', tabs[i].tabId);
				menuitem.setAttribute('oncommand', [
					'event.stopPropagation();',
					'event.preventDefault();',
					'gBrowser.selectedTab = gBrowser.getTabByTabId(this.getAttribute("targetTab"));',
					'gBrowser.scrollTabbarToTab(gBrowser.selectedTab);',
					'this.parentNode.hidePopup();'
				].join(''));
				aParent.appendChild(menuitem);
			}
		}
	},
 
	UpdateBackForwardButtons : function()
	{
		__tabextensions__UpdateBackForwardButtons();


		var backBroadcaster = document.getElementById('canGoBack') || // Suite
								document.getElementById('Browser:Back'); // Firefox
		var forwardBroadcaster = document.getElementById('canGoForward') || // Suite
								document.getElementById('Browser:Forward'); // Firefox
		var webNavigation      = gBrowser.webNavigation;


		var canGoBack    = webNavigation.canGoBack || TBEMiscOverlay.getTabForBackToAncestor();
		var backDisabled = backBroadcaster.hasAttribute('disabled');
		if (!backDisabled == !canGoBack) {
			if (backDisabled)
				backBroadcaster.removeAttribute('disabled');
			else
				backBroadcaster.setAttribute('disabled', true);
		}


		var canGoForward    = webNavigation.canGoForward || TBEMiscOverlay.getTabForForwardToFollowing();
		var forwardDisabled = forwardBroadcaster.hasAttribute('disabled');
		if (!forwardDisabled == !canGoForward) {
			if (forwardDisabled)
				forwardBroadcaster.removeAttribute('disabled');
			else
				forwardBroadcaster.setAttribute('disabled', true);
		}
	},
 
	// Tab Selection 
	ctrlNumberTabSelection : function(aEvent)
	{
		if (aEvent.altKey && aEvent.keyCode == KeyEvent.DOM_VK_RETURN) { // for WinXP
			aEvent.preventDefault();
			return;
		}

		var index = aEvent.charCode - 49,
			b     = TabbrowserService.browser;

		if (
			(
				navigator.platform.search(/mac/i) > -1 ? !aEvent.metaKey :
				navigator.platform.search(/unix|linux/i) > -1 ? !aEvent.altKey :
				!aEvent.ctrlKey
			) ||
//			!(TabbrowserService.isNewTypeBrowser || aEvent.shiftKey) || // firebird:ctrl+num, mozilla:ctrl+shift+num
			index < 0 || index > 9 || index >= b.mTabs.length // out of range
			)
			return;

		var oldTab = b.selectedTab;
		var newTab = b.mTabs[index];
		if (newTab != oldTab) {
			oldTab.selected = false;
			b.selectedTab = newTab;
			b.scrollTabbarToTab(b.selectedTab);
			b.setFocusInternal();
		}

		TabbrowserService.stopEvent(aEvent);

		return;
	},
 
	goQuitApplication : function() 
	{
		var w = TabbrowserService.browserWindows;
		for (var i in w)
			w[i].TabbrowserService.onQuit = true;

		window.__tabextensions__goQuitApplication();
	}
  
}; 

 
// end of definition 

if (!window.TabbrowserServiceModules)
	window.TabbrowserServiceModules = [];

TabbrowserServiceModules.push(TBEMiscOverlay);
}
 
