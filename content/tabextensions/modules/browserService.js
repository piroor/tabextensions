// start of definition 
if (!window.TBEBrowserService) {

var gTSDOMWindowOpenObserver;
 
// static class "TBEBrowserService" 
var TBEBrowserService =
{
	
	get service() 
	{
		if (this._service === void(0))
			this._service = 'TabbrowserService' in window ? window.TabbrowserService : null ;

		return this._service;
	},
//	_service : null,
 
	// event handling 
	
	onInit : function() 
	{
		var TS = TabbrowserService;
		var i;

		// Catch up changing of prefs
		if (TS.isBrowserWindow) {
			TS.addPrefListener(gTSTabMenuPrefListener);
 			TS.addPrefListener(gTSPlatformNativeBehaviorPrefListener);
			TS.addPrefListener(gTWindowModePrefListener);
			TS.addPrefListener(gTSOpenTabForWindowOpenPrefListener);

			if (!TS.getPref('browser.tabs.extensions.updateNativeSingleWindowPref.done'))
				gTSOpenTabForWindowOpenPrefListener.updateNativeSingleWindowPref();

			var w = TS.browserWindows;
			for (i in w)
				if (w[i] != window && w[i].gTSDOMWindowOpenObserver) {
					window.gTSDOMWindowOpenObserver = w[i].gTSDOMWindowOpenObserver;
					break;
				}

			if (!window.gTSDOMWindowOpenObserver) {
				window.gTSDOMWindowOpenObserver = this.DOMWindowOpenObserver;
				TS.ObserverService.addObserver(window.gTSDOMWindowOpenObserver, 'domwindowopened', false);
			}

			TS.ObserverService.addObserver(this, 'StartDocumentLoad', false);
		}
		if (TS.browser) {
			window.addEventListener('focus', this.onWindowFocus, true);
			window.addEventListener('blur', this.onWindowBlur, true);

			TS.addPrefListener(gTSTabbarBlankSpacePrefListener);
			TS.addPrefListener(gTSNarrowTabPrefListener);
			TS.addPrefListener(gTSCloseBoxPrefListener);
			TS.addPrefListener(gTSLastTabClosingPrefListener);
			TS.addPrefListener(gTSTabsAutoHidePrefListener);
			TS.addPrefListener(gTSIconOverlayInTabsPrefListener);
			TS.addPrefListener(gTSTabbarPlacePrefListener);
			TS.addPrefListener(gTSGroupModePrefListener);
			TS.addPrefListener(gTSThumbnailPrefListener);
			TS.addPrefListener(gTSTabsWidthPrefListener);
			TS.addPrefListener(gTSTabScrollerPrefListener);

			window.addEventListener('resize', this.onWindowResize, false);
		}

		this.updateTabBrowser();

		if (TS.isBrowserWindow) {
			gTSTabMenuPrefListener.observe(null, 'nsPref:changed', null);
			gTSProgressbarPrefListener.observe(null, 'nsPref:changed', null);
			gTSPlatformNativeBehaviorPrefListener.observe(null, 'nsPref:changed', null);
			gTWindowModePrefListener.observe(null, 'nsPref:changed', null);
			gTSGroupModePrefListener.observe(null, 'nsPref:changed', null);
		}
		if (TS.browser) {
			gTSTabbarPlacePrefListener.update();
//			gTSTabbarPlacePrefListener.observe(null, 'nsPref:changed', null);
			gTSIconOverlayInTabsPrefListener.observe(null, 'nsPref:changed', null);
			gTSTabbarBlankSpacePrefListener.observe(null, 'nsPref:changed', null);
			gTSNarrowTabPrefListener.observe(null, 'nsPref:changed', null);
			gTSCloseBoxPrefListener.observe(null, 'nsPref:changed', 'browser.tabs.extensions.show_closebox.tab');
			gTSCloseBoxPrefListener.observe(null, 'nsPref:changed', 'browser.tabs.extensions.show_closebox.tabbar');
			gTSCloseBoxPrefListener.observe(null, 'nsPref:changed', 'browser.tabs.extensions.show_closebox.tab.appearance');
			gTSLastTabClosingPrefListener.observe(null, 'nsPref:changed', null);
			gTSThumbnailPrefListener.observe(null, 'nsPref:changed', null);
			gTSTabsWidthPrefListener.observe(null, 'nsPref:changed', null);
			gTSTabScrollerPrefListener.observe(null, 'nsPref:changed', null);

			var defaultFeaturePrefs = [
					'locked',
					'referrerBlocked',
					'allowPlugins',
					'allowJavascript',
					'allowMetaRedirects',
					'allowSubframes',
					'allowImages'
				];
			var j;
			var t = TS.browser.mTabs;
			var max = t.length;
			for (i = 0; i < max; i++)
				for (j in defaultFeaturePrefs)
					t[i][defaultFeaturePrefs[j]] = TS.getPref('browser.tabs.extensions.'+defaultFeaturePrefs[j]+'.enabled');
		}


		if (!TS.isNewTypeBrowser) {
			window.addEventListener('close', this.onWindowClose, false);
		}
	},
 
	onBeforeInitWithDelay : function() 
	{
		// reset tab index (we have to do it for Mac OS X)
		// *2005.1.27:
		//   This section is for old implementation.
		//   I have not texted yet. Can I remove this scrion, or cannot?
		var b = TabbrowserService.browser;
		if (b) {
			function resetTabIndex()
			{
				var tabs = b.mTabs;
				var max  = tabs.length;
				for (var i = 0; i < max; i++)
					tabs[i].tabIndex = i;
			}
			resetTabIndex();
		}
	},
 
	onInitWithDelay : function() 
	{
		// reset labels
		if (TabbrowserService.browser)
			gTSTabsWidthPrefListener.observe(null, 'nsPref:changed', null);

		// sometimes, menuitems in "chevron" are shown as personal toolbar buttons, like "buttons are doubled".
		// this rebuilding is a fix for this problem.
		if (document.getElementById('bookmarks-chevron'))
			document.getElementById('bookmarks-chevron').builder.rebuild();
		if (document.getElementById('bookmarks-ptf'))
			document.getElementById('bookmarks-ptf').builder.rebuild();
	},
 
	onDestruct : function() 
	{
		var TS = TabbrowserService;
		var i;

		if (TS.isBrowserWindow) {
			TS.removePrefListener(gTSTabMenuPrefListener);
			TS.removePrefListener(gTSProgressbarPrefListener);
			TS.removePrefListener(gTSPlatformNativeBehaviorPrefListener);
			TS.removePrefListener(gTWindowModePrefListener);
			TS.removePrefListener(gTSOpenTabForWindowOpenPrefListener);

			try {
				var w = TS.browserWindows;
				if (!w.length || (w.length == 1 && w[0] == window))
					TS.ObserverService.removeObserver(window.gTSDOMWindowOpenObserver, 'domwindowopened', false);
			}
			catch(e) {
			}
			delete window.gTSDOMWindowOpenObserver;

			TS.ObserverService.removeObserver(this, 'StartDocumentLoad', false);
		}
		if (TS.browser) {
			window.removeEventListener('focus', this.onWindowFocus, true);
			window.removeEventListener('blur', this.onWindowBlur, true);

			TS.removePrefListener(gTSTabbarBlankSpacePrefListener);
			TS.removePrefListener(gTSNarrowTabPrefListener);
			TS.removePrefListener(gTSCloseBoxPrefListener);
			TS.removePrefListener(gTSLastTabClosingPrefListener);
			TS.removePrefListener(gTSTabsAutoHidePrefListener);
			TS.removePrefListener(gTSIconOverlayInTabsPrefListener);
			TS.removePrefListener(gTSTabbarPlacePrefListener);
			TS.removePrefListener(gTSGroupModePrefListener);
			TS.removePrefListener(gTSTabsWidthPrefListener);
			TS.removePrefListener(gTSTabScrollerPrefListener);

			window.removeEventListener('resize', this.onWindowResize, false);
		}


		window.removeEventListener('close', this.onWindowClose, false);


		this.destroyTabBrowser();
	},
 
	onWindowResize : function(aEvent) 
	{
		if (aEvent.target == window ||
			aEvent.target == document ||
			(new XPCNativeWrapper(aEvent.target, 'ownerDocument')).ownerDocument == document)
			TabbrowserService.browser.onTabsModified();
	},
 
	onWindowClose : function(aEvent) // confirm to close, when the window contains tabs 
	{
		var TS  = TabbrowserService;
		var TBS = TBEBrowserService;
		var TSM = 'TabbrowserSessionManager' in window ? TabbrowserSessionManager : null ;

		if (TBS.windowClosing) return false;
		TBS.windowClosing = true;

		var b  = TS.browser;
		var check,
			behavior = TS.getPref('browser.tabs.extensions.window_close.behavior');

		if (TS.activated && b) {
			if (behavior == 10 && b.canRemoveCurrentTab()) {
				b.removeCurrentTab();
				if (aEvent) {
					aEvent.preventDefault();
					aEvent.preventBubble();
					aEvent.preventCapture();
					aEvent.stopPropagation();
				}
				window.setTimeout(function() { TBEBrowserService.windowClosing = false; }, 100);
				return false;
			}
			else if (
				b.mTabs.length > 1 ||
				(
					behavior < 0 &&
					!TS.getPref('browser.tabs.extensions.window_close.behavior.confirmOnlyForMultipleTabs')
				)
				) {
				check = { value: behavior != -1 };
				// if you set TBE to do some window-closing action, do it silently
				if (check.value) {
					if (behavior == 1) {
						var statusText = TS.strbundle.GetStringFromName('message_cancel_windowclose').replace(/%s/gi, b.mTabs.length-1);
						var status = document.getElementById('statusbar-display');
						if (status)
							status.label = statusText;
						else
							window.status = statusText;

						try {
							var sound = Components.classes['@mozilla.org/sound;1'].createInstance(Components.interfaces.nsISound);
							sound.beep();
						}
						catch(e) {
						}
					}
				}
				// if no action is specified, TBE should ask the user to do what actions.
				// but, if the startup action is "load last sessioln", don't ask.
				// because we can restore the last visited tabs automatically on the next startup.
				else if (TSM && TS.getPref('browser.tabs.extensions.startup_action_overlay') == 0) {
					if (TS.getPref('browser.tabs.extensions.window_close.behavior') == 1)
						TS.setPref('browser.tabs.extensions.window_close.behavior', 0);
					return true;
				}
				// if no window-closing action and the startup action are specified,
				// ask user to do what action.
				else {
					var dialogTitle = TS.strbundle.GetStringFromName('message_confirm_windowclose_title'),
						dialogMessage = TS.strbundle.GetStringFromName('message_confirm_windowclose_text').replace(/%s/gi, b.mTabs.length),
						neverShowMessage = TS.strbundle.GetStringFromName('message_never_show_dialog');
					var buttonLabels = (TS.PromptService.BUTTON_TITLE_IS_STRING * TS.PromptService.BUTTON_POS_0) +
							(TS.PromptService.BUTTON_TITLE_CANCEL * TS.PromptService.BUTTON_POS_1),
						buttonLabel1 = TS.strbundle.GetStringFromName('message_confirm_windowclose_ok'),
						buttonLabel2 = null;
					var saveSessionBehavior = 0;
					if (TSM) {
						if (!TSM.shouldResutoreLastVisitedTabs) {
							buttonLabels += (TS.PromptService.BUTTON_TITLE_IS_STRING * TS.PromptService.BUTTON_POS_2);
							 saveSessionBehavior = 2;
							buttonLabel2 = TSM.strbundle.GetStringFromName('message_confirm_windowclose_save');
						}
						else {
							saveSessionBehavior = 1;
							buttonLabel1 = TSM.strbundle.GetStringFromName('message_confirm_windowclose_save');
						}
					}
					behavior = TS.PromptService.confirmEx(
							window,
							dialogTitle, dialogMessage,
							buttonLabels, buttonLabel1, null, buttonLabel2,
							neverShowMessage, check
						);
					if (behavior == saveSessionBehavior) behavior = 2;
					if (check.value && behavior != -1) {
						TS.setPref('browser.tabs.extensions.window_close.behavior', (behavior == 1 ? 1 : 0 ));

						if (behavior == 2) {
							TS.setPref('browser.tabs.extensions.startup_action_overlay', 0);

							check = { value : TS.getPref('browser.tabs.extensions.startup_action_overlay.one_time.hide_changemode_alert') };
							if (TSM && !check.value) {
								TS.PromptService.alertCheck(
									window,
									TSM.strbundle.GetStringFromName('message_confirm_windowclose_save_note_title'),
									TSM.strbundle.GetStringFromName('message_confirm_windowclose_save_note'),
									TS.strbundle.GetStringFromName('message_never_show_dialog'),
									check
								);
								if (check.value) TS.setPref('browser.tabs.extensions.startup_action_overlay.one_time.hide_changemode_alert', true);
							}
							return false;
						}
					}
				}

				switch (behavior)
				{
					default:
					case 0: // close all tabs
						break;

					case 1: // cancel to close
						if (aEvent) {
							aEvent.preventDefault();
							aEvent.preventBubble();
							aEvent.preventCapture();
							aEvent.stopPropagation();
						}

						window.setTimeout(function() { TBEBrowserService.windowClosing = false; }, 100);
						return false;

					case 2: // save all tabs and close window
						if (!TSM) break;

						var checkPref,
							label = '',
							message;
						if (TS.browserWindows.length == 1) {
							TS.setPref('browser.tabs.extensions.startup_action_overlay.one_time', true);
							TS.setPref('browser.tabs.extensions.startup_action_overlay.one_time.backup', TS.getPref('browser.tabs.extensions.startup_action_overlay'));
							checkPref = 'browser.tabs.extensions.startup_action_overlay.one_time.hide_alert';
							message = 'message_confirm_windowclose_alert_one_time';
						}
						else {
							label = TSM.saveTabSession();
							checkPref = 'browser.tabs.extensions.autosave_tabset.hide_alert';
							message = 'message_confirm_windowclose_alert_autosave_tabset';
						}
						TS.setPref('browser.tabs.extensions.startup_action_overlay', 0);
						check = { value : TS.getPref(checkPref) };
						if (!check.value) {
							TS.PromptService.alertCheck(
								window,
								TSM.strbundle.GetStringFromName('message_confirm_windowclose_alert_title'),
								TSM.strbundle.GetStringFromName(message).replace(/%s/gi, label),
								TS.strbundle.GetStringFromName('message_never_show_dialog'),
								check
							);
							if (check.value) TS.setPref(checkPref, true);
						}
						break;
				}
			}
		}

		// failsafe
//		if (TS.activated)
//			TS.destruct();

		return true;
	},
	windowClosing : false,
 
	// set the flag "is this window focused?" 
	// see the definition of "setFocusInternal" in the tabextensions.xml
	
	onWindowFocus : function(aEvent) 
	{
		window.setTimeout('window.__tabextensions__isWindowFocused = true;', 0);
	},
 
	onWindowBlur : function(aEvent) 
	{
		window.__tabextensions__isWindowFocused = false;
	},
  
	// 独自イベントの捕捉 
	
	onTabbrowserWindowClose : function(aEvent) 
	{
		var t = aEvent.originalTarget || aEvent.target;
		if (t) {
			var doc = (new XPCNativeWrapper(t, 'ownerDocument')).ownerDocument || t;
			doc.tabbrowserReadyState = 'loading';
		}
	},
 
	onTabbrowserWindowUnload : function(aEvent) 
	{
		var t = aEvent.originalTarget || aEvent.target;
		if (t) {
			var doc = (new XPCNativeWrapper(t, 'ownerDocument')).ownerDocument || t;
			doc.tabbrowserReadyState = 'loading';
		}
	},
 
	onXULTabbrowserTabbarResized : function(aEvent) 
	{
		var TS = TabbrowserService;
		var b  = TS.browser;
		TS.setPref('browser.tabs.extensions.tabs_width', b.mStrip.boxObject.width);
	},
 
	onXULTabbrowserTabLoading : function(aEvent) 
	{
		TBEBrowserService.onTabLoading(aEvent.target.getTabByTabId(aEvent.tabId), aEvent.loadingView, !aEvent.followFrames);
	},
 
	onXULTabbrowserTabLoad : function(aEvent) 
	{
		TBEBrowserService.onTabLoading(aEvent.loadedView, aEvent.target.getTabByTabId(aEvent.tabId));

		if (TabbrowserService.getPref('browser.tabs.extensions.tabs_width_type') == 1)
			TabbrowserService.browser.onTabsModified();
	},
 
	onXULTabbrowserTabStatusChange : function(aEvent) 
	{
		if (
			aEvent.targetURI != 'ANY' &&
			(
				TabbrowserService.shouldSaveBookmarksStatus ||
				aEvent.targetStatus == 'fixedLabel' ||
				(
					TabbrowserService.getPref('browser.tabs.extensions.bookmarks.save_textZoom') &&
					aEvent.targetStatus == 'textZoom'
				)
			)
			)
			TabbrowserService.saveBookmarkStatus(aEvent.target, aEvent.target.getTabByTabId(aEvent.tabId), aEvent.targetStatus);
	},
 
	onXULTabbrowserURIDrop : function(aEvent) 
	{
		// Make dragged links visited
		var links = TabbrowserService.getSelectionLinks();
		if (links.length == 1 &&
			links[0].uri == aEvent.droppedURI)
			TabbrowserService.markLinkVisited(links[0].uri, links[0].node);
	},
 
	onXULTabbrowserAddTabCanceled : function(aEvent) 
	{
		var TS = TabbrowserService;
		var chromehidden;
		var useOverflow = (
				( // if the tab bar is hidden
					(chromehidden = Components.lookupMethod(window, 'top').call(window).document.documentElement.getAttribute('chromehidden')) &&
					chromehidden.indexOf('location') > -1 &&
					chromehidden.indexOf('toolbar') > -1
				) ||
				(
					TS.getPref('browser.tabs.extensions.limit.overflow') &&
					TS.winHookMode != 2
				)
			);


		if (!useOverflow) {
			TS.popupAlert(TS.strbundle.GetStringFromName('status_tabs_rejected'));
			return;
		}


		// If another browser exists, open tab there.

		var referrer = aEvent.referrerURI ? TS.makeURIFromSpec(aEvent.referrerURI) : null ;
		var max      = TS.getPref('browser.tabs.extensions.limit.number');
		var info,
			b        = TS.browserWindows;
		var max = b.length;
		for (var i = 0; i < max; i++)
		{
			if (
				b[i] == window ||
				!b[i].TabbrowserService.browser ||
				!b[i].TabbrowserService.browser.mTabs ||
				(max && b[i].TabbrowserService.browser.mTabs.length >= max)
				)
				continue;

			b[i].focus();
			b[i].TabbrowserService.browser.addTabInternal(
				aEvent.loadingURI,
				referrer,
				aEvent.tabInfo
			);
			return;
		}

		// 他にブラウザウィンドウがない、あるいは、それらのウィンドウも全て制限いっぱいまでタブが開かれている場合、新規にウィンドウを開く
		// If other navigators have fully tabs, then open new navigator window.
//dump('over:'+aURI+'\n');
		TS.overflowingTabsManager.addTab(
			aEvent.loadingURI,
			referrer,
			aEvent.tabInfo
		);
	},
  
	onTabLoading : function(aRelatedTab, aWindow, aShouldNotFollowFrames) 
	{
		var TS = TabbrowserService;

		var id = aRelatedTab.tabId;
//		if (!TS.browser.getTabByTabId(id)) return;

		if (aWindow == Components.lookupMethod(aWindow, 'top').call(aWindow) &&
			!('__tabextensions__initialized' in aWindow)) {
			// アイコンが指定されている場合、そちらのアイコンを優先する。
			// URIがアイコンを指定されたブックマークのURIより下位のディレクトリでない場合、アイコンをリセットする。
			var icon = TS.getIconForBookmark(aRelatedTab.getAttribute('tab-loadingURI'), true);
			if (icon && id) {
				window.setTimeout('TabbrowserService.browser.getTabByTabId("'+id+'").setAttribute("image", "'+icon+'");', 0);
				// ページを開いた時点でアイコンの情報が上書きされてしまっているので、再度上書きし直す
				TS.setIconForBookmark(aRelatedTab.getAttribute('tab-loadingURI'));
			}
		}

		if (id)
			window.setTimeout('TabbrowserService.browser.getTabByTabId("'+id+'").updateThumbnail();', 0);

		var frames;
		try {
			frames = Components.lookupMethod(aWindow, 'frames').call(aWindow);
		}
		catch(e) {
		}
		if (frames && !aShouldNotFollowFrames) {
			var max = frames.length;
			for (var i = 0; i < max; i++)
				this.onTabLoading(aRelatedTab, frames[i]);
		}

		if (
			'__tabextensions__initialized' in aWindow ||
			!aWindow.Window
			)
			return;


		// set focus
		if (
			aRelatedTab == TS.browser.selectedTab &&
			!document.commandDispatcher.focusedElement // if a node has been focued, do nothing
			)
			TS.browser.setFocusInternal();


		// if there are multiple tabs, we should prevent to do it.
		if (TS.browser.mTabs.length > 1)
			TS.preventModifyWindowState(aWindow);

		aWindow.__tabextensions__LastEvent = (new Date()).getTime();

		aWindow.__tabextensions__initialized = true;
	},
  
	updateTabBrowser : function() 
	{
		var b = TabbrowserService.browser;
		if (!b) return;

		/*
			In some cases, TBE starts to initialize itself before
			the startup process of firefox is not completely done.
			Then, not initialized "mProgressListener" causes some
			troubles, like "unclosable tabs" and so on.
			So, I initialize the browser manually on this timing.

			see: browser.js::prepareForStartup()
				=> tabbrowser.xml::addProgressListener()
		*/
		if (!b.mProgressListeners) {
			b.mProgressListeners = [];
			if (!this.service.getPref('browser.tabs.autoHide') &&
				!this.service.getPref('browser.tabs.forceHide'))
				b.setStripVisibilityTo(true);
			b.mPanelContainer.addEventListener('DOMLinkAdded', b.onLinkAdded, false);
		}


		// failsafe
		if (b.mPanelContainer.selectedIndex !== 0 &&
			b.mTabListeners.length) // this "failsafe" section causes a fatal error in the latest nightly build so I skip it. (2004.1.21)
			b.mPanelContainer.selectedIndex = 0;

		this.updateMethods(b);
		this.updateContextMenu(b); // Add new menuitems
		this.updateTabContainer(b);

		// for Firefox
		// Firefox fails to execute "constructor" of tabs. why?
		b.mTabContainer.selectedIndex = 0;
		b.mTabs[0].setAttribute('first-tab', 'true');
		b.mTabs[b.mTabs.length-1].setAttribute('last-tab', 'true');
		b.selectedTab.__tabextensions__lastFocusedTime = (new Date()).getTime();

		b.mTabProgressListenerCreatorInternal.addListenerTo(b.selectedTab);

		b.addEventListener('DOMWindowClose', b.onWindowCloseInLastTabEventListener, true);

		// reset tabbrowserReadyState
		b.addEventListener('close', this.onTabbrowserWindowClose, true);
		// failsafe
		b.addEventListener('unload', this.onTabbrowserWindowUnload, true);

		b.addEventListener('XULTabbrowserTabLoading', this.onXULTabbrowserTabLoading, false);
		b.addEventListener('XULTabbrowserTabLoad', this.onXULTabbrowserTabLoad, false);
		b.addEventListener('XULTabbrowserTabStatusChange', this.onXULTabbrowserTabStatusChange, false);
		b.addEventListener('XULTabbrowserURIDrop', this.onXULTabbrowserURIDrop, false);
		// open tabs in other windows if "addTab" is canceled
		b.addEventListener('XULTabbrowserAddTabCanceled', this.onXULTabbrowserAddTabCanceled, false);


		// To fix the problem "window is always focued even if I prevent window-focus by a pref in the 'Focus' pref panel"
		var updateCurrentBrowser = b.updateCurrentBrowser.toString();
		if (updateCurrentBrowser.indexOf('window._content.focus()') > -1) {
			eval('b.updateCurrentBrowser = '+
				updateCurrentBrowser.replace(
					/window._content.focus\(\)/g,
					'gBrowser.setFocusInternal(_content);'
				).replace(
					/^[^\(]*/,
					'function'
				)
			);
		}
		else if (updateCurrentBrowser.indexOf('setFocus(element)') > -1) {
			eval('b.updateCurrentBrowser = '+
				updateCurrentBrowser.replace( // old
					/Components.lookupMethod\(element, "focus"\).call\(element\);/g,
					'tabBrowser.setFocusInternal(element);'
				).replace( // new
					/element.focus\(\);/g,
					'tabBrowser.setFocusInternal(element);'
				).replace(
					/^[^\(]*/,
					'function'
				).replace(
					'function setFocus',
					'var tabBrowser = this; function setFocus'
				)
			);
		}
		// fix the problem: when tabs are rearranged the URL bar indicates "not-rearranged" URLs. (only in Firefox 1.0.x / Mozilla Suite)
		updateCurrentBrowser = b.updateCurrentBrowser.toString();
		if (updateCurrentBrowser.search(/this\.mPanelContainer\.childNodes\[.+\.selectedIndex\]/) > -1) {
			eval('b.updateCurrentBrowser = '+
				updateCurrentBrowser.replace(
					/this\.mPanelContainer\.childNodes\[.+\.selectedIndex\]/g,
					'this.getBrowserForTab(this.selectedTab)'
				)
			);
		}
		else if (updateCurrentBrowser.search(/this\.mPanelContainer\.selectedIndex/) > -1) {
			eval('b.updateCurrentBrowser = '+
				updateCurrentBrowser.replace(
					/this\.mPanelContainer\.selectedIndex/g,
					'this.mTabContainer.selectedIndex'
				)
			);
		}



		/* Tab Bar Splitter */

		var splitter = document.createElement('splitter');
		splitter.setAttribute('tabid', 'tabbar-splitter');

		splitter.mTabBrowser = b;
		splitter.setAttribute('onmouseup', [
			'var event = document.createEvent("Events");',
			'event.initEvent("XULTabbrowserTabbarResized", false, true);',
			'this.mTabBrowser.dispatchEvent(event);'
		].join(''));

		b.mStrip.parentNode.insertBefore(splitter, b.mStrip.nextSibling);
		b.mTabBarSplitter = splitter;

		b.addEventListener('XULTabbrowserTabbarResized', this.onXULTabbrowserTabbarResized, false);
	},
	
	// メソッドの上書き 
	updateMethods : function(aTabBrowser)
	{


		// override "addTab" and "removeTab" methods.

		aTabBrowser.__tabextensions__addTab = aTabBrowser.addTab;
		aTabBrowser.addTab = this.addTab;

		aTabBrowser.__tabextensions__removeTab = aTabBrowser.removeTab;
		aTabBrowser.removeTab = this.removeTab;


		aTabBrowser.__tabextensions__setStripVisibilityTo = aTabBrowser.setStripVisibilityTo;
		aTabBrowser.setStripVisibilityTo = this.setStripVisibilityTo;


		aTabBrowser.replaceGroup = this.replaceGroup;

		aTabBrowser.getBrowserForTab           = this.getBrowserForTab;
		aTabBrowser.getBrowserAtIndex          = this.getBrowserAtIndex;
		aTabBrowser.getBrowserIndexForDocument = this.getBrowserIndexForDocument;

		aTabBrowser.onTabClick       = this.onTabClick;
		aTabBrowser.flipCurrentTab   = this.flipCurrentTab;

		if (!('selectNewTab' in aTabBrowser))
			aTabBrowser.selectNewTab = this.selectNewTab;


		aTabBrowser.__tabextensions__buildFavIconString = aTabBrowser.buildFavIconString;
		aTabBrowser.buildFavIconString = this.buildFavIconString;
		aTabBrowser.__tabextensions__loadFavIcon = aTabBrowser.loadFavIcon;
		aTabBrowser.loadFavIcon = this.loadFavIcon;
		aTabBrowser.__tabextensions__setTabTitle = aTabBrowser.setTabTitle;
		aTabBrowser.setTabTitle = this.setTabTitle;


		aTabBrowser.__tabextensions__updatePopupMenu = aTabBrowser.updatePopupMenu;
		aTabBrowser.updatePopupMenu = this.updatePopupMenu;

		var popups = aTabBrowser.mStrip.getElementsByAttribute('onpopupshowing', '*');
		var max = popups.length;
		for (var i = 0; i < max; i++)
			if (popups[i].localName == 'menupopup') {
				popups[i].setAttribute('onpopupshowing', 'this.parentNode.parentNode.parentNode.updatePopupMenu(this, event);');
				popups[i].mTabBrowser = aTabBrowser;
			}


		aTabBrowser.bookmarksManager = {
			isBookmarked : function(aURI)
			{
				return TabbrowserService.isBookmarked(aURI);
			},
			getName : function(aID)
			{
				return TabbrowserService.getNameForBookmark(aID);
			},
			setName : function(aNewName, aID)
			{
				TabbrowserService.setNameForBookmark(aNewName, aID);
			},
			getIcon : function(aURI, aOnlyUserDefined)
			{
				return TabbrowserService.getIconForBookmark(aURI, aOnlyUserDefined);
			},
			setIcon : function(aURI, aIconURI)
			{
				TabbrowserService.setIconForBookmark(aURI, aIconURI);
			},
			edit : function(aID)
			{
				if (!aID || !this.isBookmarked(aID)) return;

				if (TabbrowserService.isNewTypeBrowser) // Firefox
					window.openDialog('chrome://browser/content/bookmarks/bookmarksProperties.xul', '', 'centerscreen,chrome,resizable=no', aID, {});
				else
					window.openDialog('chrome://communicator/content/bookmarks/bm-props.xul', '', 'centerscreen,chrome,dialog=no,resizable=no,dependent', aID, {});
			},
			bookmarkTabGroup : function(aTab, aShouldBookmarkAllTabs)
			{
				TabbrowserService.bookmarkTabGroup(aTab, aShouldBookmarkAllTabs);
			}
		};


		// This is a hack for the "Ctrl-F4 closes the current tab twice
		// (so two tabs are wrongly closed)" problem.
		if ('_keyEventHandler' in aTabBrowser) {
			aTabBrowser.removeCurrentTab = this.removeCurrentTab;
			eval(
				'aTabBrowser._keyEventHandler.handleEvent ='+
				aTabBrowser._keyEventHandler.handleEvent.toString().replace(
					'this.tabbrowser.removeCurrentTab();',
					'{'+
//					'dump("now     : "+((new Date()).getTime())+"\\n");'+
//					'dump("removed : "+this.tabbrowser.mRemoveCurrentTabLastTimeStamp+"\\n");'+
					'if (Math.abs((new Date()).getTime() - this.tabbrowser.mRemoveCurrentTabLastTimeStamp) < 100) return;'+
					'this.tabbrowser.removeCurrentTab();'+
					'}'
				)
			);
		}

		delete aTabBrowser;
		delete i;
		delete uniqueId;
		delete method;
		delete func;
		delete popups;
	},
	
	removeCurrentTab : function() 
	{
		var tab = this.removeTab(this.mCurrentTab);;
		this.mRemoveCurrentTabLastTimeStamp = (new Date()).getTime();
		return tab;
	},
 
	getBrowserForTab : function(aTab) 
	{
		if (!aTab) return this.browser;

		if (aTab._mBrowser) return aTab._mBrowser;


		if (!aTab || aTab.localName == 'tabs') aTab = this.selectedTab;

		if (aTab == this.selectedTab)
			return this.mCurrentBrowser;

		// from Tab Mix/MiniT
		var panel = document.getElementById(aTab.getAttribute('linkedpanel'));
		return (panel.localName == 'browser') ? panel : // trunk
			panel.getElementsByTagNameNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'browser')[0] ; // Firefox 0.9.2 branch

		return null;
	},
 
	getBrowserAtIndex : function(aIndex) 
	{
		return (aIndex < this.mTabs.length) ? this.mTabs[aIndex].mBrowser : null ;
	},
 
	getBrowserIndexForDocument : function(aDocument) 
	{
		var tabs = this.mTabs;
		var max = tabs.length;
		for (var i = 0; i < max; i++) {
			if (tabs[i].mBrowser.contentDocument == aDocument) {
				return i;
			}
		}
		return -1;
	},
 
	// ポップアップメニューの更新 
	updatePopupMenu : function(aPopup, aEvent)
	{
		// if the popup is a submenu, return
		if (aEvent.originalTarget != aPopup) return;

		var node = document.popupNode;
		// cancel to show popup if any action is bound for right-click on tabs
		if (this.mPrefs.getIntPref((node && node.localName == 'tab') ? 'browser.tabs.extensions.onrightclick' : 'browser.tabs.extensions.tabbar_onrightclick' ) > -1) {
			aEvent.stopPropagation();
			aEvent.preventCapture();
			aEvent.preventDefault();
			aEvent.preventBubble();
			return false;
		}

		var tab = node || this.selectedTab;
		if (tab.localName != 'tab') tab = this.selectedTab;

		this.updateMenuItems(aPopup, this, tab, true);
	},
 
	updateTabsMenu : function(aPopup, aEvent) 
	{
		// if the popup is a submenu, return
		if (aEvent.originalTarget != aPopup) return;

		var nodes = aPopup.getElementsByAttribute('tbattr', 'tabbrowser-multiple');
		var single = gBrowser.mTabs.length == 1 ;
		var max = nodes.length;
		for (var i = 0;i < max; i++)
			if (single)
				nodes[i].setAttribute('disabled', true);
			else
				nodes[i].removeAttribute('disabled');

		gBrowser.updateMenuItems(aPopup);
	},
 
	// favicon 
	
	// アイコンの取得 
	buildFavIconString : function(aURI)
	{
		var icon = this.bookmarksManager ? this.bookmarksManager.getIcon(aURI.spec, true) : null ;
		return icon || this.__tabextensions__buildFavIconString(aURI) ;
	},
 
	loadFavIcon : function(aURI, aAttr, aNode) 
	{
		this.__tabextensions__loadFavIcon(aURI, aAttr, aNode);

		var icon = this.bookmarksManager ? this.bookmarksManager.getIcon(aURI.spec, true) : null ;

		if (icon) {
			window.setTimeout(
				function(aNode, aAttr, aURI)
				{
					aNode.setAttribute(aAttr, aURI);
				},
				0,
				aNode, aAttr, icon
			);
			this.bookmarksManager.setIcon(aURI.spec);
		}
	},
  
	addTab : function(aURI, aReferrerURI, aCharset, aPostData) 
	{
		var info = {
				charset  : (aCharset ? aCharset : null ),
				postData : (aPostData ? b.readPostStream(aPostData) : null )
			};
		return this.addTabInternal(aURI, aReferrerURI, info);
	},
 
	removeTab : function(aTab) 
	{
		this.removeTabInternal(aTab);
	},
 
	// タブ・タブバーをダブルクリック・中クリックした時の動作 
	// behavior of clicking on the the tabbar or tabs
	onTabClick : function(aEvent)
	{
		this.updateScrollbarFromEvent(aEvent);

		// tab flip
		if (
			aEvent.button == 0 &&
			!aEvent.shiftKey &&
			!aEvent.ctrlKey &&
			!aEvent.altKey &&
			!aEvent.metaKey &&
			aEvent.target.localName == 'tab' &&
			aEvent.target.hasAttribute('clickOnCurrent') &&
			this.mPrefs.getBoolPref('browser.tabs.extensions.tabFlip')
			) {
			switch (aEvent.type)
			{
				case 'click':
					if (!this.tabFlipTimer)
						this.tabFlipTimer = window.setTimeout(
							'gBrowser.flipCurrentTab();',
							Math.max(
								this.mPrefs.getIntPref('browser.tabs.extensions.tabFlip.delay'),
								0
							)
						);
					break;

				case 'dblclick':
				default:
					window.setTimeout('if (gBrowser.tabFlipTimer) { window.clearTimeout(gBrowser.tabFlipTimer); gBrowser.tabFlipTimer = null; }', 1);
					break;
			}
		}

		var type = (aEvent.type == 'dblclick') ? (aEvent.button == 0 ? 'double' : null ) :
					(aEvent.button == 1) ? 'middle' :
					(aEvent.button == 2) ? 'right' :
					(aEvent.button != 0) ? null :
					(!aEvent.shiftKey && (aEvent.ctrlKey || aEvent.metaKey) && !aEvent.altKey) ? 'ctrl' :
					(aEvent.shiftKey && !aEvent.ctrlKey && !aEvent.metaKey && !aEvent.altKey) ? 'shift' :
					(!aEvent.shiftKey && !aEvent.ctrlKey && !aEvent.metaKey && aEvent.altKey) ? 'alt' :
					null ;

		if (!type) return;

		var ignoreMiddleClick = false;
		try {
			ignoreMiddleClick = this.mPrefs.getBoolPref('middlemouse.contentLoadURL');
		}
		catch(e) {
		}
		if (type == 'middle' && ignoreMiddleClick) return;

		// in scrollbars
		if (aEvent.originalTarget.localName &&
			aEvent.originalTarget.localName.search(/^(scrollbar(button)?|slider|thumb|popup|menu|menupopup|menuitem|menuseparator)$/) > -1)
			return;

		var tab    = aEvent.target,
			action = 0,
			pref   = '';

		switch (tab.localName)
		{
			case 'tab':
				switch (type)
				{
					case 'double':
						pref = 'ondblclick';
						break;

					default:
						pref = 'on'+type+'click';
						break;
				}
				break;

			default: // tab bar
				tab = this.selectedTab;
				switch (type)
				{
					case 'double':
						pref = 'tabbar_ondblclick';
						break;

					default:
						pref = 'tabbar_on'+type+'click';
						break;
				}
				break;
		}

		if (pref) {
			try {
				action = this.mPrefs.getIntPref('browser.tabs.extensions.'+pref);
			}
			catch(e) {
			}
		}

		switch (action)
		{
			case -1:
				return;

			case 0:
			default:
				break;

			case 1:
				BrowserOpenTab();
				break;
			case 2:
				this.reloadTab(tab);
				break;
			case 3:
				this.reloadAllTabs();
				break;
			case 4:
				this.removeTab(tab);
				break;
			case 5:
				this.removeAllTabsButInternal(tab);
				break;
			case 6:
				if (this.tabGroupsAvailable)
					this.bookmarksManager.bookmarkTabGroup(tab);
				else if ('addGroupmarkAs' in window)
					addGroupmarkAs();
				else
					this.bookmarksManager.bookmarkTabGroup(tab, true);
				break;

			case 101:
				this.duplicateTab(tab);
				break;
			case 102:
				this.toggleTabLocked(tab);
				break;
			case 103:
				this.toggleTabAutoReload(tab);
				break;
			case 104:
				this.removeLeftTabsFrom(tab);
				break;
			case 105:
				this.removeRightTabsFrom(tab);
				break;
			case 106:
				this.duplicateTabInWindow(tab);
				break;
			case 107:
				this.moveTabBy(tab, -1);
				break;
			case 108:
				this.moveTabBy(tab, 1);
				break;
			case 109:
				this.removeTabGroup(tab);
				break;
			case 110:
				this.sortTabsByGroup();
				break;
			case 111:
				this.highlightGroupFromTab(tab);
				break;
			case 112:
				tab.setTabColor(tab);
				break;
			case 113:
				this.undoRemoveTab();
				break;
			case 114:
				this.editBookmarkFromTab(tab);
				break;
			case 115:
				this.toggleReferrerBlocked(tab);
				break;
			case 116:
				window.openDialog('chrome://tabextensions/content/contextMenuEdit.xul', '', 'chrome,modal,resizable=no');
				break;
			case 117:
				this.removeAllTabs();
				break;
			case 118:
				this.setFixedLabelFor(tab);
				break;
			case 119:
				this.removeVisitedTabs();
				break;

			case 200:
				this.toggleDocShellPropertyFor(tab, 'allowPlugins');
				break;
			case 201:
				this.toggleDocShellPropertyFor(tab, 'allowJavascript');
				break;
			case 202:
				this.toggleDocShellPropertyFor(tab, 'allowMetaRedirects');
				break;
			case 203:
				this.toggleDocShellPropertyFor(tab, 'allowSubframes');
				break;
			case 204:
				this.toggleDocShellPropertyFor(tab, 'allowImages');
				break;

			case 300:
				this.toggleAllTabsLocked();
				break;
			case 301:
				this.toggleReferrerBlockedForAllTabs();
				break;
			case 302:
				this.toggleAllTabsAutoReload();
				break;

			case 400:
				if (tab.hasChildTabs())
					tab.tabSubgroupCollapsed = !tab.tabSubgroupCollapsed;
				break;
		}

		aEvent.preventDefault();
		aEvent.preventBubble();
		aEvent.preventCapture();
		aEvent.stopPropagation();
	},
	flipCurrentTab : function()
	{
		this.tabFlipTimer = null;
		this.selectedTab.removeAttribute('clickOnCurrent');
		this.advanceSelectedTabByLastFocusedTime(-1);
	},
 
	setStripVisibilityTo : function(aValue) 
	{
		if (aValue)
			this.removeAttribute('tabbar-hidden');
		else
			this.setAttribute('tabbar-hidden', true);

		this.__tabextensions__setStripVisibilityTo(aValue);
	},
 
	replaceGroup : function(aGroupInfo) 
	{
		var oldTabsInfo = [];
		var i;

		var max = this.mTabs.length;
		for (i = 0; i < max; i++)
			oldTabsInfo.push(this.getTabInfo(this.mTabs[i]));

		var t = this.removeAllTabsButInternal(this.addTab('about:blank'), { preventUndo : true });

		max = aGroupInfo.length;
		for (i = 0; i < max; i++)
		{
			if ('SHEntries' in aGroupInfo[i])
				this.addTabWithTabInfo(aGroupInfo[i]);
			else {
				var referrerURI = 'referrerURI' in aGroupInfo[i] ? data.referrerURI : null ;
				this.addTab(aGroupInfo[i].URI, aGroupInfo[i]);
			}
		}

		if (aGroupInfo.length)
			this.removeTabInternal(t, { preventUndo : true });

		return oldTabsInfo;
	},
 
	setTabTitle : function(aTab) 
	{
		if (!aTab) aTab = this.selectedTab;
		this.__tabextensions__setTabTitle(aTab);
		aTab.setAttribute('crop', aTab.getAttribute('tab-titleCrop'));
	},
  
	// メニュー項目の追加 
	updateContextMenu : function(aTabBrowser)
	{
	try {
		var i, max;
		var TS = TabbrowserService;
		var mpopup = aTabBrowser.mTabContainer.previousSibling;


		/*
			1: name menuitems
			2: create "removeOther" item if it doesn't exist
			3: name menuseparators
			4: insert/append extra items and separators
		*/


		// 1: name menuitems
		var ds;
		try {
			ds = TS.RDF.GetDataSourceBlocking('chrome://tabextensions/content/tabsContextMenuItems.rdf');
		}
		catch(ex) {
			ds = TS.RDF.GetDataSource('chrome://tabextensions/content/tabsContextMenuItems.rdf');
		}
		if (!ds.GetAllResources().hasMoreElements()) {
			dump('ERROR: tabextensions fails to initialize tab\'s context menu.\n');
			return;
		}

		var label,
			res,
			id,
			namedItems = [];
		max = mpopup.childNodes.length;
		for (i = 0; i < max; i++)
		{
			label = mpopup.childNodes[i].getAttribute('label');
			if (!label) continue;

			res = ds.GetSource(
					TS.RDF.GetResource('http://white.sakura.ne.jp/~piro/rdf#Label'),
					TS.RDF.GetLiteral(label),
					true
				);
			if (!res) continue;

			id = ds.GetTarget(
					res,
					TS.RDF.GetResource('http://white.sakura.ne.jp/~piro/rdf#Id'),
					true
				);
			if (!id) continue;

			id = id.QueryInterface(Components.interfaces.nsIRDFLiteral).Value;

			mpopup.childNodes[i].setAttribute('tabid', 'tab-item-'+id);
			namedItems[id] = mpopup.childNodes[i];
		}

		// 2: create "removeOther" and "bookmarkGroup" item
		if (!('removeOther' in namedItems)) {
			this.insertNewItemBefore(mpopup, 'menuseparator', null, null, ['tabid', 'tab-sep-remove']);
			this.insertNewItemBefore(
				mpopup, 'menuitem',
				'label_removeOther', null,
				[
					'oncommand', 'var b = this.parentNode.mTabBrowser; b.removeAllTabsButInternal(b.mContextTab);',
					'tabid', 'tab-item-removeOther',
					'tbattr', 'tabbrowser-multiple'
				]
			);
		}
		var bookmarkGroup;
		if (!('bookmarkGroup' in namedItems)) {
			bookmarkGroup = this.insertNewItemBefore(
				mpopup, 'menuitem',
				'label_bookmarkGroup', null,
				[
					'oncommand', 'var b = this.parentNode.mTabBrowser; b.bookmarksManager.bookmarkTabGroup(b.mContextTab, !b.tabGroupsAvailable);',
					'tabid',     'tab-item-bookmarkGroup',
					'tbattr',    'tabbrowser-multiple',
					'accesskey', TS.strbundle.GetStringFromName('label_bookmarkGroup_accesskey')
				]
			);
			this.insertNewItemBefore(mpopup, 'menuseparator', null, bookmarkGroup, ['tabid', 'tab-sep-bookmarkGroup']);
		}

		// 3: name menuseparators
		var separators = [
				'removeOther',   'remove',
				'newTab',        'new',
				'bookmarkGroup', 'bookmarkGroup',
				'removeTab',     'removeOneTab',
				'reloadAll',     'reload' // for old context menu
			];
		max = separators.length;
		for (i = 0; i < max; i += 2)
		{
			if (
				!(separators[i] in namedItems) ||
				!namedItems[separators[i]] ||
				!('nextSibling' in namedItems[separators[i]]) ||
				!namedItems[separators[i]].nextSibling ||
				namedItems[separators[i]].nextSibling.localName != 'menuseparator'
				)
				continue;

			namedItems[separators[i]].nextSibling.setAttribute('tabid', 'tab-sep-'+separators[i+1]);
		}

		if (namedItems['removeTab'].nextSibling) {
			// In old versions, Mozilla Firebird doesn't have "Close Other Tabs", so the item is generated and put after the "Close Tab".
			if (namedItems['removeTab'].nextSibling.getAttribute('tabid') == 'tab-item-removeOther')
				this.insertNewItemBefore(mpopup, 'menuseparator', null, namedItems['removeOther'], ['tabid', 'tab-sep-removeOneTab']);
		}
		else if (namedItems['removeOther'].nextSibling.getAttribute('tabid') == 'tab-sep-remove') { // for new context menu of Mozilla Firebird/Firefox (later 2003/8/8)
			// In this version, "Close Other Tabs" is previous to the "Close Tab" (a separator is in between them), and, "Close Other Tabs" is just next to the "Reload All".
			namedItems['removeOther'].nextSibling.setAttribute('tabid', 'tab-sep-removeOneTab');
			this.insertNewItemBefore(mpopup, 'menuseparator', null, namedItems['removeOther'], ['tabid', 'tab-sep-remove']);
		}



		// 4: insert/append extra items and separators

		var ref = mpopup.getElementsByAttribute('tabid', 'tab-sep-reload').length ? mpopup.getElementsByAttribute('tabid', 'tab-item-removeTab')[0] :
				bookmarkGroup ? bookmarkGroup.previousSibling :
				null ;
		if (!ref) {
			this.insertNewItemBefore(mpopup, 'menuseparator', null, null, ['tabid', 'tab-sep-reload']);
		}

		// タブの移動
		// move tab to left/right
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_moveLeft', ref,
			[
				'label-for-horizontal-tabbar', TS.strbundle.GetStringFromName('label_moveLeftHorizontal'),
				'label-for-vertical-tabbar', TS.strbundle.GetStringFromName('label_moveLeftVertical'),
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.moveTabBy(b.mContextTab, -1);',
				'tabid', 'tab-item-moveLeft'
			]
		);
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_moveRight', ref,
			[
				'label-for-horizontal-tabbar', TS.strbundle.GetStringFromName('label_moveRightHorizontal'),
				'label-for-vertical-tabbar', TS.strbundle.GetStringFromName('label_moveRightVertical'),
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.moveTabBy(b.mContextTab, 1);',
				'tabid', 'tab-item-moveRight'
			]
		);

		this.insertNewItemBefore(mpopup, 'menuseparator', null, ref, ['tabid', 'tab-sep-move']);

		// タブの複製
		// duplicate tabs
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_duplicateTab', ref,
			[
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.duplicateTab(b.mContextTab);',
				'tabid', 'tab-item-duplicateTab'
			]
		);
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_duplicateTabInWindow', ref,
			[
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.duplicateTabInWindow(b.mContextTab);',
				'tabid', 'tab-item-duplicateInWindow'
			]
		);

		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_setFixedLabelFor', ref,
			[
				'oncommand', 'this.parentNode.hidePopup(); var b = this.parentNode.mTabBrowser; b.setFixedLabelFor(b.mContextTab);',
				'tabid', 'tab-item-setFixedLabelFor'
			]
		);

		// タブの固定
		// lock tabs
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_toggleTabLocked', ref,
			[
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.toggleTabLocked(b.mContextTab);',
				'type', 'checkbox',
				'tabid', 'tab-item-lockTab'
			]
		);

		// リファラのブロック
		// block referrer from tabs
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_toggleReferrerBlocked', ref,
			[
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.toggleReferrerBlocked(b.mContextTab);',
				'type', 'checkbox',
				'tabid', 'tab-item-blockReferrer'
			]
		);

		// 自動リロード
		// auto-reload
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_toggleTabAutoReload', ref,
			[
				'oncommand', 'this.parentNode.hidePopup(); var b = this.parentNode.mTabBrowser; b.toggleTabAutoReload(b.mContextTab);',
				'type', 'checkbox',
				'tabid', 'tab-item-autoreload'
			]
		);


		// その他の機能
		var advanced = this.insertNewItemBefore(mpopup, 'menu', 'label_allow', ref, ['tabid', 'tab-item-allow']);
		this.insertNewItemBefore(advanced, 'menupopup');
		this.insertNewItemBefore(
			advanced.firstChild, 'menuitem',
			'label_allowPlugins', null,
			[
				'oncommand', 'var b = this.parentNode.parentNode.parentNode.mTabBrowser; b.toggleDocShellPropertyFor(b.mContextTab, \'allowPlugins\');',
				'type', 'checkbox',
				'tabid', 'tab-item-allowPlugins'
			]
		);
		this.insertNewItemBefore(
			advanced.firstChild, 'menuitem',
			'label_allowJavascript', null,
			[
				'oncommand', 'var b = this.parentNode.parentNode.parentNode.mTabBrowser; b.toggleDocShellPropertyFor(b.mContextTab, \'allowJavascript\');',
				'type', 'checkbox',
				'tabid', 'tab-item-allowJavascript'
			]
		);
		this.insertNewItemBefore(
			advanced.firstChild, 'menuitem',
			'label_allowMetaRedirects', null,
			[
				'oncommand', 'var b = this.parentNode.parentNode.parentNode.mTabBrowser; b.toggleDocShellPropertyFor(b.mContextTab, \'allowMetaRedirects\');',
				'type', 'checkbox',
				'tabid', 'tab-item-allowMetaRedirects'
			]
		);
		this.insertNewItemBefore(
			advanced.firstChild, 'menuitem',
			'label_allowSubframes', null,
			[
				'oncommand', 'var b = this.parentNode.parentNode.parentNode.mTabBrowser; b.toggleDocShellPropertyFor(b.mContextTab, \'allowSubframes\');',
				'type', 'checkbox',
				'tabid', 'tab-item-allowSubframes'
			]
		);
		this.insertNewItemBefore(
			advanced.firstChild, 'menuitem',
			'label_allowImages', null,
			[
				'oncommand', 'var b = this.parentNode.parentNode.parentNode.mTabBrowser; b.toggleDocShellPropertyFor(b.mContextTab, \'allowImages\');',
				'type', 'checkbox',
				'tabid', 'tab-item-allowImages'
			]
		);


		this.insertNewItemBefore(mpopup, 'menuseparator', null, ref, ['tabid', 'tab-sep-advanced']);


		// 全てのタブへの操作
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_toggleTabLockedAll', ref,
			[
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.toggleAllTabsLocked();',
				'type', 'checkbox',
				'tabid', 'tab-item-lockTabAll'
			]
		);
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_toggleReferrerBlockedAll', ref,
			[
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.toggleReferrerBlockedForAllTabs();',
				'type', 'checkbox',
				'tabid', 'tab-item-blockReferrerAll'
			]
		);
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_toggleTabAutoReloadAll', ref,
			[
				'oncommand', 'this.parentNode.hidePopup(); var b = this.parentNode.mTabBrowser; b.toggleAllTabsAutoReload();',
				'type', 'checkbox',
				'tabid', 'tab-item-autoreloadAll'
			]
		);
		this.insertNewItemBefore(mpopup, 'menuseparator', null, ref, ['tabid', 'tab-sep-forAll']);


		// グループを閉じる
		// close group of tabs
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_removeTabGroup', mpopup.getElementsByAttribute('tabid', 'tab-item-removeTab')[0].nextSibling,
			[
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.removeTabGroup(b.mContextTab);',
				'tbattr', 'tabbrowser-group',
				'tabid', 'tab-item-removeTabGroup'
			]
		);

