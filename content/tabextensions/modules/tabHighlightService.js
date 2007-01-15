// start of definition 
if (!window.TBETabHighlightService) {

var TBETabHighlightService = {

	enabled : true,
	
	// properties 
	
	get service() 
	{
		if (this._service === void(0))
			this._service = 'TabbrowserService' in window ? window.TabbrowserService : null ;

		return this._service;
	},
//	_service : null,
  
	// ƒCƒxƒ“ƒg‚Ì•ß‘¨ 
	
	onAfterInit : function() 
	{
		var b = this.service.browsers;
		if (!b || !b.length) return;

		function getTabInfoExtra(aTab, aTabBrowser, aInfo)
		{
			aInfo.unread = (aTab.getAttribute('unread') == 'true');
		}

		function initTabWithTabInfoExtra(aTab, aTabBrowser, aInfo)
		{
			if (!('unread' in aInfo)) return;

			if (aInfo.unread) {
				aTab.removeAttribute('tab-readURI');
				aTab.setAttribute('unread', true);
			}
			else {
				aTab.setAttribute('tab-readURI', aInfo.uri);
				aTab.removeAttribute('unread');
			}
		}

		for (var i = 0; i < b.length; i++)
		{
			b[i].getTabInfoExtra.push(getTabInfoExtra);
			b[i].initTabWithTabInfoExtra.push(initTabWithTabInfoExtra);

			b[i].addEventListener('XULTabbrowserTabLoad', this.onXULTabbrowserTabLoad, false);
			b[i].addEventListener('XULTabbrowserTabLocationChange', this.onXULTabbrowserTabLocationChange, false);

			b[i].tabUnreadStateManager = this.createManager(b[i]);

			b[i].tabUnreadStateManager.onSelectEventListener = this.onSelectEventListener(b[i]);
			b[i].tabUnreadStateManager.onScrollEventListener = this.onScrollEventListener(b[i]);
			b[i].tabUnreadStateManager.onDOMMouseScrollEventListener = this.onDOMMouseScrollEventListener(b[i]);
			b[i].tabUnreadStateManager.onKeydownEventListener = this.onKeydownEventListener(b[i]);
			b[i].tabUnreadStateManager.onFocusEventListener = this.onFocusEventListener(b[i]);
			b[i].tabUnreadStateManager.onMouseEventListener = this.onMouseEventListener(b[i]);

			b[i].addEventListener('select', b[i].tabUnreadStateManager.onSelectEventListener, false);

			b[i].addEventListener('scroll', b[i].tabUnreadStateManager.onScrollEventListener, true);
			b[i].addEventListener('DOMMouseScroll', b[i].tabUnreadStateManager.onDOMMouseScrollEventListener, true);
			b[i].addEventListener('keydown', b[i].tabUnreadStateManager.onKeydownEventListener, true);
			b[i].addEventListener('mousedown', b[i].tabUnreadStateManager.onMouseEventListener, true);
			b[i].addEventListener('focus', b[i].tabUnreadStateManager.onFocusEventListener, true);
		}

		this.service.addPrefListener(gTSHighlightCurrentTabsPrefListener);
		gTSHighlightCurrentTabsPrefListener.observe(null, 'nsPref:changed', 'browser.tabs.extensions.highlight_current');
		gTSHighlightCurrentTabsPrefListener.observe(null, 'nsPref:changed', 'browser.tabs.extensions.highlight_current.style');

		this.service.addPrefListener(gTSHighlightUnreadTabsPrefListener);
		gTSHighlightUnreadTabsPrefListener.observe(null, 'nsPref:changed', 'browser.tabs.extensions.highlight_unread');
		gTSHighlightUnreadTabsPrefListener.observe(null, 'nsPref:changed', 'browser.tabs.extensions.highlight_unread.style');


		if ('TabbrowserSessionManager' in window) {
			TabbrowserSessionManager.saveTabInfoExtra.push(
				function(aDatabase, aRes, aInfo)
				{
					aDatabase.setData(aRes, 'unread', aInfo.unread);
				}
			);
			TabbrowserSessionManager.loadTabInfoExtra.push(
				function(aDatabase, aRes, aInfo)
				{
					aInfo.unread = (aDatabase.getData(aRes, 'unread') == 'true');
				}
			);
		}
	},
 
	onBeforeDestruct : function() 
	{
		var b = this.service.browsers;
		if (!b || !b.length) return;

		for (var i = 0; i < b.length; i++)
		{
			b[i].removeEventListener('XULTabbrowserTabLoad', this.onXULTabbrowserTabLoad, false);
			b[i].removeEventListener('XULTabbrowserTabLocationChange', this.onXULTabbrowserTabLocationChange, false);

			b[i].removeEventListener('select', b[i].tabUnreadStateManager.onSelectEventListener, false);

			b[i].removeEventListener('scroll', b[i].tabUnreadStateManager.onScrollEventListener, true);
			b[i].removeEventListener('DOMMouseScroll', b[i].tabUnreadStateManager.onDOMMouseScrollEventListener, true);
			b[i].removeEventListener('keydown', b[i].tabUnreadStateManager.onKeydownEventListener, true);
			b[i].removeEventListener('mousedown', b[i].tabUnreadStateManager.onMouseEventListener, true);
			b[i].removeEventListener('focus', b[i].tabUnreadStateManager.onFocusEventListener, true);
		}

		this.service.removePrefListener(gTSHighlightCurrentTabsPrefListener);
		this.service.removePrefListener(gTSHighlightUnreadTabsPrefListener);
	},
 
	onXULTabbrowserTabLoad : function(aEvent) 
	{
		var t = aEvent.target.getTabByTabId(aEvent.tabId);
		var b = t.mTabBrowser;
		if (
			b.selectedTab != t ||
			(
				t.getAttribute('tab-readURI') &&
				t.getAttribute('tab-readURI') != aEvent.loadedView.location.href
			) ||
			b.tabUnreadStateManager.checkScrollability(t)
			)
			return;

		t.removeAttribute('tab-readURI');
		t.removeAttribute('unread');
	},
 
	onXULTabbrowserTabLocationChange : function(aEvent) 
	{
		var tab = aEvent.target.getTabByTabId(aEvent.tabId);
		var readURI = tab.getAttribute('tab-readURI');;
		if (!readURI || readURI == aEvent.newLocation) {
			tab.removeAttribute('tab-readURI');
			tab.setAttribute('unread', true);
		}
		else if (readURI && readURI != aEvent.newLocation) {
			tab.removeAttribute('tab-readURI');
			tab.removeAttribute('unread');
		}
	},
 
	onSelectEventListener : function(aOwner) 
	{
		return ({
			owner : aOwner,
			handleEvent : function(aEvent)
			{
				if (!('mTabContainer' in this.owner) ||
					aEvent.originalTarget != this.owner.mTabContainer) return;

				var t = this.owner.selectedTab;
				var w = t.mBrowser.contentWindow;
				if (
					t.getAttribute('unread') == 'true' &&
					t.mBrowser.currentURI.spec == 	t.mTabInfo.loadingURI &&
					!this.owner.tabUnreadStateManager.checkScrollability(t)
					)
					t.removeAttribute('unread');
			}
		});
	},
 
	onScrollEventListener : function(aOwner) 
	{
		return ({
			owner : aOwner,
			handleEvent : function(aEvent)
			{
				this.owner.tabUnreadStateManager.onActive(aEvent);
			}
		});
	},
 
	onDOMMouseScrollEventListener : function(aOwner) 
	{
		return ({
			owner : aOwner,
			handleEvent : function(aEvent)
			{
				if (
					aEvent.ctrlKey ||
					aEvent.shiftKey ||
					aEvent.altKey ||
					aEvent.metaKey
					)
					return;

				this.owner.tabUnreadStateManager.onActive(aEvent);
			}
		});
	},
 
	onKeydownEventListener : function(aOwner) 
	{
		return ({
			owner : aOwner,
			lastTime : 0,
			handleEvent : function(aEvent)
			{
				this.lastTime = (new Date()).getTime();

				var code = aEvent.keyCode;
				if (
					aEvent.key == ' ' ||
					code == aEvent.DOM_VK_PAGE_UP ||
					code == aEvent.DOM_VK_PAGE_DOWN ||
					code == aEvent.DOM_VK_END ||
					code == aEvent.DOM_VK_HOME ||
					code == aEvent.DOM_VK_LEFT ||
					code == aEvent.DOM_VK_UP ||
					code == aEvent.DOM_VK_RIGHT ||
					code == aEvent.DOM_VK_DOWN
					)
					this.owner.tabUnreadStateManager.onActive(aEvent);
			}
		});
	},
 
	onMouseEventListener : function(aOwner) 
	{
		return ({
			owner : aOwner,
			lastTime : 0,
			handleEvent : function(aEvent)
			{
				if (aEvent.button < 2)
					this.lastTime = (new Date()).getTime();
			}
		});
	},
 
	onFocusEventListener : function(aOwner) 
	{
		return ({
			owner : aOwner,
			handleEvent : function(aEvent)
			{
				var byUserAction = ((new Date()).getTime() - this.owner.tabUnreadStateManager.onMouseEventListener.lastTime < 100);

				try {
					if (aEvent.originalTarget.QueryInterface(Components.interfaces.nsIDOMDocument) && !byUserAction)
						return;
				}
				catch(e) {
					try {
						if (aEvent.originalTarget.QueryInterface(Components.interfaces.nsIDOMWindow) && !byUserAction)
							return;
					}
					catch(e) {
					}
				}
				this.owner.tabUnreadStateManager.onActive(aEvent);
			}
		});
	},
  
	createManager : function(aOwner) 
	{
		return ({
			owner : aOwner,
			checkScrollability : function(aTab)
			{
				return this.checkFrameScrollability(aTab.mBrowser.contentWindow, aTab, this.owner);
			},
			checkFrameScrollability : function(aFrame, aTab, aTabBrowser)
			{
				if (!aFrame) return false;

				try {
					var theDoc = Components.lookupMethod(aFrame, 'document').call(aFrame);
					var docBox = theDoc.getBoxObjectFor(theDoc.documentElement);
				}
				catch(e) {
					return false;
				}

				if (
					Components.lookupMethod(aFrame, 'innerHeight').call(aFrame) < docBox.height ||
					Components.lookupMethod(aFrame, 'innerWidth').call(aFrame) < docBox.width
					)
					return true;

				var children = Components.lookupMethod(aFrame, 'frames').call(aFrame);
				if (children && children.length)
					for (var i = 0; i < children.length; i++)
						if (arguments.callee(children[i], aTab, aTabBrowser)) return true;

				return false;
			},
			onActive : function(aEvent)
			{
				if (
					aEvent.originalTarget.ownerDocument == window.document ||
					!this.owner.selectedTab.hasAttribute('unread') ||
					this.owner.selectedTab.getAttribute('unread') != 'true'
					)
					return;

				this.owner.selectedTab.removeAttribute('unread');
			}
		});
	}
 
}; 
 
var gTSHighlightCurrentTabsPrefListener = 
{
	domain  : 'browser.tabs.extensions.highlight_current',
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		switch (aPrefName)
		{
			case 'browser.tabs.extensions.highlight_current':
			default:
				if (TabbrowserService.getPref('browser.tabs.extensions.highlight_current'))
					TabbrowserService.browser.setAttribute('highlight-current', true);
				else
					TabbrowserService.browser.removeAttribute('highlight-current');
				break;

			case 'browser.tabs.extensions.highlight_current.style':
				var style = TabbrowserService.getPref('browser.tabs.extensions.highlight_current.style');
				if (style)
					TabbrowserService.browser.setAttribute('current-style', style);
				else
					TabbrowserService.browser.removeAttribute('current-style');
				break;
		}
	}
};
 
var gTSHighlightUnreadTabsPrefListener = 
{
	domain  : 'browser.tabs.extensions.highlight_unread',
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		switch (aPrefName)
		{
			case 'browser.tabs.extensions.highlight_unread':
			default:
				if (TabbrowserService.getPref('browser.tabs.extensions.highlight_unread'))
					TabbrowserService.browser.setAttribute('highlight-unread', true);
				else
					TabbrowserService.browser.removeAttribute('highlight-unread');
				break;

			case 'browser.tabs.extensions.highlight_unread.style':
				var style = TabbrowserService.getPref('browser.tabs.extensions.highlight_unread.style');
				if (style)
					TabbrowserService.browser.setAttribute('unread-style', style);
				else
					TabbrowserService.browser.removeAttribute('unread-style');
				break;
		}
	}
};
  
// end of definition 

if (!window.TabbrowserServiceModules)
	window.TabbrowserServiceModules = [];
TabbrowserServiceModules.push(TBETabHighlightService);
}
 
