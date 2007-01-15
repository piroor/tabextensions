// start of definition 
if (!window.TabbrowserPopupController) {

var TabbrowserPopupController = {
	enabled : true,
	
	// properties 
	
	get service() 
	{
		if (this._service === void(0))
			this._service = 'TabbrowserService' in window ? window.TabbrowserService : null ;

		return this._service;
	},
//	_service : null,
 
	get JSWindowOpenExceptionsWhite() 
	{
		if (!this._JSWindowOpenExceptionsWhite)
			this._JSWindowOpenExceptionsWhite = new pRDFDataR('JSWindowOpenExceptions', this.service.datasource.URI, 'bag', 'http://white.sakura.ne.jp/~piro/rdf#', 'chrome://tabextensions/content/tabextensions.rdf#');

		if (this._JSWindowOpenExceptionsWhite.length != this._JSWindowOpenExceptionsWhite._resources.length)
			this._JSWindowOpenExceptionsWhite.reset();

		return this._JSWindowOpenExceptionsWhite;
	},
	_JSWindowOpenExceptionsWhite : null,
 
	get JSWindowOpenExceptionsBlack() 
	{
		if (!this._JSWindowOpenExceptionsBlack)
			this._JSWindowOpenExceptionsBlack = new pRDFDataR('JSWindowOpenExceptionsBlackList', this.service.datasource.URI, 'bag', 'http://white.sakura.ne.jp/~piro/rdf#', 'chrome://tabextensions/content/tabextensions.rdf#');

		if (this._JSWindowOpenExceptionsBlack.length != this._JSWindowOpenExceptionsBlack._resources.length)
			this._JSWindowOpenExceptionsBlack.reset();

		return this._JSWindowOpenExceptionsBlack;
	},
	_JSWindowOpenExceptionsBlack : null,
  
	// ƒCƒxƒ“ƒg‚Ì•ß‘¨ 
	
	onBeforeInit : function() 
	{
		var nullPointer;
		nullPointer = this.JSWindowOpenExceptionsWhite;
		nullPointer = this.JSWindowOpenExceptionsBlack;

		// JavaScript "window.open()"
		if (window.open && this.service.isBrowserWindow) {
			window.__tabextensions_ctrlpopup__open = Components.lookupMethod(window, 'open');
			window.open = eval(this.newWindowOpen.toSource());
			window.openBrowserTab = this.openBrowserTab;
			window.shouldOpenBrowserTab = this.shouldOpenBrowserTab;
			if (window.openDialog) {
				window.__tabextensions_ctrlpopup__openDialog = (window.openDialog.toString().indexOf('[native code]') > -1) ? Components.lookupMethod(window, 'openDialog') : window.openDialog ;
				window.openDialog = this.newOpenDialog;
			}
		}


		// Firefox 1.0 or later
		if ('gPopupBlockerObserver' in window && gPopupBlockerObserver) {
			gPopupBlockerObserver.__tabextensions_ctrlpopup__showBlockedPopup = gPopupBlockerObserver.showBlockedPopup;
			gPopupBlockerObserver.showBlockedPopup = this.showBlockedPopup;
			if (!gPopupBlockerObserver._findChildShell && window.findChildShell)
				gPopupBlockerObserver._findChildShell = this.callFindChildShell;
		}

		if (!('gBrowser' in window)) return;

		var events = (this.service.getPref('dom.popup_allowed_events') || '');
		if (events) {
			events = events.split(/\s/);
			if (events.length) {
				gBrowser.hookEvents = [];
				for (var i in events)
					gBrowser.hookEvents.push(events[i]);
			}
		}
/*
		gBrowser.hookEvents = [
			'mousedown', 'mouseup', 'click', 'dblclick', 'mouseover',
			'mouseout', 'mousemove', 'contextmenu', 'keydown', 'keyup', 'keypress',
			'focus', 'blur', 'load', 'beforeunload', 'unload', 'abort', 'error',
			'submit', 'reset', 'change', 'select', 'input', 'paint' ,'text',
			'popupshowing', 'popupshown', 'popuphiding', 'popuphidden', 'close', 'command', 'broadcast', 'commandupdate',
			'dragenter', 'dragover', 'dragexit', 'dragdrop', 'draggesture', 'resize',
			'scroll','overflow', 'underflow', 'overflowchanged',
			'DOMSubtreeModified', 'DOMNodeInserted', 'DOMNodeRemoved',
			'DOMNodeRemovedFromDocument', 'DOMNodeInsertedIntoDocument',
			'DOMAttrModified', 'DOMCharacterDataModified',
			'popupBlocked'
		];
*/

	},
 
	onAfterInit : function() 
	{
		var b = this.service.browser;
		if (!b) return;

		b.addEventListener('XULTabbrowserTabLoading', this.onXULTabbrowserTabLoading, false);
		b.addEventListener('XULTabbrowserTabLoad', this.onXULTabbrowserTabLoad, false);
	},
 
	onBeforeDestruct : function() 
	{
		var b = this.service.browser;
		if (!b) return;

		b.removeEventListener('XULTabbrowserTabLoading', this.onXULTabbrowserTabLoading, false);
		b.removeEventListener('XULTabbrowserTabLoad', this.onXULTabbrowserTabLoad, false);
	},
 
	onOpenTabInsteadSelfInternal_preProcess : function(aPopupInfo) 
	{
		aPopupInfo.blocked = !this.allowPopupForURI(aPopupInfo.uri);
	},
 
	onTabLoading : function(aRelatedTab, aWindow, aShouldNotFollowFrames) 
	{
		if (aWindow == '[object XULElement]') return;

		var winWrapper = new XPCNativeWrapper(aWindow,
				'frames',
				'open()'
			);
		var frames = winWrapper.frames;
		if (frames && !aShouldNotFollowFrames) {
			for (var i = 0; i < frames.length; i++)
				this.onTabLoading(aRelatedTab, frames[i]);
		}

		if ('__tabextensions_ctrlpopup__initialized' in aWindow)
			return;

		// override "window.open"
		if (!('__tabextensions_ctrlpopup__open' in aWindow)) {
			aWindow.__tabextensions_ctrlpopup__open = Components.lookupMethod(aWindow, 'open');
		}
		eval('aWindow.open = '+this.newWindowOpen.toSource());

/* THIS SECTION MAKES A HUGE SECURITY HOLE!! (delayed scripts in webpages will be able to access XPCOM without the special permission)
		// override timer functions
		if (!('__tabextensions__setTimeout' in aWindow.Window.prototype)) {
			aWindow.Window.prototype.__tabextensions_ctrlpopup__setTimeout = aWindow.Window.prototype.setTimeout;
			aWindow.Window.prototype.__tabextensions_ctrlpopup__setInterval = aWindow.Window.prototype.setInterval;
		}
		eval('aWindow.setTimeout = '+this.newWindowSetTimeout.toSource());
		eval('aWindow.setInterval = '+this.newWindowSetInterval.toSource());

		aWindow.__tabextensions_ctrlpopup__popupControlState   = this.openAbused;
		aWindow.__tabextensions_ctrlpopup__runningTimeoutDepth = 0;
*/

		// Norton Internet Securityt overrides window.open so we have to kill the feature...
		aWindow.SymRealWinOpen = winWrapper.open;


		aWindow.openBrowserTab                  = this.openBrowserTab;
		aWindow.openBrowserTab.__parent__       = aWindow;
		aWindow.shouldOpenBrowserTab            = this.shouldOpenBrowserTab;
		aWindow.shouldOpenBrowserTab.__parent__ = aWindow;

		aWindow.__tabextensions_ctrlpopup__initialized = true;
	},
	
	onXULTabbrowserTabLoading : function(aEvent) 
	{
		TabbrowserPopupController.onTabLoading(aEvent.target.getTabByTabId(aEvent.tabId), aEvent.loadingView, !aEvent.followFrames);
	},
 
	onXULTabbrowserTabLoad : function(aEvent) 
	{
		TabbrowserPopupController.onTabLoading(aEvent.loadedView, aEvent.target.getTabByTabId(aEvent.tabId));
	},
   
	// "window.open" 
	
	newWindowOpen : function(aURI, aName, aFlags) 
	{
		var now = (new Date()).getTime();
		aName = String(aName) || '' ;

		var TS  = TabbrowserService;
		var TPC = TabbrowserPopupController;
if (TS.debug) dump('newWindowOpen ('+aURI+')\n');

		var contextWindow = TS.getWindowFromDocument(this.document, window);
		if (!contextWindow) contextWindow = this;

		var topWin = Components.lookupMethod(contextWindow, 'top').call(contextWindow);

		var sourceURI = ('Components' in window && 'lookupMethod' in Components) ? Components.lookupMethod(contextWindow, 'location').call(contextWindow).href : contextWindow.location.href ;

		aURI = aURI ? String(aURI) : 'about:blank' ;
		if (aURI.search(/^\w+:/) < 0)
			aURI = TS.makeURLAbsolute(sourceURI, aURI);

		var abuseLevel = TPC.checkForAbusePoint({
				window    : contextWindow,
				XULwindow : window,
				now       : now,
				uri       : aURI,
				source    : sourceURI
			});


if (TS.debug) dump('   abuse level: '+abuseLevel+'\n');
		if (!TPC.checkOpenAllow(abuseLevel, aName, contextWindow)) {
if (TS.debug) dump('   blocked\n');
			TPC.fireAbuseEvents(
				true,
				false,
				{
					window : contextWindow,
					uri    : aURI,
					flags  : aFlags
				}
			);
			return {};
		}

try {
if (TS.debug) dump('   POP UP NOW!!\n');
		var w;
		if (
			aName &&
			aName.search(/^_(top|self|content|parent)$/i) < 0 &&
			aName != '_main' &&
			(w = TS.getFrameByName(topWin, aName))
			) {
if (TS.debug) dump('    => Existing Frame\n');
			TS.uriSecurityCheck(aURI, sourceURI);
			var docShell = Components.lookupMethod(w, 'QueryInterface').call(w, Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShell);


			// block cross-site scriptings!
			if (
				aURI.indexOf('javascript:') == 0 &&
				docShell &&
				TS.makeURIFromSpec(sourceURI).host != docShell.QueryInterface(Components.interfaces.nsIWebNavigation).currentURI.host
				)
				// see http://lxr.mozilla.org/mozilla/source/dom/src/jsurl/nsJSProtocolHandler.cpp#228
				throw 'Attempt to load a javascript: URL from one host\nin a window displaying content from another host\nwas blocked by the security manager.';


			docShell.loadURI(
				aURI,
				Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
				TS.makeURIFromSpec(sourceURI),
				null,
				null
			);
			return  Components.lookupMethod(docShell.document, 'defaultView').call(docShell.document);
		}

		if (window.shouldOpenBrowserTab(aURI, aName, aFlags)) {
if (TS.debug) dump('    => New Tab\n');
			w = TPC.openBrowserTabInternal(contextWindow, aURI, aName, aFlags, sourceURI);
		}
		else {
if (TS.debug) dump('    => New Window\n');
			if (
				topWin
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShell)
					.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
					.itemType != Components.interfaces.nsIDocShellTreeItem.typeChrome &&
				aName &&
				!(
					aName.search(/^_(top|self|content|parent)$/i) > -1 ||
					aName == '_main'
				) &&
				TS.getPref('browser.tabs.extensions.ignore_target') &&
				!this.service.getFrameByName(topWin, aName)
				)
				aName = '_blank';

			var flags = TPC.applyFlagsPermission(aFlags);

			// we have to allow delayed popups becaus TBE makes delay for allowed popups too...
			var originalVal = TS.getPref('dom.disable_open_during_load');
			if (originalVal)
				TS.setPref('dom.disable_open_during_load', false);

			TS.setPref('browser.tabs.extensions.processing_window_count_from_script', (TS.getPref('browser.tabs.extensions.processing_window_count_from_script') || 0)+1);

			try {
				w = (aFlags !== void(0)) ?
					this.__tabextensions_ctrlpopup__open.call(this,
						String(aURI),
						String(aName),
						(topWin == Components.lookupMethod(window, 'top').call(window) ?
							(flags.replace(/(alwaysLowered|alwaysRaised|titlebar|z-lock)(=(0|1|true|false|yes|no))?,?/g, '') || void(0))
							: flags
						)
					) :
					this.__tabextensions_ctrlpopup__open.call(this, String(aURI), String(aName)) ;
			}
			catch(e) {
				if (originalVal)
					TS.setPref('dom.disable_open_during_load', true);

				TS.setPref('browser.tabs.extensions.processing_window_count_from_script', Math.max((TS.getPref('browser.tabs.extensions.processing_window_count_from_script') || 0)-1, 0));

				throw e;
			}

			if (originalVal)
				TS.setPref('dom.disable_open_during_load', true);

			TS.setPref('browser.tabs.extensions.processing_window_count_from_script', Math.max((TS.getPref('browser.tabs.extensions.processing_window_count_from_script') || 0)-1, 0));

			// set real opener to prevent to reopen the new window in a tab
			if (TS.browserWindow &&
				TS.browserWindow != window)
				TS.browserWindow.__tabextensions__opener = this;
			if (w)
				w.__tabextensions__opener = this;
		}
if (TS.debug) dump('       successfully opened\n');
}
catch(e) {
	if (TS.debug)
		alert('@TabbrowserPopupController.newWindowOpen()\n'+e+'\n');
}


		if (abuseLevel >= TPC.openControlled)
			if ('openPopupSpamCount' in this)
				this.openPopupSpamCount++;
			else
				this.openPopupSpamCount = 1;

		if (abuseLevel >= TPC.openAbused)
			TPC.fireAbuseEvents(
				false,
				true,
				{
					window    : contextWindow,
					uri       : aURI,
					flags     : aFlags
				}
			);

if (TS.debug) dump('   allowed\n');
		return w;
	},
 
	newOpenDialog : function() 
	{
		var uri = arguments.length ? arguments[0] : null ;
		var TS  = TabbrowserService;
		var TPC = TabbrowserPopupController;

		if (uri == TS.browserURI &&
			TS.winHookMode == 2 &&
			TS.isBrowserWindow) {
			var documentURI = arguments.length > 2 ? arguments[3] : null ;
			var referrer = arguments.length > 4 ? arguments[5] : null ;
			TS.browserWindow.TabbrowserService.browser.addTab(documentURI, referrer);
			return window;
		}

		return __tabextensions_ctrlpopup__openDialog.apply(this, arguments);
	},
 
	// methods like "GlobalWindowImpl", transplanted from nsGlobalWindow.cpp 
	// see http://lxr.mozilla.org/mozilla/source/dom/src/base/nsGlobalWindow.cpp
	
	openAllowed    : 0, // open that window without worries 
	openControlled : 1, // it's a popup, but allow it
	openAbused     : 2, // it's a popup. disallow it, but allow domain override.
	openOverridden : 3, // disallow window open
 
	checkForAbusePoint : function(aInfo) 
	{
		if (!aInfo)
			return this.openOverridden;

		const CI = Components.interfaces;
		if (aInfo.window.QueryInterface(CI.nsIInterfaceRequestor).getInterface(CI.nsIWebNavigation).QueryInterface(CI.nsIDocShellTreeItem).itemType != CI.nsIDocShellTreeItem.typeContent)
			return this.openAllowed;


		var w     = aInfo.window;
		var abuse = '__tabextensions_ctrlpopup__popupState' in w ? w.__tabextensions_ctrlpopup__popupState : this.openAllowed ;


		// delayed popups, requested before being initialized
		if (
			!('__tabextensions_ctrlpopup__popupState' in w) &&
			!('__tabextensions__triggerByUser' in w) // except bookmarklets
			) {
			var rejectDelay = Math.max(Number(this.service.getPref('dom.disable_open_click_delay')), 0);
/*
			function findRootCaller(aFunc)
			{
//				dump('====CALLER('+aFunc.__parent__+')====\n'+aFunc+'\n');
				return (!aFunc || !aFunc.arguments.callee.caller) ? aFunc : findRootCaller(aFunc.arguments.callee.caller) ;
			}
			var foundCaller = findRootCaller(arguments.callee.caller);
*/
			if (
				rejectDelay &&
				'__tabextensions__LastEvent' in w &&
				(aInfo.now - w.__tabextensions__LastEvent) > rejectDelay
				) {
				if (this.service.debug) dump('TBE blocks popup: '+(aInfo.now - w.__tabextensions__LastEvent)+'msec DELAYED\n');
				abuse = this.openOverridden;
			}
		}

		// is the document being loaded or unloaded?
		if (
			abuse == this.openAllowed &&
			w.document.tabbrowserReadyState != 'complete'
			) {
			if (this.service.debug) dump('TBE blocks popup: LOADING\n');
			abuse = this.openAbused;
		}

		// fetch pref string detailing which events are allowed
		// see http://lxr.mozilla.org/mozilla/source/dom/src/base/nsGlobalWindow.cpp#3045 (definition of GlobalWindowImpl::CheckForAbusePoint())
		var type   = '__tabextensions__activeEventType' in w ? w.__tabextensions__activeEventType : null ;
		var events = w.__tabextensions__activeEvents;
		if (
			type &&
			type in events &&
			events[type].length &&
			events[type][events[type].length-1].eventPhase > 0 &&
			events[type][events[type].length-1].eventPhase < 4
			) {
			abuse = this.openAbused;
			var allowed_events = this.service.getPref('dom.popup_allowed_events');
			if (allowed_events === null)
				allowed_events = 'change click dblclick reset submit';
			if ((' '+allowed_events.toLowerCase()+' ').indexOf(' '+type.toLowerCase()+' ') > -1) {
				switch (type)
				{
					case 'select':
					case 'resize':
					case 'input':
					case 'change':
					case 'keypress':
					case 'keyup':
					case 'keydown':
					case 'error':
					case 'submit':
					case 'reset':
						abuse = this.openControlled;
						break;
					case 'mouseup':
					case 'mousedown':
					case 'dblclick':
						if (w.__tabextensions__activeEventButton == 0)
							abuse = this.openControlled;
						break;
					case 'click':
						if (w.__tabextensions__activeEventButton == 0)
							abuse = this.openAllowed;
						break;
					default:
						break;
				}
			}
			if (this.service.debug && abuse == this.openAbused)
				dump('TBE blocks popup: DENIED EVENT ('+type+')\n');
		}

		// limit the number of simultaneously open popups
		if (abuse == this.openAbused || abuse == this.openControlled) {
			var max = this.service.getPref('dom.popup_maximum');
			if (max === null) max = 20; // for Mozilla 1.6 or older (default at Mozilla 1.7a)
			max = Math.max(Number(max), 0);
			if (
				max >= 0 &&
				('openPopupSpamCount' in w ? w.openPopupSpamCount : 0 ) >= max
				) {
				if (TS.debug) dump('TBE blocks popup: TOO MANY SPAM WINDOWS\n');
				abuse = this.openOverridden;
			}
		}

		return abuse;
	},
 
	checkOpenAllow : function(aAbuseLevel, aName, aCurrentWindow) 
	{
		var allowWindow = true;

		if (
			aAbuseLevel == this.openOverridden ||
			(
				aAbuseLevel == this.openAbused &&
				this.isPopupBlocked(aCurrentWindow)
			)
			) {
			allowWindow = false;

			if (
				aName &&
				(
					aName.search(/^_(top|self|content)$/i) > -1 ||
					aName == '_main' ||
					this.service.WindowWatcher.getWindowByName(aName, aCurrentWindow)
				)
				)
				allowWindow = true;
		}

		return allowWindow;
	},
 
	isPopupBlocked : function(aWindow) 
	{
		var blockedPref = this.service.getPref('dom.disable_open_during_load'); // for Mozilla 1.6 or older
		var blocked = (blockedPref === null) ? true : blockedPref ;

		try { // for Mozilla 1.2 or later
			const nsIPopupWindowManager = Components.interfaces.nsIPopupWindowManager;
			const PopupManager = Components.classes['@mozilla.org/PopupWindowManager;1'].getService(nsIPopupWindowManager);
			var permission = PopupManager.testPermission(
					this.service.makeURIFromSpec(
						('Components' in window && 'lookupMethod' in Components) ? Components.lookupMethod(aWindow, 'location').call(aWindow).href : aWindow.location.href
					)
				);
			if (blockedPref === null) // for Mozilla 1.7a or later
				blocked = (permission == nsIPopupWindowManager.DENY_POPUP);
			else if (permission != nsIPopupWindowManager.DENY_POPUP)
				blocked = false;
		}
		catch(e) {
		}

		return blocked;
	},
 
	fireAbuseEvents : function(aBlocked, aOpenWindow, aInfo) 
	{
		if (aBlocked)
			this.firePopupBlockedEvent(aInfo.window, aInfo.uri, aInfo.flags);
		if (aOpenWindow)
			this.firePopupWindowEvent(aInfo.window);
	},
	
	firePopupBlockedEvent : function(aWindow, aURI, aFlags) 
	{
		try {
			var event = document.createEvent('PopupBlockedEvents');
			event.initPopupBlockedEvent(
				'DOMPopupBlocked',
				true,
				true,
				this.service.makeURIFromSpec('Components' in window && 'lookupMethod' in Components ? Components.lookupMethod(aWindow, 'location').call(aWindow).href : aWindow.location.href ),
				this.service.makeURIFromSpec(aURI),
				aFlags
			);
			Components.lookupMethod(aWindow, 'top').call(aWindow).document.dispatchEvent(event);
		}
		catch(e) {
			alert('@TabbrowserPopupController.firePopupBlockedEvent()\n'+e);
		}
	},
 
	firePopupWindowEvent : function(aWindow) 
	{
		try {
			var event = document.createEvent('Events');
			event.initEvent('PopupWindow', true, true);
			Components.lookupMethod(aWindow, 'top').call(aWindow).document.dispatchEvent(event);
		}
		catch(e) {
			alert('@TabbrowserPopupController.firePopupWindowEvent()\n'+e);
		}
	},
  
	applyFlagsPermission : function(aFlags) 
	{
		// ignore disabled flags
		var flags = aFlags || '';
		var features = [
				'titlebar',
				'close',
				'toolbar',
				'location',
				'directories',
				'personalbar',
				'menubar',
				'scrollbars',
				'resizable',
				'minimizable',
				'status'
			],
			regexp = new RegExp();
		for (var i in features)
			if (this.service.getPref('dom.disable_window_open_feature.'+features[i])) {
				flags = flags.replace(regexp.compile(features[i]+'=(0|false|no)?,?', 'gi'), '');
				if (flags.indexOf(features[i]) < 0)
					flags = flags ? flags + ',' + features[i] : features[i] ;
			}

		return flags;
	},
   
	// timers 
	
	newWindowSetTimeout : function() 
	{
		var w     = this,
			exp   = arguments[0],
			delay = arguments[1],
			args  = [],
			TS    = TabbrowserService,
			TPC   = TabbrowserPopupController;
		if (arguments.length > 2)
			for (var i = 2; i < arguments.length; i++)
				args.push(arguments[i] ? arguments[i].toSource() : arguments[i] );

		args = args.length ? args.join(',') : '' ;

		var popupState = TPC.openAbused;
		if (
			!w.__tabextensions_ctrlpopup__runningTimeoutDepth &&
			w.__tabextensions_ctrlpopup__popupControlState < TPC.openAbused &&
			delay <= Math.max(Number(TS.getPref('dom.disable_open_click_delay')), 0)
			) {
			popupState = w.__tabextensions_ctrlpopup__popupControlState;
		}
		if (TS.debug) dump('TBE blocks delayed popup: '+delay+'msec DELAYED\n');

		var runTimeout = function() {
			++w.__tabextensions_ctrlpopup__runningTimeoutDepth;
			w.__tabextensions_ctrlpopup__popupState = popupState;
			try {
				if (typeof exp == 'function')
					exp.apply(w, args);
				else
					eval(exp);
			}
			catch(e) {
			}
			--w.__tabextensions_ctrlpopup__runningTimeoutDepth;
			delete w.__tabextensions_ctrlpopup__popupState;

			delete w;
			delete exp;
			delete popupState;
			delete runTimeout;
		};

		delete delay;
		delete args;
		delete TS;
		delete TPC;

		return eval('this.__tabextensions_ctrlpopup__setTimeout(runTimeout, delay)');
	},
 
	newWindowSetInterval : function() 
	{
		var w     = this,
			exp   = arguments[0],
			delay = arguments[1],
			args  = [],
			TS    = TabbrowserService,
			TPC   = TabbrowserPopupController;
		if (arguments.length > 2)
			for (var i = 2; i < arguments.length; i++)
				args.push(arguments[i] ? arguments[i].toSource() : arguments[i] );

		args = args.length ? args.join(',') : '' ;

		var popupState = TPC.openAbused;
		if (
			!w.__tabextensions_ctrlpopup__runningTimeoutDepth &&
			w.__tabextensions_ctrlpopup__popupControlState < TPC.openAbused &&
			delay <= Math.max(Number(TS.getPref('dom.disable_open_click_delay')), 0)
			) {
			popupState = w.__tabextensions_ctrlpopup__popupControlState;
		}
		if (TS.debug) dump('TBE blocks delayed popup: '+delay+'msec DELAYED\n');

		var runTimeout = function() {
			++w.__tabextensions_ctrlpopup__runningTimeoutDepth;
			w.__tabextensions_ctrlpopup__popupState = popupState;
			try {
				if (typeof exp == 'function')
					exp.apply(w, args);
				else
					eval(exp);
			}
			catch(e) {
			}
			--w.__tabextensions_ctrlpopup__runningTimeoutDepth;
			delete w.__tabextensions_ctrlpopup__popupState;
		};

		return eval('this.__tabextensions_ctrlpopup__setInterval(runTimeout, delay)');
	},
  
	openBrowserTab : function(aURI, aName, aFlags, aSourceURI) 
	{
		var TS  = window.TabbrowserService;
		var contextWindow = TS.getWindowFromDocument(this.document, this);
		if (!contextWindow) contextWindow = this;

		var TPC = window.TabbrowserPopupController;
if (TS.debug) dump('newWindowOpen/openBrowserTab ('+aURI+')\n');

		var abuseLevel = TPC.checkForAbusePoint({
				window    : contextWindow,
				XULwindow : window,
				now       : (new Date()).getTime(),
				uri       : aURI,
				source    : sourceURI
			});

if (TS.debug) dump('   abuse level: '+abuseLevel+'\n');
		if (!TPC.checkOpenAllow(abuseLevel, aName, contextWindow)) {
if (TS.debug) dump('   blocked\n');
			TPC.fireAbuseEvents(
				true,
				false,
				{
					window    : contextWindow,
					uri       : aURI,
					flags     : aFlags
				}
			);
			return {};
		}

		var retVal = TPC.openBrowserTabInternal(contextWindow, aURI, aName, aFlags, aSourceURI);

		if (abuseLevel >= TPC.openAbused)
			TPC.fireAbuseEvents(
				false,
				true,
				{
					window : contextWindow
				}
			);

if (TS.debug) dump('   allowed\n');

		return retVal;
	},
	
	openBrowserTabInternal : function(aContextWindow, aURI, aName, aFlags, aSourceURI) 
	{
		var uri = aURI || 'about:blank' ;
		var event;
		var i;

		if  ( // when should not open tab
			'shouldOpenBrowserTab' in aContextWindow &&
			!aContextWindow.shouldOpenBrowserTab(uri, aName, aFlags)
			) {
//			dump('tabextensions:window.open is rejected\n');
			return null;
		}

		this.service.uriSecurityCheck(uri, aSourceURI);

		var name = !aName ? '_blank' : String(aName) ;
		aFlags = this.applyFlagsPermission(aFlags);

		var w = null;


		var b = this.service.browser,
			browser,
			parentTab;
		var loadInBackground = this.service.getPref('browser.tabs.extensions.loadInBackgroundJS');

		// prevent to open same URI
		if (this.service.preventSameURLTab) {
			if (b.selectedTab.getAttribute('tab-loadingURI') == uri)
				return b.selectedTab.mBrowser.contentWindow;

			for (i = 0; i < b.mTabs.length; i++)
			{
				if (b.mTabs[i].getAttribute('tab-loadingURI') != uri) continue;

				this.service.popupAlert(this.service.strbundle.GetStringFromName('status_same_uri_tab_exists'));

				if (!loadInBackground) {
					b.selectedTab = b.mTabs[i];
					b.scrollTabbarTo(b.selectedTab);
					b.setFocusInternal();
				}
				return b.mTabs[i].mBrowser.contentWindow;
			}
		}

		var topWin = Components.lookupMethod(aContextWindow, 'top').call(aContextWindow);
		for (i = 0; i < b.mTabs.length; i++)
			if (b.mTabs[i].mBrowser.contentWindow == topWin)
				parentTab = b.mTabs[i];

		var referrer = !parentTab || parentTab.referrerBlocked ? null : this.service.makeURIFromSpec(aSourceURI) ;

		// When a tab with the name exists, open in the tab.
		if (
			!this.service.getPref('browser.tabs.extensions.ignore_target') &&
			name.toLowerCase() != '_blank'
			) {
			var contentWindow;
			for (i = 0; i < b.mTabs.length; i++)
			{
				browser = b.mTabs[i].mBrowser;
				contentWindow = new XPCNativeWrapper(browser.contentWindow,
					'opener',
					'name'
				);

				if (b.mTabs[i].browserName != name &&
					contentWindow.name != name) continue;

				var realURI = this.service.getRealURI(uri);
				var bypassReferrerBlocker = realURI ? true : false ;
				if (realURI) uri = realURI;

				if (b.mTabs[i].referrerBlocked || bypassReferrerBlocker)
					referrer = null;

	/*
				var postData = {};
				uri = getShortcutOrURI(uri, postData);
				browser.webNavigation.loadURI(
					uri,
					Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
					referrer,
					('value' in postData ? postData.value : null ),
					null
				);
	*/
				browser.loadURI(uri, referrer);

				if (b.tabGroupsAvailable) b.attachTabTo(b.mTabs[i], parentTab, true);

				contentWindow.opener = aContextWindow;
				if (
					name &&
					String(name).search(/^_(self|top|parent|content|blank)$/i) < 0 &&
					name != '_main'
					)
					contentWindow.name = name;

	//			dump('tabextensions:window.open is redirected to existing tab:'+uri+'\n');

				return browser.contentWindow;
			}
		}


		var info = {
				browserName   : name,
				openedFromTab : true
			};

		// inherit status
		if (
			parentTab &&
			(
				!this.service.getPref('browser.tabs.extensions.inherit.onlySameSite') ||
				this.service.isSameHost(uri, aSourceURI)
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
				for (i in props)
					info[props[i]] = parentTab[props[i]];
				info.uri = uri;
			}
			delete props;
		}

		var openIn = this.service.getPref('browser.tabs.extensions.open_tab_in_link');
		if (openIn > -1) info.openIn = openIn;

		var t = b.addTabInternal(uri, referrer, info);
		if (!t) return null;


		if (parentTab)
			b.attachTabTo(t, parentTab, true);


		if (!loadInBackground) {
			b.selectedTab = t;
			b.scrollTabbarTo(b.selectedTab);
			b.setFocusInternal();
		}

		w = new XPCNativeWrapper(t.mBrowser.contentWindow,
				'opener',
				'name',
				'document'
			);
		var safeDocument = new XPCNativeWrapper(w.document);
		w.document = safeDocument;
		delete safeDocument;

		w.opener = aContextWindow;
		if (
			name &&
			String(name).search(/^_(self|top|parent|content|blank)$/i) < 0 &&
			name != '_main'
			)
			w.name = name;

		var dummyFunc = function() {};

		if (!w.resizeTo) w.resizeTo = dummyFunc;
		if (!w.resizeBy) w.resizeBy = dummyFunc;
		if (!w.moveTo)   w.moveTo   = dummyFunc;
		if (!w.moveBy)   w.moveBy   = dummyFunc;
		if (!w.focus)    w.focus    = dummyFunc;
		if (!w.location) w.location = { href : uri };

		delete uri;
		delete event;
		delete i;
		delete name;
		delete b;
		delete browser;
		delete parentTab;
		delete loadInBackground;
		delete topWin;
		delete referrer;
		delete info;
		delete openIn;
		delete t;

		return w;
	},
	
	allowPopupForURI : function(aURI, aWindow) 
	{
		var defaultAllowed = !(
				this.service.opentabforJS ||
				this.service.winHookMode == 2 ||
				(
					this.service.winHookMode == 1 &&
					aWindow &&
					aWindow.document.tabbrowserReadyState != 'complete'
				)
			);

		if (aURI) {
			var ex = defaultAllowed ? this.JSWindowOpenExceptionsBlack : this.JSWindowOpenExceptionsWhite ;
			for (var i = 0; i < ex.length; i++)
				if (aURI.indexOf(ex.getData(ex.item(i), 'Rule')) > -1)
					return !defaultAllowed;
		}

		return defaultAllowed;
	},
  
	shouldOpenBrowserTab : function(aURI, aName, aFlags) 
	{
		var topWin = ('Components' in window && 'lookupMethod' in Components) ? Components.lookupMethod(this, 'top').call(this) : this.top ;

		var inContent = this && topWin != Components.lookupMethod(window, 'top').call(window);


		/*
			The original mean of this pref is, to parse the link pref
			"browser.link.open_newwindow" for "window.open()" or not.
			Default value "2" means "parse only for popups with no option".
			"0" means "parse for any popup".
			"1" means "don't parse for any popup".

			TBE uses this pref like as a boolean pref (2 or not) because
			links and popups are controlled separately by default in TBE.
		*/
		var restrictionPref = window.TabbrowserService.getPref('browser.link.open_newwindow.restriction');
		if (restrictionPref === null) restrictionPref = 2;
		switch(restrictionPref)
		{
			case 0: // same to link
				break;

			case 1: // ignore link pref
				break;

			default: // ignore only for popups with options
			case 2:
				if (
					aFlags &&
		//			String(aFlags).search(/(^|,)(width|height)=[0-9]*/i) > -1 &&
					window.TabbrowserService.winHookMode != 2
					)
					return false;
				break;
		}


		return (
			(
				!inContent &&
				(!aURI || aURI.indexOf('chrome:') != 0) && // not-registered resources
				(
					// unrequested open in single window mode
					window.TabbrowserService.winHookMode == 2 ||
					( // unrequested open in XUL windows
						window.TabbrowserService.winHookMode == 1 &&
						window.document.documentElement.namespaceURI != window.TabbrowserService.XULNS
					)
				)
			) ||
			// window.open of content windows
			(
				inContent &&
				(
					TabbrowserService.getPref('browser.tabs.extensions.ignore_target') ||
					!TabbrowserService.getFrameByName(topWin, aName, this)
				) &&
				(
					(window.TabbrowserService.winHookMode == 1 && this.document.tabbrowserReadyState != 'complete') ||
					window.TabbrowserService.winHookMode == 2 ||
					!window.TabbrowserPopupController.allowPopupForURI(aURI, this)
				)
			)
			);

/*
		alert(
			['(',
			'    (!inContent [['+!inContent+']] &&',
			'    (!aURI || !aURI.match(/^chrome:/)) [['+(!aURI || !aURI.match(/^chrome:/))+' &&',
			'    (',
			'       window.TabbrowserService.winHookMode == 2 [['+(window.TabbrowserService.winHookMode == 2)+']] ||',
			'        (',
			'           window.TabbrowserService.winHookMode == 1 [['+(window.TabbrowserService.winHookMode == 1)+']] &&',
			'           window.document.documentElement.namespaceURI != window.TabbrowserService.XULNS [['+(window.document.documentElement.namespaceURI != window.TabbrowserService.XULNS)+']]',
			'       )',
			'    )',
			') ||',
			'(',
			'inContent [['+inContent+']] &&',
			'!TabbrowserService.getFrameByName(topWin, aName, this) [['+!TabbrowserService.getFrameByName(topWin, aName, this)+']] &&',
			'   (',
			'       (window.TabbrowserService.winHookMode == 1 && this.document.tabbrowserReadyState != \'complete\') [['+(window.TabbrowserService.winHookMode == 1 && this.document.tabbrowserReadyState != 'complete')+']] ||',
			'       window.TabbrowserService.winHookMode == 2 [['+(window.TabbrowserService.winHookMode == 2)+']] ||',
			'       !window.TabbrowserPopupController.allowPopupForURI(aURI) [['+!window.TabbrowserPopupController.allowPopupForURI(aURI)+']]',
			'   )',
			')'
		].join('\n'));
*/
	},
  
	showBlockedPopup : function(aEvent) 
	{
		// update "__tabextensions__LastEvent" property before to reopen popup, because those popups are blocked as "delayed popups".
		var requestingWindowURI = Components.classes['@mozilla.org/network/io-service;1']
                          .getService(Components.interfaces.nsIIOService)
                          .newURI(aEvent.target.getAttribute('requestingWindowURI'), null, null);
		var shell = this._findChildShell(gBrowser.selectedBrowser.docShell, requestingWindowURI);
		if (shell) {
			shell.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsIDOMWindowInternal)
				.__tabextensions__LastEvent = (new Date()).getTime();
		}

		this.__tabextensions_ctrlpopup__showBlockedPopup(aEvent);
	},
	callFindChildShell : function(aDocShell, aSoughtURI)
	{
		return findChildShell(null, aDocShell, aSoughtURI);
	}
 
}; 
  
// end of definition 

if (!window.TabbrowserServiceModules)
	window.TabbrowserServiceModules = [];
if (TabbrowserPopupController.enabled)
	TabbrowserServiceModules.push(TabbrowserPopupController);
}
 