//		ref = mpopup.lastChild;
		ref = mpopup.getElementsByAttribute('tabid', 'tab-item-removeOther')[0];

		// 左/右を閉じる
		// close left/right tabs
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_removeLeft', ref,
			[
				'label-for-horizontal-tabbar', TS.strbundle.GetStringFromName('label_removeLeftHorizontal'),
				'label-for-vertical-tabbar', TS.strbundle.GetStringFromName('label_removeLeftVertical'),
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.removeLeftTabsFrom(b.mContextTab);',
				'tabid', 'tab-item-removeLeft'
			]
		);
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_removeRight', ref,
			[
				'label-for-horizontal-tabbar', TS.strbundle.GetStringFromName('label_removeRightHorizontal'),
				'label-for-vertical-tabbar', TS.strbundle.GetStringFromName('label_removeRightVertical'),
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.removeRightTabsFrom(b.mContextTab);',
				'tabid', 'tab-item-removeRight'
			]
		);

		this.insertNewItemBefore(mpopup, 'menuseparator', null, ref, ['tabid', 'tab-sep-removeLR']);

		// close all tabs
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_removeAll', ref,
			[
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.removeAllTabs();',
//				'tbattr', 'tabbrowser-multiple',
				'tabid', 'tab-item-removeAll'
			]
		);
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_removeVisited', ref,
			[
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.removeVisitedTabs();',
				'tbattr', 'tabbrowser-multiple',
				'tabid', 'tab-item-removeVisited'
			]
		);

		this.insertNewItemBefore(mpopup, 'menuseparator', null, ref, ['tabid', 'tab-sep-removeAll']);


		ref = ref.nextSibling; // 旧コンテキストメニューではnull

		this.insertNewItemBefore(mpopup, 'menuseparator', null, ref, ['tabid', 'tab-sep-undo']);

		// 「タブを閉じる」をやり直す
		// undo close tab
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_undoRemoveTab', ref,
			[
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.undoRemoveTab();',
				'tabid', 'tab-item-undoRemoveTab'
			]
		);


		this.insertNewItemBefore(mpopup, 'menuseparator', null, null, ['tabid', 'tab-sep-group']);


		// サブツリーの開閉
		// collapse/expand subgroup
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_collapseExpandGroup', null,
			[
				'oncommand', 'var b = this.parentNode.mTabBrowser; var t = b.mContextTab; if (t.hasChildTabs()) t.tabSubgroupCollapsed = !t.tabSubgroupCollapsed;',
				'tabid', 'tab-item-collapseExpandGroup',
				'tbattr', 'tabbrowser-tree'
			]
		);

		// タブの並べかえ
		// sort tabs
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_sortTabsByGroup', null,
			[
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.sortTabsByGroup();',
				'tabid', 'tab-item-sortTabsByGroup',
				'tbattr', 'tabbrowser-group'
			]
		);

		// グループのハイライト表示
		// highlight group of tabs
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_highlightGroup', null,
			[
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.highlightGroupFromTab(b.mContextTab);',
				'tabid', 'tab-item-highlightGroup',
				'tbattr', 'tabbrowser-group'
			]
		);

		// グループの色を設定
		// set group color
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_setTabColorFor', null,
			[
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.mContextTab.setTabColor();',
				'tabid', 'tab-item-setTabColorFor'
			]
		);


		// ブックマークの編集
		// edit bookmark from tab
		var editRef = bookmarkGroup && bookmarkGroup.nextSibling ? bookmarkGroup.nextSibling : null ;
		this.insertNewItemBefore(mpopup, 'menuseparator', null, editRef, ['tabid', 'tab-sep-bookmark']);
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_editBookmark', editRef,
			[
				'oncommand', 'var b = this.parentNode.mTabBrowser; b.editBookmarkFromTab(b.mContextTab);',
				'tabid', 'tab-item-editBookmark'
			]
		);


		this.insertNewItemBefore(mpopup, 'menuseparator', null, null, ['tabid', 'tab-sep-editmenu']);
		this.insertNewItemBefore(
			mpopup, 'menuitem',
			'label_editMenu', null,
			[
				'oncommand', 'this.parentNode.hidePopup(); window.openDialog(\'chrome://tabextensions/content/contextMenuEdit.xul\', \'\', \'chrome,modal,resizable=no\');',
				'tabid', 'tab-item-editMenu'
			]
		);
	}
	catch(ex){
		alert('@TBEBrowserService.updateContextMenu()\n'+ex);
	}
	},
	
	// 項目の追加処理 
	insertNewItemBefore : function(aMPopup, aLocalName, aLabelID, aRefNode, aAttrArray)
	{
		var newItem = document.createElementNS(TabbrowserService.XULNS, aLocalName);
		if (aRefNode)
			aMPopup.insertBefore(newItem, aRefNode)
		else
			aMPopup.appendChild(newItem);

		if (aLabelID)
			newItem.setAttribute('label', TabbrowserService.strbundle.GetStringFromName(aLabelID));
		if (aAttrArray) {
			var max = aAttrArray.length;
			for (var i = 0; i < max; i += 2)
				newItem.setAttribute(aAttrArray[i], aAttrArray[i+1]);
		}

		return newItem;
	},
  
	// tabsのアップデート 
	updateTabContainer : function(aTabBrowser)
	{
		var i, max;
		// initialize the order of tabs, "new tab" and "close tab" button.
		/* Content of tabs:
			Mozilla 1.1+
				<xul:stack/>
				<xul:hbox flex="1" style="min-width: 1px;">
					<children/> (<xul:tab/>)
					<xul:spacer class="tabs-right" flex="1"/>
				</xul:hbox>
				<xul:stack/>
			Netscape 7.0
				<xul:stack/>
				<children/>
				<xul:stack flex="1"/>
			Mozilla 1.0
				<xul:spacer class="tabs-left"/>
				<children/>
				<xul:stack flex="1"/>
			Phoenix/Firebird/Firefox
				<xul:hbox flex="1" style="min-width: 1px;">
					<children/> (<xul:tab/>)
					<xul:spacer class="tabs-right" flex="1"/>
				</xul:hbox>
				<xul:stack/>

			Mozilla on Mac OS X
				defined in:
				- http://lxr.mozilla.org/mozilla/source/themes/classic/global/mac/globalBindings.xml (Mozilla Suite)
				- http://lxr.mozilla.org/mozilla/source/toolkit/skin/mac/globalBindings.xml (Firefox, old)
				- http://lxr.mozilla.org/mozilla/source/toolkit/themes/pinstripe/global/globalBindings.xml (Firefox)
		*/
try{
		var closeBox = document.getAnonymousElementByAttribute(aTabBrowser.mTabContainer, 'class', 'tabs-closebutton-box');
		var prev;
		while (true)
		{
			anonyElem = document.getAnonymousNodes(closeBox.parentNode);
			if (!anonyElem)
				anonyElem = closeBox.parentNode.childNodes;

			for (i = anonyElem.length-1; i > -1 ; i--)
				if (i != 0 && anonyElem[i] == closeBox) {
					prev = anonyElem[i-1];
					break;
				}
			if (!prev || prev.localName == 'spacer') {
				closeBox = closeBox.parentNode;
				if (closeBox.parentNode == aTabBrowser.mStrip) break;
			}
			else
				break;
		}
		aTabBrowser.mTabContainerInnerBox = prev;
		if (aTabBrowser.mTabContainerInnerBox.localName == 'tab') { // for Mozilla 1.0.x
			aTabBrowser.mTabContainerInnerBox = aTabBrowser.mTabContainer;
			closeBox.setAttribute('buttonpack', 'end');
		}

		var tabContents = aTabBrowser.mTabContainerInnerBox.childNodes;
		var isAfter = false;
		max = tabContents.length;
		for (i = 0; i < max; i++)
		{
			if (tabContents[i].localName == 'tab') {
				isAfter = true;
				continue;
			}

			if (isAfter)
				tabContents[i].setAttribute('tabs-scrollbox-spacer', 'after');
			else
				tabContents[i].setAttribute('tabs-scrollbox-spacer', 'before');

			aTabBrowser.scrollboxSpacers.push(tabContents[i]);
		}
		var tabsRight = document.getAnonymousElementByAttribute(aTabBrowser.mTabContainer, 'class', 'tabs-right');
		if (tabsRight) {
			if (!tabsRight.getAttribute('tabs-scrollbox-spacer'))
				aTabBrowser.scrollboxSpacers.push(tabsRight);
			tabsRight.setAttribute('tabs-scrollbox-spacer', 'after');
		}

		aTabBrowser.mTabContainerInnerBox.setAttribute('tabs-scrollbox', true);

		// SeaMonkey
		var styleRule = aTabBrowser.mTabContainerInnerBox.getAttribute('style');
		if (styleRule.indexOf('-moz-hidden-unscrollable') > -1) {
			aTabBrowser.mTabContainerInnerBox.setAttribute('style', styleRule.replace(/overflow[^\;]+/, '')+'overflow:visible');
			window.setTimeout([
				"var box = gBrowser.mTabContainerInnerBox;",
				"var styleRule = box.getAttribute('style');",
				"box.setAttribute('style', styleRule.replace(/overflow[^\\;]+/, '')+'overflow:auto');"
			].join(''), 1);
		}

		closeBox.setAttribute('tabs-scrollbox-right', true);
}
catch(e) {
	alert('@TBEBrowserService.updateTabContainer()\nLaunching Error:\nTabbrowser Extensions failed to find out mTabContainerInnerBox.\n\n'+e);
//	window.close();
}


		var container    = aTabBrowser.mTabContainer;
		var tabs         = container.childNodes;
		// add properties and methods without XBL
		container.mTabBrowser        = aTabBrowser;
		container.advanceSelectedTab = this.advanceSelectedTab;
//		if (!('selectNewTab' in container))
			container.selectNewTab = this.selectNewTab;


		if (!('mTabBrowser' in aTabBrowser.mTabContainer.mTabBrowser) ||
			!aTabBrowser.mTabContainer.mTabBrowser)
			aTabBrowser.mTabContainer.mTabBrowser = aTabBrowser;

		// Behavior of tabs with middle-click or double click
		aTabBrowser.onTabClick = this.onTabClick;
		aTabBrowser.mTabContainer.setAttribute('onclick', 'this.parentNode.parentNode.parentNode.onTabClick(event);');
		aTabBrowser.mTabContainer.setAttribute('ondblclick', 'this.parentNode.parentNode.parentNode.onTabClick(event);');

		// when there is no tab bar and the current is blank (after close all of tabs), actions on content area are regarded as onthe tab bar.
		aTabBrowser.addEventListener('click', this.emulateTabbarClick, true);
		aTabBrowser.addEventListener('dblclick', this.emulateTabbarClick, true);
	},
	
	advanceSelectedTab : function(aDir) 
	{
		var fromContent = (document.commandDispatcher.focusedWindow != window);

		var b        = this.mTabBrowser;
		var startTab = this.selectedItem;
		var tabs     = b.mTabs;

		var next = (aDir < 0) ?
			(startTab.previousTab || tabs[tabs.length-1]) :
			(startTab.nextTab || tabs[0]) ;
		if (next && next != startTab)
			this.selectNewTab(next);

		b.scrollTabbarToTab(next);

		// failsafe
		if (fromContent)
			(new XPCNativeWrapper(b.contentWindow, 'focus()')).focus();
	},
 
	selectNewTab : function(aNewTab) // Firefox 1.1 has this method but 1.0.x doesn't, so I emulate it. 
	{
		if (aNewTab.mTabButtonClicked) {
			aNewTab.mTabButtonClicked = false;
			return;
		}

		var tabContainer = this.localName == 'tabbrowser' ? this.mTabContainer : this ;

		var isTabFocused = (document.commandDispatcher.focusedElement == tabContainer.selectedItem);

		tabContainer.selectedItem = aNewTab;

		if (isTabFocused) {
			aNewTab.focus();
		}
		else if (tabContainer.getAttribute('setfocus') != 'false') {
			aNewTab.focus();
			document.commandDispatcher.advanceFocusIntoSubtree(aNewTab);
			tabContainer.mTabBrowser.setFocusInternal();
		}
	},
	
	onTabListDragStart : function(aEvent, aTransferData, aDragAction) 
	{
		var tab = gBrowser.mTabs[aEvent.target.value];
		gBrowser.mDraggedTab = tab;

		var uri = tab.mBrowser.currentURI.spec;

		aTransferData.data = new TransferData();
		aTransferData.data.addDataForFlavour('text/x-moz-tab',
			'order='+tab.tabIndex+'\n'+ // current order of the tab.
			'dragId='+tab.tabId+'\n'+ // browser ID. If tab is dropped to other window, the browser opens new tab.
			'uri='+uri);

		aTransferData.data.addDataForFlavour('text/unicode', uri);
		aTransferData.data.addDataForFlavour('text/x-moz-url', uri+'\n'+(tab.getAttribute('tab-nextFixedLabel') || tab.getAttribute('tab-fixedLabel') || tab.label));
		aTransferData.data.addDataForFlavour('text/html', '<a href="'+uri+'">'+tab.label+'</a>');
	},
  
	emulateTabbarClick : function(aEvent) 
	{
		if (
			(new XPCNativeWrapper(aEvent.originalTarget, 'ownerDocument')).ownerDocument == (new XPCNativeWrapper(aEvent.target, 'ownerDocument')).ownerDocument ||
			!aEvent.target.isBlank
			)
			return;

		aEvent.target.onTabClick(aEvent);

/*
		aEvent.stopPropagation();
		aEvent.preventCapture();
		aEvent.preventBubble();
		aEvent.preventDefault();
*/
	},
   
	destroyTabBrowser : function() 
	{
		var b = TabbrowserService.browser;
		if (!b) return;

		// remove event listeners

		b.removeEventListener('DOMWindowClose', b.onWindowCloseInLastTabEventListener, true);

		b.removeEventListener('close', this.onTabbrowserWindowClose, true);
		b.removeEventListener('unload', this.onTabbrowserWindowUnload, true);

		b.removeEventListener('XULTabbrowserTabLoading', this.onXULTabbrowserTabLoading, false);
		b.removeEventListener('XULTabbrowserTabLoad', this.onXULTabbrowserTabLoad, false);
		b.removeEventListener('XULTabbrowserTabStatusChange', this.onXULTabbrowserTabStatusChange, false);
		b.removeEventListener('XULTabbrowserURIDrop', this.onXULTabbrowserURIDrop, false);
		b.removeEventListener('XULTabbrowserAddTabCanceled', this.onXULTabbrowserAddTabCanceled, false);

		b.removeEventListener('click', this.emulateTabbarClick, true);
		b.removeEventListener('dblclick', this.emulateTabbarClick, true);

		b.removeEventListener('XULTabbrowserTabbarResized', this.onXULTabbrowserTabbarResized, false);


		b.bookmarksManager = null;


		var browser;
		var max = b.mTabs.length;
		for (var i = 0; i < max; i++)
		{
			try {
				browser = b.mTabs[i].mBrowser;

				browser.stop();
				b.mTabProgressListenerCreatorInternal.removeListenerFrom(b.mTabs[i]);
				browser.contentWindow.close = function() {};

				// do destroying steps which aren't done by the destructor of "tabbrowser.xml"
				browser.setAttribute('type', 'content');
				if ('destroy' in browser) browser.destroy();
			}
			catch(e) {
				if (TabbrowserService.debug) dump('Error: Tabbrowser Extensions fails to destroy tabbrowser\n'+e+'\n');
			}
		}

		b.mIdentifiedTabs     = null;
		b.mRemovedTabInfoList = null;
	},
 
	// utils 
	
	findParentNodeByProp : function(aNode, aProp, aType) 
	{
		var nodeWrapper;

		while(
			aNode &&
			(nodeWrapper = new XPCNativeWrapper(aNode,
				'parentNode',
				'ownerDocument'
			)) &&
			nodeWrapper.ownerDocument &&
			aNode != (new XPCNativeWrapper(nodeWrapper.ownerDocument, 'documentElement')).documentElement
			)
		{
			if (aProp in aNode && typeof aNode[aProp] == aType)
				return aNode;
			aNode = nodeWrapper.parentNode;
		}

		return null;
	},
 
	findParentNodeByNameOrProp : function(aNode, aName, aProp, aType) 
	{
		if (!aName && !aProp) return null;

		var nodeWrapper;
		while(
			aNode &&
			(nodeWrapper = new XPCNativeWrapper(aNode,
				'localName',
				'parentNode',
				'ownerDocument'
			)) &&
			aNode != (new XPCNativeWrapper(nodeWrapper.ownerDocument, 'documentElement')).documentElement
			)
		{
			if (
				(aName && nodeWrapper.localName && nodeWrapper.localName.toLowerCase() == aName.toLowerCase()) ||
				(aProp && aProp in aNode && typeof aNode[aProp] == aType)
				)
				return aNode;

			aNode = aNode.parentNode;
		}

		return null;
	},
  
	observe : function(aSubject, aTopic, aData) 
	{
		if (aTopic != 'StartDocumentLoad')
			return;

		if (
			!gBrowser.selectedTab.getAttribute('tab-loadingURI') ||
			gBrowser.selectedTab.getAttribute('tab-loadingURI') == 'about:blank' ||
			gBrowser.mTabs.length > 1 ||
			gBrowser.getStripVisibility() ||
			gBrowser.mPrefs.getBoolPref('browser.tabs.autoHide')
			)
			return;

		gBrowser.selectedTab.mBrowser.removeAttribute('autoscroll');
		gBrowser.setStripVisibilityTo(true);
	},
 
	DOMWindowOpenObserver : { 
	
		WindowManager : Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator), 
		DOMWindow : Components.interfaces.nsIDOMWindow,
		target : null,
 
		get browserWindow() 
		{
			var targets = this.WindowManager.getEnumerator('navigator:browser'),
				target;
			while (targets.hasMoreElements())
			{
				target = targets.getNext().QueryInterface(this.DOMWindow);
				if (target != this.target)
					return target;
			}
			return null;
		},
 
		observe : function(aSubject, aTopic, aData) 
		{
	//			dump('tabextensions : on'+aTopic+'\n');
			if (aTopic != 'domwindowopened')
				return;

			this.onObserve(aSubject, this);
		},
 
		onObserve : function(aSubject, aThis) 
		{
			var win = aThis.target = aSubject;
			var nav = aThis.browserWindow;

			// if there is no navigator window, do nothing.
			if (!nav) return;

			var TS  = nav.TabbrowserService;
			var uri;
			try {
				uri = win.location.href;
			}
			catch(e) {
//				uri = 'about:blank';
				if (TS.debug) dump('gTSDOMWindowOpenObserver.onObserve():: '+e+'\n');
//				return;
			}

			if (!uri) {
				nav.setTimeout(aThis.onObserve, 0, win, aThis);
				return;
			}

			if (TS.debug) dump('gTSDOMWindowOpenObserver.onObserve():: loading '+uri+'\n');

			if (uri != TS.browserURI) // this is not browser
				return;

			 // if the window has been reopened by another thread, end this.)
			if (win.gTSWindowOpenerType) return;


			// not yet initialized
			var dialog = TS.WindowManager.getMostRecentWindow('tabextensions:loadPresetPrefs');
			if (dialog) {
				dialog.TabbrowserService.closeWindow(win, dialog);
				dialog.focus();
				return;
			}

			win.gTSWindowOpenerType = (win.opener) ? 'XULWindow' :
							(
								(
									!('arguments' in win) &&
									!('__tabextensions__opener' in win)&&
									(TS.winHookMode || TS.opentabforJS)
								) ||
								(TS.getPref('browser.tabs.extensions.processing_window_count_from_script') > 0)
							) ? 'ContentWindow' :
							'PlatformNative' ;


			// ignore "reopen new windows as new tabs" behavior if this window is loaded into a frame, like the DOM Inspector's browser.
			if (win != Components.lookupMethod(win, 'top').call(win)) return;
			var docShell = win
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShell)
					.QueryInterface(Components.interfaces.nsIDocShellTreeItem);
			if (docShell.parent) return;
	/*
			var baseWindow = docShell.treeOwner
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIXULWindow)
					.QueryInterface(Components.interfaces.nsIBaseWindow);
	*/

			if (
				(
					win.gTSWindowOpenerType == 'PlatformNative' &&
					(
						TS.winHookMode == 1 ||
						TS.platformNativeBehavior == 1 ||
						TS.platformNativeBehavior == 2
					)
				) ||
				(TS.winHookMode == 2 && win.gTSWindowOpenerType != 'ContentWindow')
				) {
				if (
					(
						TS.winHookMode == 2 &&
						win.gTSWindowOpenerType == 'XULWindow' &&
						uri.search(/^(chrome:\/\/navigator\/content\/(navigator.xul)?|chrome:\/\/browser\/content\/(browser.xul)?)$/) > -1
					) ||
					(
						win.gTSWindowOpenerType == 'PlatformNative' &&
						(
							TS.winHookMode == 2 ||
							(
								(
									TS.winHookMode == 1 ||
									TS.platformNativeBehavior == 0 ||
									TS.platformNativeBehavior == 2
								) &&
								(
									!TS.getPref('browser.tabs.extensions.platform_native.allow_window_for_homepage') ||
									!TS.isDefaultStartup(win) ||
									(!('arguments' in win ) || win.arguments.length != 1)
								)
							)
						)
					)
					) {
	if (TS.debug) dump('TABEXTENSIONS: window is opened with not the home page (type: '+win.gTSWindowOpenerType+')\n');
					TS.hideWindow(win);
					TS.openTabInsteadSelfInternal(win, TS);
				}
			}
			else if ( // window.openの実行時に制御に失敗した場合のフェイルセーフ
				win.gTSWindowOpenerType == 'ContentWindow' &&
				(TS.winHookMode || TS.opentabforJS)
				) {
	if (TS.debug) dump('TABEXTENSIONS: window is opened by "target" links or JavaScript in webpages\n');
				TS.hideWindow(win);
				win.gTSWindowShouldBeDestructed = true;
				win.gTSOpenTabTimer = win.setTimeout(TS.openTabInsteadSelfInternal, 100, win, TS);
			}
			else if (win.gTSWindowOpenerType == 'PlatformNative') {
	if (TS.debug) dump('TABEXTENSIONS: window is opened by platform native\n');
				TS.hideWindow(win);
				TS.checkWindowShouldBeOpenedForSameURI(win);
			}
		}
 
	} 
  
}; 
  
