// start of definition 
if (!window.TBEBookmarksService) {
	
// static class "TBEBookmarksService" 
var TBEBookmarksService =
{
	get service()
	{
		return TabbrowserService;
	},
	
	onBeforeInit : function() 
	{
		var nodes, i;
		var b = this.service.browser;

		// Bookmarks
		window.OpenBookmarkURL = this.openBookmarkURL;
		window.OpenBookmarkGroupFromResource = this.service.openBookmarkGroup;
		window.__tabextensions__addBookmarkForTabBrowser = window.addBookmarkForTabBrowser;
		window.addBookmarkForTabBrowser = this.addBookmarkForTabBrowser;
		if ('BookmarksUtils' in window) {
			BookmarksUtils.__tabextensions__addBookmark = BookmarksUtils.addBookmark;
			BookmarksUtils.addBookmark = this.addBookmark;
			BookmarksUtils.__tabextensions__createBookmark = BookmarksUtils.createBookmark;
			BookmarksUtils.createBookmark = this.createBookmark;
			BookmarksUtils.addBookmarkForTabBrowser = this.addBookmarkForTabBrowser;
		}
		if ('BookmarksMenu' in window) {
			BookmarksMenu.__tabextensions__loadBookmark = BookmarksMenu.loadBookmark;
			BookmarksMenu.loadBookmark = this.loadBookmark;
			BookmarksMenu.__tabextensions__loadBookmarkMiddleClick = BookmarksMenu.loadBookmarkMiddleClick;
			BookmarksMenu.loadBookmarkMiddleClick = this.loadBookmarkMiddleClick;
		}
		if ('BookmarksCommand' in window) {
			BookmarksCommand.__tabextensions__openBookmark = BookmarksCommand.openBookmark;
			BookmarksCommand.openBookmark = this.BookmarksCommandOpenBookmark;
			BookmarksCommand.__tabextensions__createContextMenu = BookmarksCommand.createContextMenu;
			BookmarksCommand.createContextMenu = this.BookmarksCommandCreateContextMenu;
		}

		if (this.service.isNewTypeBrowser) { // Firefox
			if ('BookmarksCommand' in window)
				BookmarksCommand.openGroupBookmark = this.openGroupBookmark;

			nodes = document.getElementsByTagName('bookmarks-toolbar');
			for (i = 0; i < nodes.length; i++) {
				nodes[i].toolbar.setAttribute('oncommand', 'TBEBookmarksService.openBookmarkURL(event.originalTarget, this.database, event, this);');
				nodes[i].toolbar.setAttribute('onclick', 'TBEBookmarksService.openBookmarkURL(event.originalTarget, this.database, event, this);');
			}
		}

		nodes = document.getElementsByTagNameNS(this.service.XULNS, 'bookmarks-tree');
		for (i = 0; i < nodes.length; i++)
		{
			if ('openItemClick' in nodes[i]) {
				nodes[i].__tabextensions__openItemKey  = nodes[i].openItemKey;
				nodes[i].__tabextensions__openItemClick = nodes[i].openItemClick;
			}
			nodes[i].openItemKey   = this.openBookmarkItemClickOrKey;
			nodes[i].openItemClick = this.openBookmarkItemClickOrKey;

			// old implementation
			nodes[i].__tabextensions__openItem = nodes[i].openItem;
			nodes[i].openItem = (this.service.isNewTypeBrowser) ? this.openBookmarkItemClickOrKey : this.openBookmarkItem ; // Firefox

			if ('tree' in nodes[i] && nodes[i].tree &&
				!nodes[i].tree.getAttribute('onclick'))
				nodes[i].tree.setAttribute('onclick', 'if (event.button != 1) return; '+nodes[i].tree.getAttribute('ondblclick'));

			nodes[i].validOpenClickConditions = this.validOpenClickConditions;
		}

		// Bookmarks and Text Zoom
		if ('ZoomManager' in window) {
			ZoomManager.prototype.__defineSetter__(
				'textZoom',
				function(aZoom)
				{
					// implementations in original code
					if (aZoom < this.MIN || aZoom > this.MAX)
						throw Components.results.NS_ERROR_INVALID_ARG;

					getMarkupDocumentViewer().textZoom = aZoom / 100;

					// TBE extra feature
					try {
						var TS = TabbrowserService;
						var b  = if ('SplitBrowser' in window) ? SplitBrowser.activeBrowser : TS.browser ;
						var t  = b.selectedTab;
						if (!t.getAttribute('tab-bookmarkID') ||
							t.getAttribute('tab-bookmarkURI') != t.getAttribute('tab-loadingURI') ||
							!TS.isBookmarked(t.getAttribute('tab-bookmarkID')))
							t.removeAttribute('tab-textZoomTargetURI');
//						else
						b.setTextZoomFor(t, aZoom, t.getAttribute('tab-loadingURI'));
					}
					catch(e) {
					}
				}
			);
		}

		// Bookmarks and Icon
		if ('bookmarksFavIconLoadListener' in window) {
			bookmarksFavIconLoadListener.prototype.__tabextensions__onStopRequest = bookmarksFavIconLoadListener.prototype.onStopRequest;
			bookmarksFavIconLoadListener.prototype.onStopRequest = this.bookmarksFavIconLoadListenerOnStopRequest;
		}

	},
 
	// Bookmarks 
	
	openBookmarkURL : function(aNode, aDataSource, aEvent, aRoot) 
	{
		var TS   = TabbrowserService,
			TBEBS = TBEBookmarksService,
			type = (aEvent ? aEvent.type : 'command' ),
			node = aNode;
		var url  = (node) ? node.id :
					(aEvent) ? aEvent.target.id :
					null ;

		if (
			aEvent && type == 'click' &&
			(
				aEvent.button != 1 ||
				TS.getPref('browser.tabs.opentabfor.bookmarks.middleClickBehavior') < 0
			)
			)
			return;

		// "Open in Tabs" in folders
		if (
			url == 'openintabs-menuitem' ||
			node.getAttribute('class') == 'openintabs-menuitem'
			) {
			TS.openBookmark(aEvent.target.parentNode.parentNode.id, aEvent, 'folder-as-group', null);
			return;
		}

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

		if (!TS.openBookmark(url, aEvent)) return;

		if (!node) return;
		var parent = node.parentNode;
		while (parent && parent != aRoot)
		{
			if ('hidePopup' in parent)
				parent.hidePopup();
			else if ('closePopup' in parent)
				parent.closePopup();

			parent = parent.parentNode;
		}
	},
 
	// open bookmark groups in Firefox 
	openGroupBookmark : function(aURI, aTargetBrowser)
	{
		var TS = TabbrowserService;
		var resource = TS.RDF.GetResource(aURI);

		if (aTargetBrowser == 'window') {
			var w = window.openDialog(TS.browserURI, '_blank', 'chrome,all,dialog=no', null, null, null, resource);
			w.addEventListener(
				'load',
				function(aEvent)
				{
					aEvent.target.TabbrowserService.openBookmarkGroup(aEvent.target.arguments[3]);
				},
				false
			);
		}
		else
			TS.openBookmarkGroup(resource, TS.BookmarksDS);
	},
 
	// Bookmarks Tree 
	
	// in Bookmarks Tree 
	openBookmarkItem : function(aEvent, aInNewWindow, aOpenGroups)
	{
		var groupRes      = this.rdf.GetResource('http://home.netscape.com/NC-rdf#FolderGroup');
		var groupTarget   = this.db.GetTarget(this.currentRes, groupRes, true);

		var TS = TabbrowserService;

		var browserWindow = TS.browserWindow;

		var rdf = TS.RDF;
		var db  = TS.BookmarksDatabase;

		try {
			var middleclick  = aEvent && (
						aEvent.button == 1 ||
						(aEvent.button == 0 && (aEvent.ctrlKey || aEvent.metaKey))
					);
			var normalBehavior      = TS.getPref('browser.tabs.opentabfor.bookmarks.behavior');
			var middleClickBehavior = TS.getPref('browser.tabs.opentabfor.bookmarks.middleClickBehavior');


			// actions not to open the bookmark in new tab
			var otherAction = (
						!aEvent || // "Open" or "Open in New Window" selected in the context menu
						(groupTarget && (!aOpenGroups || aEvent.detail > 1)) ||
						(!groupTarget && this.treeBoxObject.view.isContainer(this.treeBoxObject.view.selection.currentIndex)) ||
						aEvent.altKey || //  open property
						aInNewWindow //  open in window compulsory
					);

			// action to open the bookmark in new tab
			var openTabAction = (
					middleClickBehavior > 0 &&
					middleclick &&
					(
						normalBehavior < 1 ||
						TS.shouldOpenBookmarkGroup(this.currentRes)
					)
				);
			if (browserWindow)
				openTabAction = (
						openTabAction ||
						(
						!middleclick &&
						normalBehavior > 0 &&
						!TS.shouldOpenBookmarkGroup(this.currentRes) &&
						!TS.checkToLoadInCurrentTabOf(browserWindow.gBrowser)
						)
					);

			// open the folder as a group
			if (openTabAction &&
				TS.shouldOpenBookmarkGroup(this.currentRes))
				return TS.openBookmarkGroup(this.currentRes, this.db);

			if ((otherAction || !openTabAction) &&
				aEvent && aEvent.type.indexOf('click') > -1 && aEvent.button > 1) {
				aEvent.stopPropagation();
				return true;
			}


			if (
				TS.isBookmarkFolder(this.currentRes) ||
				!aEvent // from the context menu
				)
				return this.__tabextensions__openItem(aEvent, aInNewWindow, aOpenGroups);

			var urlValue = db.GetTarget(this.currentRes, TS.kNC_URL, true);
			if (!urlValue) return false;

			urlValue = urlValue.QueryInterface(TS.knsIRDFLiteral).Value;
			if (!urlValue || urlValue.substring(0,3) == 'NC:') return false;

			if (!browserWindow)
				return window.openDialog(TS.browserURI, '_blank', 'chrome,all,dialog=no', urlValue, null, null);

			TS.openBookmark(urlValue, aEvent, (otherAction || !openTabAction) ? 'current' : 'tab', sel.parent[0]);
		}
		catch(e) {
		}

		if (aEvent) aEvent.stopPropagation();
		return true;
	},
	
	validOpenClickConditions : function(aEvent) 
	{
		if (
			aEvent.button > 1 ||
			aEvent.originalTarget.localName != 'treechildren' ||
			(
				aEvent.button == 1 &&
				TabbrowserService.getPref('browser.tabs.opentabfor.bookmarks.middleClickBehavior') < 0
			)
			)
			return false;

		var row = {};
		var col = {};
		var obj = {};
		this.treeBoxObject.getCellAt(aEvent.clientX, aEvent.clientY, row, col, obj);
		if (row.value == -1 || obj.value == 'twisty')
			return false;

		return true;
	},
  
	// in Bookmarks Tree (new implementation, Firefox) 
	openBookmarkItemClickOrKey : function(aEvent, aClickCount)
	{
		var TS = TabbrowserService;

		if (
			(aEvent && !this.validOpenClickConditions(aEvent)) ||
			(aClickCount != this.clickCount && aEvent && aEvent.button != 1)
			)
			return false;

		var browserWindow = TS.browserWindow;
		var rdf = TS.RDF;
		var db  = TS.BookmarksDatabase;

		// for new implementation
		var sel = this._selection;
		var res = sel ? rdf.GetResource(sel.item[0].Value) : this.currentRes ;

		try {
			var middleclick  = aEvent && (
						aEvent.button == 1 ||
						(aEvent.button == 0 && (aEvent.ctrlKey || aEvent.metaKey))
					);
			var normalBehavior      = TS.getPref('browser.tabs.opentabfor.bookmarks.behavior');
			var middleClickBehavior = TS.getPref('browser.tabs.opentabfor.bookmarks.middleClickBehavior');


			// actions not to open the bookmark in new tab
			var otherAction = (
						!aEvent || // "Open" or "Open in New Window" selected in the context menu
//						aEvent.detail > 1 ||
						(sel && sel.type[0] != 'Bookmark') || // new implementation
						( // old implementation: clicking folders
							this.treeBoxObject.view.selection &&
							this.treeBoxObject.view.isContainer(this.treeBoxObject.view.selection.currentIndex)
						) ||
						aEvent.altKey // open property
					);

			// action to open the bookmark in new tab
			var openTabAction = (
					middleClickBehavior > 0 &&
					middleclick &&
					(
						normalBehavior < 1 ||
						TS.shouldOpenBookmarkGroup(res)
					)
				);
			if (browserWindow)
				openTabAction = (
						openTabAction ||
						(
						!middleclick &&
						normalBehavior > 0 &&
						!TS.shouldOpenBookmarkGroup(res) &&
						!TS.checkToLoadInCurrentTabOf(browserWindow.gBrowser)
						)
					);


			// open the folder as a group
			if (openTabAction &&
				TS.shouldOpenBookmarkGroup(res))
				return TS.openBookmarkGroup(res, db);


			if ((otherAction || !openTabAction) &&
				aEvent && aEvent.type.indexOf('click') > -1 && aEvent.button > 1) {
				aEvent.stopPropagation();
				return true;
			}


			if (
				TabbrowserService.isBookmarkFolder(res) ||
				!aEvent // from the context menu
				) {
				return ('__tabextensions__openItemClick' in this) ? (aEvent ? this.__tabextensions__openItemClick(aEvent, aClickCount) : this.__tabextensions__openItemKey() ) : this.__tabextensions__openItem(aEvent, aClickCount) ;
			}

			var urlValue = db.GetTarget(res, TS.kNC_URL, true);
			if (!urlValue) return false;

			urlValue = urlValue.QueryInterface(TS.knsIRDFLiteral).Value;
			if (!urlValue || urlValue.substring(0,3) == 'NC:') return false;

			if (!browserWindow)
				return window.openDialog(TS.browserURI, '_blank', 'chrome,all,dialog=no', urlValue, null, null);

			TabbrowserService.openBookmark((sel ? sel.item[0].Value : urlValue ), aEvent, (otherAction || !openTabAction) ? 'current' : 'tab', sel.parent[0]);
		}
		catch(e) {
//			alert('@TBEBookmarksService.openBookmarkItemClickOrKey()\n'+e); // In some environments, "Type Error: this.getBrowserForTab(aTab).currentURI has no properties" error appears (but works fine). Why?
		}

		if (aEvent) aEvent.stopPropagation();
		return true;
	},
  
	// BookmarksUtils 
	
	addBookmark : function(aURI, aTitle, aCharset, aShowDialogOrIsWebPanel) 
	{
		// use fixed label instead of the title
		var nav = TabbrowserService.browserWindow;
		var b   = nav ? nav.TabbrowserService.browser : null ;
		if (b &&
			b.selectedTab &&
			b.selectedTab.getAttribute('tab-loadingURI') == aURI &&
			b.selectedTab.getAttribute('tab-fixedLabel'))
			aTitle = b.selectedTab.getAttribute('tab-fixedLabel');

		this.__tabextensions__addBookmark(aURI, aTitle, aCharset, aShowDialogOrIsWebPanel);
	},
 
	createBookmark : function(aName, aURI, aCharSet, aDefaultName) 
	{
		// use fixed label instead of the title (for drag'n'drop)
		var nav = TabbrowserService.browserWindow;
		var b   = nav ? nav.TabbrowserService.browser : null ;
		if (b &&
			b.selectedTab &&
			b.selectedTab.getAttribute('tab-loadingURI') == aURI &&
			b.selectedTab.getAttribute('tab-fixedLabel') &&
			b.selectedTab.getAttribute('tab-fixedLabel') == aDefaultName)
			aName = b.selectedTab.getAttribute('tab-fixedLabel');

		return this.__tabextensions__createBookmark(aName, aURI, aCharSet, aDefaultName);
	},
  
	// BookmarksMenu 
	
	loadBookmark : function(aEvent, aTarget, aDatabase) 
	{
		TBEBookmarksService.openBookmarkURL(aTarget, aDatabase, aEvent, aEvent.currentTarget);
	},
 
	loadBookmarkMiddleClick : function(aEvent, aDatabase) 
	{
		TBEBookmarksService.openBookmarkURL(aEvent.target, aDatabase, aEvent, aEvent.currentTarget);
	},
  
	// BookmarksCommand 
	
	BookmarksCommandOpenBookmark : function(aSelection, aOpenType, aDataSource) 
	{
		if (!aOpenType) return;

		var type;
		for (var i = 0; i < aSelection.length; i++)
		{
			type = aSelection.type[i];
			if (!type || type == 'Bookmark')
				TabbrowserService.openBookmark(aSelection.item[i].Value, null, aOpenType, aSelection.parent[i]);
			else if (type.search(/^(FolderGroup|Folder|PersonalToolbarFolder)$/) > -1)
				TabbrowserService.openBookmarkGroup(aSelection.item[i].Value, aDataSource);
		}
	},
 
	BookmarksCommandCreateContextMenu : function(aEvent, aSelection) 
	{
		this.__tabextensions__createContextMenu(aEvent, aSelection);

		var TS    = TabbrowserService,
			popup = aEvent.target;

		var newTabItem = popup.getElementsByAttribute('command', 'cmd_bm_openinnewtab');
		if (!newTabItem.length)
			newTabItem = popup.getElementsByAttribute('cmd', 'http://home.netscape.com/NC-rdf#command?cmd=bm_openinnewtab');
		if (!newTabItem.length)
			return;

		var node;

		if (TS.getPref('browser.tabs.extensions.showNewActiveTabItem.bookmarks') &&
			TS.getPref('browser.tabs.extensions.loadInBackgroundBookmarks')) {
			node = popup.insertBefore(document.createElement('menuitem'), newTabItem[0].nextSibling);
			node.setAttribute('label', TS.strbundle.GetStringFromName('openBookmarkInNewActiveTab_label'));
			node.setAttribute('accesskey', TS.strbundle.GetStringFromName('openBookmarkInNewActiveTab_accesskey'));
			node.setAttribute('oncommand', 'TabbrowserService.openBookmark((\'BookmarksMenu\' in window ? BookmarksMenu._selection.item[0].Value : this.parentNode.parentNode._selection.item[0].Value ), null, \'newactivetab\');');
		}

		if (TS.getPref('browser.tabs.opentabfor.bookmarks.behavior') > 0) {
			newTabItem[0].hidden = true;
			if (TS.getPref('browser.tabs.extensions.showThisTabItem.bookmarks')) {
				node = popup.insertBefore(document.createElement('menuitem'), newTabItem[0].nextSibling);
				node.setAttribute('label', TS.strbundle.GetStringFromName('openBookmarkInThisTab_label'));
				node.setAttribute('accesskey', TS.strbundle.GetStringFromName('openBookmarkInThisTab_accesskey'));
				node.setAttribute('oncommand', 'TabbrowserService.openBookmark((\'BookmarksMenu\' in window ? BookmarksMenu._selection.item[0].Value : this.parentNode.parentNode._selection.item[0].Value ), null, \'current\');');
			}
		}
		else {
			newTabItem[0].hidden = false;
		}
	},
  
	addBookmarkForTabBrowser : function(aTabBrowser, aBookmarkAllTabs, aSelect) 
	{
		// for Firefox 1.0.x or before
		if (!window.__tabextensions__addBookmarkForTabBrowser ||
			window.__tabextensions__addBookmarkForTabBrowser.arity == 2) {
			aSelect = aBookmarkAllTabs;
		}

		var info = [];
		var currentInfo;

		var tabs = aTabBrowser.mTabs;
		var b;
		var doc;
		for (var i = 0; i < tabs.length; i++)
		{
			b = tabs[i].mBrowser;
			try {
				doc = b.contentDocument;
			}
			catch(e) {
				doc = null;
			}
			if (doc) doc = new XPCNativeWrapper(doc, 'title', 'characterSet');

			info[i] = {
				name    : (doc ? doc.title : '' ) || b.currentURI.spec,
				url     : b.currentURI.spec,
				charset : (doc ? doc.characterSet : null )
			};

			if (tabs[i] == aTabBrowser.selectedTab)
				currentInfo = info[i];
		}

		if (!TabbrowserService.isNewTypeBrowser) // Suite
			window.openDialog(
				'chrome://communicator/content/bookmarks/addBookmark.xul',
				'',
				'centerscreen,chrome,dialog,resizable,dependent',
				currentInfo.name,
				currentInfo.url,
				null,
				currentInfo.charset,
				'addGroup' + (aSelect ? ',group' : ''),
				info
			);
		else if ('getDescriptionFromDocument' in BookmarksUtils) { // Firefox 1.1 or later
			var dialogArgs = currentInfo;
			try {
				if ( // Firefox 1.5 or later
					aBookmarkAllTabs &&
					gNavigatorBundle.getString('bookmarkAllTabsDefault') &&
					BROWSER_ADD_BM_FEATURES
					) {
					dialogArgs = {
						name             : gNavigatorBundle.getString('bookmarkAllTabsDefault'),
						bBookmarkAllTabs : true
					};
				}
			}
			catch(e) {
			}
			dialogArgs.objGroup = info;
			window.openDialog(
				'chrome://browser/content/bookmarks/addBookmark2.xul',
				'',
				BROWSER_ADD_BM_FEATURES,
				dialogArgs
			);
		}
		else // Firefox 1.0.x
			window.openDialog(
				'chrome://browser/content/bookmarks/addBookmark2.xul',
				'',
				'centerscreen,chrome,dialog,resizable,dependent',
				currentInfo.name,
				currentInfo.url,
				null,
				currentInfo.charset,
				'addGroup' + (aSelect ? ',group' : ''),
				info
			);
	},
 
	// favicon 
	// original code is in the file "chrome://browser/content/bookmrks/bookmarks.js" (of Trunk 20050323)
	bookmarksFavIconLoadListenerOnStopRequest : function(aRequest, aContext, aStatusCode)
	{
		var isLocalFile = this.mFavIconURL.indexOf('file:') == 0;
		var httpChannel = this.mChannel.QueryInterface(isLocalFile ? Components.interfaces.nsIFileChannel : Components.interfaces.nsIHttpChannel );
		if (
			httpChannel &&
			(isLocalFile ?
				(
					httpChannel.file.exists() &&
					httpChannel.file.isFile() &&
					httpChannel.file.isReadable()
				) :
				httpChannel.requestSucceeded
			) &&
			Components.isSuccessCode(aStatusCode) &&
			this.mCountRead > 0
			) {
			var dataurl;
			if (this.mCountRead > 16384) {
				dataurl = 'data:';
			}
			else {
				var mimeType = null;

				const nsICategoryManager = Components.interfaces.nsICategoryManager;
				const nsIContentSniffer = Components.interfaces.nsIContentSniffer;

				var catMgr = Components.classes['@mozilla.org/categorymanager;1'].getService(nsICategoryManager);
				var sniffers = catMgr.enumerateCategory('content-sniffing-services');
				while (mimeType == null && sniffers.hasMoreElements())
				{
					var snifferCID = sniffers.getNext().QueryInterface(Components.interfaces.nsISupportsCString).toString();
					var sniffer = Components.classes[snifferCID].getService(nsIContentSniffer);

					try {
						mimeType = sniffer.getMIMETypeFromContent(this.mBytes, this.mCountRead);
					}
					catch(e) {
						mimeType = null;
					}
				}
			}

			if (mimeType == null) {
				BMSVC.updateBookmarkIcon(this.mURI, null, null, 0);
			}
			else {
				BMSVC.updateBookmarkIcon(this.mURI, mimeType, this.mBytes, this.mCountRead);
			}
		}

		this.mChannel = null;
	}
    
}; 

 
// end of definition 

if (!window.TabbrowserServiceModules)
	window.TabbrowserServiceModules = [];

TabbrowserServiceModules.push(TBEBookmarksService);
}
 
