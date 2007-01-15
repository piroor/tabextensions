// start of definition 
if (!window.TBELocationBarService) {
	
// static class "TBELocationBarService" 
var TBELocationBarService =
{
	get service()
	{
		return TabbrowserService;
	},
	
	onBeforeInit : function() 
	{
		// Location Bar
		if ('BrowserLoadURL' in window) {
			window.__tabextensions__BrowserLoadURL = window.BrowserLoadURL;
			window.BrowserLoadURL = this.BrowserLoadURL;

			if (this.service.isNewTypeBrowser) {
				window.__tabextensions__handleURLBarCommand = window.handleURLBarCommand;
				window.handleURLBarCommand = this.handleURLBarCommand;
			}
		}

		// Web Search
		if ('SearchLoadURL' in window) {
			window.__tabextensions__SearchLoadURL = window.SearchLoadURL;
			window.SearchLoadURL = this.SearchLoadURL;
		}

	},
 
	// Location Bar 
	
	BrowserLoadURL : function(aEvent, aPostData, aOriginalURI, aSearchURL) 
	{
		var TS = TabbrowserService;

		var uri    = aSearchURL || gURLBar.value;
		var b      = TS.browser;
		var id     = aEvent ? aEvent.target.id || aEvent.target.parentNode.id : '' ;
		// Firefox 1.0PR hands "textbox" element inside of the searchbar as the event target,instead of the sarachbar element itself. Why?

		var newTabAction = !aEvent ? false :
							TS.isNewTypeBrowser ? aEvent.altKey :
							(aEvent.ctrlKey || aEvent.metaKey);

		if (aSearchURL) // for Firefox 1.0 or later
			id = 'searchbar';

		var behavior;
		var modifierKeyEnterBehavior;
		var foreignDomainBehavior;
		switch (id)
		{
			case 'searchbar': // Firefox 1.0 or later
			case 'search-bar': // old Firefox
				behavior = TS.getPref('browser.tabs.opentabfor.searchbar.behavior');
				modifierKeyEnterBehavior = TS.getPref('browser.tabs.opentabfor.searchbar.modifierKeyEnterBehavior');
				foreignDomainBehavior = TS.getPref('browser.tabs.opentabfor.searchbar.foreignDomainBehavior');

				break;

			default:
				behavior = TS.getPref('browser.tabs.opentabfor.urlbar.behavior');
				modifierKeyEnterBehavior = TS.getPref('browser.tabs.opentabfor.urlbar.modifierKeyEnterBehavior');
				foreignDomainBehavior = TS.getPref('browser.tabs.opentabfor.urlbar.foreignDomainBehavior');
				break;
		}


		if (uri.indexOf('view-source:') == 0)
			return window.__tabextensions__BrowserLoadURL(aEvent);


		var uriWithKeyword = String(aOriginalURI) || uri;
		uri = getShortcutOrURI(uri, {});

		var info     = null,
			referrer = null;

		// when this is a keyword
		if (uri != uriWithKeyword) {
			var bookmarkRes = TS.getBookmarkResourceFromKeyword(uriWithKeyword.substring(0, uriWithKeyword.indexOf(' ')), uri);
			if (bookmarkRes) {
				id = bookmarkRes.Value;

				referrer = TS.getReferrerForBookmark(id) || null ;

				info = {
					uri        : uri,
					fixedLabel : TS.getFixedLabelForBookmark(id),
					textZoom   : TS.getTextZoomForBookmark(id),
					bookmarkID : id
				};

				if (!info.fixedLabel && TS.getPref('browser.tabs.extensions.show_link_text_as_label')) {
					var name = TS.getNameForBookmark(id) || '';
					info.fixedLabelAutoDestroy = true;
					info.fixedLabel = TS.strbundle.GetStringFromName('loading_temp_label').replace(/%s/gi, name).replace(/\s+/g, ' ');
					if (TS.getPref('browser.tabs.extensions.show_link_text_as_label_permanently'))
						info.nextFixedLabel = name;
				}

				if (TS.shouldSaveBookmarksStatus)
					info = TS.loadBookmarkStatus(id, info);
			}
		}


		if (newTabAction)
			behavior = modifierKeyEnterBehavior;
		else if (foreignDomainBehavior > -1) {
			var isSameHost = true;
			try {
				var fixedURI = TS.fixupURI(uri);
				isSameHost = (
							fixedURI.indexOf('about:') < 0 &&
							b.currentURI.spec.indexOf('about:') < 0
						) ? TS.makeURIFromSpec(fixedURI).host == b.currentURI.host :
							(!fixedURI.indexOf('about:') && !b.currentURI.spec.indexOf('about:'));
			}
			catch(e) {
//				alert(e);
			}
			if (!isSameHost)
				behavior = foreignDomainBehavior;
		}

		var t;
		if (TS.preventSameURLTab) {
			var testURI = TS.fixupURI(uri);
			if (testURI) uri = testURI;

			var max = b.mTabs.length;
			for (var i = 0; i < max; i++)
			{
				if (b.mTabs[i].getAttribute('tab-loadingURI') != uri) continue;

				t = b.mTabs[i];

				if (TS.getPref('browser.tabs.extensions.prevent_same_uri_tab.alert.show'))
					TS.popupAlert(TS.strbundle.GetStringFromName('status_same_uri_tab_exists'));

				t.mBrowser.webNavigation.loadURI(
					uri,
					Components.interfaces.nsIWebNavigation.LOAD_FLAGS_REPLACE_HISTORY,
					referrer,
					aPostData || null,
					null
				);
				if (info)
					t.mBrowser.initTabWithTabInfo(t, info);

				var loadInBackground = behavior == 2;
				if (aEvent.shiftKey) loadInBackground = !loadInBackground;

				if (!loadInBackground) {
					b.userTypedValue = null;
					b.selectedTab    = t;
					b.scrollTabbarToTab(b.selectedTab);
				}
				break;
			}
		}

		if (!t) {
			if (behavior > 0 && !b.selectedTab.isReallyBlank) {
				try {
					if ('handleURLBarRevert' in window)
						handleURLBarRevert();
					(new XPCNativeWrapper(content, 'focus()')).focus();
				}
				catch(e) {
				}

				if (!info) info = {};
				if (aPostData)
					info.postData = b.readPostStream(aPostData);

				t = b.addTabInternal(uri, referrer, info);
				gURLBar.value = uri;

				var loadInBackground = behavior == 2;
				if (aEvent.shiftKey) loadInBackground = !loadInBackground;

				if (!loadInBackground) {
					b.userTypedValue = null;
					b.selectedTab    = t;
					b.scrollTabbarToTab(b.selectedTab);
				}
			}
			else if (behavior > -1) {
				b.webNavigation.loadURI(
					uri,
					Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
					referrer,
					aPostData || null,
					null
				);
				if (info)
					b.initTabWithTabInfo(b.selectedTab, info);
				t = b.selectedTab;
			}
		}

		if (aEvent) TS.stopEvent(aEvent);

		if (t) {
			b.setFocusInternal();
			(new XPCNativeWrapper(b.contentWindow, 'focus()')).focus();
		}

		return true;
	},
 
	SearchLoadURL : function(aURL, aTriggeringEvent) // for Firefox 1.0 or later 
	{
		if (!(aTriggeringEvent instanceof Event)) // Firefox 1.5 hands a boolean value as the second argument
			aTriggeringEvent = {
				type     : '',
				target   : document.getElementById('searchbar'),
				altKey   : (aTriggeringEvent ? true : false ),
				shiftKey : false,
				ctrlKey  : false,
				metaKey  : false
			};

		return BrowserLoadURL(aTriggeringEvent, null, null, aURL);
	},
 
	handleURLBarCommand : function(aEvent) 
	{
		var originalURI = gURLBar.value
		var postData = {};
		if ('canonizeUrl' in window)
			canonizeUrl(aEvent, postData);

		try {
			if ('addToUrlbarHistory' in window)
				addToUrlbarHistory(originalURI);
		}
		catch(e) {
		}

		TBELocationBarService.BrowserLoadURL(
			aEvent,
			('value' in postData ? postData.value : null ),
			originalURI
		);
	}
    
}; 

 
// end of definition 

if (!window.TabbrowserServiceModules)
	window.TabbrowserServiceModules = [];

TabbrowserServiceModules.push(TBELocationBarService);
}
 