// pref listeners 
	
// browser 
	
var gTSTabMenuPrefListener = 
{
	domain  : 'browser.tabs.extensions.tab_menu.show',
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		var menu = document.getElementById('tabMenu');
		if (menu) {
			if (!TabbrowserService.getPref(this.domain))
				menu.setAttribute('hidden', true);
			else
				menu.removeAttribute('hidden');
		}
	}
};
 
var gTSProgressbarPrefListener = 
{
	domain  : 'browser.tabs.extensions.show_progress',
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed' ||
			!('TabbrowserService' in window)) return;

		var isShown = !TabbrowserService.getPref('browser.tabs.extensions.show_progress.tab') || TabbrowserService.getPref('browser.tabs.extensions.show_progress.status');

		var bar = document.getElementById('statusbar-progresspanel') || document.getElementById('statusbar-icon');
		if (isShown)
			bar.removeAttribute('tabextensions-progress-hidden');
		else
			bar.setAttribute('tabextensions-progress-hidden', true);

	}
};
 
var gTSPlatformNativeBehaviorPrefListener = 
{
	domains : [
		'browser.tabs.extensions.platform_native.behavior',
		'advanced.system.supportDDEExec'
	],
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		var TS = TabbrowserService;

		var value = TS.getPref('browser.tabs.extensions.platform_native.behavior');
		if (aPrefName == 'browser.tabs.extensions.platform_native.behavior') {
			gTWindowModePrefListener.observe(null, 'nsPref:changed', 'browser.tabs.extensions.platform_native.behavior');

			var nsIBrowserDOMWindow = 'nsIBrowserDOMWindow' in Components.interfaces ? Components.interfaces.nsIBrowserDOMWindow : 'nsIBrowserWindow' in Components.interfaces ? Components.interfaces.nsIBrowserWindow : null ;
			if (nsIBrowserDOMWindow) {
				switch (value)
				{
					case 1:
						TS.setPref('browser.link.open_external', nsIBrowserDOMWindow.OPEN_CURRENTWINDOW);
						break;
					case 2:
						TS.setPref('browser.link.open_external', nsIBrowserDOMWindow.OPEN_NEWTAB);
						break;
					case 3:
						TS.setPref('browser.link.open_external', nsIBrowserDOMWindow.OPEN_NEWWINDOW);
						break;
					default:
						break;
				}
			}
		}

		if (navigator.platform == 'Win32') {
			if (value > 1) {
				var DDE = TS.getPref('advanced.system.supportDDEExec');
				if (DDE !== null && DDE)
					TS.setPref('advanced.system.supportDDEExec', false);
			}
			else {
				// if I wish to disable DDE but don't wish to load pages in a tab...
				if (
					aPrefName == 'advanced.system.supportDDEExec' &&
					TS.getPref('advanced.system.supportDDEExec')
					)
					return;

				if (value == 1)
					TS.setPref('advanced.system.supportDDEExec', true);
			}
			return;
		}
		else if ('@mozilla.org/browser/xremoteservice;1' in Components.classes &&
				Components.classes['@mozilla.org/browser/xremoteservice;1']) { // Linux or others
			this.registerRemoteService(value < 4);
			return;
		}
	},
	remoteServiceRegistered : true,
	registerRemoteService : function(aRegister)
	{
		try {
			const remoteService = Components.classes['@mozilla.org/browser/xremoteservice;1'].getService(Components.interfaces.nsIXRemoteService);
			if (aRegister) {
				if (!this.remoteServiceRegistered)
					remoteService.addBrowserInstance(window);
				this.remoteServiceRegistered = true;
			}
			else {
				if (this.remoteServiceRegistered)
					remoteService.removeBrowserInstance(window);
				this.remoteServiceRegistered = false;
			}
		}
		catch(e) {
		}
	}
};
 
