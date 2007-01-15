// start of definition 
if (!window.TBEContextMenuService) {
	
// static class "TBEContextMenuService" 
var TBEContextMenuService =
{
	get service()
	{
		return TabbrowserService;
	},
	
	onBeforeInit : function() 
	{
		var nodes, i;
		var b = this.service.browser;

		if (this.service.isNewTypeBrowser) { // Firefox
			if (this.service.isBrowserWindow) {
				window.__tabextensions__openNewTabWith = window.openNewTabWith;
				window.openNewTabWith = this.openNewTabWith;

				window.__tabextensions__openNewWindowWith = window.openNewWindowWith;
				window.openNewWindowWith = this.openNewWindowWith;
			}
		}
		else {
			if (this.service.isBrowserWindow) {
				window.__tabextensions__openNewTabWith = window.openNewTabWith;
				window.openNewTabWith = this.openNewTabWith_old;

				window.__tabextensions__openNewWindowWith = window.openNewWindowWith;
				window.openNewWindowWith = this.openNewWindowWith_old;
			}
		}

		// Web Search
		if ('OpenSearch' in window) {
			if (window.OpenSearch.arity == 4) { // old Mozilla Suite
				window.OpenSearch = function(aTabName, aForceDialogFlag, aSearchStr, aNewWindowFlag) {
					TBEContextMenuService.OpenSearch(aTabName, aSearchStr, aNewWindowFlag, aForceDialogFlag);
				};
			}
			else {
				window.OpenSearch = this.OpenSearch;
			}
		}


		// Context Menu
		if ('nsContextMenu' in window) {
			nsContextMenu.prototype.__tabextensions__initItems = nsContextMenu.prototype.initItems;
			nsContextMenu.prototype.initItems = this.initItems;

			var contextmenu = document.getElementById('contentAreaContextMenu') || document.getElementById('messagePaneContext') ;
			contextmenu.addEventListener('popupshowing', this.onContentAreaContextMenuShowing, false);
		}


		// view source
		if ('BrowserViewSourceOfDocument' in window) {
			window.__tabextensions__BrowserViewSourceOfDocument = window.BrowserViewSourceOfDocument;
			window.BrowserViewSourceOfDocument = function(aDocument)
			{
				return TabbrowserService.viewSourceInTab ? TBEContextMenuService.viewSourceOf('document', aDocument) : __tabextensions__BrowserViewSourceOfDocument(aDocument);
			};
		}
		if ('BrowserViewSourceOfURL' in window) {
			window.__tabextensions__BrowserViewSourceOfURL = window.BrowserViewSourceOfURL;
			window.BrowserViewSourceOfURL = function(aURI, aCharset, aPageCookie)
			{
				return TabbrowserService.viewSourceInTab ? TBEContextMenuService.viewSourceOf('uri', aURI, aCharset, aPageCookie) : __tabextensions__BrowserViewSourceOfURL(aURI, aCharset, aPageCookie);
			};
		}
		if('nsContextMenu' in window) {
			nsContextMenu.prototype.__tabextensions__viewPartialSource = nsContextMenu.prototype.viewPartialSource;
			nsContextMenu.prototype.viewPartialSource = function(aContext)
			{
				return TabbrowserService.viewSourceInTab ? TBEContextMenuService.viewSourceOf('partial', aContext) : this.__tabextensions__viewPartialSource(aContext);
			};
		}
	},
 
	onBeforeDestruct : function() 
	{
		// Context Menu
		if ('nsContextMenu' in window) {
			var contextmenu = document.getElementById('contentAreaContextMenu') || document.getElementById('messagePaneContext') ;
			contextmenu.removeEventListener('popupshowing', this.onContentAreaContextMenuShowing, false);
		}
	},
 
	// Web Search 
	OpenSearch : function(aTabName, aSearchStr, aFromContextMenu, aForceDialogFlag)
	{
		/*
			The original third argument is a flag to open the result
			in a new window or tab, but the flag is used only from the
			context menu.
			So, I regard the flag that this function is called from
			the context menu.
			This function is based on Firefox Trunk 20050313.
		*/
		var TS = TabbrowserService;
		var w  = TS.browserWindow;


		var defaultSearchURL = null;
		var navigatorRegionBundle = window.gNavigatorRegionBundle || // Mozilla Suite
				document.getElementById('bundle_browser_region'); // Firefox
		var fallbackDefaultSearchURL = navigatorRegionBundle.getString('fallbackDefaultSearchURL');

		var urlmatch= /(:\/\/|^ftp\.)[^ \S]+$/;
		var forceAsURL = urlmatch.test(aSearchStr);

		try {
			defaultSearchURL = TS.getPref('browser.search.defaulturl', Components.interfaces.nsIPrefLocalizedString);
		}
		catch (e) {
		}

		// Fallback to a default url (one that we can get sidebar search results for)
		if (!defaultSearchURL)
			defaultSearchURL = fallbackDefaultSearchURL;

		if (!aSearchStr) {
			BrowserSearchInternet();
		}
		else if (forceAsURL) {
			 BrowserLoadURL(null, null);
		}
		else if ( // only for Mozilla Suite
			!TS.isNewTypeBrowser &&
			(
				aForceDialogFlag ||
				TS.getPref('browser.search.powermode') == 1
			)
			) {
			var searchWindow = TS.windowManager.getMostRecentWindow('search:window');
			if (!searchWindow) {
				openDialog('chrome://communicator/content/search/search.xul', 'SearchWindow', 'dialog=no,close,chrome,resizable', aTabName, aSearchStr);
			}
			else {
				searchWindow.focus();

				if ('loadPage' in searchWindow)
					searchWindow.loadPage(aTabName, aSearchStr);
			}
		}
		else if (aSearchStr) {
			var escapedSearchStr = encodeURIComponent(aSearchStr);
			defaultSearchURL += escapedSearchStr;
			var searchDS = Components.classes['@mozilla.org/rdf/datasource;1?name=internetsearch']
					.getService(Components.interfaces.nsIInternetSearchService);

			searchDS.RememberLastSearchText(escapedSearchStr);
			try {
				var searchBox = w ? (w.document.getElementById('searchbar') || w.document.getElementById('search-bar')) : null ;
				var useSearchBox = searchBox && TS.getPref('browser.tabs.opentabfor.contextsearch.useSearchBox');

				var searchEngineURI = useSearchBox ? searchBox.mTextbox.currentEngine :
						TS.getPref('browser.search.defaultengine');
				if (searchEngineURI) {
					var searchURL = 'getSearchUrl' in window ? getSearchUrl('actionButton') : null ;
					if (!useSearchBox && searchURL) {
						defaultSearchURL = searchURL + escapedSearchStr;
					}
					else {
						searchURL = searchDS.GetInternetSearchURL(searchEngineURI, escapedSearchStr, 0, 0, { value: 0 });
						if (searchURL)
							defaultSearchURL = searchURL;
					}
				}
			}
			catch (e) {
			}


			var behavior = !aFromContextMenu ? 0 :
					TS.getPref('browser.tabs.opentabfor.contextsearch.behavior');
			if (behavior < 0)
				behavior = !TS.isNewTypeBrowser ? 3 :
							TS.loadInBackground ? 2 :
							1 ;

			var info = null;
			if (behavior == 1 || behavior == 2) {
				info = { openedFromTab : true };

				if (TS.getPref('browser.tabs.extensions.show_link_text_as_label')) {
					var label = aSearchStr;
					info.fixedLabel = TS.strbundle.GetStringFromName('loading_temp_label').replace(/%s/gi, label).replace(/\s+/g, ' ');
					info.fixedLabelAutoDestroy = true;
					if (TS.getPref('browser.tabs.extensions.show_link_text_as_label_permanently'))
						info.nextFixedLabel = label;
				}

				if (w.gBrowser.tabGroupsAvailable) {
					info.parentTab           = gBrowser.selectedTab.tabId;
					info.openedAutomatically = false;

					var openIn = TS.getPref('browser.tabs.extensions.open_tab_in_link');
					if (openIn > -1)
						info.openIn = openIn;
				}
			}

			switch (behavior)
			{
				case 0:
					w.loadURI(defaultSearchURL, null, null);
					break;
				case 1:
					w.gBrowser.selectedTab = w.gBrowser.addTabInternal(defaultSearchURL, null, info);
					break;
				case 2:
					w.gBrowser.addTabInternal(defaultSearchURL, null, info);
					break;
				case 3:
					window.openDialog(TabbrowserService.browserURI, '_blank', 'chrome,all,dialog=no', defaultSearchURL);
					break;

				default:
					break;
			}
		}

		if (!TS.isNewTypeBrowser &&
			TS.getPref('browser.search.opensidebarsearchpanel') &&
			'RevealSearchPanel' in window)
			RevealSearchPanel();
	},
 
	// view source 
	
	viewSourceOf : function() 
	{
		if (!arguments || !arguments.length) return false;

		var w,
			winWrapper,
			doc,
			uri,
			args,
			onload,
			target,
			targetURI,
			parentTab;
		var TS   = TabbrowserService,
			TCMS = TBEContextMenuService;

		var root = TS.isNewTypeBrowser ? 'chrome://global/content/' : 'chrome://navigator/content/' ;

		switch (arguments[0])
		{
			case 'document':
				doc = arguments[1];
				var nav;
				try {
					if (arguments[1] == document)
						doc = gBrowser.contentDocument;
					nav = TS.getDocShellFromDocument(
							doc,
							window
								.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								.getInterface(Components.interfaces.nsIWebNavigation)
								.QueryInterface(Components.interfaces.nsIDocShell)
						)
						.QueryInterface(Components.interfaces.nsIWebNavigation);
				}
				catch(e) {
					nav = TS.browser.webNavigation;
				}
				doc = new XPCNativeWrapper(doc,
						'location',
						'characterSet'
					);

				var cookie = null;
				try{
					var pageLoader = nav.QueryInterface(Components.interfaces.nsIWebPageDescriptor);
					cookie = pageLoader.currentDescriptor;
				}
				catch(e) {
				}

				uri  = root+'viewSource.xul?url='+escape(doc.location);
				args = [
					String(doc.location),
					'charset='+doc.characterSet,
					cookie
				];
				onload    = TCMS.onLoadViewSource;
				target    = targetURI = doc.location;
				parentTab = TS.browser.selectedTab;
				break;

			case 'uri':
				uri  = root+'viewSource.xul?url='+escape(arguments[1]);
				args = [
					String(arguments[1]),
					arguments[2],
					arguments[3]
				];
				onload    = TCMS.onLoadViewSource;
				target    = targetURI = arguments[1];
				parentTab = null;
				break;

			case 'partial':
				var context = arguments[1];
				w = document.commandDispatcher.focusedWindow || gBrowser.contentWindow;
				winWrapper = new XPCNativeWrapper(w,
						'getSelection()',
						'document'
					);
				doc = new XPCNativeWrapper(winWrapper.document,
						'location',
						'characterSet'
					);

				var reference;
				switch (context)
				{
					case 'selection':
						reference = winWrapper.getSelection();
						targetURI = [
							'data:text/html;charset=utf-8,',
							encodeURIComponent(TS.getSelectionSource(w))
						].join('');
						break;
					case 'mathml':
						reference = document.popupNode;
						targetURI = [
							'data:text/html;charset=utf-8,',
							encodeURIComponent(this.getPartialSourceOf(reference, context))
						].join('');
						break;
					default:
						throw 'not reached';
				}

				uri  = root+'viewPartialSource.xul?url='+escape(doc.location);
				args = [
					null,
					'charset='+doc.characterSet,
					reference,
					context
				];
				onload    = TCMS.onLoadViewPartialSource;
				target    = doc.location;
				parentTab = TS.browser.selectedTab;
				break;

			default:
				return false;
		}

		var label = TS.strbundle.GetStringFromName('view_source_label').replace(/%s/gi, target);

		var b        = TS.browser;
		var t        = b.addTab(uri);
		var listener = function()
			{
				t.mBrowser.removeEventListener('load', listener, true);

				onload(t.mBrowser.contentWindow, targetURI, args);

				t.mBrowser.sessionHistory.QueryInterface(Components.interfaces.nsISHistoryInternal).replaceEntry(
					0,
					b.createSHEntryFromInfo({
						uri              : 'view-source:'+targetURI,
						title            : label,
						isSubFrame       : false,
						saveLayoutState  : true,
						expirationStatus : true,
						loadType         : 2,
						x                : 0,
						y                : 0
					})
				);

				delete b;
				delete t;
				delete listener;

				delete root;
				delete label;

				delete w;
				delete winWrapper;
				delete doc;
				delete uri;
				delete args;
				delete onload;
				delete target;
				delete targetURI;
				delete parentTab;
				delete TS;
				delete TCMS;
			};
		t.mBrowser.addEventListener('load', listener, true);

		t.mBrowser.userTypedValue = 'view-source:'+target;

		if (!TS.getPref('browser.tabs.extensions.loadInBackgroundViewSource'))
			b.selectedTab = t;

		b.setFixedLabelFor(t, label, 'ANY');
		if (parentTab)
			t.parentTab = parentTab;

		return true;
	},
	onLoadViewSource : function(aWindow, aLoadURL, aArgs)
	{
		var d = aWindow.document;
		var b = d.getElementById('content');

		var loadFromURL = true;
		var arg;

		arg = aArgs[1];
		try {
			if (typeof arg == 'string' &&
				arg.indexOf('charset=') != -1) {
				var arrayArgComponents = arg.split('=');
				if (arrayArgComponents) {
					b.markupDocumentViewer.defaultCharacterSet = arrayArgComponents[1];
				}
			}
		}
		catch (e) {
		}

		arg = aArgs[2];
		try {
			if (typeof arg == 'object' &&
				arg != null) {
				var PageLoader = b.webNavigation.QueryInterface(Components.interfaces.nsIWebPageDescriptor);
				PageLoader.loadPage(arg, Components.interfaces.nsIWebPageDescriptor.DISPLAY_AS_SOURCE);
				loadFromURL = false;
			}
		}
		catch(e) {
		}

		if (loadFromURL) {
			aLoadURL = 'view-source:' + aLoadURL;
			b.setAttribute('src', aLoadURL);
			try {
				b.webNavigation.loadURI(aLoadURL, Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
			}
			catch(e) {
			}
		}


		var TS = TabbrowserService;
		var node;

		if ((node = d.getElementById('menu_wrapLongLines')) &&
			TS.getPref('view_source.wrap_long_lines'))
			node.setAttribute('checked', true);

		if (node = d.getElementById('menu_highlightSyntax'))
			node.setAttribute('checked', TS.getPref('view_source.syntax_highlight'));

		aWindow._content.focus();
	},
	onLoadViewPartialSource : function(aWindow, aLoadURL, aArgs)
	{
		var d = aWindow.document;
		var b = d.getElementById('content');


		var TS = TabbrowserService;
		var node;

		if ((node = d.getElementById('menu_wrapLongLines')) &&
			TS.getPref('view_source.wrap_long_lines'))
			node.setAttribute('checked', true);

		if (node = d.getElementById('menu_highlightSyntax'))
			node.setAttribute('checked', TS.getPref('view_source.syntax_highlight'));


		b.setAttribute('src', 'view-source:' + aLoadURL);


		aWindow._content.focus();
	},
 
	getPartialSourceOf : function(aNode, aContext) // see viewPartialSource.js 
	{
		var node = aNode;
		if (aNode && aNode.nodeType == Node.TEXT_NODE)
			node = (new XPCNativeWrapper(node, 'parentNode')).parentNode;

		var topTag;
		switch (aContext)
		{
			case 'mathml':
				topTag = 'math';
				break;
			default:
				throw 'not reached';
		}
		var nodeWrapper;
		while (
			node &&
			(
				nodeWrapper = new XPCNativeWrapper(node,
					'parentNode',
					'localName',
					'ownerDocument',
					'childNodes'
				)
			) &&
			nodeWrapper.localName != topTag
			)
			node = nodeWrapper.parentNode;

		if (!node) return '';

		var w = TabbrowserService.getWindowFromDocument(nodeWrapper.ownerDocument) ||
				TabbrowserService.getWindowFromDocument(nodeWrapper.ownerDocument, window);
		var winWrapper = new XPCNativeWrapper(w,
				'document',
				'getSelection()'
			);

		var sel = winWrapper.getSelection();

		sel.removeAllRanges();

		var docWrapper = new XPCNativeWrapper(winWrapper.document,
				'createRange()'
			);
		var range = docWrapper.createRange();
		range.setStart(node, 0);
		range.setEnd(node, node.childNodes.length);

		sel.addRange(range);

		return TabbrowserService.getSelectionSource(w, null, sel);
	},
    
	// nsContextMenu 
	
	initItems : function() 
	{
		this.__tabextensions__initItems();

		var TS = TabbrowserService;

		var b = TS.getOwnerBrowserFromNode(document.popupNode) || TS.browser ;

		var onLinks              = false,
			onLinksWithoutMailto = false,
			isSingleWindow       = false,
			tab                  = null,
			tabs                 = [];


		var uri = this.link ?
					(
						'getLinkURI' in this ? this.linkURI.spec : // firefox 1.1 or later
						this.linkURL() // firefox 1.0.x or before
					) :
					null ;

		var showOpenInActiveTab = TS.getPref('browser.tabs.extensions.showNewActiveTabItem.links') && TS.getPref('browser.tabs.opentabfor.links.behavior') == 2;
		var showOpenInThisTab = TS.getPref('browser.tabs.extensions.showThisTabItem.links') && (
			TS.getPref('browser.tabs.opentabfor.links.behavior') > 0 ||
			(
				TS.getPref('browser.tabs.opentabfor.outerlink.level') > 0 &&
				this.link &&
				!TS.isSameHost(uri, (new XPCNativeWrapper((new XPCNativeWrapper(this.link, 'ownerDocument')).ownerDocument, 'location')).location)
			) ||
			(
				(
					TS.winHookMode > 0 ||
					TS.getPref('browser.tabs.opentabfor.links.targetBehavior') > 0
				) &&
				(
					TS.getPref('browser.link.open_newwindow') === null ? !TS.getPref('browser.block.target_new_window') : (TS.getPref('browser.link.open_newwindow') == 1)
				) &&
				TS.getTargetForLink(this.link).name
			)
		);
		var showOpenAllLinksInTabs = TS.getPref('browser.tabs.extensions.show_context.openAllLinksInTabs');
		var showOpenAllLinksInGroup = TS.getPref('browser.tabs.extensions.show_context.openAllLinksInGroup');
		var showBookmarkAllLinksAsGroup = TS.getPref('browser.tabs.extensions.show_context.bookmarkAllLinksAsGroup');
		var showBookmarkTabGroup = TS.getPref('browser.tabs.extensions.show_context.bookmarkTabGroup');

		if (showOpenAllLinksInTabs ||
			showOpenAllLinksInGroup ||
			showBookmarkAllLinksAsGroup) {
			try {
				var links = TS.getSelectionLinks();
				onLinks = (links.length > 1);

				for (var i = links.length-1; i > -1; i--)
					if (links[i].uri.indexOf('mailto:') == 0)
						links.splice(1, 1);
				onLinksWithoutMailto = (links.length > 1);

				isSingleWindow = TS.winHookMode == 2;

				tab  = (b) ? b.selectedTab : null ;
				if (tab && tab.hasChildTabs) {
					if (!tab.hasChildTabs() && tab.parentTab)
						tab = tab.parentTab;
					tabs = tab.descendantTabs;
					tabs.unshift(tab);
				}
			}
			catch(e) {
				alert('@TBEContextMenuService.initItems()\n'+e);
			}
		}


		this.showItem('context-openlink', (this.onSaveableLink || ( this.inDirList && this.onLink )) && !isSingleWindow);

		this.showItem('context-openLinkInNewActiveTab', this.onLink && showOpenInActiveTab);
		this.showItem('context-openLinkInThisTab', this.onLink && showOpenInThisTab);

		this.showItem('context-sep-openAllLinksInGroup', onLinks && !this.onLink && showOpenAllLinksInTabs);
		this.showItem('context-openAllLinksInTabs', onLinks && !this.onLink && showOpenAllLinksInTabs);
		this.showItem('context-openAllLinksInGroup', onLinks && !this.onLink && showOpenAllLinksInGroup && TS.isGroupMode);

		this.showItem('context-openAllLinksInTabs-onLink', onLinks && this.onLink && showOpenAllLinksInTabs);
		this.showItem('context-openAllLinksInGroup-onLink', onLinks && this.onLink && showOpenAllLinksInGroup && TS.isGroupMode);
		this.showItem('context-sep-open', (onLinks && this.onLink && (showOpenAllLinksInTabs || showOpenAllLinksInGroup)) || this.onSaveableLink || ( this.inDirList && this.onLink ) );


		this.showItem('context-sep-bookmarkAllLinksAsGroup', onLinksWithoutMailto && showBookmarkAllLinksAsGroup);
		this.showItem('context-bookmarkAllLinksAsGroup', onLinksWithoutMailto && !this.onLink && showBookmarkAllLinksAsGroup);
		this.showItem('context-bookmarkAllLinksAsGroup-onLink', onLinksWithoutMailto && this.onLink && showBookmarkAllLinksAsGroup);

		this.showItem('context-bookmarkTabGroup', b && TS.browser.tabGroupsAvailable && !(this.isTextSelected || this.onTextInput) && tabs.length > 1 && showBookmarkTabGroup);
	},
 
	onContentAreaContextMenuShowing : function(aEvent) 
	{
		var TS = TabbrowserService;
		if (!TS) return true;

		var b = TS.getOwnerBrowserFromNode(document.popupNode);
		if (!b || !b.isBlank) return true;

		// popup a small menu instead of the normal
		aEvent.preventDefault();

		var p = b.selectedTab.mBrowser;
		TS.popupMenu('tabextensions-blankWindow-contextMenu', b.mMouseDownX-p.boxObject.screenX, b.mMouseDownY-p.boxObject.screenY, p);

		return false;
	},
  
	// General Functions 
	
	openNewTabWith_old : function(aURI, aShouldSendReferrer, aReverseBackgroundPref) 
	{
		urlSecurityCheck(aURI, document);

		var loadInBackground = TabbrowserService.loadInBackground;
		if (aReverseBackgroundPref)
			loadInBackground = !loadInBackground;

		TabbrowserService.openLinkInNewTab(aURI, TabbrowserService.getLastActiveLink(), !loadInBackground);
	},
	
	openNewTabWith : function(aURI, aLinkNode, aEventOrFlag, aSecurityCheckOrEvent, aPostData, aSendReferrer) 
	{ // OrFlag/OrEvent is for 0.4 before
		if (typeof aSecurityCheckOrEvent == 'boolean' &&
			aSecurityCheckOrEvent)
			urlSecurityCheck(aURI, document);

		var event = (typeof aEventOrFlag == 'object') ? aEventOrFlag : aSecurityCheckOrEvent ;

		var loadInBackground = TabbrowserService.loadInBackground;
		if (event && event.shiftKey)
			loadInBackground = !loadInBackground;

		TabbrowserService.openLinkInNewTab(aURI, aLinkNode, !loadInBackground, aPostData, aSendReferrer);
	},
  
	openNewWindowWith_old : function(aURI, aShouldSendReferrer) 
	{
		urlSecurityCheck(aURI, document);

		var charsetArg = null;
		if (TabbrowserService.isBrowserWindow)
			charsetArg = 'charset=' + (new XPCNativeWrapper(gBrowser.contentDocument, 'characterSet')).characterSet;

		var win = document.commandDispatcher.focusedWindow;
		if (!win || (new XPCNativeWrapper(win, 'top')).top != gBrowser.contentWindow)
			win = null;

		var referrer = aShouldSendReferrer && TabbrowserService.shouldSendReferrerWithLinkClick() ? TabbrowserService.getReferrer(win) : null;
		window.openDialog(TabbrowserService.browserURI, '_blank', 'chrome,all,dialog=no', aURI, charsetArg, referrer);

		TabbrowserService.markLinkVisited(aURI, TabbrowserService.getLastActiveLink());
	},
	
	openNewWindowWith : function(aURI, aLinkNode, aSecurityCheck, aPostData) 
	{
		if (aSecurityCheck)
			urlSecurityCheck(aURI, document);

		var charsetArg = null;
		if (TabbrowserService.isBrowserWindow)
			charsetArg = 'charset=' + (new XPCNativeWrapper(gBrowser.contentDocument, 'characterSet')).characterSet;

		var win = document.commandDispatcher.focusedWindow;
		if (!win || (new XPCNativeWrapper(win, 'top')).top != gBrowser.contentWindow)
			win = null;

		var referrer = TabbrowserService.shouldSendReferrerWithLinkClick() ? TabbrowserService.getReferrer(win) : null;
		window.openDialog(TabbrowserService.browserURI, '_blank', 'chrome,all,dialog=no', aURI, charsetArg, referrer, aPostData);

		TabbrowserService.markLinkVisited(aURI, aLinkNode);
	}
   
}; 

 
// end of definition 

if (!window.TabbrowserServiceModules)
	window.TabbrowserServiceModules = [];

TabbrowserServiceModules.push(TBEContextMenuService);
}
 
