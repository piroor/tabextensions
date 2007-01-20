// start of definition 
if (!window.TBEClickEventService) {
 
// static class "TBEClickEventService" 
var TBEClickEventService =
{
	
	get service() 
	{
		if (this._service === void(0))
			this._service = 'TabbrowserService' in window ? window.TabbrowserService : null ;

		return this._service;
	},
//	_service : null,
 
	// event handling 
	
	onBeforeInit : function() 
	{
		var b = this.service.browser;
		// Link Click
		if ('contentAreaClick' in window) {
			window.__tabextensions__contentAreaClick = window.contentAreaClick;
			window.contentAreaClick = this.contentAreaClick;
			if (b) b.hookContentAreaClick = true;
		}
		if ('handleLinkClick' in window) {
			window.__tabextensions__handleLinkClick = window.handleLinkClick;
			window.handleLinkClick = this.handleLinkClick;
		}
		// Mail&News (1.4 or later)
		if ('messagePaneOnClick' in window) {
			document.getElementById('messagepane').removeEventListener('click', messagePaneOnClick, true);
			window.__tabextensions__messagePaneOnClick = window.messagePaneOnClick;
			window.messagePaneOnClick = this.messagePaneOnClick;
			document.getElementById('messagepane').addEventListener('click', window.messagePaneOnClick, true);
		}
	},
  
	// Links 
	
	contentAreaClick : function(aEvent, aFieldNormalClicks) 
	{
		var targetWrapper = new XPCNativeWrapper(aEvent.target, 'ownerDocument');

		// ignore clicks on XUL elements (Mozilla 1.4 or later?)
		if (targetWrapper.ownerDocument == document)
			return true;

		var TS   = TabbrowserService,
			CES  = TBEClickEventService,
			nav  = ('__tabextensions__browserWindow' in aEvent ? aEvent.__tabextensions__browserWindow : TS.browserWindow ),
			node = (
					TS.findParentNodeWithLocalName(aEvent.target, 'a') ||
					TS.findParentNodeWithLocalName(aEvent.target, 'area') ||
					TS.findParentNodeWithLocalName(aEvent.target, 'link') ||
					null
				);

		var b = CES.getBrowserForContentAreaClick(aEvent, nav);


		var eventInfo = {
				DOMEvent          : aEvent,
				cancelProcess     : false,
				retVal            : true,
				fieldNormalClicks : aFieldNormalClicks
			};

		TS.fireEventForModules('ContentAreaClick_preProcess', eventInfo);
		if (eventInfo.cancelProcess) return eventInfo.retVal;

		// ignore clicks not on a link
		if (!node || (aEvent.type == 'click' && aEvent.button > 1))
			return __tabextensions__contentAreaClick(aEvent, eventInfo.fieldNormalClicks);


		// get URI, REFERRER, TARGET
		var linkInfo = CES.getLinkInfo(node);

		linkInfo.referrerBlocked = (b && b.selectedTab.referrerBlocked) || (linkInfo.originalURI != linkInfo.uri) ;
		if (linkInfo.referrerBlocked)
			linkInfo.referrer = null;

		linkInfo.browser           = b;
		linkInfo.tabId             = ('__tabextensions__tabId' in aEvent ? aEvent.__tabextensions__tabId : b.selectedTab.tabId );
		linkInfo.fieldNormalClicks = aFieldNormalClicks;


		// if there is no browser window...
		if (!b) {
			TS.markLinkVisited(linkInfo.uri, node);
			if (linkInfo.uri.indexOf('javascript:') != 0) {
				window.openDialog(
					TS.browserURI,
					'_blank',
					'chrome,all,dialog=no',
					linkInfo.uri,
					null,
					linkInfo.referrer
				);
				TS.stopEvent(aEvent, true);
			}
			else {
				TS.fireEventForModules('ContentAreaClick_noBrowserWindow', eventInfo);
				if (eventInfo.cancelProcess) return eventInfo.retVal;
			}

			return true;
		}

try {
		CES.computeActionForLink(linkInfo, aEvent);
}
catch(e) { if (TS.debug) dump('contentAreaClick => computeActionForLink:\n'+e+'\n'); }

		if (
			linkInfo.behavior == -1 ||
			(
				linkInfo.newTabActionMiddleClick &&
				linkInfo.ignoreMiddleClickAction
			) ||
			( // prevent to open new tab
				(
					linkInfo.behavior > 0 ||
					(linkInfo.newTypeBrowserOpenWindow && TS.winHookMode > 0)
				) &&
				CES.blockSameURLTab(linkInfo)
			)
			) {
			TS.stopEvent(aEvent, true);
			return true;
		}

if (TS.debug) {
	dump('TabbrowserSerivce.contentAreaClick() ---- LOADING LINK INFORMATION\n');
	for (var p in linkInfo)
		dump('   '+ p + ' : ' + linkInfo[p] +'\n');
}


try {
		var retVal = CES.doLinkAction(linkInfo, aEvent);
}
catch(e) { if (TS.debug) dump('contentAreaClick => doLinkAction:\n'+e+'\n'); }


		TS.fireEventForModules('ContentAreaClick_postProcess', eventInfo);
		if (eventInfo.cancelProcess) return eventInfo.retVal;

		return retVal;
	},
	
	getBrowserForContentAreaClick : function(aEvent, aBrowserWindow) 
	{
		return (aBrowserWindow ? aBrowserWindow.TabbrowserService.browser : null );
	},
 
	blockSameURLTab : function(aLinkInfo) 
	{
		if (!this.service.preventSameURLTab) return false;

		var b = aLinkInfo.browser || this.service.browser ;

		if (b.selectedTab.getAttribute('tab-loadingURI') == aLinkInfo.uri)
			return true;

		var max = b.mTabs.length;
		for (var i = 0; i < max; i++)
		{
			if (b.mTabs[i].getAttribute('tab-loadingURI') != aLinkInfo.uri)
				continue;

			if (this.service.getPref('browser.tabs.extensions.prevent_same_uri_tab.alert.show'))
				this.service.popupAlert(this.service.strbundle.GetStringFromName('status_same_uri_tab_exists'));

			if (!aLinkInfo.loadInBackground) {
				b.selectedTab = b.mTabs[i];
				b.scrollTabbarToTab(b.selectedTab);
				b.setFocusInternal();
			}
			return true;
		}
		return false;
	},
 
	getLinkInfo : function(aLinkNode) 
	{
		// uri
		var linkWrapper = new XPCNativeWrapper(aLinkNode,
				'href',
				'getAttributeNS()',
				'getAttribute()',
				'ownerDocument'
			);

		var uri = (
				linkWrapper.href ||
				linkWrapper.getAttributeNS(this.service.XHTMLNS, 'href') ||
				linkWrapper.getAttributeNS(this.service.XLinkNS, 'href') ||
				linkWrapper.getAttribute('href') ||
				''
			);
		var originalURI = uri;
		// for accesses from ime.nu(www.2ch.net), etc....
		var realURI = this.service.getRealURI(uri);
		if (realURI) uri = realURI;

		// referrer
		var sourceURI = (new XPCNativeWrapper(linkWrapper.ownerDocument, 'location')).location;

		// link target
		var nameInfo = this.service.getTargetForLink(aLinkNode);

		return {
			node        : aLinkNode,
			window      : (this.service.getWindowFromDocument(linkWrapper.ownerDocument) || this.service.getWindowFromDocument(linkWrapper.ownerDocument, window)),
			document    : linkWrapper.ownerDocument,

			uri         : uri,
			originalURI : originalURI,

			source      : sourceURI,
			referrer    : (realURI ? null : this.service.makeURIFromSpec(sourceURI) ),

			target      : nameInfo.target,
			realTarget  : nameInfo.realTarget
		};
	},
	

  
	computeActionForLink : function(aLinkInfo, aEvent) 
	{
		var topWin = Components.lookupMethod(aLinkInfo.window, 'top').call(aLinkInfo.window);

		var tab = null;
		if (aLinkInfo.browser.localName == 'tabbrowser') {
			if ('getTabByTabId' in aLinkInfo.browser)
				tab = aLinkInfo.browser.getTabByTabId(aLinkInfo.tabId);
			else
				tab = aLinkInfo.browser.selectedTab;
		}

		aLinkInfo.behavior = -1;

		// middle click
		aLinkInfo.newTabActionMiddleClick = (
				aEvent.type == 'click' &&
				(
					aEvent.button == 1 ||
					(aEvent.button == 0 && (aEvent.ctrlKey || aEvent.metaKey))
				)
			);
		aLinkInfo.ignoreMiddleClickAction = false;
		if (aLinkInfo.newTabActionMiddleClick) {
			var middleClickBehavior = this.service.getPref('browser.tabs.opentabfor.links.middleClickBehavior');
			if (aLinkInfo.behavior < 0)
				aLinkInfo.behavior = middleClickBehavior;
			aLinkInfo.ignoreMiddleClickAction = (middleClickBehavior < 0);

			if (aLinkInfo.behavior < 0) return;
		}

		// locked tabs
		aLinkInfo.newTabActionLocked = (
				aLinkInfo.browser &&
				aLinkInfo.browser.localName == 'tabbrowser' &&
				tab &&
				tab.locked &&
				tab.mBrowser.contentDocument &&
				tab.mBrowser.contentWindow == topWin
			);
		if (aLinkInfo.behavior < 0 && aLinkInfo.newTabActionLocked) {
			aLinkInfo.behavior = this.service.getPref('browser.tabs.opentabfor.links.lockedBehavior');
		}

		// target links
		aLinkInfo.newTabActionTarget = (
				aLinkInfo.target &&
				!this.service.getFrameByName(topWin, aLinkInfo.target)
			);
		if  (aLinkInfo.newTabActionTarget && aLinkInfo.behavior < 0) {
				aLinkInfo.behavior = this.service.getPref('browser.tabs.opentabfor.links.targetBehavior');
			if (aLinkInfo.behavior < 0 && this.service.winHookMode > 0)
				aLinkInfo.behavior = this.service.loadInBackground ? 2 : 1 ;
		}

		// outer link
		var source = this.service.browserWindow ? this.service.browserWindow.TabbrowserService.browser.selectedTab.getAttribute('tab-loadingURI') : null ;
		aLinkInfo.foreignDomainLink = source && !this.service.isSameHost(this.service.makeURLAbsolute(source, aLinkInfo.uri), source);
		aLinkInfo.newTabActionForeignDomainLink = false;
		if (
			(
				this.service.getPref('browser.tabs.opentabfor.outerlink.level') > 0 &&
				aLinkInfo.foreignDomainLink
			) &&
			aLinkInfo.behavior < 0
			) {
			aLinkInfo.behavior = this.service.getPref('browser.tabs.opentabfor.links.outerBehavior');
			aLinkInfo.newTabActionForeignDomainLink = (aLinkInfo.behavior > 0);
		}

		// normal
		aLinkInfo.newTabActionNormalClick = false;
		aLinkInfo.normalClickAction = !aLinkInfo.newTabActionMiddleClick &&
			(
				!aLinkInfo.browser ||
//				!tab ||
				!this.service.checkToLoadInCurrentTabOf(aLinkInfo.browser)
			);
		if (aLinkInfo.normalClickAction && aLinkInfo.behavior < 0) {
			aLinkInfo.behavior = this.service.getPref('browser.tabs.opentabfor.links.behavior');
			aLinkInfo.newTabActionNormalClick = (aLinkInfo.behavior > 0);
		}

		// block URIs end with some extensions or patterns
		aLinkInfo.newTabActionBlockedURI = this.service.getPref('browser.tabs.opentabfor.links.block_uri.type');
		aLinkInfo.newTabActionBlockedURI = (aLinkInfo.newTabActionBlockedURI == 2) ||
					(
						aLinkInfo.newTabActionBlockedURI == 1 &&
//						!aLinkInfo.newTabActionNormalClick &&
						!aLinkInfo.newTabActionMiddleClick &&
						aLinkInfo.behavior != 0
					);
		if (aLinkInfo.newTabActionBlockedURI) {
			var uri  = aLinkInfo.uri;
			var rule = (this.service.getPref('browser.tabs.opentabfor.links.block_uri.rule') || '').toLowerCase().split(/[ \n\r]+/);

			var uriForExtension = uri.substring(uri.lastIndexOf('/'), uri.length);
			uriForExtension = uriForExtension.substring(uriForExtension.indexOf('.'), uriForExtension.length);

			var testRegExp = new RegExp();
			var uri_ext;
			var max = rule.length;
			for (i = 0; i < max; i++)
			{
/*
				if (node.hasAttribute('onclick') &&
					(node.getAttribute('onclick').indexOf(('return install')||('return installTheme')) == 0))
					return true;
*/
				try{
					if (rule[i].indexOf('/') < 0) {
						testRegExp = testRegExp.compile('\\.'+rule[i], 'i');
						uri_ext    = uriForExtension;
					}
					else {
						testRegExp = testRegExp.compile(rule[i].substring(1, rule[i].length-1), 'i');
						uri_ext    = uri;
					}
				}
				catch(e) {
					continue;
				}

				if (testRegExp.test(uri_ext)) {
					aLinkInfo.behavior = 0;
					break;
				}
			}
		}

		if (aLinkInfo.behavior < 0)
			aLinkInfo.behavior = 0;



		aLinkInfo.newTypeBrowserOpenWindow = false;

		if (
			this.service.isNewTypeBrowser &&
			(aEvent.type != 'click' || aEvent.button == 0) &&
			!aEvent.ctrlKey && !aEvent.metaKey &&
			(this.service.getPref('ui.key.saveLink.shift') ? aEvent.altKey : aEvent.shiftKey ) // save modifier
			)
			aLinkInfo.newTypeBrowserOpenWindow = true;

		// reverse behavior
		if (
			!aLinkInfo.newTabActionLocked &&
			this.service.isNewTypeBrowser &&
			aLinkInfo.newTypeBrowserOpenWindow &&
			!this.service.getPref('ui.key.saveLink.shift') &&
			aEvent.shiftKey &&
			(
				aLinkInfo.behavior > 0 ||
				this.service.winHookMode > 1
			)
			)
			aLinkInfo.newTypeBrowserOpenWindow = false;

		aLinkInfo.loadInBackground = (aLinkInfo.behavior == 2);
		if (aEvent.shiftKey &&
			!aLinkInfo.newTypeBrowserOpenWindow &&
			!aLinkInfo.newTabActionLocked)
			aLinkInfo.loadInBackground = !aLinkInfo.loadInBackground;
	},
 
	doLinkAction : function(aLinkInfo, aEvent) 
	{
		var i;
		var uri  = aLinkInfo.uri;
		var node = aLinkInfo.node;
		var nodeWrapper = new XPCNativeWrapper(aLinkInfo.node, 'getAttribute()');
		var b    = aLinkInfo.browser;
		var nav  = ('__tabextensions__browserWindow' in aEvent ? aEvent.__tabextensions__browserWindow : this.service.browserWindow );


		this.service.fireEventForModules('DoLinkAction_preProcess', aLinkInfo);


		// web panels (Sidebar)
		if (aLinkInfo.fieldNormalClicks &&
			(!aLinkInfo.target || aLinkInfo.target == '_content')) {
			if (nodeWrapper.getAttribute('onclick') ||
				aLinkInfo.uri.substr(0, 11) == 'javascript:') {
if (this.service.debug) dump('doLinkAction: Web Panel / blocked because it is javascript: link\n');
				return true;
			}

			if (aLinkInfo.behavior == 0) {
				this.service.stopEvent(aEvent);
				aLinkInfo.loadFlags = Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE;
				this.service.loadLinkNormally(aLinkInfo);
if (this.service.debug) dump('doLinkAction: Web Panel / load normally\n');
				return true;
			}
		}


		if (
			( // sidebar features (Firefox)
				(aLinkInfo.target == '_search' || nodeWrapper.getAttribute('rel') == 'sidebar') &&
				!aLinkInfo.newTabActionMiddleClick &&
				!aEvent.shiftKey &&
				!aEvent.ctrlKey &&
				!aEvent.altKey &&
				!aEvent.metaKey
			) ||

			// special features of links
			!uri ||
			uri.search(/^(mailto|javascript):/) > -1 ||
			(aEvent.type == 'click' && aEvent.button > 1)
			) {
			if (uri.indexOf('javascript:') == 0) {
				this.service.stopEvent(aEvent);
				this.service.loadLinkNormally(aLinkInfo);
				return true;
			}
if (this.service.debug) dump('doLinkAction: load in sidebar\n');
			return __tabextensions__contentAreaClick(aEvent, aLinkInfo.fieldNormalClicks);
		}



		// FOLLOWING CODES ARE FOR NORMAL LINKS.

		var topWin = Components.lookupMethod(aLinkInfo.window, 'top').call(aLinkInfo.window);


		// in frames, or in-page-link, ignore "open any link in new tab" feature for normal links.
		if (
			aLinkInfo.normalClickAction &&
			aLinkInfo.newTabActionNormalClick &&
			(
				(uri.split('#')[0] == String(aLinkInfo.source).split('#')[0]) ||
				(
					!aLinkInfo.realTarget &&
					topWin != aLinkInfo.window
				) ||
				(
					aLinkInfo.target &&
					this.service.getFrameByName(topWin, aLinkInfo.target)
				)
			)
			) {
			if (!aLinkInfo.referrerBlocked) {
if (this.service.debug) dump('doLinkAction: in-page-link (referrer blocked)\n');
				return __tabextensions__contentAreaClick(aEvent, aLinkInfo.fieldNormalClicks);
			}

			this.service.stopEvent(aEvent);
			this.service.loadLinkNormally(aLinkInfo);
if (this.service.debug) dump('doLinkAction: in-page-link\n');
			return true;
		}


		var postData = {};
		var convertedURI = ('getShortcutOrURI' in window) ? getShortcutOrURI(uri, postData) : uri ; // in Mail&Newsgroup, "getShortcutOrURI()" is not defined!!
		postData = 'value' in postData ? postData.value : null ;
		aLinkInfo.postData = postData;


		// If a tab (named by "TARGET") exists, then open the link in the tab.
		if (
			!this.service.getPref('browser.tabs.extensions.ignore_target') &&
			(
				(
					aLinkInfo.newTabActionTarget &&
					!aLinkInfo.newTabActionMiddleClick
				) ||
				( // Don't open new tab when the link aims to an existing tab/frame
					aLinkInfo.normalClickAction &&
					aLinkInfo.target &&
					aLinkInfo.target.toLowerCase() != '_blank'
				)
			)
			) {
			var browser;
			var contentWindow;
			var max = b.mTabs.length;
			for (i = 0; i < max; i++)
			{
				browser = b.mTabs[i].mBrowser;
				contentWindow = new XPCNativeWrapper(browser.contentWindow,
						'opener',
						'name'
					);
				if (
					b.mTabs[i].browserName != aLinkInfo.target &&
					browser.contentWindow.name != aLinkInfo.target
					) continue;

				this.service.uriSecurityCheck(uri, aLinkInfo.source);

				browser.webNavigation.loadURI(
					convertedURI,
					Components.interfaces.nsIWebNavigation.LOAD_FLAGS_IS_LINK,
					aLinkInfo.referrer,
					postData,
					null
				);

				contentWindow.opener = aLinkInfo.window;
				if (
					aLinkInfo.target &&
					String(aLinkInfo.target).search(/^_(self|top|parent|content|blank)$/i) < 0 &&
					aLinkInfo.target != '_main'
					)
					contentWindow.name = aLinkInfo.target;

				if (!aLinkInfo.loadInBackground) {
					b.selectedTab = b.mTabs[i];
					b.scrollTabbarToTab(b.selectedTab);
					b.setFocusInternal();
				}


				var focusedWindow = (nav.gBrowser ? nav.gBrowser.contentWindow : nav );
				(new XPCNativeWrapper(focusedWindow, 'focus()')).focus();

				this.service.markLinkVisited(uri, node);

				// add the tab to the children list
				if (
					b.tabGroupsAvailable &&
					b.ownerDocument == document && // reject tabs opened by undocked sidebar and so on
					b.mTabs[i] != b.selectedTab // reject current tab
					)
					b.attachTabTo(b.mTabs[i], b.selectedTab, true);

				this.service.stopEvent(aEvent, true);
if (this.service.debug) dump('doLinkAction: load in existing tab by target\n');
				return false;
			}
		}



		// load URI
		if (
			aLinkInfo.behavior == 0 &&
			(
				aLinkInfo.newTabActionTarget ||
				aLinkInfo.newTabActionMiddleClick ||
				aLinkInfo.referrerBlocked
			)
			) {
			aLinkInfo.uri = convertedURI;
			if (aEvent.shiftKey || aEvent.altKey)
				handleLinkClick(aEvent, uri, node);
			else // block referrer
				this.service.loadLinkNormally(aLinkInfo)

			this.service.stopEvent(aEvent);

if (this.service.debug) dump('doLinkAction: load normally\n');
			return false;
		}


		// open new tab
		if (
			aLinkInfo.behavior > 0 ||
			(aLinkInfo.newTypeBrowserOpenWindow && this.winHookMode > 0)
			) {
			this.service.stopEvent(aEvent, true);

			this.service.uriSecurityCheck(uri, aLinkInfo.source);

			var info = { openedFromTab : true };
			if (postData)
				info.postData = b.readPostStream(postData);

			// If the link has "TARGET", then the tab is named.
			info.browserName = (aLinkInfo.newTabActionTarget && !aLinkInfo.newTabActionMiddleClick) ? aLinkInfo.target : null ;

			if (this.service.getPref('browser.tabs.extensions.show_link_text_as_label')) {
				var label = this.service.getInnerTextOf(node) || '';
				info.fixedLabel = this.service.strbundle.GetStringFromName('loading_temp_label').replace(/%s/gi, label).replace(/\s+/g, ' ');
				info.fixedLabelAutoDestroy = true;
				if (this.service.getPref('browser.tabs.extensions.show_link_text_as_label_permanently'))
					info.nextFixedLabel = label;
			}

			// inherit status
			if (
				b.ownerDocument == document && // reject tabs opened by undocked sidebar and so on
				(
					!this.service.getPref('browser.tabs.extensions.inherit.onlySameSite') ||
					!aLinkInfo.foreignDomainLink
				)
				) {
				var props = [];
				if(this.service.getPref('browser.tabs.extensions.inherit.textZoom'))
					props.push('textZoom');
				if (this.service.getPref('browser.tabs.extensions.inherit.locked'))
					props.push('locked');
				if (this.service.getPref('browser.tabs.extensions.inherit.referrerBlocked'))
					props.push('referrerBlocked');
				if (this.service.getPref('browser.tabs.extensions.inherit.allow'))
					props = props.concat([
							'allowPlugins',
							'allowJavascript',
							'allowMetaRedirects',
							'allowSubframes',
							'allowImages'
						]);
				if (props.length) {
					info.uri = uri;
					for (i in props)
						info[props[i]] = b.selectedTab[props[i]];
				}
			}

			// add the tab to the children list
			if (
				b.tabGroupsAvailable &&
				b.ownerDocument == document && // reject tabs opened by undocked sidebar and so on
				this.service.getOwnerBrowserFromNode(node) == this.service.browser
				) {
				info.parentTab = aLinkInfo.tabId;
				info.openedAutomatically = aLinkInfo.causedByTargetAttribute || aLinkInfo.causedByLocked || aLinkInfo.causedByAlwaysNewTab ;

				var openIn = this.service.getPref('browser.tabs.extensions.open_tab_in_link');
				if (openIn > -1)
					info.openIn = openIn;
			}

			var newTab;

			if ('addTabInternal' in b) {
				newTab = b.addTabInternal(uri, aLinkInfo.referrer, info);
			}
			else {
				newTab = b.addTab(uri, aLinkInfo.referrer);
			}

			var contentWindow = new XPCNativeWrapper(newTab.mBrowser.contentWindow,
					'opener',
					'name'
				);

			if (aLinkInfo.causedByTargetAttribute) {
				contentWindow.opener = aLinkInfo.window;
				if (
					aLinkInfo.target &&
					String(aLinkInfo.target).search(/^_(self|top|parent|content|blank)$/i) < 0 &&
					aLinkInfo.target != '_main'
					)
					contentWindow.name = aLinkInfo.target;
			}

			if (!aLinkInfo.loadInBackground) {
				b.selectedTab = newTab;
				b.scrollTabbarToTab(b.selectedTab);
				b.setFocusInternal();
			}

			if (!this.service.loadInBackgroundWindow) {
				var focusedWindow = (nav.gBrowser ? gBrowser.contentWindow : nav );
				(new XPCNativeWrapper(focusedWindow, 'focus()')).focus();
			}

			this.service.markLinkVisited(uri, node);

if (this.service.debug) dump('doLinkAction: open new tab\n');
			return false;
		}


		aLinkInfo.retVal = __tabextensions__contentAreaClick(aEvent, aLinkInfo.fieldNormalClicks);
		aLinkInfo.DOMEvent = aEvent;

		this.service.fireEventForModules('DoLinkAction_postProcess', aLinkInfo);


if (this.service.debug) dump('doLinkAction: do nothing\n');
		return aLinkInfo.retVal;
	},
  
	handleLinkClick : function(aEvent, aURI, aNode) 
	{
		var retVal = __tabextensions__handleLinkClick(aEvent, aURI, aNode);

		var saveClick = (aEvent.button == 0 && (TabbrowserService.getPref('ui.key.saveLink.shift') ? aEvent.shiftKey : aEvent.altKey ));
		var nullClick = (aEvent.button == 0 && aEvent.altKey);

		if (aEvent.button < 2 &&
			(!retVal || (retVal && !saveClick && !nullClick)))
			TabbrowserService.markLinkVisited(aURI, aNode);

		return retVal;
	},
 
	messagePaneOnClick : function(aEvent) 
	{
		// ignore simple click, because new browser has been opened by customized contentAreaClick().
		var res = ('hrefAndLinkNodeForClickEvent' in window) ? hrefAndLinkNodeForClickEvent(aEvent) : { href : hrefForClickEvent(aEvent) };
		// hrefAndLinkNodeForClickEvent is for lately SeaMonkey.
		// hrefForClickEvent is for old Mozilla.
		if (res &&
			res.href &&
			res.href.search(/^(https?|ftp|file|gopher|chrome|resource|about):/i) > -1 &&
			aEvent.button == 0 &&
			!aEvent.metaKey &&
			!aEvent.ctrlKey &&
			!aEvent.shiftKey &&
			!aEvent.altKey) {
			TabbrowserService.stopEvent(aEvent);
		}

		window.__tabextensions__messagePaneOnClick(aEvent);
	}
  
}; 
  
// end of definition 

if (!window.TabbrowserServiceModules)
	window.TabbrowserServiceModules = [];

TabbrowserServiceModules.push(TBEClickEventService);
}
 