var gTWindowModePrefListener = 
{
	domain  : 'browser.tabs.extensions.window_hook_mode',
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		var TS = TabbrowserService;
		var nsIBrowserDOMWindow = 'nsIBrowserDOMWindow' in Components.interfaces ? Components.interfaces.nsIBrowserDOMWindow : 'nsIBrowserWindow' in Components.interfaces ? Components.interfaces.nsIBrowserWindow : null ;

		// override prefs of native tabbed browsing
		var openExternal = TS.getPref('browser.link.open_external');
		var openWindow   = TS.getPref('browser.link.open_newwindow');
		if (nsIBrowserDOMWindow && TS.winHookMode == 2) {
			if (openExternal != null && nsIBrowserDOMWindow &&
				openExternal != nsIBrowserDOMWindow.OPEN_CURRENTWINDOW &&
				openExternal != nsIBrowserDOMWindow.OPEN_NEWTAB)
				TS.setPref('browser.link.open_external', nsIBrowserDOMWindow.OPEN_NEWTAB);

			if (openWindow !== null && nsIBrowserDOMWindow &&
				openWindow != nsIBrowserDOMWindow.OPEN_CURRENTWINDOW &&
				openWindow != nsIBrowserDOMWindow.OPEN_NEWTAB) {
				TS.setPref('browser.link.open_newwindow', nsIBrowserDOMWindow.OPEN_NEWTAB);
				TS.setPref('browser.link.open_newwindow.ui', nsIBrowserDOMWindow.OPEN_NEWTAB);
			}
		}
		else if (nsIBrowserDOMWindow) {
			var behavior = TS.getPref('browser.tabs.extensions.platform_native.behavior');
			if (openExternal !== null && nsIBrowserDOMWindow &&
				openExternal != nsIBrowserDOMWindow.OPEN_DEFAULTWINDOW &&
				openExternal != nsIBrowserDOMWindow.OPEN_NEWWINDOW)
				TS.setPref('browser.link.open_external', behavior == 3 ? nsIBrowserDOMWindow.OPEN_NEWWINDOW : behavior == 2 ? nsIBrowserDOMWindow.OPEN_NEWTAB : nsIBrowserDOMWindow.OPEN_CURRENTWINDOW );

			if (openWindow != null && nsIBrowserDOMWindow &&
				openExternal != nsIBrowserDOMWindow.OPEN_DEFAULTWINDOW &&
				openExternal != nsIBrowserDOMWindow.OPEN_NEWWINDOW) {
				TS.setPref(
					'browser.link.open_newwindow',
					(
						TS.getPref('browser.tabs.opentabfor.windowopen') &&
						(
							TS.getPref('browser.tabs.opentabfor.links.behavior') > 0 ||
							TS.getPref('browser.tabs.opentabfor.links.targetBehavior') > 0
						)
					) ? nsIBrowserDOMWindow.OPEN_NEWTAB : nsIBrowserDOMWindow.OPEN_NEWWINDOW
				);
				TS.setPref('browser.link.open_newwindow.ui', nsIBrowserDOMWindow.OPEN_NEWTAB);
			}
		}

		if (!TS.winHookMode &&
			!TS.opentabforJS &&
			gTSWindowOpenerType == 'ContentWindow')
			gTSWindowOpenerType = 'PlatformNative'; // reset opener type to use this window for reopen new windows opened from webpages in this window.

		if (window.location.href != TS.browserURI) return;

		var i, max;
		var isSingleWindow = TS.winHookMode == 2 ? true : false ;

		var items = [
				document.getElementById('menu_newNavigator'),
				document.getElementsByAttribute('oncommand', 'gContextMenu.openFrame();')[0],
				document.getElementById('cmd_newNavigator')
			];

		// Firefox
		if (TS.isNewTypeBrowser) {
			var nodes = document.getElementsByAttribute('command', 'cmd_newNavigator');
			max = nodes.length;
			for (i = 0; i < max; i++)
				if (nodes[i].localName == 'menuitem')
					items.push(nodes[i]);
		}

		for (i in items)
			if (items[i]) {
				if (isSingleWindow) {
					items[i].setAttribute('hidden', true);
					items[i].setAttribute('disabled', true);
				}
				else {
					items[i].removeAttribute('hidden');
					items[i].removeAttribute('disabled');
				}
			}
	}
};
 
