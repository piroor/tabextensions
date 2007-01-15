// start of definition 
if (!window.TabbrowserSessionManager) {

var gTSGlobalUndoRemoveTabCache;
var gTSGlobalUndoRemoveTabCacheDatabase;

var TabbrowserSessionManager = {

	enabled : true,

	defaultPref      : 'chrome://tabextensions_sessionmanager/content/default.js',
	defaultPrefLight : 'chrome://tabextensions_sessionmanager/content/default.light.js',
	
	// properties 
	tabHistoryQuitInitialized : false,
	tabsBackupInitialized     : false,
	
	get service() 
	{
		if (this._service === void(0))
			this._service = 'TabbrowserService' in window ? window.TabbrowserService : null ;

		return this._service;
	},
//	_service : null,
 
	// 定数 
	
	get kRDF_HistoryEntry() 
	{
		if (!this._kRDF_HistoryEntry)
			this._kRDF_HistoryEntry = this.service.RDF.GetResource('http://white.sakura.ne.jp/~piro/rdf#HistoryEntry');
		return this._kRDF_HistoryEntry;
	},
	_kRDF_HistoryEntry : null,
 
	get kRDF_ID() 
	{
		if (!this._kRDF_ID)
			this._kRDF_ID = this.service.RDF.GetResource('http://white.sakura.ne.jp/~piro/rdf#ID');
		return this._kRDF_ID;
	},
	_kRDF_ID : null,
 
	get kRDF_URI() 
	{
		if (!this._kRDF_URI)
			this._kRDF_URI = this.service.RDF.GetResource('http://white.sakura.ne.jp/~piro/rdf#URI');
		return this._kRDF_URI;
	},
	_kRDF_URI : null,
 
	get kRDF_title() 
	{
		if (!this._kRDF_title)
			this._kRDF_title = this.service.RDF.GetResource('http://white.sakura.ne.jp/~piro/rdf#title');
		return this._kRDF_title;
	},
	_kRDF_title : null,
 
	get kRDF_isSubFrame() 
	{
		if (!this._kRDF_isSubFrame)
			this._kRDF_isSubFrame = this.service.RDF.GetResource('http://white.sakura.ne.jp/~piro/rdf#isSubFrame');
		return this._kRDF_isSubFrame;
	},
	_kRDF_isSubFrame : null,
 
	get kRDF_saveLayoutState() 
	{
		if (!this._kRDF_saveLayoutState)
			this._kRDF_saveLayoutState = this.service.RDF.GetResource('http://white.sakura.ne.jp/~piro/rdf#saveLayoutState');
		return this._kRDF_saveLayoutState;
	},
	_kRDF_saveLayoutState : null,
 
	get kRDF_loadType() 
	{
		if (!this._kRDF_loadType)
			this._kRDF_loadType = this.service.RDF.GetResource('http://white.sakura.ne.jp/~piro/rdf#loadType');
		return this._kRDF_loadType;
	},
	_kRDF_loadType : null,
 
	get kRDF_expirationStatus() 
	{
		if (!this._kRDF_expirationStatus)
			this._kRDF_expirationStatus = this.service.RDF.GetResource('http://white.sakura.ne.jp/~piro/rdf#expirationStatus');
		return this._kRDF_expirationStatus;
	},
	_kRDF_expirationStatus : null,
 
	get kRDF_cacheKey() 
	{
		if (!this._kRDF_cacheKey)
			this._kRDF_cacheKey = this.service.RDF.GetResource('http://white.sakura.ne.jp/~piro/rdf#cacheKey');
		return this._kRDF_cacheKey;
	},
	_kRDF_cacheKey : null,
 
	get kRDF_postContentType() 
	{
		if (!this._kRDF_postContentType)
			this._kRDF_postContentType = this.service.RDF.GetResource('http://white.sakura.ne.jp/~piro/rdf#postContentType');
		return this._kRDF_postContentType;
	},
	_kRDF_postContentType : null,
 
	get kRDF_postContent() 
	{
		if (!this._kRDF_postContent)
			this._kRDF_postContent = this.service.RDF.GetResource('http://white.sakura.ne.jp/~piro/rdf#postContent');
		return this._kRDF_postContent;
	},
	_kRDF_postContent : null,
 
	get kRDF_x() 
	{
		if (!this._kRDF_x)
			this._kRDF_x = this.service.RDF.GetResource('http://white.sakura.ne.jp/~piro/rdf#x');
		return this._kRDF_x;
	},
	_kRDF_x : null,
 
	get kRDF_y() 
	{
		if (!this._kRDF_y)
			this._kRDF_y = this.service.RDF.GetResource('http://white.sakura.ne.jp/~piro/rdf#y');
		return this._kRDF_y;
	},
	_kRDF_y : null,
  
	get strbundle() 
	{
		if (!this._strbundle) {
			const STRBUNDLE = Components.classes['@mozilla.org/intl/stringbundle;1'].getService(Components.interfaces.nsIStringBundleService);
			this._strbundle = STRBUNDLE.createBundle('chrome://tabextensions_sessionmanager/locale/tabextensions_sessionmanager.properties');
		}
		return this._strbundle;
	},
	_strbundle : null,
 
	// datasource 
	
	get tabHistoryDataSource() 
	{
		if (!this._tabHistoryDataSource)
			this._tabHistoryDataSource = this.service.getDataSource('history.rdf');
		return this._tabHistoryDataSource;
	},
	_tabHistoryDataSource : null,
	
	get tabHistory() 
	{
		if (!this._tabHistory)
			this._tabHistory = new pRDFDataR('TabsHistory', this.tabHistoryDataSource.URI, 'seq', 'http://white.sakura.ne.jp/~piro/rdf#', 'chrome://tabextensions/content/tabextensions.rdf#');

		if (this._tabHistory.length != this._tabHistory._resources.length)
			this._tabHistory.reset();

		return this._tabHistory;
	},
	_tabHistory : null,
 
	get tabHistoryQuitRoot() 
	{
		if (!this._tabHistoryQuitRoot)
			this._tabHistoryQuitRoot = new pRDFDataR('TabsHistoryQuit', this.tabHistoryDataSource.URI, 'bag', 'http://white.sakura.ne.jp/~piro/rdf#', 'chrome://tabextensions/content/tabextensions.rdf#', null, true);

		if (this._tabHistoryQuitRoot.length != this._tabHistoryQuitRoot._resources.length)
			this._tabHistoryQuitRoot.reset();

		return this._tabHistoryQuitRoot;
	},
	_tabHistoryQuitRoot : null,
	
	get tabHistoryQuit() 
	{
		if (!this._tabHistoryQuit)
			this._tabHistoryQuit = new pRDFDataR('TabsHistoryQuit:window-'+Math.floor(Math.random() * 100000), this.tabHistoryDataSource.URI, 'seq', 'http://white.sakura.ne.jp/~piro/rdf#', 'chrome://tabextensions/content/tabextensions.rdf#', null, true);

		if (this._tabHistoryQuit.length != this._tabHistoryQuit._resources.length)
			this._tabHistoryQuit.reset();

		return this._tabHistoryQuit;
	},
	set tabHistoryQuit(aValue)
	{
		this._tabHistoryQuit = aValue;
	},
	_tabHistoryQuit : null,
   
	get tabsBackupDataSource() 
	{
		if (!this._tabsBackupDataSource)
			this._tabsBackupDataSource = this.service.getDataSource('backup.rdf');
		return this._tabsBackupDataSource;
	},
	_tabsBackupDataSource : null,
	
	get tabsBackupRoot() 
	{
		if (!this._tabsBackupRoot)
			this._tabsBackupRoot = new pRDFDataR('TabsBackup', this.tabsBackupDataSource.URI, 'bag', 'http://white.sakura.ne.jp/~piro/rdf#', 'chrome://tabextensions/content/tabextensions.rdf#', null, true);

		if (this._tabsBackupRoot.length != this._tabsBackupRoot._resources.length)
			this._tabsBackupRoot.reset();

		return this._tabsBackupRoot;
	},
	_tabsBackupRoot : null,
	
	get tabsBackup() 
	{
		if (!this._tabsBackup)
			this._tabsBackup = new pRDFDataR('TabsBackup:window-'+Math.floor(Math.random() * 100000), this.tabsBackupDataSource.URI, 'seq', 'http://white.sakura.ne.jp/~piro/rdf#', 'chrome://tabextensions/content/tabextensions.rdf#', null, true);

		if (this._tabsBackup.length != this._tabsBackup._resources.length)
			this._tabsBackup.reset();

		return this._tabsBackup;
	},
	set tabsBackup(aValue)
	{
		this._tabsBackup = aValue;
	},
	_tabsBackup : null,
   
	get storedTabSetsDataSource() 
	{
		if (!this._storedTabSetsDataSource)
			this._storedTabSetsDataSource = this.service.getDataSource('tabsessions.rdf');
		return this._storedTabSetsDataSource;
	},
	_storedTabSetsDataSource : null,
	
	get storedTabSetsRoot() 
	{
		if (!this._storedTabSetsRoot)
			this._storedTabSetsRoot = new pRDFDataR('StoredTabSets', this.storedTabSetsDataSource.URI, 'seq', 'http://white.sakura.ne.jp/~piro/rdf#', 'chrome://tabextensions/content/tabextensions.rdf#', null, true);

		if (this._storedTabSetsRoot.length != this._storedTabSetsRoot._resources.length)
			this._storedTabSetsRoot.reset();

		return this._storedTabSetsRoot;
	},
	set storedTabSetsRoot(aValue)
	{
		this._storedTabSetsRoot = aValue;
	},
	_storedTabSetsRoot : null,
	
	storedTabSets : [], 
   
	get removeTabCacheDataSource() 
	{
		if (!this._removeTabCacheDataSource)
			this._removeTabCacheDataSource = this.service.getDataSource('closedtabs.rdf');
		return this._removeTabCacheDataSource;
	},
	_removeTabCacheDataSource : null,
  
	// prefs 
	
	get shouldResutoreLastVisitedTabs() 
	{
		return (
			this.service.isBrowserWindow &&
			this.service.browserWindows.length < 2 &&
			this.service.getPref('browser.tabs.extensions.startup_action_overlay') == 0
		);
	},
 
	get shouldBackupTabs() 
	{
		return (this.service.isBrowserWindow && this.service.getPref('browser.tabs.extensions.backup_tabs'));
	},
   
	// イベントの捕捉 
	
	onBeforeInit : function() 
	{
		var oldDataFile = this.service.getFileFromURL(this.service.profileURL+'tabextensions.rdf');
		if (!oldDataFile.exists()) return;

		// inherit old datafile
		var dataDir = this.service.getFileFromURL(this.service.profileURL+'tabextensions/');
		if (!dataDir.exists()) {
			dataDir.create(dataDir.DIRECTORY_TYPE, 0755);
		}

		var newFile;

		newFile = this.service.getFileFromURL(this.service.profileURL+'tabextensions/tabsessions.rdf');
		if (!newFile.exists())
			oldDataFile.copyTo(dataDir, 'tabsessions.rdf');

		newFile = this.service.getFileFromURL(this.service.profileURL+'tabextensions/backup.rdf');
		if (!newFile.exists())
			oldDataFile.copyTo(dataDir, 'backup.rdf');

		newFile = this.service.getFileFromURL(this.service.profileURL+'tabextensions/closedtabs.rdf');
		if (!newFile.exists())
			oldDataFile.copyTo(dataDir, 'closedtabs.rdf');

		newFile = this.service.getFileFromURL(this.service.profileURL+'tabextensions/history.rdf');
		if (!newFile.exists())
			oldDataFile.copyTo(dataDir, 'history.rdf');
	},
 
	onAfterInit : function() 
	{
		var nullPointer;
		nullPointer = this.tabHistory;
		nullPointer = this.tabHistoryQuitRoot;
		nullPointer = this.tabsBackupRoot;
		nullPointer = this.storedTabSetsRoot;
		delete nullPointer;

		var b = this.service.browser;
		if (this.service.isBrowserWindow && b) {
			this.service.addPrefListener(gTSMTabHistoryQuitPrefListener);
			this.service.addPrefListener(gTSMTabsBackupPrefListener);

			b.addEventListener('XULTabbrowserTabLoad', this.onXULTabbrowserTabLoad, false);
			b.addEventListener('XULTabbrowserTabAdded', this.onXULTabbrowserTabAdded, false);
			b.addEventListener('XULTabbrowserTabRemoved', this.onXULTabbrowserTabRemoved, false);
			b.addEventListener('XULTabbrowserTabMoved', this.onXULTabbrowserTabMoved, false);
//			b.addEventListener('XULTabbrowserTabGroupModified', this.onXULTabbrowserTabGroupModified, false);

			gTSMTabHistoryQuitPrefListener.observe(null, 'nsPref:changed', null);
			gTSMTabsBackupPrefListener.observe(null, 'nsPref:changed', null);
		}

		// initialize global "undo close tab" cache and clipbard history
		var targets = this.service.WindowManager.getEnumerator(null, true),
			target;
		while (targets.hasMoreElements())
		{
			target = targets.getNext().QueryInterface(Components.interfaces.nsIDOMWindowInternal);
			if (!target.gTSGlobalUndoRemoveTabCache) continue;

			window.gTSGlobalUndoRemoveTabCache = target.gTSGlobalUndoRemoveTabCache;
			window.gTSGlobalUndoRemoveTabCacheDatabase = target.gTSGlobalUndoRemoveTabCacheDatabase;
			break;
		}
		if (!window.gTSGlobalUndoRemoveTabCache)
			window.gTSGlobalUndoRemoveTabCache = [];
		if (!window.gTSGlobalUndoRemoveTabCacheDatabase) {
			window.gTSGlobalUndoRemoveTabCacheDatabase = new pRDFDataR('UndoRemoveTabCache', this.removeTabCacheDataSource.URI, 'seq', 'http://white.sakura.ne.jp/~piro/rdf#', 'chrome://tabextensions/content/tabextensions.rdf#');
		}
	},
 
	onAfterInitWithDelay : function(aInfo) 
	{
		if (this.service.isBrowserWindow) {
			try {
				this.service.ObserverService.addObserver(gTSMStoredTabSetsListener, 'tabextensions:storedTabSetsModified', false);
			}
			catch(e) {
			}
			window.addEventListener('XULTabbrowserUndoCacheAdded', this.onXULTabbrowserUndoCacheModified, true);
			window.addEventListener('XULTabbrowserUndoCacheRemoved', this.onXULTabbrowserUndoCacheModified, true);
		}

		// load the undo cache
		this.initGlobalUndoCache();

		// restore tabs
		var info = aInfo || {} ;
		this.overlayStartupAction('argumentIsDefaultStartup' in info ? info.argumentIsDefaultStartup : false );
	},
	
	// open last visited tabs with startup 
	overlayStartupAction : function(aArgumentIsDefaultStartup)
	{
try {
		var nav  = this.service.browserWindows;
		var info = {};

		info.forceToRestore = this.service.getPref('browser.tabs.extensions.startup_action_overlay.one_time');
		info.loadSelectedSession = this.service.getPref('browser.tabs.extensions.startup_action_overlay') == 1;

		if (
			(
				this.shouldResutoreLastVisitedTabs ||
				info.loadSelectedSession ||
				this.shouldBackupTabs ||
				info.forceToRestore
			) &&
			nav.length == 1 &&
			nav[0] == window &&
			(// 起動オプションで渡されたURIを優先
				!('arguments' in window) ||
				!window.arguments.length ||
				!window.arguments[0] ||
				aArgumentIsDefaultStartup
			)
			) {

			info.shouldRestoreBackup = this.checkShouldRestoreBackup();

			if (
				this.shouldResutoreLastVisitedTabs ||
				info.loadSelectedSession ||
				info.shouldRestoreBackup ||
				info.forceToRestore
				) {
				info.loadType = info.shouldRestoreBackup ? 'backup' :
								info.loadSelectedSession ? 'selected' :
								'history';

				if (info.loadType == 'selected' &&
					this.service.getPref('browser.tabs.extensions.startup_action_overlay.onece_per_day')) {
					// if the last loading has already been done today, skip restoring
					var yesterday = new Date();
					yesterday.setTime(yesterday.getTime()-86400000); // set to yesterday

					var last = new Date();
					last.setTime(this.service.getPref('browser.tabs.extensions.startup_action_overlay.onece_per_day.last_time'));
					if (
						last.getTime() >= yesterday.getTime() &&
						last.getDate() == (new Date()).getDate()
						)
						info.loadType = null;
				}

				if (info.loadType) {
					info.count = 0;
					window.setTimeout(this.restoreTabsOnStartup, 1, info);
				}
			}

			if (info.forceToRestore) {
				this.service.setPref('browser.tabs.extensions.startup_action_overlay.one_time', false);
				this.service.setPref('browser.tabs.extensions.startup_action_overlay', this.service.getPref('browser.tabs.extensions.startup_action_overlay.one_time.backup'));
			}
		}
		else if ( // 最近アクティブだったブラウザウィンドウからタブをコピーする
			this.shouldResutoreLastVisitedTabs &&
			this.service.getPref('browser.tabs.extensions.copy_recent_tabs') &&
			nav.length > 1
			) {
			this.copyTabsFrom(nav[1]);
		}
}
catch(e) {
	if (this.service && this.service.debug)
		alert('@TabbrowserSessionManager.overlayStartupAction()\n'+e);
}
	},
	restoreTabsOnStartup : function(aInfo)
	{
		var TSM   = TabbrowserSessionManager;

		var loadData;
		switch (aInfo.loadType)
		{
			case 'backup':
				loadData = TSM.tabsBackupRoot;
				break;

			case 'selected':
				if (!TSM.storedTabSetsRoot.length)
					TSM.storedTabSetsRoot.reset();

				if (!TSM.storedTabSets.length ||
					TSM.storedTabSets.length != TSM.storedTabSetsRoot.length)
					TSM.initStoredTabSets();

				var selected = TSM.service.getPref('browser.tabs.extensions.startup_action_overlay.selected_session');
				if (selected in TSM.storedTabSets)
					loadData = TSM.storedTabSets[selected];
				break;

			default:
			case 'history':
				if (!TSM.tabHistoryQuitRoot.length)
					TSM.tabHistoryQuitRoot.reset();

				loadData = (TSM.tabHistoryQuitRoot.length > 1 && !aInfo.forceToRestore) ? TSM.tabHistoryQuitRoot : TSM.tabHistory ;
				break;
		}

		if (loadData && !loadData.length) loadData.reset();
		if (!loadData || !loadData.length && aInfo.count < 10) {
			aInfo.count++;
			// retry after successfully initialized
			window.setTimeout(arguments.callee, 10, aInfo);
		}

		var doneCorrectly = TSM.restoreAllTabs(loadData);
		var b = TSM.service.browser;
		if (
			(
				!aInfo.shouldRestoreBackup &&
				(
					TSM.tabHistoryQuitRoot.length < 2 ||
					aInfo.forceToRestore
				) &&
				!TSM.tabHistory.length
			) ||
			(
				TSM.service.getPref('browser.tabs.extensions.last_tab_closing') == 3 &&
				b.mTabs.length == 1 &&
				b.selectedTab.isReallyBlank
			)
			)
			TSM.service.browser.removeTabInternal(b.selectedTab, { preventUndo : true });

		delete aInfo;
	},
	
	checkShouldRestoreBackup : function() 
	{
		var shouldRestoreBackup = (this.tabsBackupRoot.length > this.service.browserWindows.length);
		if (shouldRestoreBackup) {
			shouldRestoreBackup = this.shouldBackupTabs;
			var check = { value: this.service.getPref('browser.tabs.extensions.backup_tabs_confirm_hidden') };
			if (!check.value) {
				shouldRestoreBackup = this.service.PromptService.confirmEx(
						window,
						this.strbundle.GetStringFromName('message_restore_tabs_title'),
						this.strbundle.GetStringFromName('message_restore_tabs_text'),
						(
							(this.service.PromptService.BUTTON_TITLE_YES * this.service.PromptService.BUTTON_POS_0) +
							(this.service.PromptService.BUTTON_TITLE_NO * this.service.PromptService.BUTTON_POS_1)
						),
						null, null, null,
						this.service.strbundle.GetStringFromName('message_never_show_dialog'),
						check
					) == 0;

				// save pressed button
				if (check.value) {
					this.service.setPref('browser.tabs.extensions.backup_tabs_confirm_hidden', check.value);
					this.service.setPref('browser.tabs.extensions.backup_tabs', shouldRestoreBackup);
				}
			}

			if (!shouldRestoreBackup) { // clear stored data
				var history = this.tabsBackupRoot;

				var res,
					id,
					entries = [];
				for (var i = 0; i < history.length; i++)
				{
					id = history.item(i).Value.match(/TabsBackup:window-\d+/)[0];

					if (id == this.tabsBackup.id) continue;

					entries[i] = new pRDFDataR(id, this.tabsBackupDataSource, 'seq', 'http://white.sakura.ne.jp/~piro/rdf#', 'chrome://tabextensions/content/tabextensions.rdf#', null, true);
				}

				if (entries.length)
					window.setTimeout(
						function(aEntries)
						{
							for (var i in aEntries) {
								aEntries[i].clearData();
								TabbrowserService.tabsBackupRoot.removeData(aEntries[i].containerNode);
							}
						},
						0,
						entries
					);
			}
		}

		return shouldRestoreBackup;
	},
   
	onBeforeDestruct : function() 
	{
		var i;

		if (this.shouldBackupTabs) {
			for (i = this.tabsBackup.length-1; i > -1; i--)
				this.removeSHEntriesFrom(this.tabsBackup.item(i), this.tabsBackup);
			this.tabsBackup.clearData();
			this.tabsBackupRoot.removeData(this.tabsBackup.containerNode);
		}

		var nav = this.service.browserWindows;
		if (
			(
				(!nav.length && this.service.isBrowserWindow) ||
				(nav.length == 1 && nav[0] == window)
			) &&
			this.service.getPref('browser.tabs.extensions.startup_action_overlay') == 0 &&
			(
				!this.service.startWithOpenURLRequest ||
				this.service.getPref('browser.tabs.extensions.startup_action_overlay.one_time') ||
				!this.service.getPref('browser.tabs.extensions.startup_action_overlay.ignore_OpenURL_requests') ||
				this.service.browser.mTabs.length > 1 ||
				this.service.browser.mRemovedTabInfoList.length > 1 ||
				(
					this.service.browser.mTabs.length == 1 &&
					this.service.browser.mRemovedTabInfoList.length == 1 &&
					!this.service.browser.selectedTab.isReallyBlank
				)
			)
			) {
			this.saveAllTabs(this.tabHistory);
		}

		if (this.service.isBrowserWindow) {
			if (this.service.onQuit) {
				if (this.service.getPref('browser.tabs.extensions.startup_action_overlay') == 0)
					this.saveAllTabs(this.tabHistoryQuit);
			}
			else {
				for (i = this.tabHistoryQuit.length-1; i > -1; i--)
					this.removeSHEntriesFrom(this.tabHistoryQuit.item(i), this.tabHistoryQuit);
				this.tabHistoryQuit.clearData();
				this.tabHistoryQuitRoot.removeData(this.tabHistoryQuit.containerNode);
			}
		}

		var b = this.service.browser;
		if (this.service.isBrowserWindow && b) {
			this.service.removePrefListener(gTSMTabHistoryQuitPrefListener);
			this.service.removePrefListener(gTSMTabsBackupPrefListener);

			b.removeEventListener('XULTabbrowserTabLoad', this.onXULTabbrowserTabLoad, false);
			b.removeEventListener('XULTabbrowserTabAdded', this.onXULTabbrowserTabAdded, false);
			b.removeEventListener('XULTabbrowserTabRemoved', this.onXULTabbrowserTabRemoved, false);
			b.removeEventListener('XULTabbrowserTabMoved', this.onXULTabbrowserTabMoved, false);
//			b.removeEventListener('XULTabbrowserTabGroupModified', this.onXULTabbrowserTabGroupModified, false);

			try {
				this.service.ObserverService.removeObserver(gTSStoredTabSetsListener, 'tabextensions:storedTabSetsModified', false);
			}
			catch(e) {
			}
			window.removeEventListener('XULTabbrowserUndoCacheAdded', this.onXULTabbrowserUndoCacheModified, true);
			window.removeEventListener('XULTabbrowserUndoCacheRemoved', this.onXULTabbrowserUndoCacheModified, true);
		}

		if (b &&
			this.service.getPref('browser.tabs.extensions.undo_cache.global')) {
			if (b.mTabs) { // if the browser has no 'mTabs' property, shutdown process wrongly stops on this point.
				for (i = 0; i < b.mTabs.length; i++)
					if (!b.mTabs[i].isReallyBlank)
						this.updateGlobalUndoCache(b.getTabInfo(b.mTabs[i]), true);
			}
		}

		if (this.service.isBrowserWindow) {
			this.service.removePrefListener(gTSMTabHistoryQuitPrefListener);
			this.service.removePrefListener(gTSMTabsBackupPrefListener);

			try {
				this.service.ObserverService.removeObserver(gTSMStoredTabSetsListener, 'tabextensions:storedTabSetsModified', false);
			}
			catch(e) {
			}
			window.removeEventListener('XULTabbrowserUndoCacheAdded', this.onXULTabbrowserUndoCacheModified, true);
			window.removeEventListener('XULTabbrowserUndoCacheRemoved', this.onXULTabbrowserUndoCacheModified, true);
		}

		window.gTSGlobalUndoRemoveTabCache = null;
		window.gTSGlobalUndoRemoveTabCacheDatabase = null;
	},
 
	onXULTabbrowserTabLoad : function(aEvent) 
	{
		if (TabbrowserSessionManager.shouldBackupTabs)
			TabbrowserSessionManager.saveTabAt(aEvent.target.getTabByTabId(aEvent.tabId).tabIndex, TabbrowserSessionManager.tabsBackup);
	},
 
	onXULTabbrowserTabAdded : function(aEvent) 
	{
		if (TabbrowserSessionManager.shouldBackupTabs)
			TabbrowserSessionManager.saveTabAt(aEvent.target.getTabByTabId(aEvent.tabId).tabIndex, TabbrowserSessionManager.tabsBackup);
	},
 
	onXULTabbrowserTabGroupModified : function(aEvent) 
	{
		if (TabbrowserSessionManager.shouldBackupTabs)
			TabbrowserSessionManager.saveTabAt(aEvent.target.getTabByTabId(aEvent.tabId).tabIndex, TabbrowserSessionManager.tabsBackup);
	},
 
	onXULTabbrowserTabRemoved : function(aEvent) 
	{
		// remove the entry from the history
		if (TabbrowserSessionManager.shouldBackupTabs) {
			var res = TabbrowserSessionManager.tabsBackup.getResource(aEvent.tabId);
			TabbrowserSessionManager.removeSHEntriesFrom(res, TabbrowserSessionManager.tabsBackup);
			TabbrowserSessionManager.tabsBackup.removeData(res);
		}
	},
 
	onXULTabbrowserTabMoved : function(aEvent) 
	{
		// move the entry for the tab
		if (TabbrowserSessionManager.shouldBackupTabs)
			TabbrowserSessionManager.tabsBackup.moveElementTo(aEvent.tabId, aEvent.target.getTabByTabId(aEvent.tabId).tabIndex);
	},
 
	// edit the global "undo close tab" cache when the cache in this window has been modified 
	onXULTabbrowserUndoCacheModified : function(aEvent, aInfo)
	{
		if (aEvent.cachedTabInfo || aEvent.removedCachedTabInfo)
			TabbrowserSessionManager.updateGlobalUndoCache(aEvent.cachedTabInfo || aEvent.removedCachedTabInfo, aEvent.type == 'XULTabbrowserUndoCacheAdded');
	},
	
	updateGlobalUndoCache : function(aInfo, aAdding) 
	{
		if (gTSGlobalUndoRemoveTabCacheDatabase.length > gTSGlobalUndoRemoveTabCache.length)
			this.initGlobalUndoCache();

		var i;
		var c  = gTSGlobalUndoRemoveTabCache;
		var db = this.service.getPref('browser.tabs.extensions.undo_cache.backup.enabled') ? gTSGlobalUndoRemoveTabCacheDatabase : null ;
		if (aAdding) {
			c.push(aInfo);
			if (db) this.saveTabInfoTo(aInfo, db.getResource(aInfo.id), db);

			var global_max = Math.max(this.service.getPref('browser.tabs.extensions.undo_cache.global'), 0);

			if (c.length <= global_max) return;

			c.splice(0, c.length-global_max);
			if (db)
				while (db.length > global_max)
					db.removeData(db.item(db.length-1));
		}
		else {
			for (i in c)
				if (c[i] && c[i].id == aInfo.id) {
					c.splice(i, 1);
					if (db) db.removeData(db.item(i));
					break;
				}
		}
	},
 
	initGlobalUndoCache : function() 
	{
		if (!this.service.getPref('browser.tabs.extensions.undo_cache.backup.enabled') ||
			gTSGlobalUndoRemoveTabCache.length)
			return;

		gTSGlobalUndoRemoveTabCacheDatabase.reset();
		for (var i = 0; i < gTSGlobalUndoRemoveTabCacheDatabase.length; i++) {
			gTSGlobalUndoRemoveTabCache[i] = this.loadTabInfoFrom(gTSGlobalUndoRemoveTabCacheDatabase.item(i), gTSGlobalUndoRemoveTabCacheDatabase, {});
		}
	},
   
// タブの保存と復元 
	
	saveTabInfoTo : function(aInfo, aRes, aDatabase) 
	{
		// update tabgroup aInfo
		aDatabase.setData(aRes, 'parentTab', aInfo.parentTab);

		aDatabase.setData(aRes,
			'tabId',              aInfo.id,

			'label',              aInfo.label,
			'uri',                aInfo.uri,
			'favIcon',            aInfo.favIcon,
			'selected',           aInfo.selected,
			'HistoryIndex',       aInfo.SHIndex,

			'locked',             aInfo.locked,
			'referrerBlocked',    aInfo.referrerBlocked,
			'autoreloadInterval', String(aInfo.autoreloadInterval),
			'autoreloadPostType', aInfo.autoreloadPostType,
			'autoreloadPostData', this.service.escape(aInfo.autoreloadPostData || ''),

			'allowPlugins',       aInfo.allowPlugins,
			'allowJavascript',    aInfo.allowJavascript,
			'allowMetaRedirects', aInfo.allowMetaRedirects,
			'allowSubframes',     aInfo.allowSubframes,
			'allowImages',        aInfo.allowImages,

			'fixedLabel',         aInfo.fixedLabel,
			'textZoom',           aInfo.textZoom,

			'bookmarkID',         aInfo.bookmarkID
		);

		if (this.saveTabInfoExtra.length)
			for (var i = 0; i < this.saveTabInfoExtra.length; i++)
				this.saveTabInfoExtra[i](aDatabase, aRes, aInfo);

		this.saveSHEntriesFor(aInfo.SHEntries, aRes, aDatabase);

		// failsafe... sometimes trash entries are saved (they have only "parentTab" value)
		if (!aDatabase.getData(aRes, 'tabId')) {
			try {
				aDatabase.removeData(aRes);
			}
			catch(e) {
				aDatabase.removeResource(aRes);
			}
		}

		aDatabase.flush();
	},
	saveTabInfoExtra : [],
	
	saveSHEntriesFor : function(aEntries, aParentResource, aDatabase) 
	{
try {
		if (!aDatabase) return;

		var i, j,
			entry,
			old,
			data,
			entryResource,
			cacheKey;

		for (i = 0; i < aEntries.length; i++)
		{
			entry = aEntries[i];
			if (!entry) continue;

			entryResource = this.service.RDF.GetResource(aParentResource.Value+':'+i);
			old = aDatabase.dsource.GetTarget(entryResource, this.kRDF_ID, true);
			if (old) {
				old = old.QueryInterface(this.service.knsIRDFLiteral);
				if (old.Value == entry.id)
					continue;
				else // remove old entry
					this.removeSHEntriesFrom(entryResource, aDatabase);
			}

			data  = {
				URI             : entry.uri,
				title           : entry.title,
				isSubFrame      : entry.isSubFrame,
				saveLayoutState : entry.saveLayoutState,
				loadType        : entry.loadType,
				x               : entry.x,
				y               : entry.y
			};
			if (entry.cacheKey) {
				data.cacheKey        = entry.cacheKey;
				data.postContentType = entry.postContentType;
				data.postContent     = escape(this.service.WalletService ? this.service.WalletService.WALLET_Encrypt(entry.postContent) : entry.postContent );
			}
			else {
				data.cacheKey        = 0;
				data.postContentType = '';
				data.postContent     = '';
			}
			for (j in data)
			{
				old = aDatabase.dsource.GetTarget(entryResource, this['kRDF_'+j], true);
				if (old) {
					old = old.QueryInterface(this.service.knsIRDFLiteral);
					aDatabase.dsource.Change(
						entryResource,
						this['kRDF_'+j],
						old,
						this.service.RDF.GetLiteral(data[j]),
						true
					);
				}
				else
					aDatabase.dsource.Assert(
						entryResource,
						this['kRDF_'+j],
						this.service.RDF.GetLiteral(data[j]),
						true
					);
			}

			if (!aDatabase.dsource.HasAssertion(aParentResource, this.kRDF_HistoryEntry, entryResource, true))
				aDatabase.dsource.Assert(aParentResource, this.kRDF_HistoryEntry, entryResource, true);

			this.saveSHEntriesFor(aEntries[i].children, entryResource, aDatabase);
		}

		// remove old entries after the last entry
		var entries = aDatabase.dsource.GetTargets(aParentResource, this.kRDF_HistoryEntry, true);
		for (i = 0; entries.hasMoreElements(); i++)
		{
			entryResource = entries.getNext().QueryInterface(this.service.knsIRDFResource);
			if (i < aEntries.length) continue;

			this.removeSHEntriesFrom(entryResource, aDatabase);
			aDatabase.dsource.Unassert(aParentResource, this.kRDF_HistoryEntry, entryResource, true);
		}
}
catch(e) {
	if (this.service.debug)
		alert('@TabbrowserSessionManager.saveSHEntriesFor()\n'+e);
}
	},
 
	removeSHEntriesFrom : function(aParentResource, aDatabase) 
	{
try {
		if (!aParentResource || !aDatabase) return;

		var children = aDatabase.dsource.GetTargets(aParentResource, this.kRDF_HistoryEntry, true);
		var child, names, name, value;
		while (children.hasMoreElements())
		{
			child = children.getNext().QueryInterface(this.service.knsIRDFResource);

			aDatabase.dsource.Unassert(aParentResource, this.kRDF_HistoryEntry, child);

			this.removeSHEntriesFrom(child, aDatabase);

			names = aDatabase.dsource.ArcLabelsOut(child);
			while (names.hasMoreElements())
			{
				try {
					name = names.getNext().QueryInterface(this.service.knsIRDFResource);
					value = aDatabase.dsource.GetTarget(child, name, true);
					aDatabase.dsource.Unassert(child, name, value);
				}
				catch(ex) {
					dump(ex+'\n');
				}
			}
		}
}
catch(e) {
	if (this.service.debug)
		alert('@TabbrowserSessionManager.removeSHEntriesFrom()\n'+e);
}
	},
  
	loadTabInfoFrom : function(aRes, aDatabase, aError) 
	{
		var info = {
			id                 : aDatabase.getData(aRes, 'tabId'),

			label              : aDatabase.getData(aRes, 'label'),
			uri                : aDatabase.getData(aRes, 'uri'),
			favIcon            : (aDatabase.getData(aRes, 'favIcon') || ''),
			selected           : (aDatabase.getData(aRes, 'selected') == 'true'),
			SHEntries          : this.getSHEntriesFrom(aRes, aDatabase, aError),
			SHIndex            : Number(aDatabase.getData(aRes, 'HistoryIndex')),

			parentTab          : (aDatabase.getData(aRes, 'parentTab') || null),
			childTabs          : [],

			locked             : (aDatabase.getData(aRes, 'locked') == 'true'),
			referrerBlocked    : (aDatabase.getData(aRes, 'referrerBlocked') == 'true'),
			autoreloadInterval : Number(aDatabase.getData(aRes, 'autoreloadInterval')),
			autoreloadPostType : aDatabase.getData(aRes, 'autoreloadPostType'),
			autoreloadPostData : this.service.unescape(aDatabase.getData(aRes, 'autoreloadPostData') || ''),

			allowPlugins       : (aDatabase.getData(aRes, 'allowPlugins') == 'true'),
			allowJavascript    : (aDatabase.getData(aRes, 'allowJavascript') == 'true'),
			allowMetaRedirects : (aDatabase.getData(aRes, 'allowMetaRedirects') == 'true'),
			allowSubframes     : (aDatabase.getData(aRes, 'allowSubframes') == 'true'),
			allowImages        : (aDatabase.getData(aRes, 'allowImages') == 'true'),

			fixedLabel         : aDatabase.getData(aRes, 'fixedLabel'),
			textZoom           : Number(aDatabase.getData(aRes, 'textZoom')),

			bookmarkID         : aDatabase.getData(aRes, 'bookmarkID'),

			restored           : true // this tabinfo is restored from a database
		};

		if (this.loadTabInfoExtra.length)
			for (var i = 0; i < this.loadTabInfoExtra.length; i++)
				this.loadTabInfoExtra[i](aDatabase, aRes, info);

		if (info.parentTab &&
			info.parentTab in this.loadTabInfoIdTable)
			info.parentTab = this.loadTabInfoIdTable[info.parentTab];

		return info;
	},
	loadTabInfoExtra : [],
	loadTabInfoIdTable : [],
	
	getSHEntriesFrom : function(aParentResource, aDatabase, aError) 
	{
try {
		var entries = [],
			entry;

		if (!aDatabase || !aParentResource) return entries;

		var children = aDatabase.dsource.GetTargets(aParentResource, this.kRDF_HistoryEntry, true);
		var child,
			cacheKey,
			postContent;
		while (children.hasMoreElements())
		{
			child = children.getNext().QueryInterface(this.service.knsIRDFResource);
			entries[entries.length] = {
				uri             : this.getLiteral(aDatabase, child, this.kRDF_URI),
				title           : this.getLiteral(aDatabase, child, this.kRDF_title),
				isSubFrame      : (this.getLiteral(aDatabase, child, this.kRDF_isSubFrame) == 'true'),
				saveLayoutState : (this.getLiteral(aDatabase, child, this.kRDF_saveLayoutState) == 'true'),
				loadType        : parseInt(this.getLiteral(aDatabase, child, this.kRDF_loadType)),
				x               : parseInt(this.getLiteral(aDatabase, child, this.kRDF_x)),
				y               : parseInt(this.getLiteral(aDatabase, child, this.kRDF_y)),
				children        : this.getSHEntriesFrom(child, aDatabase, aError)
			};

			if (!entries[entries.length-1].uri) {
				entries[entries.length-1].uri = 'about:blank';
				if (aError) aError.value = true;
			}

			cacheKey    = parseInt(this.getLiteral(aDatabase, child, this.kRDF_cacheKey));
			postContent = escape(this.service.WalletService ? this.service.WalletService.WALLET_Encrypt(this.getLiteral(aDatabase, child, this.kRDF_postContent)) : this.getLiteral(aDatabase, child, this.kRDF_postContent) );
			try {
				if (postContent)
					postContent = this.service.WalletService ? this.service.unescapeString(this.service.WalletService.WALLET_Decrypt(postContent)) : this.service.unescapeString(postContent) ;
			}
			catch(e) {
			}
			if (cacheKey && postContent) {
				entries[entries.length-1].cacheKey        = cacheKey;
				entries[entries.length-1].postContentType = this.getLiteral(aDatabase, child, this.kRDF_postContentType);
				entries[entries.length-1].postContent     = postContent;
			}
			else {
				entries[entries.length-1].cacheKey        = 0;
				entries[entries.length-1].postContentType = '';
				entries[entries.length-1].postContent     = '';
			}
		}
}
catch(e) {
	if (this.service.debug)
		alert('@TabbrowserSessionManager.getSHEntriesFrom()\n'+e);
}
		return entries;
	},
	
	getLiteral : function(aDatabase, aResource, aName) { 
		try {
			return aDatabase.dsource.GetTarget(aResource, aName, true).QueryInterface(this.service.knsIRDFLiteral).Value;
		}
		catch(e) {
		}
		return '';
	},
   
	// 全てのタブの内容を保存 
	saveAllTabs : function(aDatabase)
	{
try {
		if (!this.service.browser || !aDatabase) return;

		var i;

		// 最後に保存されたヒストリを削除
		// Remove old data.
		for (i = aDatabase.length-1; i > -1; i--)
			this.removeSHEntriesFrom(aDatabase.item(i), aDatabase);
		aDatabase.clearData();

		var t = this.service.browser.mTabs;
		if (!t || t.length < 1) return;

		for (i = 0; i < t.length; i++)
			this.saveTabAt(i, aDatabase);
}
catch(e) {
	if (this.service.debug)
		alert('@TabbrowserSessionManager.saveAllTabs()\n'+e);
}
	},
	
	// n番目のタブの内容を保存 
	saveTabAt : function(aIndex, aDatabase)
	{
try {
		if (!aDatabase) return;

		var t = this.service.browser.mTabs[aIndex];
		if (
			!t ||
			(
				t.isReallyBlank &&
				!this.service.getPref('browser.tabs.extensions.session.save_blank_tab')
			)
			)
			return;

		var id = t.tabId;
		var res = aDatabase.item(aIndex);
		if (!res) res = aDatabase.getResource(id);

		var info = this.service.browser.getTabInfo(t);
		this.saveTabInfoTo(info, res, aDatabase);
if (this.service.debug) dump('=>['+aIndex+'] '+info.uri.substr(0, 25)+' SAVED.\n');
}
catch(e) {
	if (this.service.debug)
		alert('@TabbrowserSessionManager.saveTabAt()\n'+e);
}
	},
  
	// 全てのタブの内容を再現 
	restoreAllTabs : function(aDatabase, aShouldNotAlert)
	{
		var doneCorrectly = true;
try {
		if (!this.service.browser) return doneCorrectly;

		if (!aDatabase || !aDatabase.length) return doneCorrectly;

		var i,
			res,
			id,
			entries = [];

		if (aDatabase == this.tabsBackupRoot) {
			for (i = 0; i < aDatabase.length; i++)
			{
				id = aDatabase.item(i).Value.match(/TabsBackup:window-\d+/)[0];

				if (id == this.tabsBackup.id) continue;

				entries[i] = new pRDFDataR(id, this.tabsBackupDataSource.URI, 'seq', 'http://white.sakura.ne.jp/~piro/rdf#', 'chrome://tabextensions/content/tabextensions.rdf#', null, true);
			}

			if (entries.length)
				window.setTimeout(this.restoreAllTabsFromRoot, 0, this.tabsBackupRoot, entries);
		}
		else if (aDatabase == this.tabHistoryQuitRoot) {
			for (i = 0; i < aDatabase.length; i++)
			{
				id = aDatabase.item(i).Value.match(/TabsHistoryQuit:window-\d+/)[0];

				if (id == this.tabHistoryQuit.id) continue;

				entries[i] = new pRDFDataR(id, this.tabHistoryDataSource.URI, 'seq', 'http://white.sakura.ne.jp/~piro/rdf#', 'chrome://tabextensions/content/tabextensions.rdf#', null, true);
			}

			if (entries.length)
				window.setTimeout(this.restoreAllTabsFromRoot, 0, this.tabHistoryQuitRoot, entries);
		}
		else {
			var b = this.service.browser,
				t = b.selectedTab;

			b.removeAllTabsButInternal(t); // close other tabs

//			window.setTimeout(function(aManager, aDatabase, aTab) { aManager.restoreAllTabsFrom(aDatabase, aTab); }, 0, this, aDatabase, t);
			if (!this.restoreAllTabsFrom(aDatabase, t)) doneCorrectly = false;
		}
}
catch(e) {
		doneCorrectly = false;
	if (this.service.debug)
		alert('@TabbrowserSessionManager.restoreAllTabs()\n'+e);
}

		// broken data
		if (
			!aShouldNotAlert &&
			!doneCorrectly &&
			this.confirmToClearData() == 0
			) {
			this.clearDatabase(aDatabase);
		}

		return doneCorrectly;
	},
	
	// ウィンドウごとのヒストリを初期化した後、それぞれを一つのウィンドウで開く 
	restoreAllTabsFromRoot : function(aRoot, aEntries)
	{
		var doneCorrectly = true;
try {
		var b = TabbrowserService.browser,
			t = b.selectedTab,
			i, j;

		var doneFirst = false;
		for (i in aEntries) {
			if (!doneFirst) {
				b.removeAllTabsButInternal(t); // close other tabs
				doneFirst = true;
			}

			if (!TabbrowserSessionManager.restoreAllTabsFrom(aEntries[i], i == 0 ? t : null ))
				doneCorrectly = false;

			for (j = aEntries[i].length-1; j > -1; j--)
				TabbrowserSessionManager.removeSHEntriesFrom(aEntries[i].item(j), aEntries[i]);
			aEntries[i].clearData();
			aRoot.removeData(aEntries[i].containerNode);
		}
}
catch(e) {
		doneCorrectly = false;
	if (TabbrowserService.debug)
		alert('@TabbrowserSessionManager.restoreAllTabsFromRoot()\n'+e);
}

		// broken data
		if (
			!doneCorrectly &&
			this.confirmToClearData() == 0
			) {
			this.clearDatabase(aDatabase);
		}
	},
 
	// ヒストリからタブを再現する 
	restoreAllTabsFrom : function(aDatabase, aRemoveTab)
	{
		var doneCorrectly = true;
		var errorOut = { value : false };
try {
		if (!aDatabase || !aDatabase.length) return doneCorrectly;

		var b = this.service.browser,
			lastTab,
			res,
			info,
			shouldReload = this.service.getPref('browser.tabs.extensions.reload_restored_session');

		b.setAttribute('tab-animation-disabled', true);
		for (var i = 0; i < aDatabase.length; i++)
		{
try {
			res = aDatabase.item(i);
			info = this.loadTabInfoFrom(res, aDatabase, errorOut);
			info.index = i;

			lastTab = b.addTabWithTabInfo(info);
			if (!lastTab) continue;

			this.loadTabInfoIdTable[info.id] = lastTab.tabId;

			if (info.selected) {
				b.selectedTab = lastTab;
				b.scrollTabbarTo(b.selectedTab);
			}

			if (aRemoveTab) {
				try {
					this.service.browser.removeTabInternal(aRemoveTab, { preventUndo : true });
					delete aTab;
				}
				catch(e) {
					// do nothing it the tab has been removed.
				}
				aRemoveTab = false;
			}

			if (shouldReload)
				window.setTimeout(
					function(aBrowser)
					{
						try {
							aBrowser.reload();
						}
						catch(e) {
						}
					},
					0,
					lastTab.mBrowser
				);

if (this.service.debug) dump('<=['+i+'] '+info.uri.substr(0, 25)+' RESTORED.\n');
}
catch(e) {
		doneCorrectly = false;
	if (this.service.debug)
		alert('@TabbrowserSessionManager.restoreAllTabsFrom()\n'+res.Value+'\n\n'+e);
}
		}
}
catch(ex) {
		doneCorrectly = false;
	if (this.service.debug)
		alert('@TabbrowserSessionManager.restoreAllTabsFrom()\n'+ex);
}

		if (this.service.getPref('browser.tabs.extensions.group.tree.simple_operation'))
			window.setTimeout(this.collapseExpandWithDelay, 0, b.selectedTab);
		else
			b.removeAttribute('tab-animation-disabled');

		if (errorOut.value) doneCorrectly = false;

		return doneCorrectly;
	},
	collapseExpandWithDelay : function(aTab)
	{
		aTab.collapseOtherSubgroups(true);
		aTab.mTabBrowser.removeAttribute('tab-animation-disabled');
	},
   
	// タブセッションホルダーの処理 
	initStoredTabSets : function()
	{
		// init data
		this.storedTabSets = [];
		var root = this.storedTabSetsRoot,
			id;

		if (!root.length) return;

		for (var i = 0; i < root.length; i++)
		{
			id = root.item(i).Value.match(/StoredTabSets:tabset-\d+/)[0];

			if (!id) continue;

			this.storedTabSets[id] = new pRDFDataR(id, this.storedTabSetsDataSource.URI, 'seq', 'http://white.sakura.ne.jp/~piro/rdf#', 'chrome://tabextensions/content/tabextensions.rdf#', null, false);
		}
	},
	
	loadStoredTabSet : function(aID) 
	{
		if (!aID) return;

		var b = this.service.browser;
		if ('replaceGroup' in b) {
			var removedTabsInfo = [];
			for (var i = 0; i < b.mTabs.length; i++)
				removedTabsInfo.push(b.getTabInfo(b.mTabs[i]));

			b.backBrowserGroup    = removedTabsInfo;
			b.forwardBrowserGroup = [];
		}

		var res;
		if (
			!this.restoreAllTabs(this.storedTabSets[aID], true) &&
			this.storedTabSetsRoot.getData(this.storedTabSets[aID].containerNode, 'brokenButNeverAlert') != 'true' &&
			(res = this.confirmToClearData(true)) == 0
			) {
			this.removeStoredTabSet(aID);
		}
		if (res == 2)
			this.storedTabSetsRoot.setData(this.storedTabSets[aID].containerNode, 'brokenButNeverAlert', 'true');
	},
 
 	renameStoredTabSet : function(aID, aEvent) 
	{
		if (!aID) return;

		var old = this.storedTabSetsRoot.getData(this.storedTabSets[aID].containerNode, 'Label');

		if (aEvent && aEvent.type == 'click' && aEvent.button == 1) {
			var node = aEvent.target.parentNode;
			while (node.localName == 'menupopup' ||
					node.localName == 'popup')
			{
				node.hidePopup();
				node = node.parentNode.parentNode;
			}
		}

		var label = { value : old };
		if (!this.service.PromptService.prompt(
				window,
				this.strbundle.GetStringFromName('tabSetsHolder_rename_title'),
				this.strbundle.GetStringFromName('tabSetsHolder_rename_text'),
				label,
				null,
				{}
			))
			return;

		if (label.value && label.value != old)
			this.storedTabSetsRoot.setData(this.storedTabSets[aID].containerNode, 'Label', label.value);
	},
 
	saveTabSession : function(aShouldShowAlert) 
	{
		var id = 'StoredTabSets:tabset-'+Math.floor(Math.random() * 100000);
		this.storedTabSets[id] = new pRDFDataR(id, this.storedTabSetsDataSource.URI, 'seq', 'http://white.sakura.ne.jp/~piro/rdf#', 'chrome://tabextensions/content/tabextensions.rdf#', null, false);

		var d     = new Date();
		var label = this.strbundle.GetStringFromName('tabSetsHolder_label_for_new_session')
					.replace(/%date%/gi, [d.getFullYear(), '/', d.getMonth()+1, '/', d.getDate()].join(''))
					.replace(/%time%/gi, [d.getHours(), ':', d.getMinutes(), ':', d.getSeconds()].join(''))
					.replace(/%num%/gi, this.service.browser.mTabs.length)
					.replace(/%current%/gi, this.service.browser.selectedTab.label);

		window.setTimeout(this.saveTabSessionCallBack, 0, id, label, aShouldShowAlert);

		return label;
	},
	
	saveTabSessionCallBack : function(aID, aLabel, aShouldShowAlert) 
	{
		var TSM = TabbrowserSessionManager;
		TSM.saveAllTabs(TSM.storedTabSets[aID]);

		// failsafe
		if (!TSM.storedTabSetsRoot.length) {
			TSM.storedTabSetsRoot.removeResource(TSM.storedTabSetsRoot.containerNode);
			TSM.storedTabSetsRoot.makeContainer();
			TSM.storedTabSetsRoot.reset();
		}

		TSM.storedTabSetsRoot.setData(TSM.storedTabSets[aID].containerNode, 'Label', aLabel);
		TSM.storedTabSetsRoot.setData(TSM.storedTabSets[aID].containerNode, 'favIcon',
			gBrowser.selectedTab.getAttribute('image') || '');

		TSM.service.ObserverService.notifyObservers(window, 'tabextensions:storedTabSetsModified', null);

		if (!aShouldShowAlert) return;

		TSM.service.PromptService.alert(
			window,
			TSM.strbundle.GetStringFromName('tabSetsHolder_save_alert_title'),
			TSM.strbundle.GetStringFromName('tabSetsHolder_save_alert_text').replace(/%s/i, aLabel)
		);
	},
  
	removeStoredTabSet : function(aID) 
	{
		if (!aID) return;

		for (var i = this.storedTabSets[aID].length-1; i > -1; i--)
			this.removeSHEntriesFrom(this.storedTabSets[aID].item(i), this.storedTabSets[aID]);
		this.storedTabSets[aID].clearData();
		this.storedTabSetsRoot.removeData(this.storedTabSets[aID].containerNode);
		delete this.storedTabSets[aID];

		this.service.ObserverService.notifyObservers(window, 'tabextensions:storedTabSetsModified', null);
	},
 
	removeAllStoredTabSet : function() 
	{

		if (!this.service.PromptService.confirm(
				window,
				this.strbundle.GetStringFromName('tabSetsHolder_deleteAll_confirm_title'),
				this.strbundle.GetStringFromName('tabSetsHolder_deleteAll_confirm_text')
			))
			return;

		for (var i in this.storedTabSets)
			this.removeStoredTabSet(this.storedTabSets[i].containerNode.QueryInterface(this.service.knsIRDFResource).Value.match(/StoredTabSets:tabset-\d+/)[0]);
	},
 
	initTabSetsMenu : function(aPopup) 
	{
		if (!aPopup) return;

		if (!this.storedTabSets.length || this.storedTabSets.length != this.storedTabSetsRoot.length)
			this.initStoredTabSets();

		var full   = aPopup.getElementsByAttribute('tabid', 'full')[0],
			sep    = aPopup.getElementsByAttribute('tabid', 'sep')[0],
			rename = aPopup.getElementsByAttribute('tabid', 'rename')[0],
			del    = aPopup.getElementsByAttribute('tabid', 'delete')[0],
			delAll = aPopup.getElementsByAttribute('tabid', 'deleteAll')[0];

		var range = document.createRange();

		range.selectNodeContents(aPopup);
		range.setEndBefore(full);
		range.deleteContents();

		range.selectNodeContents(full.firstChild);
		range.deleteContents();

		range.selectNodeContents(rename.firstChild);
		range.deleteContents();

		range.selectNodeContents(del.firstChild);
		range.deleteContents();

		range.detach();

		var item,
			count         = 0,
			tabSetsLength = this.storedTabSetsRoot.length;
		for (var i in this.storedTabSets)
		{
			item = document.createElement('menuitem');
			item.setAttribute('label', this.storedTabSetsRoot.getData(this.storedTabSets[i].containerNode, 'Label'));
			item.setAttribute('value', this.storedTabSets[i].containerNode.QueryInterface(this.service.knsIRDFResource).Value.match(/StoredTabSets:tabset-\d+/)[0]);
			item.setAttribute('crop', 'end');
			item.setAttribute('tooltiptext', item.getAttribute('label'));

			item.setAttribute('class', 'tabextensions-menu-iconic menuitem-iconic');
			item.setAttribute('image', this.storedTabSetsRoot.getData(this.storedTabSets[i].containerNode, 'favIcon'));

			if (count > tabSetsLength-11) {
				item.setAttribute('label', [tabSetsLength-count-1, item.getAttribute('label')].join(' : '));
				item.setAttribute('accesskey', tabSetsLength-count-1);
			}

			if (count) {
				full.firstChild.insertBefore(item, full.firstChild.firstChild);
				rename.firstChild.insertBefore(item.cloneNode(true), rename.firstChild.firstChild);
				del.firstChild.insertBefore(item.cloneNode(true), del.firstChild.firstChild);
			}
			else {
				full.firstChild.appendChild(item);
				rename.firstChild.appendChild(item.cloneNode(true));
				del.firstChild.appendChild(item.cloneNode(true));
			}

			if (count > tabSetsLength-11)
				item = aPopup.insertBefore(item.cloneNode(true), aPopup.firstChild);

			count++;
		}

		if (del.firstChild.hasChildNodes()) {
			sep.removeAttribute('hidden');
			rename.removeAttribute('disabled');
			del.removeAttribute('disabled');
			delAll.removeAttribute('disabled');
		}
		else {
			sep.setAttribute('hidden', true);
			rename.setAttribute('disabled', true);
			del.setAttribute('disabled', true);
			delAll.setAttribute('disabled', true);
		}

		if (full.firstChild.hasChildNodes() &&
			full.firstChild.childNodes.length > aPopup.childNodes.length-7)
			full.removeAttribute('hidden');
		else
			full.setAttribute('hidden', true);
	},
  
	// 閉じたタブの履歴 
	
	flushUndoCache : function() 
	{
		if (!this.service.PromptService.confirm(
				window,
				this.strbundle.GetStringFromName('flushUndoCache_confirm_title'),
				this.strbundle.GetStringFromName('flushUndoCache_confirm_text')
			))
			return;

		var targets = this.service.WindowManager.getEnumerator(null, true),
			target,
			i;
		while (targets.hasMoreElements())
		{
			target = targets.getNext().QueryInterface(Components.interfaces.nsIDOMWindowInternal);
			if ('gTSGlobalUndoRemoveTabCache' in target)
				target.gTSGlobalUndoRemoveTabCache = [];

			if (!('TabbrowserService' in window) ||
				!target.TabbrowserService) continue;

			b = target.TabbrowserService.browser;
			if (b) b.mRemovedTabInfoList = [];
		}

		for (i = gTSGlobalUndoRemoveTabCacheDatabase.length-1; i > -1; i--)
			this.removeSHEntriesFrom(gTSGlobalUndoRemoveTabCacheDatabase.item(i), gTSGlobalUndoRemoveTabCacheDatabase);
		gTSGlobalUndoRemoveTabCacheDatabase.clearData();
	},
 
	reopenTabById : function(aID, aEvent) 
	{
		if (!aID ||
			aEvent.type == 'click' && aEvent.button != 1) return;

		var info;
		for (var i in gTSGlobalUndoRemoveTabCache)
			if (gTSGlobalUndoRemoveTabCache[i].id == aID) {
				info = gTSGlobalUndoRemoveTabCache[i];
				window.gTSGlobalUndoRemoveTabCache.splice(i, 1);
				if (this.service.getPref('browser.tabs.extensions.undo_cache.backup.enabled'))
					gTSGlobalUndoRemoveTabCacheDatabase.removeData(gTSGlobalUndoRemoveTabCacheDatabase.item(i));

				break;
			}

		if (!info) return;


		if (!this.service.getPref('browser.tabs.extensions.undo.apply_original_index'))
			delete info.index;

		var t      = this.service.browser.selectedTab;
		var newTab = this.service.browser.addTabWithTabInfo(info);

		if (newTab && 'restored' in info && info.restored)
			this.loadTabInfoIdTable[info.id] = newTab.tabId;

		if (t.isReallyBlank) {
			this.service.browser.moveTabTo(newTab, t.tabIndex)
			this.service.browser.removeTab(t);
		}

		if (aEvent.type != 'click' || aEvent.button != 1) {
			this.service.browser.selectedTab = newTab;
			this.service.browser.scrollTabbarTo(newTab);
		}

		if (aEvent.type == 'click' && aEvent.button == 1) {
			var node = aEvent.target.parentNode;
			while (node.localName == 'menupopup' ||
					node.localName == 'popup')
			{
				node.hidePopup();
				node = node.parentNode.parentNode;
			}
		}
	},
 
	initClosedTabsHistoryMenu : function(aPopup) 
	{
		if (!aPopup) return;

		if (gTSGlobalUndoRemoveTabCacheDatabase.length > gTSGlobalUndoRemoveTabCache.length)
			this.initGlobalUndoCache();

		var i,
			blank  = aPopup.getElementsByAttribute('tabid', 'blank')[0],
			full   = aPopup.getElementsByAttribute('tabid', 'full')[0],
			flush  = aPopup.getElementsByAttribute('tabid', 'flush-item')[0];

		var range = document.createRange();

		range.selectNodeContents(aPopup);
		range.setEndBefore(blank);
		range.deleteContents();

		range.selectNodeContents(full.firstChild);
		range.deleteContents();

		range.detach();

		var item,
			list = gTSGlobalUndoRemoveTabCache;
		for (i = list.length-1; i > -1; i--)
		{
			item = document.createElement('menuitem');
			item.setAttribute('label', list[i].label);
			item.setAttribute('value', list[i].id);
			item.setAttribute('crop',  'center');

			if (i > list.length-11) {
				item.setAttribute('label', [list.length-i-1, item.getAttribute('label')].join(' : '));
				item.setAttribute('accesskey', list.length-i-1);
			}

			item.setAttribute('class', 'tabextensions-menu-iconic menuitem-iconic');
			item.setAttribute('image', list[i].favIcon);

			full.firstChild.appendChild(item);

			if (i > list.length-11)
				item = aPopup.insertBefore(item.cloneNode(true), blank);
		}

		if (full.firstChild.hasChildNodes()) {
			blank.setAttribute('hidden', true);
			flush.removeAttribute('disabled');
		}
		else {
			blank.removeAttribute('hidden');
			flush.setAttribute('disabled', true);
		}

		if (full.firstChild.hasChildNodes() &&
			full.firstChild.childNodes.length > aPopup.childNodes.length-2)
			full.removeAttribute('hidden');
		else
			full.setAttribute('hidden', true);
	},
  
	confirmToClearData : function(aCanBeIgnored) 
	{
		return this.service.PromptService.confirmEx(
				window,
				this.strbundle.GetStringFromName('confirmToClearBrokenData_title'),
				this.strbundle.GetStringFromName('confirmToClearBrokenData_text'),
				(
					(this.service.PromptService.BUTTON_TITLE_IS_STRING * this.service.PromptService.BUTTON_POS_0) +
					(this.service.PromptService.BUTTON_TITLE_IS_STRING * this.service.PromptService.BUTTON_POS_1) +
					(aCanBeIgnored ? (this.service.PromptService.BUTTON_TITLE_IS_STRING * this.service.PromptService.BUTTON_POS_2) : 0 )
				),
				this.strbundle.GetStringFromName('confirmToClearBrokenData_clear'),
				this.strbundle.GetStringFromName('confirmToClearBrokenData_cancel'),
				(aCanBeIgnored ? this.strbundle.GetStringFromName('confirmToClearBrokenData_ignore') : null ),
				null,
				{}
			);
	},
	clearDatabase : function(aDatabase)
	{
		var i, j;
		if (aDatabase == this.tabsBackupRoot ||
			aDatabase == this.tabHistoryQuitRoot) {
			for (i = aDatabase.length-1; i > -1; i--)
			{
				for (j = aDatabase.item(i).length-1; j > -1; j--)
					this.removeSHEntriesFrom(aDatabase.item(i).item(j), aDatabase.item(i));
				aDatabase.item(i).clearData();
				aDatabase.removeData(aDatabase.item(i).containerNode);
			}
		}
		else {
			for (i = aDatabase.length-1; i > -1; i--)
				this.removeSHEntriesFrom(aDatabase.item(i), aDatabase);
			aDatabase.clearData();
		}
		aDatabase.removeResource(aDatabase.containerNode);
	}
 
}; 
 
// pref listeners 
	
var gTSMTabHistoryQuitPrefListener = 
{
	domain  : 'browser.tabs.extensions.startup_action_overlay',
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		var TSM = TabbrowserSessionManager;

		if (TSM.service.getPref(this.domain) == 0) {
			var nullPointer = TSM.tabHistoryQuit;
			window.setTimeout(
				function()
				{
					TSM.tabHistoryQuitRoot.push(TSM.tabHistoryQuit.containerNode);
					TSM.saveAllTabs(TSM.tabHistoryQuit);
					TSM.tabHistoryQuitInitialized = true;
				},
				0
			);
		}
		else if (TSM.tabHistoryQuitInitialized) {
			for (var i = TSM.tabHistoryQuit.length-1; i > -1; i--)
				TSM.removeSHEntriesFrom(TSM.tabHistoryQuit.item(i), TSM.tabHistoryQuit);
			TSM.tabHistoryQuit.clearData();
			TSM.tabHistoryQuitRoot.removeData(TSM.tabHistoryQuit.containerNode);
			TSM.tabHistoryQuit = null;
		}
	}
};

 
var gTSMTabsBackupPrefListener = 
{
	domain  : 'browser.tabs.extensions.backup_tabs',
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;

		var TSM = TabbrowserSessionManager;

		if (TSM.shouldBackupTabs) {
			var nullPointer = TSM.tabsBackup;
			window.setTimeout(
				function()
				{
					TSM.tabsBackupRoot.push(TSM.tabsBackup.containerNode);
					TSM.saveAllTabs(TSM.tabsBackup);
					TSM.tabsBackupInitialized = true;
				},
				0
			);
		}
		else if (TSM.tabsBackupInitialized) {
			for (var i = TSM.tabsBackup.length-1; i > -1; i--)
				TSM.removeSHEntriesFrom(TSM.tabsBackup.item(i), TSM.tabsBackup);
			TSM.tabsBackup.clearData();
			TSM.tabsBackupRoot.removeData(TSM.tabsBackup.containerNode);
			TSM.tabsBackup = null;
		}
	}
};
 
// observe modifying in other window 
var gTSMStoredTabSetsListener =
{
	observe : function(aSubject, aTopic, aData)
	{
		if (aTopic != 'tabextensions:storedTabSetsModified' ||
			aSubject == window) return;

		TabbrowserSessionManager.storedTabSetsRoot = null;
		var nullPointer = TabbrowserSessionManager.storedTabSetsRoot;
		window.setTimeout(
			function()
			{
				TabbrowserSessionManager.initStoredTabSets();
			},
			0
		);
	}
};
   
// end of definition 

if (!window.TabbrowserServiceModules)
	window.TabbrowserServiceModules = [];
if (TabbrowserSessionManager.enabled)
	TabbrowserServiceModules.push(TabbrowserSessionManager);
}
 