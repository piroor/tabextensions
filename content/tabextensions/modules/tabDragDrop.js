// start of definition
if (!window.TBEMovableTabService) {

// static class "TBEMovableTabService"
var TBEMovableTabService =
{
	DROP_BEFORE : -1,
	DROP_ON     : 0,
	DROP_AFTER  : 1,

	get service()
	{
		return TabbrowserService;
	},

	onInit : function()
	{
		var b = this.service.browser;
		if (!b) return;

		if (!document.getElementById('tab-drop-indicator-bar') &&
			!document.getAnonymousElementByAttribute(b, 'class', 'tab-drop-indicator'))
			this.createTabDropIndicator(b);

		this.service.addPrefListener(gTSTabDropIndicatorTypePrefListener);

		this.updateMethods(b);
		b.addEventListener('XULTabbrowserTabDrop', this.onXULTabbrowserTabDrop, false);
	},
	onBeforeInitWithDelay : function()
	{
		var b = this.service.browser;
		if (!b) return;

		this.supportMovableTabs(b);

		b.addEventListener('mousemove', this.onTabbrowserMouseMove, false);
		b.addEventListener('mouseup',   this.onTabbrowserMouseUp, false);

		gTSTabDropIndicatorTypePrefListener.observe(null, 'nsPref:changed', null);
	},

	onDestruct : function()
	{
		var b = this.service.browser;
		if (!b) return;

		this.service.removePrefListener(gTSTabDropIndicatorTypePrefListener);

		b.removeEventListener('mousemove', this.onTabbrowserMouseMove, false);
		b.removeEventListener('mouseup',   this.onTabbrowserMouseUp, false);
		b.removeEventListener('XULTabbrowserTabDrop', this.onXULTabbrowserTabDrop, false);
	},



	createTabDropIndicator : function(aTabBrowser)
	{
		var bar = document.createElement('hbox');
		bar.setAttribute('tabid', 'tab-drop-indicator-bar');
		bar.setAttribute('class', 'tab-drop-indicator-bar');

		var indicator = document.createElement('hbox');
		indicator.setAttribute('tabid', 'tab-drop-indicator');
		indicator.setAttribute('class', 'tab-drop-indicator');

		bar.appendChild(indicator);
		aTabBrowser.mTabBox.appendChild(bar);

		aTabBrowser._mTabDropIndicatorBar = bar;
		aTabBrowser._mTabDropIndicator    = indicator;
	},



	updateMethods : function(aTabBrowser)
	{
		var nativeDragDropAvailable = document.getElementById('tab-drop-indicator-bar');


		if (!nativeDragDropAvailable) {
			// from Tab Mix/MiniT
			aTabBrowser.__defineGetter__('mTabs',
				function (){ return this.mTabContainer.childNodes; });
			aTabBrowser.mCurrentTab.__proto__.__defineGetter__('ordinal',
				function (){ return this.tabIndex; });
			aTabBrowser.__defineGetter__('browsers',
				function() {
					var browsers = [];
					var max = this.mTabs.length;
					for (var i = 0; i < max; i++)
						browsers.push(this.getBrowserForTab(this.mTabs[i]));
					return browsers;
				}
			);
			aTabBrowser.mPanelContainer.__defineSetter__('selectedIndex',
				aTabBrowser.mPanelContainer.__lookupSetter__('selectedIndex'));
			aTabBrowser.mPanelContainer.__defineGetter__('selectedIndex',
				function() { return aTabBrowser.mTabContainer.selectedIndex; });
			aTabBrowser.getBrowserAtIndex = function(aIndex) {
				if (aIndex < 0) return null;
				return this.getBrowserForTab(this.mTabs[aIndex]);
			};
		}

		try {
			eval('bengoodger.com.tabdownloader._saveSubsequentTabs ='+bengoodger.com.tabdownloader._saveSubsequentTabs.toString().replace(
				'var startBrowser = this._findNextBrowser(tabbrowser.selectedBrowser);',
				'try { var startBrowser = tabbrowser.getBrowserAtIndex(tabbrowser.mCurrentTab.tabIndex+1); } catch(e) { return; }'
			));
		}
		catch(e) {
		}

		var uniqueId;
		for (var i = 0; i < aTabBrowser.mTabs.length; i++)
		{
			var uniqueId = 'panel'+(new Date()).getTime()+i;
			aTabBrowser.mPanelContainer.childNodes[i].id = uniqueId;
			aTabBrowser.mTabs[i].setAttribute('linkedpanel', uniqueId);
			aTabBrowser.mTabs[i].tabIndex = i;

			aTabBrowser.mIdentifiedTabs[aTabBrowser.mTabs[i].tabId] = aTabBrowser.mTabs[i];
		}
		if(gBrowser.mTabs.length > 0) gBrowser.mCurrentTab.selected = true;




		// from Tab Mix/MiniT, for Netscape 7
		// This code is backported from Firefox.
		if (!nativeDragDropAvailable &&
			aTabBrowser.mTabContainer.__lookupSetter__('selectedIndex')
			.toString().indexOf('linkedPanel') < 0) {
			aTabBrowser.mTabContainer.__defineGetter__('selectedIndex',
				aTabBrowser.mTabContainer.__lookupGetter__('selectedIndex'));
			aTabBrowser.mTabContainer.__defineSetter__('selectedIndex', function(val) {
				const tabs = this.childNodes;
				if (0 <= val && val < tabs.length && !tabs[val].selected) {
					for (var i = 0; i < tabs.length; i++)
						if (i != val && tabs[i].selected)
							tabs[i].selected = false;
					tabs[val].selected = true;
					for (var parent = this.parentNode; parent; parent = parent.parentNode) {
						if (parent.localName == 'tabbox') {
							var tabpanels = parent._tabpanels;
							if (tabpanels) {
								var linkedPanelId = tabs[val].getAttribute('linkedpanel');
								var linkedPanel = linkedPanelId ? document.getElementById(linkedPanelId) : null;
								if (linkedPanel)
									tabpanels.selectedPanel = linkedPanel;
								else
									tabpanels.selectedIndex = val;
							}
							break;
						}
					}
					var event = document.createEvent('Events');
					event.initEvent('select', false, true);
					this.dispatchEvent(event);
				}
				return val;
			});
		}




		// override "addTab" and "removeTab" methods.
		if (!nativeDragDropAvailable) {

			var method = 'addTab';
			var func   = aTabBrowser[method];
			if (func.toString().indexOf('mTabContainer.appendChild') < 0) {
				func = null;
				for (i in aTabBrowser)
				{
					if (typeof aTabBrowser[i] != 'function' ||
						aTabBrowser[i].toString().indexOf('mTabContainer.appendChild') < 0)
						continue;

					func   = aTabBrowser[i];
					method = i;
					break;
				}
			}
			// from Tab Mix/MiniT
			eval('aTabBrowser[method] ='+
				func.toString().replace(
					'if (!blank)',
					'var uniqueId = "panel"+(new Date()).getTime()+position;'+
					'this.mPanelContainer.lastChild.id = uniqueId;'+
					't.setAttribute("linkedpanel", uniqueId);'+
					't.tabIndex = position;'+
					'if (!blank)'
				)
			);



			method = 'removeTab';
			func   = aTabBrowser[method];
			if (func.toString().indexOf('mTabContainer.removeChild') < 0) {
				func = null;
				for (i in aTabBrowser)
				{
					if (typeof aTabBrowser[i] != 'function' ||
						aTabBrowser[i].toString().indexOf('mTabContainer.removeChild') < 0)
						continue;

					func   = aTabBrowser[i];
					method = i;
					break;
				}
			}
			// from Tab Mix/MiniT
			eval('aTabBrowser[method] ='+
				func.toString().replace( // for Netscape 7.1
					'var oldBrowser = this.mPanelContainer.childNodes[index];',
					'var oldBrowser = this.getBrowserForTab(aTab);'
				).replace( // for Firefox
					'this.mPanelContainer.removeChild(this.mPanelContainer.childNodes[index]);',
					'this.mPanelContainer.removeChild(oldBrowser.parentNode == this.mPanelContainer ? oldBrowser : oldBrowser.parentNode );'
				).replace(
					'this.mPanelContainer.selectedIndex = newIndex;',
					'for (var i = oldTab.tabIndex; i < this.mTabs.length; i++) this.mTabs[i].tabIndex = i;'+
					'var nextSelectedBrowser = this.getBrowserForTab(this.mCurrentTab);'+
					'this.mTabBox.selectedPanel = (nextSelectedBrowser.parentNode == this.mPanelContainer) ? nextSelectedBrowser : nextSelectedBrowser.parentNode;'+
					'this.mCurrentTab.selected = true;'
				).replace(
					'this.mPanelContainer.selectedIndex',
					'this.mTabContainer.selectedIndex'
				)
			);

		}



		// from Tab Mix/MiniT
		eval(
			'aTabBrowser.onTitleChanged ='+
			aTabBrowser.onTitleChanged.toString().replace(
				'var tab = tabBrowser.mTabContainer.childNodes[i];',
				'var tab = document.getAnonymousElementByAttribute(tabBrowser, "linkedpanel", this.id || this.parentNode.id);'
			)
		);
		// "this.id" is for NS7 or older versions.
	},



	supportMovableTabs : function(aTabBrowser) 
	{
		// Add methods
		aTabBrowser.getDropPosition = this.getTabDropPosition;

		var container = aTabBrowser.mTabContainer;
		container.setAttribute('ondraggesture', 'nsDragAndDrop.startDrag(event, this.parentNode.parentNode.parentNode); event.stopPropagation();');
		aTabBrowser.onDragStart = this.onTabDragStart;

		container.setAttribute('ondragexit', 'nsDragAndDrop.dragExit(event, this.parentNode.parentNode.parentNode); event.stopPropagation();');
		aTabBrowser.onDragExit = this.onTabDragExit;

		aTabBrowser.__tabextensions__onDrop = aTabBrowser.onDrop;
		aTabBrowser.onDrop = this.onTabDrop;

		aTabBrowser.__tabextensions__onDragOver = aTabBrowser.onDragOver;
		aTabBrowser.onDragOver = this.onTabDragOver;

		aTabBrowser.__tabextensions__getSupportedFlavours = aTabBrowser.getSupportedFlavours;
		aTabBrowser.getSupportedFlavours = this.getTabsSupportedFlavours;

//		aTabBrowser.mDragOverFocusTimeout = this.mDragOverFocusTimeout;
	},
 
	onXULTabbrowserTabDrop : function(aEvent) 
	{
		TBEMovableTabService.onTabDropInternal(aEvent);
	},


 
	getTabDropPosition : function(aEvent, aIndexObj) 
	{
		if (!aIndexObj)
			aIndexObj = {};

		var tab = aEvent.target;
		if (this.tabGroupTreeAvailable &&
			tab &&
			this.mDraggedTab &&
			this.mDraggedTab.parentTab != tab.parentTab) {
			aIndexObj.value = aEvent.target.tabIndex;
			return TBEMovableTabService.DROP_ON;
		}


		var isSimpleEdit = false;
		try {
			isSimpleEdit = this.mPrefs.getBoolPref('browser.tabs.extensions.group.edit_simple_dragdrop');
		}
		catch(e) {
		}

		var box = aEvent.target.boxObject.QueryInterface(Components.interfaces.nsIBoxObject);
		var regionCount = (
					this.tabGroupsAvailable &&
					(
						aEvent.ctrlKey ||
						aEvent.metaKey ||
						(
							!aEvent.ctrlKey &&
							!aEvent.metaKey &&
							isSimpleEdit
						)
					)
				) ? 3 : 2 ;
		// This is a number of position. "2" is "Left/Right", "3" is "Left/Middle/Right".

		var side = this.mTabBox.orient == 'horizontal'; // left or right
		var measure          = ((side ? box.height : box.width) / regionCount),
			coordValue       = (side ? box.y : box.x ),
			clientCoordValue = (side ? aEvent.clientY : aEvent.clientX );


		var reversed = window.getComputedStyle(this.parentNode, null).direction != 'ltr';
		var current = aEvent.target.tabIndex;

		if (this.mScrollbar) { // see "updateScrollbarFromEvent" in tabextensions.xml
			var curPos = this.mGetScrollPosition(this.mScrollbar).curPos;
			coordValue -= curPos;
		}

		var retVal;

		if (clientCoordValue < (coordValue + measure)) { // BEFORE
			retVal = TBEMovableTabService.DROP_BEFORE;
			aIndexObj.value = current + (reversed ? 1 : 0 );
		}
		else if (!this.tabGroupsAvailable ||
				clientCoordValue >= (coordValue + (regionCount-1)*measure)) { // AFTER
			retVal = TBEMovableTabService.DROP_AFTER;
			aIndexObj.value = current + (reversed ? 0 : 1 );
		}
		else {
			retVal = TBEMovableTabService.DROP_ON;
			aIndexObj.value = current;
		}
		return retVal;
	},



 
	// onDragStart 
	onTabDragStart : function(aEvent, aTransferData, aDragAction)
	{
		this.updateScrollbarFromEvent(aEvent);

		var tab = this.getTabFromChild(aEvent.originalTarget);


		if (tab && tab.isEventFiredOn(aEvent, 'closebox')) {
			TabbrowserService.stopEvent(aEvent);
			this.mTabsReadyToClose = true;
			tab.setAttribute('tab-ready-to-close', true);
			return;
		}
		else if (
			!tab || // dragging tabbar
			(
				!tab.isEventFiredOn(aEvent, 'favicon') &&
				this.mPrefs.getBoolPref('browser.tabs.extensions.focus_with_drag')
			)
			) {
			TabbrowserService.stopEvent(aEvent);
			this.mTabsReadyToFocus = true;
			return;
		}



		this.mDraggedTab = tab;

		var uri   = tab.mBrowser.currentURI.spec;
		var label = tab.getAttribute('tab-nextFixedLabel') || tab.getAttribute('tab-fixedLabel') || tab.label || uri ;

		aTransferData.data = new TransferData();
		aTransferData.data.addDataForFlavour('text/x-moz-tab',
			'order='+tab.tabIndex+'\n'+ // current order of the tab.
			'dragId='+tab.tabId+'\n'+ // browser ID. If tab is dropped to other window, the browser opens new tab.
			'uri='+uri);

		aTransferData.data.addDataForFlavour('text/unicode', uri);
		aTransferData.data.addDataForFlavour('text/x-moz-url', uri+'\n'+label);
		aTransferData.data.addDataForFlavour('text/html', '<a href="'+uri+'">'+label+'</a>');
	},


	// onDrop 
	onTabDrop : function(aEvent, aTransferData, aSession)
	{
		var event;
		var uri;

		if (aTransferData.flavour.contentType == 'text/x-moz-url') {
			uri = aTransferData.data.split('\n')[0];
			TabbrowserService.dragDropSecurityCheck(aEvent, aSession, uri);
			event = document.createEvent('Events');
			event.initEvent('XULTabbrowserURIDrop', false, true);
			event.droppedURI = uri;
			this.dispatchEvent(event);
		}

		if (aTransferData.flavour.contentType != 'text/x-moz-tab') {
			this.__tabextensions__onDrop(aEvent, aTransferData, aSession);
			return;
		}


		var indicatorBar = this.mTabDropIndicatorBar;
		if (indicatorBar &&
			this.getAttribute('tab-drop-indicator-type') == 'default')
			indicatorBar.setAttribute('dragging', 'false');


		var toTab   = aEvent.target,
			fromTab = this.mDraggedTab,
			dragId,
			uri;

		if (toTab.localName != 'tab') toTab = null;

		var data = aTransferData.data.split('\n');
		if (data.length == 1) {
			dragId = this.mTabs[data[0]].tabId;
			uri    = this.mTabs[data[0]].mBrowser.currentURI.spec;
		}
		else {
			dragId = data[1].match(/[^=]+$/)[0];
			uri    = data[2].replace(/^uri=/, '');
		}


		TabbrowserService.dragDropSecurityCheck(aEvent, aSession, uri);



		// タブのドロップ位置を調べる
		// get the dropped position of the tab
		var indexObj = {};
		var newIndex = this.getDropPosition(aEvent, indexObj);
		if (aEvent.target.localName == 'tab' && newIndex == 0) {
			pos = TBEMovableTabService.DROP_ON;
		}
		newIndex = Math.max(0, Math.min(this.mTabs.length-1, indexObj.value))
		toTab    = this.mTabs[newIndex];

		if (fromTab && newIndex > fromTab.tabIndex)
			newIndex--;

		var reversed = window.getComputedStyle(this.parentNode, null).direction != 'ltr';
		var pos,
			toTab;
		if (aEvent.target.localName == 'tab') {
			toTab = aEvent.target;

			if (pos != TBEMovableTabService.DROP_ON) {
				if (reversed ? (newIndex > toTab.tabIndex) : (newIndex <= toTab.tabIndex))
					pos = TBEMovableTabService.DROP_BEFORE;
				else if (reversed ? (newIndex <= toTab.tabIndex) : (newIndex > toTab.tabIndex))
					pos = TBEMovableTabService.DROP_AFTER;
			}
		}
		else {
			var box = this.mTabs[this.mTabs.length-1].boxObject;
			if (this.mTabBox.orient == 'vertical' ?
				(aEvent.screenX >= box.screenX+box.width) :
				(aEvent.screenY >= box.screenY+box.height)
				) {
				newIndex = this.mTabs.length-1;
				pos = TBEMovableTabService.DROP_AFTER;
			}
			else {
				newIndex = 0;
				pos = TBEMovableTabService.DROP_BEFORE;
			}
			toTab = this.mTabs[newIndex];
		}



		event = document.createEvent('Events');
		event.initEvent('XULTabbrowserTabDrop', false, true);

		event.tabURI           = uri;
		event.droppedTabId     = dragId;
		event.targetTabId      = toTab.tabId;
		event.droppedPosition  = pos;
		event.droppedSourceURI = null;
		try {
			event.droppedSourceURI = aSession.sourceDocument.documentURI;
		}
		catch(e) {
		}

		event.dragdropCtrlKey  = aEvent.ctrlKey;
		event.dragdropShiftKey = aEvent.shiftKey;
		event.dragdropAltKey   = aEvent.altKey;
		event.dragdropMetaKey  = aEvent.metaKey;

		event.dragdropTarget         = aEvent.target;
		event.dragdropOriginalTarget = 'originalTtarget' in aEvent ? aEvent.originalTtarget : null ;

		this.dispatchEvent(event);


		this.mDraggedTab = null;

//		TBEMovableTabService.onTabDropInternal(event);
	},


	onTabDropInternal : function(aEvent) 
	{
		var TS = TabbrowserService;
		var b  = TS.browser;

		var fromId  = aEvent.droppedTabId,
			fromTab = b.getTabByTabId(fromId),
			toTab   = b.getTabByTabId(aEvent.targetTabId),
			toIndex = toTab.tabIndex,
			uri     = aEvent.tabURI,
			pos     = aEvent.droppedPosition,
			i;


		// When the tab is dragged from another window...
		if (!fromTab) {
			// security check
			if (!uri || !uri.length || uri.indexOf(' ', 0) != -1 ||
				/^\s*(javascript|data):/.test(uri))
				return;

			try {
				TS.uriSecurityCheck(uri, aEvent.droppedSourceURI);
			}
			catch(e) {
				return;
			}

			// when dropped to an existing tab
			if (!b.tabGroupTreeAvailable &&
				pos == TBEMovableTabService.DROP_ON &&
				toTab.getAttribute('tab-loadingURI') &&
				toTab.getAttribute('tab-loadingURI') != 'about:blank' &&
				aEvent.dragdropTarget.localName == 'tab' &&
				(!b.tabGroupsAvailable || aEvent.dragdropShiftKey)) {
				toTab.mBrowser.loadURI(uri);
				return;
			}

			if (TS.getPref('browser.tabs.extensions.dragdrop.only_load_uri')) { // old implementation
				fromTab = b.addTab(uri);
			}
			else {
				var w = TS.browserWindows;
				var browser, tab;
				for (i in w) // find the window the tab is dragged from
				{
					browser = w[i].TabbrowserService.browser;
					tab     = browser.getTabByTabId(fromId);
					if (tab) break;
				}
				if (tab) {
					var info   = browser.getTabInfo(tab);
					var isLast = (browser.mTabs.length == 1);
					browser.removeTabInternal(tab, { preventUndo : true });
					if (isLast) {
						window.setTimeout(function() {
							Components.lookupMethod(browser.ownerDocument.defaultView, 'top').call(browser.ownerDocument.defaultView).close();
						}, 0);
					}
					fromTab = b.addTabWithTabInfo(info);
				}
				else
					fromTab = b.addTab(uri);
			}

			// if the tab is dropped to the blank tab, remove it
			if (
				pos == TBEMovableTabService.DROP_ON ||
				b.mTabs.length < 3 // if there was only one tab since the tab was dropped
				) {
				var targetTab = (b.mTabs.length < 3) ? b.mTabs[0] : toTab ;
				if (targetTab.isReallyBlank) {
					b.removeTabInternal(targetTab, { preventUndo : true });
					if (toTab == targetTab) toTab = null;
				}
			}
		}

		// グループへの追加 insert to the group
		var isSimpleEdit = TS.getPref('browser.tabs.extensions.group.edit_simple_dragdrop');
		if (toTab &&
			pos == TBEMovableTabService.DROP_ON &&
			(
				b.tabGroupsAvailable &&
				(
					aEvent.dragdropCtrlKey ||
					aEvent.dragdropMetaKey ||
					(
						!aEvent.dragdropCtrlKey &&
						!aEvent.dragdropMetaKey &&
						isSimpleEdit
					)
				)
			)) {
			if (b.tabGroupTreeAvailable) {
				fromTab.parentTab = toTab;
			}
			else {
// If there is 3 tabs A, B(child of A) and C(child of A), and you open new tab D from A, tabextensions appends D to it's group. Then it has three children B, C, and D.
// But, D is not accessible when there is too many tabs. In bookmark groups or links opened from the context menu, D shouldn't be the brother of B and C. For example, if new tabs are shown at the right edge of groups, expected result is following: A, D(child of A), B and C(child of B).
				if (toTab.hasChildTabs() &&
					toTab.shouldPurgeChildren) {
					var children  = toTab.childTabs;
					var newParent = toTab.parentTab || children[0] ;
					for (i = 0; i < children.length; i++)
						b.attachTabTo(children[i], children[i] == newParent ? toTab.parentTab : newParent );

					toTab.shouldPurgeChildren     = false;
					newParent.shouldPurgeChildren = true;
				}

				b.moveTabToGroupEdge(fromTab, toTab);

				fromTab.parentTab = toTab;
			}
		}
		else {
			if (
				toIndex > -1 &&
				toIndex < b.mTabs.length
				) {
				b.moveTabTo(fromTab, toIndex);
				if (b.tabGroupTreeAvailable)
					b.updateTabTree();
			}


			// タブ以外の場所にドロップした場合、グループを抜けさせる
			// if the tab is dropped from groups, detach it from the group.
			if (aEvent.dragdropTarget.localName != 'tab' &&
				fromTab.parentTab &&
				!aEvent.dragdropOriginalTarget
				) {
				fromTab.parentTab = null;

				// 子供のタブをタブの右側に再配置
				// move child tabs to right of the tab
				var tabs = fromTab.descendantTabs;
				for (i in tabs)
					b.moveTabToGroupEdge(tabs[i], fromTab);
			}
		}
	},



	// onDragOver 
	onTabDragOver : function(aEvent, aFlavour, aSession)
	{
		this.updateScrollbarFromEvent(aEvent);


/*
		if (aEvent.target.localName == 'tab' &&
			this.mPrefs.getBoolPref('browser.tabs.extensions.focus_with_dragover')) {
			if (!aEvent.target.selected)
				this.selectedTab = aEvent.target;
//			if (this.mDragOverFocusTimer &&
//				this.mDragOverFocusTarget &&
//				this.mDragOverFocusTarget != aEvent.target.tabId) {
//				window.clearTimeout(this.mDragOverFocusTimer);
//				this.mDragOverFocusTarget = null;
//				this.mDragOverFocusTimer = null;
//			}
//			if (!this.mDragOverFocusTimer) {
//				this.mDragOverFocusTarget = aEvent.target.tabId;
//				this.mDragOverFocusTimer = window.setTimeout(
//					this.mDragOverFocusTimeout,
//					Math.max(0, this.mPrefs.getIntPref('browser.tabs.extensions.focus_with_dragover.delay')),
//					this
//				);
//			}
		}
*/


		var XferDataSet = nsTransferable.get(
				this.getSupportedFlavours(),
				nsDragAndDrop.getDragData,
				true
			);
		var XferData = XferDataSet.first.first;
		switch (XferData.flavour.contentType)
		{
			case 'tabbrowser/tab':
			case 'text/x-moz-tab':
				break;
			default:
				this.__tabextensions__onDragOver(aEvent, aFlavour, aSession);
				return;
		}

		this.mCurrentDragOverTab = (aEvent.target.localName == 'tab') ? aEvent.target.tabId : null ;
		if (!this.mCurrentDragOverTab) return;

		var tab = this.getTabByTabId(this.mCurrentDragOverTab);



		this.autoScrollTabbar(aEvent);




		// ドラッグ開始したタブの上では表示を変えない
		// Ignore the tab dragged from.
		if (this.mDraggedTab == aEvent.target) {
			tab.removeAttribute('dragover-at');
			return;
		}


		var indexObj = {};
		var newIndex = this.getDropPosition(aEvent, indexObj);
		var reversed = window.getComputedStyle(this.parentNode, null).direction != 'ltr';

		var indicatorBar = this.mTabDropIndicatorBar;
		var indicator = this.mTabDropIndicator;

		if (newIndex == TBEMovableTabService.DROP_ON) {
			if (this.mDraggedTab &&
				!this.canAttachTabTo(this.mDraggedTab, tab)) {
				aSession.canDrop = false;
			}
			tab.setAttribute('dragover-at', 'this');

			if (indicatorBar)
				indicatorBar.setAttribute('dragging', 'false');
		}
		else {
			if (newIndex == TBEMovableTabService.DROP_BEFORE)
				tab.setAttribute('dragover-at', 'before');
			else
				tab.setAttribute('dragover-at', 'after');

			newIndex = indexObj.value;

			if (indicatorBar &&
				this.getAttribute('tab-drop-indicator-type') == 'default')
				indicatorBar.setAttribute('dragging', true);

			var newOrLastIndex = (newIndex == this.mTabs.length) ? this.mTabs.length-1 : newIndex ;

			var styleRules = [];

			var isSide = this.mTabBox.orient != 'vertical';
			if (!isSide) {
				// 次の行の頭ではなく、前の行の最後に表示
				if (
					newIndex < this.mTabs.length &&
					newIndex > 0 &&
					(
						(this.mTabs[newIndex].boxObject.y - this.mTabs[newIndex-1].boxObject.y) > (this.mTabs[newIndex].boxObject.height/2)
					) &&
					tab.getAttribute('dragover-at') == 'after'
					)
					newOrLastIndex = newIndex-1;

				var offset = /tabbrowser-tabbar-bottom/.test(this.getAttribute('class')) ? 5 : 0 ;
				styleRules.push('margin-top: '+(
							this.mTabs[newOrLastIndex].boxObject.y
							- indicatorBar.boxObject.y
							- 10 + offset - this.multirowTabbarYOffset
						)+'px');
				styleRules.push('margin-bottom: '+(0-(
							this.mTabs[newOrLastIndex].boxObject.y
							- indicatorBar.boxObject.y
							- 5 + offset - this.multirowTabbarYOffset
						))+'px');
			}

			if (!reversed) {
				if (!isSide) {
					if (newIndex != newOrLastIndex)
						styleRules.push('margin-left: '+(
								this.mTabs[newOrLastIndex].boxObject.x
								+ this.mTabs[newOrLastIndex].boxObject.width
								- indicatorBar.boxObject.x - 7
								- this.tabbarXOffset
							)+'px');
					else
						styleRules.push('margin-left: '+(
								this.mTabs[newIndex].boxObject.x
								- indicatorBar.boxObject.x
								- 7
								- this.tabbarXOffset
							)+'px');
				}
				else {
					if (newIndex != newOrLastIndex)
						styleRules.push('margin-top: '+(
								this.mTabs[newOrLastIndex].boxObject.y
								+ this.mTabs[newOrLastIndex].boxObject.height
								- indicatorBar.boxObject.y - 7
								- this.tabbarYOffset
							)+'px');
					else
						styleRules.push('margin-top: '+(
								this.mTabs[newIndex].boxObject.y
								- indicatorBar.boxObject.y
								- 7
								- this.tabbarYOffset
							)+'px');
				}
			}
			else {
				if (!isSide) {
					if (newIndex == gBrowser.mTabs.length)
						styleRules.push('margin-right: '+(
								indicatorBar.boxObject.width
								+ indicatorBar.boxObject.x
								- gBrowser.mTabs[newIndex-1].boxObject.x
								- this.tabbarXOffset
							)+'px');
					else
						styleRules.push('margin-right: '+(
								indicatorBar.boxObject.width
								+ indicatorBar.boxObject.x
								- gBrowser.mTabs[newIndex].boxObject.x
								- gBrowser.mTabs[newIndex].boxObject.width
								- this.tabbarXOffset
							)+'px');
				}
				else {
					if (newIndex == gBrowser.mTabs.length)
						styleRules.push('margin-bottom: '+(
								indicatorBar.boxObject.height
								+ indicatorBar.boxObject.y
								- gBrowser.mTabs[newIndex-1].boxObject.y
								- this.tabbarYOffset
							)+'px');
					else
						styleRules.push('margin-bottom: '+(
								indicatorBar.boxObject.height
								+ indicatorBar.boxObject.y
								- gBrowser.mTabs[newIndex].boxObject.y
								- gBrowser.mTabs[newIndex].boxObject.height
								- this.tabbarYOffset
							)+'px');
				}
			}

			indicator.setAttribute('style', styleRules.join(';'));
		}
	},
/*
	mDragOverFocusTimeout : function(aBrowser)
	{
		if (aBrowser.mDragOverFocusTarget) {
			var tab = aBrowser.getTabByTabId(aBrowser.mDragOverFocusTarget);
			if (!tab.selected)
				aBrowser.selectedTab = tab;
		}

		aBrowser.mDragOverFocusTarget = null;
		aBrowser.mDragOverFocusTimer = null;
	},
*/
 
	// onDragExit 
	onTabDragExit : function(aEvent, aSession)
	{
		if (this.mCurrentDragOverTab)
			this.getTabByTabId(this.mCurrentDragOverTab).removeAttribute('dragover-at');

		var indicatorBar = this.mTabDropIndicatorBar;
		if (indicatorBar)
			indicatorBar.setAttribute('dragging', 'false');
/*
		if (this.mDragOverFocusTimer) {
			window.clearTimeout(this.mDragOverFocusTimer);
			this.mDragOverFocusTarget = null;
			this.mDragOverFocusTimer = null;
		}
*/
	},


	// Supported Flavours 
	getTabsSupportedFlavours : function()
	{
		var flavourSet = new FlavourSet();
		flavourSet.appendFlavour('text/x-moz-tab');
		flavourSet.appendFlavour('text/x-moz-url');
		flavourSet.appendFlavour('text/unicode');
		flavourSet.appendFlavour('application/x-moz-file', 'nsIFile');
		return flavourSet;
	},


	onTabbrowserMouseMove : function(aEvent)
	{
		var b = TabbrowserService.browser;
		if (b.mTabsReadyToClose ||
			b.mTabsReadyToFocus) {
			b.autoScrollTabbar(aEvent, true);
		}
	},


	onTabbrowserMouseUp : function(aEvent)
	{
		var b = TabbrowserService.browser;

		if (b.mTabsReadyToClose) {
			var xpathResult = b.evaluateXPath(
					'child::*[local-name() = "tab" and @tab-ready-to-close = "true"]',
					b.mTabContainer
				);
			if (xpathResult && xpathResult.snapshotLength) {
				var removeTab = !('warnAboutClosingTabs' in b) || b.warnAboutClosingTabs(false);

				for (var i = 0, max = xpathResult.snapshotLength, node; i < max; i++)
				{
					node = xpathResult.snapshotItem(i);
					node.removeAttribute('tab-ready-to-close');
					if (removeTab)
						b.removeTab(node);
				}
			}
		}

		b.mTabsReadyToClose = false;
		b.mTabsReadyToFocus = false;

/*
		if (b.mDragOverFocusTimer) {
			window.clearTimeout(b.mDragOverFocusTimer);
			b.mDragOverFocusTarget = null;
			b.mDragOverFocusTimer = null;
		}
*/
	}

}; 

var gTSTabDropIndicatorTypePrefListener = 
{
	domain  : 'browser.tabs.extensions.dragdrop.indicator',
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		var type = TabbrowserService.getPref(this.domain);
		if (type)
			TabbrowserService.browser.setAttribute('tab-drop-indicator-type', type);
		else
			TabbrowserService.browser.removeAttribute('tab-drop-indicator-type');
	}
};





// end of definition 

if (!window.TabbrowserServiceModules)
	window.TabbrowserServiceModules = [];

TabbrowserServiceModules.push(TBEMovableTabService);
}