var gTSOpenTabForWindowOpenPrefListener = 
{
	domains : [
		'browser.tabs.opentabfor.windowopen',
		'browser.tabs.opentabfor.links.behavior',
		'browser.tabs.opentabfor.links.targetBehavior'
	],
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		var TS = TabbrowserService;
		if (!aPrefName || aPrefName == 'browser.tabs.opentabfor.windowopen') {
			if (!TS.winHookMode &&
				!TS.opentabforJS &&
				gTSWindowOpenerType == 'ContentWindow')
				gTSWindowOpenerType = 'PlatformNative'; // reset opener type to use this window for reopen new windows opened from webpages in this window.
		}

		this.updateNativeSingleWindowPref();
	},
	updateNativeSingleWindowPref : function()
	{
		var TS = TabbrowserService;
		var nsIBrowserDOMWindow = 'nsIBrowserDOMWindow' in Components.interfaces ? Components.interfaces.nsIBrowserDOMWindow : 'nsIBrowserWindow' in Components.interfaces ? Components.interfaces.nsIBrowserWindow : null ;

		// override prefs of native tabbed browsing
		var openWindow = TS.getPref('browser.link.open_newwindow');
		if (openWindow !== null && nsIBrowserDOMWindow) {
			if (
				TS.winHookMode == 2 ||
				(
					TS.getPref('browser.tabs.opentabfor.windowopen') &&
					(
						TS.getPref('browser.tabs.opentabfor.links.behavior') > 0 ||
						TS.getPref('browser.tabs.opentabfor.links.targetBehavior') > 0
					)
				)
				) {
				TS.setPref('browser.link.open_newwindow', nsIBrowserDOMWindow.OPEN_NEWTAB);
				TS.setPref('browser.link.open_newwindow.ui', nsIBrowserDOMWindow.OPEN_NEWTAB);
			}
			else if (
				TS.winHookMode < 2 &&
				!TS.getPref('browser.tabs.opentabfor.windowopen') &&
				TS.getPref('browser.tabs.opentabfor.links.behavior') < 1 &&
				TS.getPref('browser.tabs.opentabfor.links.targetBehavior') < 1
				) {
				TS.setPref('browser.link.open_newwindow', nsIBrowserDOMWindow.OPEN_NEWWINDOW);
				TS.setPref('browser.link.open_newwindow.ui', nsIBrowserDOMWindow.OPEN_NEWTAB);
			}
		}

		if (!TS.getPref('browser.tabs.extensions.updateNativeSingleWindowPref.done'))
			TS.setPref('browser.tabs.extensions.updateNativeSingleWindowPref.done', true);
	}
};
  
// <tabbrowser> widget 
	
var gTSCloseBoxPrefListener = 
{
	domain  : 'browser.tabs.extensions.show_closebox',
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed' ||
			!('TabbrowserService' in window)) return;

		var value = TabbrowserService.getPref(aPrefName);
		var b = TabbrowserService.browser;

		switch (aPrefName)
		{
			case 'browser.tabs.extensions.show_closebox.tabbar':
				b.setAttribute('tabbrowser-tabbar-closebox-hidden', !value);
				break;

			case 'browser.tabs.extensions.show_closebox.tab':
				switch (value)
				{
					case -1:
					default:
						value = 'never';
						break;
					case 0:
						value = 'any';
						break;
					case 1:
						value = 'current';
						break;
					case 2:
						value = 'pointed';
						break;
				}
				b.setAttribute('tabbrowser-tab-closebox', value);
				break;

			case 'browser.tabs.extensions.show_closebox.tab.appearance':
				b.setAttribute('tabbrowser-tab-closebox-style', value);
				break;

			default:
				break;
		}
	}
};
 
var gTSIconOverlayInTabsPrefListener = 
{
	domain  : 'browser.tabs.extensions.overlay_icon',
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		var shouldOverlay = TabbrowserService.getPref(this.domain);
		var b = TabbrowserService.browser;
		var max = b.mTabs.length;
		for (i = 0; i < max; i++)
			b.mTabs[i].setAttribute('overlay-icon', shouldOverlay);
	}
};
 
var gTSTabsWidthPrefListener = 
{
	domains : [
		'browser.tabs.extensions.tabs_width_type',
		'browser.tabs.extensions.tabs_width',
		'browser.tabs.extensions.tabs_min_width',
		'browser.tabs.extensions.tabs_max_width',
		'browser.tabs.extensions.tabs_title_crop'
	],
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		var b = TabbrowserService.browser;
		var max = b.mTabs.length;
		for (var i = 0; i < max; i++)
			b.mTabs[i].initTab();

		if (b.mTabBox.orient == 'horizontal')
			b.mStrip.setAttribute('width', TabbrowserService.getPref('browser.tabs.extensions.tabs_width'));

		b.onTabsModified();
	}
};
 
var gTSTabbarBlankSpacePrefListener = 
{
	domain  : 'browser.tabs.extensions.show_blankspaces',
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		TabbrowserService.browser.setAttribute('makeblankspace', TabbrowserService.getPref(this.domain));
	}
};
 
var gTSNarrowTabPrefListener = 
{
	domain  : 'browser.tabs.extensions.vertical.narrow_tabs',
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		if (TabbrowserService.getPref(this.domain))
			TabbrowserService.browser.setAttribute('tab-tree-narrow-tab', true);
		else
			TabbrowserService.browser.removeAttribute('tab-tree-narrow-tab');
	}
};
 
var gTSLastTabClosingPrefListener = 
{
	domain  : 'browser.tabs.extensions.last_tab_closing',
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		if (TabbrowserService.getPref(this.domain) != 2) {
			TabbrowserService.setPref('browser.tabs.autoHide', false);
			TabbrowserService.setPref('browser.tabs.forceHide', false);
		}

		TabbrowserService.browser.setStripVisibilityTo(!TabbrowserService.getPref('browser.tabs.autoHide'));
	}
};
 
var gTSTabsAutoHidePrefListener = 
{
	domain  : 'browser.tabs.autoHide',
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (
			aTopic != 'nsPref:changed' ||
			!TabbrowserService.getPref(this.domain) ||
			TabbrowserService.getPref('browser.tabs.autoHide.temporaryChanged') // when this is temporary change, ignore.
			)
			return;

		// disable the feature automatically
		TabbrowserService.setPref('browser.tabs.extensions.last_tab_closing', 2);

		var b = TabbrowserService.browser;
		b.setStripVisibilityTo(b.mTabs.length > 1);
	}
};
 
var gTSTabbarPlacePrefListener = 
{
	domain  : 'browser.tabs.extensions.tabbar_place',
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		this.update(TabbrowserService.getPref(this.domain) > -1);
	},
	update : function(aPreventToUpdateNow)
	{
		var TS = TabbrowserService;

		var place = TS.getPref(this.domain);
		var b     = TS.browser;

		if (place > -1 && b.hasAttribute('tabbrowser-tabbar-hidden'))
			b.removeAttribute('tabbrowser-tabbar-hidden');

		if (b.mStrip.getAttribute('class').indexOf(
				place == 0 ? 'tabbrowser-strip-top' :
				place == 1 ? 'tabbrowser-strip-bottom' :
				place == 2 ? 'tabbrowser-strip-left' :
					'tabbrowser-strip-right'
			) > -1)
			return;

		if (place < 2)
			TS.setPref('browser.tabs.extensions.group.tree.enabled', false);

		if (aPreventToUpdateNow) {
			if (TS.PromptService.confirm(
					window,
					TS.strbundle.GetStringFromName('message_alert_tabbar_place_title'),
					TS.strbundle.GetStringFromName('message_alert_tabbar_place')
				))
				window.openDialog('chrome://tabextensions/content/browserRestarter.xul', '_blank', 'chrome,all,dialog');
			return;
		}

		if (place > 1) {
			if(TS.getPref('browser.tabs.extensions.tabs_width_type') != 2)
				TS.setPref('browser.tabs.extensions.tabs_width_type', 2);

			if(TS.getPref('browser.tabs.extensions.tab_scroller') == 3)
				TS.setPref('browser.tabs.extensions.tab_scroller', 0);
		}

		b.updateTabAppearance();
		b.updateTabbarPlace();

		var attr = place < 2 ? 'label-for-horizontal-tabbar' : 'label-for-vertical-tabbar' ;
		var nodes = document.getElementsByAttribute(attr, '*');
		var max = nodes.length;
		for (var i = 0; i < max; i++)
			nodes[i].setAttribute('label', nodes[i].getAttribute(attr));
	}
};
 
// タブの親子関係を抹消 
// clear the relation of tabs when the TabGroup Mode is disabled
var gTSGroupModePrefListener =
{
	domains : [
		'browser.tabs.extensions.group.enabled',
		'browser.tabs.extensions.group.tree.enabled'
	],
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		var b = TabbrowserService.browser;
		var max = b.mTabs.length;
		var i;

		var groupMode = TabbrowserService.getPref('browser.tabs.extensions.group.enabled');
		if (!groupMode) {
			for (i = 0; i < max; i++)
			{
				b.mTabs[i].parentTab = null;
				b.mTabs[i].removeAttribute('tab-childTabs');
				b.mTabs[i].removeAttribute('tab-openedAutomatically');
				b.mTabs[i].removeAttribute('tab-groupTargetHost');
			}
			TabbrowserService.setPref('browser.tabs.extensions.group.tree.enabled', false);
		}

		var treeMode  = TabbrowserService.getPref('browser.tabs.extensions.group.tree.enabled');
		if (groupMode && treeMode) {
			b.setAttribute('tab-tree-enabled', true);
			var place = TabbrowserService.getPref('browser.tabs.extensions.tabbar_place');
			if (place > 1)
				b.updateTabTree();
			else
				TabbrowserService.setPref('browser.tabs.extensions.tabbar_place', 2);
		}
		else {
			b.removeAttribute('tab-tree-enabled');
			b.updateTabTree(true);
		}
		b.updateTabAppearance();
	}
};
 
var gTSThumbnailPrefListener = 
{
	domains : [
		'browser.tabs.extensions.thumbnail.enabled',
		'browser.tabs.extensions.thumbnail.width',
		'browser.tabs.extensions.thumbnail.height',
		'browser.tabs.extensions.thumbnail.power'
	],
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		var b = TabbrowserService.browser;
		if (TabbrowserService.getPref('browser.tabs.extensions.thumbnail.enabled')) {
			b.setAttribute('tab-thumbnail-enabled', true);
			for (var i = 0, max = b.mTabs.length; i < max; i++)
				b.mTabs[i].updateThumbnail();
		}
		else {
			b.removeAttribute('tab-thumbnail-enabled');
		}
	}
};
 
var gTSTabScrollerPrefListener = 
{
	domain  : 'browser.tabs.extensions.tab_scroller',
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		var TS = TabbrowserService;

		var value = TS.getPref(this.domain);
		switch (value)
		{
			default:
			case 0:
				value = 'button';
				break;

			case 4:
				value = 'buttonalways';
				break;

			case 1:
				value = 'scrollbar';
				break;

			case 2:
				value = 'scrollbaralways';
				break;

			case 3:
				value = 'multirow';

				if (TS.getPref('browser.tabs.extensions.tabbar_place') > 1)
					TS.setPref('browser.tabs.extensions.tabbar_place', 0);
//				if (TS.getPref('browser.tabs.extensions.tabs_width_type') == 0)
//					TS.setPref('browser.tabs.extensions.tabs_width_type', 2);
				break;

			case -1:
				value = 'never';
				break;
		}
		TS.browser.setAttribute('tab-scrollbar', value);
	}
};
  
// initializing: failsafe 
if (
	window == Components.lookupMethod(window, 'top').call(window) &&
	!gTSWindowOpenerType &&
	TabbrowserService.isBrowserWindow
	)
	TBEBrowserService.DOMWindowOpenObserver.observe(window, 'domwindowopened', null);

if (TabbrowserService.isNewTypeBrowser) {
	// Firefox cannot add event listener in "TabbrowserService.init()", so do it in this point.
	window.addEventListener('close', function(aEvent)
	{
		TBEBrowserService.onWindowClose(aEvent);
	},
	false);
}
  
// end of definition 

if (!window.TabbrowserServiceModules)
	window.TabbrowserServiceModules = [];

TabbrowserServiceModules.push(TBEBrowserService);
}
 
