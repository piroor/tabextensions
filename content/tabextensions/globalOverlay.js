// start of definition 
if (!window.TabbrowserService) {
	
if (!('TabbrowserServiceModules' in window)) 
	window.TabbrowserServiceModules = [];
if (!('gTSWindowOpenerType' in window))
	var gTSWindowOpenerType = null;
if (!('gTSOpenTabTimer' in window))
	var gTSOpenTabTimer = null;
 
var TabbrowserService = { 
	
	// properties 
	
	debug : false, 

	activated : false,
	onQuit    : false,

	get initialized()
	{
		return this.activated;
	},

	prefs : [],

	startWithOpenURLRequest   : false,

	// 定数
	XULNS : 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
	XHTMLNS : 'http://www.w3.org/1999/xhtml',
	XLinkNS : 'http://www.w3.org/1999/xlink',
	knsIRDFResource    : Components.interfaces.nsIRDFResource,
	knsIRDFLiteral     : Components.interfaces.nsIRDFLiteral,
	knsISupportsString : ('nsISupportsWString' in Components.interfaces) ? Components.interfaces.nsISupportsWString : Components.interfaces.nsISupportsString,

	kBookmarksCommentSep : ':::::: tabextensions: Don\'t Edit after This Line ::::::',
	kBookmarksInfoSepStart : '<tabextensions>',
	kBookmarksInfoSepEnd   : '</tabextensions>',

	ZOOM_MAX : ('ZoomManager' in window ? ZoomManager.prototype.MAX : 2000 ),
	ZOOM_MIN : ('ZoomManager' in window ? ZoomManager.prototype.MIN : 1 ),
	
	get kNC_URL() 
	{
		if (!this._kNC_URL)
			this._kNC_URL = this.RDF.GetResource('http://home.netscape.com/NC-rdf#URL');
		return this._kNC_URL;
	},
	_kNC_URL : null,
 
	get kNC_Keyword() 
	{
		if (!this._kNC_Keyword)
			this._kNC_Keyword = this.RDF.GetResource('http://home.netscape.com/NC-rdf#ShortcutURL');
		return this._kNC_Keyword;
	},
	_kNC_Keyword : null,
 
	get kNC_NAME() 
	{
		if (!this._kNC_NAME)
			this._kNC_NAME = this.RDF.GetResource('http://home.netscape.com/NC-rdf#Name');
		return this._kNC_NAME;
	},
	_kNC_NAME : null,
 
	get kNC_DESC() 
	{
		if (!this._kNC_DESC)
			this._kNC_DESC = this.RDF.GetResource('http://home.netscape.com/NC-rdf#Description');
		return this._kNC_DESC;
	},
	_kNC_DESC : null,
 
	get kNC_WebPanel() 
	{
		if (!this._kNC_WebPanel)
			this._kNC_WebPanel = this.RDF.GetResource('http://home.netscape.com/NC-rdf#WebPanel');
		return this._kNC_WebPanel;
	},
	_kNC_WebPanel : null,
  
	get isNewTypeBrowser() 
	{
		return (this.browserURI.indexOf('chrome://browser/') > -1);
	},
 
	get isBrowserWindow() 
	{
		return Components.lookupMethod(window, 'top').call(window).location.href == this.browserURI;
	},
	
	get browserURI() 
	{
		if (!this._browserURI) {
			var uri = this.getPref('browser.chromeURL');
			if (!uri) {
				try {
					var handler = Components.classes['@mozilla.org/commandlinehandler/general-startup;1?type=browser'].getService(Components.interfaces.nsICmdLineHandler);
					uri = handler.chromeUrlForTask;
				}
				catch(e) {
				}
			}
			if (uri.charAt(uri.length-1) == '/')
				uri = uri.replace(/chrome:\/\/([^\/]+)\/content\//, 'chrome://$1/content/$1.xul');
			this._browserURI = uri;
		}
		return this._browserURI;
	},
	_browserURI : null,
  
	get browser() 
	{
		if (this._browser === void(0)) {
			this._browser = document.getElementById('content');
			if (this._browser && this._browser.localName != 'tabbrowser')
				this._browser = null;
		}
		var b = this.browsers;
		return this._browser ? this._browser : b.length ? b[0] : null ;
	},
	
	get browsers() 
	{
		return document.getElementsByTagNameNS(this.XULNS, 'tabbrowser');
	},
  
	get browserWindow() 
	{
		return this.WindowManager.getMostRecentWindow('navigator:browser');
	},
	
	get browserWindows() 
	{
		var browserWindows = [];

		var targets = this.WindowManager.getEnumerator('navigator:browser'),
			target;
		while (targets.hasMoreElements())
		{
			target = targets.getNext().QueryInterface(Components.interfaces.nsIDOMWindowInternal);
			browserWindows.push(target);
		}

//		return browserWindows;

		// rearrange with z-order
		var ordered = this.browserWindowsWithZOrder;
		var results = [];
		var i, j;
		for (i in ordered)
			for (j in browserWindows)
				if (ordered[i] == browserWindows[j]) {
					results.push(browserWindows[j]);
					browserWindows.splice(j, 1);
					break;
				}

		return results.concat(browserWindows); // result + rest windows (have not shown yet)
	},
 
	get browserWindowsWithZOrder() 
	{
		var browserWindows = [];

		var targets = this.WindowManager.getZOrderDOMWindowEnumerator('navigator:browser', true),
			target;
		while (targets.hasMoreElements())
		{
			target = targets.getNext().QueryInterface(Components.interfaces.nsIDOMWindowInternal);
			browserWindows.push(target);
		}

		return browserWindows;
	},
  
	get BookmarksDS() 
	{
		if (!this._BookmarksDS) {
			this._BookmarksDS = this.RDF.GetDataSource('rdf:bookmarks');
			try {
				this._BookmarksDS = this._BookmarksDS.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
				this._BookmarksDS = this._BookmarksDS.QueryInterface(Components.interfaces.nsIBookmarksService);
			}
			catch(e) {
				alert('@TabbrowserService.BookmarksDS\n'+e);
			}
		}
		return this._BookmarksDS;
	},
	_BookmarksDS : null,
	
	get BookmarksDatabase() 
	{
		if (!this._BookmarksDatabase) {
			this._BookmarksDatabase = Components.classes['@mozilla.org/rdf/datasource;1?name=composite-datasource'].createInstance(Components.interfaces.nsIRDFCompositeDataSource);

			this._BookmarksDatabase.AddDataSource(this.BookmarksDS);
			this._BookmarksDatabase.AddDataSource(this.RDF.GetDataSource('rdf:files'));
			this._BookmarksDatabase.AddDataSource(this.RDF.GetDataSource('rdf:localsearch'));
			this._BookmarksDatabase.AddDataSource(this.RDF.GetDataSource('rdf:internetsearch'));
		}
		return this._BookmarksDatabase;
	},
	_BookmarksDatabase : null,
  
	get datasource() 
	{
		if (!this._datasource)
			this._datasource = this.getDataSource('global.rdf');

		return this._datasource;
	},
	_datasource : null,
	
	get profileURL() 
	{
		if (!this._profileURL) {
			const DIR = Components.classes['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties);
			var dir = DIR.get('ProfD', Components.interfaces.nsILocalFile);

			var uri = this.getURLSpecFromFile(dir);
			if (uri.search(/\/$/) < 0) uri += '/';

			this._profileURL = uri;
		}
		return this._profileURL;
	},
	_profileURL : null,
 
	getDataSource : function(aFileName) 
	{
		var dataDir = this.getFileFromURL(this.profileURL+'tabextensions/');
		if (!dataDir.exists()) {
			dataDir.create(dataDir.DIRECTORY_TYPE, 0755);
		}

		uri = this.profileURL+'tabextensions/'+aFileName;

		// if the file doesn't exist, create it.
		var tempLocalFile = this.getFileFromURL(uri);

		if (!tempLocalFile.exists())
			tempLocalFile.create(tempLocalFile.NORMAL_FILE_TYPE, 0644);

		// create datasource object
		try {
			return this.RDF.GetDataSource(uri);
		}
		catch(e) {
			alert('@TabbrowserService.getDataSource()\nTabbrowser Extesions: Launching error');
		}
		return null;
	},
 
	get bookmarksData()	// only for backward compatibility 
	{
		if (!this._bookmarksData)
			this._bookmarksData = new pRDFDataR('Bookmarks', this.datasource.URI, 'bag', 'http://white.sakura.ne.jp/~piro/rdf#', 'chrome://tabextensions/content/tabextensions.rdf#', '%itemID%');

		if (this._bookmarksData.length != this._bookmarksData._resources.length)
			this._bookmarksData.reset();

		return this._bookmarksData;
	},
	_bookmarksData : null,
 
	get iconData() 
	{
		if (!this._iconData)
			this._iconData = new pRDFDataR('RelatedIcons', this.datasource.URI, 'bag', 'http://white.sakura.ne.jp/~piro/rdf#', 'chrome://tabextensions/content/tabextensions.rdf#');

		if (this._iconData.length != this._iconData._resources.length)
			this._iconData.reset();

		return this._iconData;
	},
	_iconData : null,
  
	get strbundle() 
	{
		if (!this._strbundle) {
			const STRBUNDLE = Components.classes['@mozilla.org/intl/stringbundle;1'].getService(Components.interfaces.nsIStringBundleService);
			this._strbundle = STRBUNDLE.createBundle('chrome://tabextensions/locale/tabextensions.properties');
		}
		return this._strbundle;
	},
	_strbundle : null,
 
	// preferences 
	
	get winHookMode() 
	{
		return this.getPref('browser.tabs.extensions.window_hook_mode');
	},
 
	get platformNativeBehavior() 
	{
		return this.getPref('browser.tabs.extensions.platform_native.behavior');
	},
 
	get preventSameURLTab() 
	{
		return this.getPref('browser.tabs.extensions.prevent_same_uri_tab');
	},
 
	get isGroupMode() 
	{
		return this.getPref('browser.tabs.extensions.group.enabled');
	},
 
	get bookmarkGroupBehavior() 
	{
		var groupBehavior = this.getPref('browser.tabs.extensions.bookmarkgroup_behavior');
		/*
			0: append to current tabset
			1: insert to current group
			10: replace all tabs
			11: replace current group
			20: replace current tab when only one tab is open
				(normally append to current tabset)
			21: replace current tab when only one tab is open
				(normally insert to current group)
		*/

		if (!this.isGroupMode)
			if (groupBehavior == 1)
				groupBehavior = 0;
			else if (groupBehavior == 11)
				groupBehavior = 10;
			else if (groupBehavior == 21)
				groupBehavior = 20;

		switch (groupBehavior)
		{
			case 0:
			case 1:
			case 10:
			case 11:
			case 20:
			case 21:
				break;

			default:
				groupBehavior = 0;
				break;
		}

		return groupBehavior;
	},
 
	// opentabfor... 
	
	get opentabforJS() 
	{
		return this.getPref('browser.tabs.opentabfor.windowopen');
	},
  
	// loadInBackground... 
	
	get loadInBackground() 
	{
		return this.getPref('browser.tabs.loadInBackground');
	},
 
	get loadInBackgroundWindow() 
	{
		return this.getPref('browser.tabs.extensions.loadInBackgroundWindow');
	},
  
	get shouldSaveBookmarksStatus() 
	{
		return this.getPref('browser.tabs.extensions.bookmarks.save_status');
	},
 
	get shouldSaveBookmarksPermissions() 
	{
		return this.getPref('browser.tabs.extensions.bookmarks.save_permissions');
	},
 
	get viewSourceInTab() 
	{
		return this.getPref('browser.tabs.extensions.view_source_tab');
	},
  
	// XPConnect 
	
	get Prefs() 
	{
		if (!this._Prefs) {
			this._Prefs = Components.classes['@mozilla.org/preferences;1'].getService(Components.interfaces.nsIPrefBranch);
		}
		return this._Prefs;
	},
	_Prefs : null,
	
	getPref : function(aPrefstring, aStringType) 
	{
		try {
			switch (this.Prefs.getPrefType(aPrefstring))
			{
				case this.Prefs.PREF_STRING:
					return this.Prefs.getComplexValue(aPrefstring, aStringType || this.knsISupportsString).data;
					break;
				case this.Prefs.PREF_INT:
					return this.Prefs.getIntPref(aPrefstring);
					break;
				default:
					return this.Prefs.getBoolPref(aPrefstring);
					break;
			}
		}
		catch(e) {
		}

		return null;
	},
 
	setPref : function(aPrefstring, aNewValue, aPrefObj) 
	{
		var pref = aPrefObj || this.Prefs ;
		var type;
		try {
			type = typeof aNewValue;
		}
		catch(e) {
			type = null;
		}

		switch (type)
		{
			case 'string':
				var string = ('@mozilla.org/supports-wstring;1' in Components.classes) ?
						Components.classes['@mozilla.org/supports-wstring;1'].createInstance(this.knsISupportsString) :
						Components.classes['@mozilla.org/supports-string;1'].createInstance(this.knsISupportsString) ;
				string.data = aNewValue;
				pref.setComplexValue(aPrefstring, this.knsISupportsString, string);
				break;
			case 'number':
				pref.setIntPref(aPrefstring, parseInt(aNewValue));
				break;
			default:
				pref.setBoolPref(aPrefstring, aNewValue);
				break;
		}
		return true;
	},
 
	clearPref : function(aPrefstring) 
	{
		try {
			this.Prefs.clearUserPref(aPrefstring);
		}
		catch(e) {
		}

		return;
	},
 
	addPrefListener : function(aObserver) 
	{
		var domains = ('domains' in aObserver) ? aObserver.domains : [aObserver.domain] ;
		try {
			var pbi = this.Prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
			for (var i = 0; i < domains.length; i++)
				pbi.addObserver(domains[i], aObserver, false);
		}
		catch(e) {
		}
	},
 
	removePrefListener : function(aObserver) 
	{
		var domains = ('domains' in aObserver) ? aObserver.domains : [aObserver.domain] ;
		try {
			var pbi = this.Prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
			for (var i = 0; i < domains.length; i++)
				pbi.removeObserver(domains[i], aObserver, false);
		}
		catch(e) {
		}
	},
  
	get RDF() 
	{
		if (!this._RDF) {
			this._RDF = Components.classes['@mozilla.org/rdf/rdf-service;1'].getService(Components.interfaces.nsIRDFService);
		}
		return this._RDF;
	},
	_RDF : null,
 
	get WindowManager() 
	{
		if (!this._WindowManager) {
			this._WindowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
		}
		return this._WindowManager;
	},
	_WindowManager : null,
 
	get WindowWatcher() 
	{
		if (!this._WindowWatcher) {
			this._WindowWatcher = Components.classes['@mozilla.org/embedcomp/window-watcher;1'].getService(Components.interfaces.nsIWindowWatcher);
		}
		return this._WindowWatcher;
	},
	_WindowWatcher : null,
 
	get IOService() 
	{
		if (!this._IOService) {
			this._IOService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
		}
		return this._IOService;
	},
	_IOService : null,
 
	get GlobalHistory() 
	{
		if (!this._GlobalHistory) {
			this._GlobalHistory = Components.classes['@mozilla.org/browser/global-history;1'].getService(Components.interfaces.nsIGlobalHistory);
		}
		return this._GlobalHistory;
	},
	_GlobalHistory : null,
	
	get GlobalHistory2() 
	{
		if (!this._GlobalHistory2) {
			this._GlobalHistory2 = Components.classes['@mozilla.org/browser/global-history;2'].getService(Components.interfaces.nsIGlobalHistory2);
		}
		return this._GlobalHistory2;
	},
	_GlobalHistory2 : null,
 
	get BrowserHistory() 
	{
		if (!this._BrowserHistory) {
			try {
				this._BrowserHistory = Components.classes['@mozilla.org/browser/global-history;2'].getService(Components.interfaces.nsIBrowserHistory);
			}
			catch(e) { // old implementation(?)
				this._BrowserHistory = this.GlobalHistory.QueryInterface(Components.interfaces.nsIBrowserHistory);
			}
		}
		return this._BrowserHistory;
	},
	_BrowserHistory : null,
  
	get PromptService() 
	{
		if (!this.mPromptService)
			this.mPromptService = Components.classes['@mozilla.org/embedcomp/prompt-service;1'].getService(Components.interfaces.nsIPromptService);
		return this.mPromptService;
	},
	mPromptService : null,
 
	get WalletService() 
	{
		if (!this._WalletService &&
			'nsIWalletService' in Components.interfaces &&
			'@mozilla.org/wallet/wallet-service;1' in Components.classes) {
			this._WalletService = Components.classes['@mozilla.org/wallet/wallet-service;1'].getService(Components.interfaces.nsIWalletService);
		}
		return this._WalletService;
	},
	_WalletService : null,
 
	get URIFixup() 
	{
		if (!this._URIFixup) {
			this._URIFixup = Components.classes['@mozilla.org/docshell/urifixup;1'].getService(Components.interfaces.nsIURIFixup);
		}
		return this._URIFixup;
	},
	_URIFixup : null,
 
	get ObserverService() 
	{
		if (!this._ObserverService) {
			this._ObserverService = Components.classes['@mozilla.org/observer-service;1'].getService(Components.interfaces.nsIObserverService);
		}
		return this._ObserverService;
	},
	_ObserverService : null,
 
	get TextToSubURI() 
	{
		if (!this._TextToSubURI)
			this._TextToSubURI = Components.classes['@mozilla.org/intl/texttosuburi;1'].getService(Components.interfaces.nsITextToSubURI);
		return this._TextToSubURI;
	},
	_TextToSubURI : null,
 
	get ConsoleService() 
	{
		if (!this._ConsoleService)
			this._ConsoleService = Components.classes['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService);
		return this._ConsoleService;
	},
	_ConsoleService : null,
   
	// utils 
	
	// common utilities 
	
	unescapeString : function(aString) 
	{
		aString = String(aString || '');
		var unescapedAsStr = unescape(aString);
		var unescapedAsURI = this.unescape(aString);
		return (this.escape(unescapedAsURI) == aString) ? unescapedAsURI : unescapedAsStr ;
	},
 
	escape : function(aString) 
	{
		return this.TextToSubURI.ConvertAndEscape('UTF-8', String(aString || '').replace(/ /g, '%20')).replace(/%2520/g, '%20').replace(/%2B/g, '+');
	},
 
	unescape : function(aString) 
	{
		return this.TextToSubURI.UnEscapeAndConvert('UTF-8', String(aString || '').replace(/%%20/g, '+').replace(/\+/g, '%2B'));
	},
 
	findParentNodeWithLocalName : function(aNode, aLocalName) 
	{
		var name = String(aLocalName).toLowerCase();
		var node = aNode;
		while (node &&
			String(Components.lookupMethod(node, 'localName').call(node)).toLowerCase() != name)
			node = Components.lookupMethod(node, 'parentNode').call(node);

		return node;
	},
 
	getInnerTextOf : function(aNode) 
	{
		if (!aNode || !aNode.firstChild) return '';
		var node = aNode.firstChild;

		var depth = 1,
			ret   = [];

		traceTree:
		while (node && depth > 0) {
			if (node.hasChildNodes()) {
				node = node.firstChild;
				depth++;
			} else {
				if (node.nodeType == Node.TEXT_NODE)
					ret.push(node.nodeValue);
				else if (node.alt)
					ret.push(node.alt);

				while (!node.nextSibling) {
					node = node.parentNode;
					depth--;
					if (!node) break traceTree;
				}
				node = node.nextSibling;
			}
		}
		return ret.join('');
	},
 
	getDocShellFromDocument : function(aDocument, aRootDocShell) 
	{
		var doc = aDocument;
		if (!doc) return null;

		doc = new XPCNativeWrapper(doc,
				'QueryInterface()',
				'defaultView'
			);

		const kDSTreeNode = Components.interfaces.nsIDocShellTreeNode;
		const kDSTreeItem = Components.interfaces.nsIDocShellTreeItem;
		const kWebNav     = Components.interfaces.nsIWebNavigation;

		if (doc.defaultView)
			return (new XPCNativeWrapper(doc.defaultView, 'QueryInterface()'))
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(kWebNav)
					.QueryInterface(Components.interfaces.nsIDocShell);

		if (!aRootDocShell)
			aRootDocShell = this.browser ? this.browser.docShell : null ;
		if (!aRootDocShell)
			return null;


		var aRootDocShell = aRootDocShell
				.QueryInterface(kDSTreeNode)
				.QueryInterface(kDSTreeItem)
				.QueryInterface(kWebNav);
		var docShell = aRootDocShell;
		traceDocShellTree:
		do {
			if (docShell.document == aDocument)
				return docShell;

			if (docShell.childCount) {
				docShell = docShell.getChildAt(0);
				docShell = docShell
					.QueryInterface(kDSTreeNode)
					.QueryInterface(kWebNav);
			}
			else {
				parentDocShell = docShell.parent.QueryInterface(kDSTreeNode);
				while (docShell.childOffset == parentDocShell.childCount-1)
				{
					docShell = parentDocShell;
					if (docShell == aRootDocShell || !docShell.parent)
						break traceDocShellTree;
					parentDocShell = docShell.parent.QueryInterface(kDSTreeNode);
				}
				docShell = parentDocShell.getChildAt(docShell.childOffset+1)
					.QueryInterface(kDSTreeNode)
					.QueryInterface(kWebNav);
			}
		} while (docShell != aRootDocShell);

		return null;
	},
	getWindowFromDocument : function(aDocument, aRootWindow)
	{
		var doc = aDocument;
		if (!doc) return null;

		doc = new XPCNativeWrapper(doc, 'defaultView');

		var root = aRootWindow;
		if (root && !(root instanceof XPCNativeWrapper))
			root = new XPCNativeWrapper(root, 'QueryInterface()');

		if (doc.defaultView)
			return doc.defaultView;

		var docShell = this.getDocShellFromDocument(
				aDocument,
				root ? root
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShell) :
					null
			);
		if (!docShell) return null;

		return docShell
				.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.QueryInterface(Components.interfaces.nsIWebNavigation)
				.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsIDOMWindow);
	},
 
	getSelectionSource : function(aWindow, aFormat, aSelection) 
	{
		var w = aWindow || document.commandDispatcher.focusedWindow;
		var winWrapper = new XPCNativeWrapper(w,
					'getSelection()',
					'document'
				);
		var selection = aSelection ? aSelection : winWrapper.getSelection() ;

		if (!selection) return '';

		var pSelection = selection.QueryInterface(Components.interfaces.nsISelectionPrivate),
			cType      = (new XPCNativeWrapper(winWrapper.document, 'contentType')).contentType,
			ret;

		if (!pSelection) return '';

		try {
			ret = pSelection.toStringWithFormat(aFormat || cType, 128+256, 0);
		}
		catch(e) {
			ret = pSelection.toStringWithFormat('text/xml', 128+256, 0);
		}
		return ret.replace(/ _moz-userdefined="[^"]*"/g, '');
	},
 
	makeURIFromSpec : function(aURI) 
	{
		try {
			var newURI;
			aURI = aURI || '';
			if (aURI && String(aURI).indexOf('file:') == 0) {
				var tempLocalFile;
				try {
					var fileHandler = this.IOService.getProtocolHandler('file').QueryInterface(Components.interfaces.nsIFileProtocolHandler);
					tempLocalFile = fileHandler.getFileFromURLSpec(aURI);
				}
				catch(ex) { // [[interchangeability for Mozilla 1.1]]
					try {
						tempLocalFile = this.IOService.getFileFromURLSpec(aURI);
					}
					catch(ex) { // [[interchangeability for Mozilla 1.0.x]]
						tempLocalFile = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
						this.IOService.initFileFromURLSpec(tempLocalFile, aURI);
					}
				}
				newURI = this.IOService.newFileURI(tempLocalFile); // we can use this instance with the nsIFileURL interface.
			}
			else {
				newURI = this.IOService.newURI(aURI, null, null);
			}

			return newURI;
		}
		catch(e){
if (this.debug) dump('TabbrowserService::makeURIFromSpec('+aURI+')\n'+e+'\n');
		}
		return null;
	},
 
	makeFileWithPath : function(aPath) 
	{
		var newFile = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
		newFile.initWithPath(aPath);
		return newFile;
	},
 
	getFileFromURL : function(aURL) 
	{
		var tempLocalFile;
		try {
			var fileHandler = this.IOService.getProtocolHandler('file').QueryInterface(Components.interfaces.nsIFileProtocolHandler);
			tempLocalFile = fileHandler.getFileFromURLSpec(aURL);
		}
		catch(e) { // [[interchangeability for Mozilla 1.1]]
			try {
				tempLocalFile = this.IOService.getFileFromURLSpec(aURL);
			}
			catch(ex) { // [[interchangeability for Mozilla 1.0.x]]
				tempLocalFile = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsILocalFile);
				this.IOService.initFileFromURLSpec(tempLocalFile, aURL);
			}
		}
		return tempLocalFile;
	},
 
	getURLSpecFromFile : function(aFile) 
	{
		var uri;
		try {
			uri = this.IOService.newFileURI(aFile).spec;
		}
		catch(e) { // [[interchangeability for Mozilla 1.1]]
			uri = this.IOService.getURLSpecFromFile(aFile);
		}
		return uri;
	},
 
	fixupURI : function(aString) 
	{
		var testURI = this.URIFixup.createFixupURI(aString || 'about:blank', this.URIFixup.FIXUP_FLAG_ALLOW_KEYWORD_LOOKUP);
		return (testURI) ? testURI.spec : null ;
	},
 
	getReferrer : function(aSource) 
	{
		if (!aSource) return null;

		if (typeof aSource != 'string') {
			if ('nodeType' in aSource)
				aSource = (new XPCNativeWrapper(aSource, 'ownerDocument')).ownerDocument;

			if ('defaultView' in aSource)
				aSource = (new XPCNativeWrapper(aSource, 'defaultView')).defaultView;

			aSource = (new XPCNativeWrapper(aSource, 'location')).location.href;
		}

		return this.makeURIFromSpec(aSource);
	},
 
	isSameHost : function(aURI1, aURI2) 
	{
		return this.getHost(aURI1) == this.getHost(aURI2);
	},
	
	getHost : function(aURI) 
	{
		if (this.getPref('browser.tabs.opentabfor.outerlink.level') > 1) {
			var host = String(aURI).split('//');
			if (host.length > 1) {
				host = host[1].split('/');
				return (host.length > 1 && host[1].search(/^(~|\%7[eE])/) > -1) ? host[0]+'/'+host[1] : host[0] ;
			}
		}
		else {
			try {
				return this.makeURIFromSpec(String(aURI)).host;
			}
			catch(e) {
			}
		}
		return null;
	},
  
	// 与えられた名前のフレームを返す（再帰処理） 
	// get a frame from name (reflexive)
	getFrameByName : function(aTop, aName, aCurrent)
	{
		var name = (typeof aName == 'string') ? aName : String(aName) ;
		if (!name) return null;

		if (
			aCurrent &&
			(name.search(/^_(self|top|parent|content)$/) > -1 || name == '_main')
			) {
			switch (name.toLowerCase())
			{
				case '_top':
				case '_content':
				case '_main':
					return aTop;

				case '_parent':
					return aCurrent.parent;

				case '_self':
					return aCurrent;

				default:
					break;
			}
		}
		var frames = aTop.frames;
		var frame  = null;
		for (var i = 0; i < frames.length; i++)
		{
			if (frames[i].name == name) return frames[i];
			if (frames[i].frames.length) {
				frame = this.getFrameByName(frames[i], name);
				if (frame) break;
			}
		}
		return frame;
	},
 
	getTargetForLink : function(aLinkNode) 
	{
		if (!aLinkNode) return { name : '', realName : '' };

		var linkWrapper = new XPCNativeWrapper(aLinkNode,
				'ownerDocument',
				'target',
				'getAttributeNS()',
				'getAttribute()'
			);

		var realName = (
				linkWrapper.target ||
				linkWrapper.getAttributeNS(this.XHTMLNS, 'target') ||
				linkWrapper.getAttributeNS(this.XLinkNS, 'target') ||
				linkWrapper.getAttribute('target') ||
				''
			);

		var name = realName.replace(/^_(self|top|parent|content)$/i, '').replace(/^_main$/, '');

		// find "target" attribute of "base" element

		var docWrapper = new XPCNativeWrapper(linkWrapper.ownerDocument,
				'getElementsByTagName()',
				'getElementsByTagNameNS()'
			);
		var base = docWrapper.getElementsByTagName('base');
		var baseLength = (new XPCNativeWrapper(base, 'length')).length;
		if (!baseLength) base = docWrapper.getElementsByTagNameNS(this.XHTMLNS, 'base');
		baseLength = (new XPCNativeWrapper(base, 'length')).length;

		if (!realName && baseLength) {
			var tempRealName;
			var nodeWrapper;
			for (var i = baseLength-1; i > -1 ; i--)
			{
				nodeWrapper = new XPCNativeWrapper(base[i],
					'target',
					'getAttributeNS()',
					'getAttribute()'
				);
				if ((tempRealName = (
						nodeWrapper.target ||
						nodeWrapper.getAttributeNS(this.XHTMLNS, 'target') ||
						nodeWrapper.getAttributeNS(this.XLinkNS, 'target') ||
						nodeWrapper.getAttribute('target') ||
						''
					))) {
					realName = tempRealName;
					name = realName.replace(/^_(self|top|parent|content)$/i, '').replace(/^_main$/, '');
				}
			}
		}

		return { target : name, realTarget : realName };
	},
 
	stopEvent : function(aEvent, aShouldStopParent) 
	{
		if (!aEvent || !(aEvent instanceof Event)) return;

		aEvent.stopPropagation();
		aEvent.preventDefault();

		this.fireEventForModules(
			'StopEvent',
			{
				DOMEvent         : aEvent,
				shouldStopParent : aShouldStopParent
			}
		);
	},
 
	makeURLAbsolute : function(aBase, aURI) 
	{
		var baseURI = this.IOService.newURI(aBase, null, null);
		return this.IOService.newURI(baseURI.resolve(aURI), null, null).spec;
	},
 
	preventModifyWindowState : function(aWindow) 
	{
		var overriddenMethods = {
				'resizeTo' : null,
				'resizeBy' : null,
				'moveTo'   : null,
				'moveBy'   : null,
				'focus'    : null,
				'blur'     : null
			};
		var dummyFunc = function() {};
		for (var i in overriddenMethods)
		{
			overriddenMethods[i] = aWindow[i];
			if (!overriddenMethods[i]) break;

			aWindow[i] = dummyFunc;
		}

		// restore methods after a few seconds past
		aWindow.setTimeout(function() {
			for (i in overriddenMethods)
				if (overriddenMethods[i])
					aWindow[i] = overriddenMethods[i];

			delete overriddenMethods;
			delete i;
			delete dummyFunc;
		}, this.getPref('browser.tabs.extensions.preventToModifyWindowState.timeout'));
	},
 
	uriSecurityCheck : function(aLoadingURI, aSourceURI) 
	{
		var loadingURI = this.makeURIFromSpec(aLoadingURI);
		var sourceURI  = this.makeURIFromSpec(aSourceURI);

		const nsIScriptSecurityManager = Components.interfaces.nsIScriptSecurityManager;
		var secMan = Components.classes['@mozilla.org/scriptsecuritymanager;1'].getService(nsIScriptSecurityManager);
		try {
			secMan.checkLoadURI(sourceURI, loadingURI, nsIScriptSecurityManager.STANDARD);
		}
		catch (e) {
			var error = 'Load of ' + aLoadingURI + ' denied.';
if (this.debug) error += '\nFrom: '+aSourceURI+'\nTo: '+aLoadingURI+'\n\n'+sourceURI+'\n'+loadingURI+'\n\n'+e;
			throw error;
		}
	},
 
	dragDropSecurityCheck : function(aEvent, aSession, aURI) 
	{
		var sourceDoc = aSession.sourceDocument;
		if (sourceDoc) {
			var sourceURI = sourceDoc.documentURI;
			const nsIScriptSecurityManager = Components.interfaces.nsIScriptSecurityManager;
			var secMan = Components.classes['@mozilla.org/scriptsecuritymanager;1'].getService(nsIScriptSecurityManager);
			try {
				secMan.checkLoadURIStr(sourceURI, aURI, nsIScriptSecurityManager.STANDARD);
			}
			catch(e) {
				aEvent.stopPropagation();
				throw 'Drop of ' + aURI + ' denied.';
			}
		}
	},
  
	// bookmarks 
	
	get isNewTypeBookmarks() 
	{
		var type   = this.RDF.GetResource('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
		var folder = this.RDF.GetResource('http://home.netscape.com/NC-rdf#Folder');
		var roots  = this.BookmarksDS.GetSources(type, folder, true);
		roots.getNext();
		return roots.hasMoreElements();
	},
 
	isBookmarked : function(aIDOrURI) 
	{
		if (!aIDOrURI) return false;
		if (aIDOrURI.indexOf('rdf:') == 0) return true;

		var res = this.getBookmarkResourcesFromURI(aIDOrURI);
		if (!res.length) return;

		// for old Mozilla
		try {
			if ('isBookmarkedResource' in this.BookmarksDS)
				return this.BookmarksDS.isBookmarkedResource(res[0]);
			else if ('IsBookmarked' in this.BookmarksDS) // NS7
				return this.BookmarksDS.IsBookmarked(aIDOrURI);
			else
				return this.BookmarksDS.isBookmarked(aIDOrURI);
		}
		catch(e) {
		}

		return false;
	},
 
	// get bookmark resources from URI 
	getBookmarkResourcesFromURI : function(aURIOrID)
	{
		// old implementation
		var res = this.RDF.GetResource(aURIOrID);
		if (this.BookmarksDS.GetTarget(res, this.kNC_URL, true))
			return [res];

		var resources = this.BookmarksDS.GetSources(this.kNC_URL, this.RDF.GetLiteral(aURIOrID), true);
		var ret = [];
		while (resources.hasMoreElements())
			ret.push(resources.getNext().QueryInterface(this.knsIRDFResource));

		return ret;
	},
 
	getBookmarkResourceFromKeyword : function(aKeyword, aURI) 
	{
		if (!aURI || !aKeyword) return null;

		var res = this.RDF.GetResource(aKeyword);

		var resources = this.BookmarksDS.GetSources(this.kNC_Keyword, this.RDF.GetLiteral(aKeyword), true);

		while (resources.hasMoreElements())
		{
			res = resources.getNext().QueryInterface(this.knsIRDFResource);

			uri = this.getURIForBookmark(res.Value);
			if (aURI.indexOf(uri.split('%s')[0]) == 0)
				return res;
		}
		return null;
	},
 
	getURIForBookmark : function(aID) 
	{
		if (aID.indexOf('rdf:') != 0) return aID;

		var uriRes = this.BookmarksDS.GetTarget(this.RDF.GetResource(aID), this.kNC_URL, true);
		try {
			if (uriRes) {
				uriRes = uriRes.QueryInterface(this.knsIRDFLiteral);
				if (uriRes && uriRes.Value)
					return uriRes.Value;
			}
		}
		catch(e) {
		}

		return null;
	},
 
	// ブックマークに記録されたリファラを得る（リファラの偽装） 
	// get the referrer for a bookmark (to camouflage referrer)
	getReferrerForBookmark : function(aID)
	{
		if (!this.isBookmarked(aID)) return null;
		try {
			var desc = this.loadBookmarkStatusInternal(aID);
			if (desc && desc.indexOf('referrerURI=') > -1)
				return this.makeURIFromSpec(desc.match(/referrerURI=(.*)[\n|\r]*/)[1]);
		}
		catch(e) {
		}
		return null;
	},
 
	getTextZoomForBookmark : function(aID) 
	{
		if (!this.isBookmarked(aID)) return null;
		try {
			var desc = this.loadBookmarkStatusInternal(aID);
			var zoom = desc ? desc.match(/textZoom=([0-9]+)/) : null ;
			if (this.getPref('browser.tabs.extensions.bookmarks.save_textZoom') &&
				zoom)
				return Math.min(Math.max(parseInt(zoom[1]), this.ZOOM_MIN), this.ZOOM_MAX);
		}
		catch(e) {
		}
		return null;
	},
 
	getFixedLabelForBookmark : function(aID) 
	{
		if (!this.isBookmarked(aID)) return null;
		try {
			var desc = this.loadBookmarkStatusInternal(aID);
			if (this.getPref('browser.tabs.extensions.bookmarks.use_fixed_label') ||
				(desc && desc.search(/useFixedLabel=(true|yes|1)/) > -1))
				return this.getNameForBookmark(aID);
		}
		catch(e) {
		}
		return null;
	},
 
	getNameForBookmark : function(aID) 
	{
		try {
			return this.BookmarksDS.GetTarget(this.RDF.GetResource(aID), this.kNC_NAME, true).QueryInterface(this.knsIRDFLiteral).Value;
		}
		catch(e) {
		}

		return null;
	},
 
	setNameForBookmark : function(aNewName, aID) 
	{
		if (!this.isBookmarked(aID))
			return;

		var res     = this.RDF.GetResource(aID);
		var oldName = this.getNameForBookmark(aID);

		if (aNewName === void(0)) {
			var history = this.RDF.GetDataSource('rdf:history');
			aNewName = history.GetTarget(this.RDF.GetResource(aID), this.kNC_NAME, true);
			aNewName = aNewName ? aNewName.QueryInterface(this.knsIRDFLiteral).Value : null ;
			if (!aNewName) aNewName = aURI;
		}

		if ((!oldName && !aNewName) || oldName == aNewName) return;

		if (oldName && !aNewName)
			this.BookmarksDS.Unassert(
				res,
				this.kNC_NAME,
				this.RDF.GetLiteral(oldName)
			);
		else if (!oldName && aNewName)
			this.BookmarksDS.Assert(
				res,
				this.kNC_NAME,
				this.RDF.GetLiteral(aNewName),
				true
			);
		else
			this.BookmarksDS.Change(
				res,
				this.kNC_NAME,
				this.RDF.GetLiteral(oldName),
				this.RDF.GetLiteral(aNewName)
			);

		try {
			this.BookmarksDS.Flush();
		}
		catch(e) {
		}
	},
 
	// ブックマークに記録されたアイコンを得る 
	// get the icon for a bookmark
	getIconForBookmark : function(aURI, aOnlyUserDefined)
	{
		if (!aURI) return '';

		aURI = this.getURIForBookmark(aURI);
		if (!aURI) return '';

		var icon;

		if (!this.isBookmarked(aURI)) {
			// get icon from icon data
			var dir = aURI.split('#')[0].split('?')[0].replace(/[^\/]+$/, '').replace(/\/$/, '').split('/');

			while(dir.length && !icon)
			{
				icon = this.iconData.getData(dir.join('/')+'/', 'IconURI');
				if (icon)
					break;
				else
					dir.splice(dir.length-1, 1);
			}

			if (!icon) return '';
		}

		if (!icon) icon = this.iconData.getData(aURI, 'IconURI');

		if (!icon && !aOnlyUserDefined) {
			try {
				var res = this.getBookmarkResourcesFromURI(aURI);
				for (var i in res)
				{
					icon = this.BookmarksDatabase.GetTarget(
							res[i],
							this.RDF.GetResource('http://home.netscape.com/NC-rdf#Icon'),
							true
						);
					icon = (icon) ? icon.QueryInterface(this.knsIRDFLiteral).Value : '' ;
					if (icon) break;
				}
			}
			catch(e) {
				icon = '';
			}
		}
		return icon;
	},
 
	// ブックマークに記録されたアイコンをユーザー定義のアイコンで上書きする 
	// override bookmark's icon by user's icon
	setIconForBookmark : function(aURI, aIconURI)
	{
		aURI = this.getURIForBookmark(aURI);
		if (!aURI || !this.isBookmarked(aURI)) return;

		if (aIconURI) this.iconData.setData(aURI, 'IconURI', aIconURI);

		var icon = aIconURI || this.iconData.getData(aURI, 'IconURI');

		// add entry to icon data
		var dir = aURI.split('#')[0].split('?')[0].replace(/[^\/]+$/, '').replace(/\/$/, '')+'/';
		if (icon)
			this.iconData.setData(dir, 'IconURI', icon);
		else if (this.iconData.getData(dir, 'IconURI'))
			this.iconData.removeData(dir);

		// update bookmarks
		var res = this.getBookmarkResourcesFromURI(aURI);
		var oldIcon;
		var update = false;
		for (var i in res)
		{
			oldIcon = this.BookmarksDatabase.GetTarget(
					res[i],
					this.RDF.GetResource('http://home.netscape.com/NC-rdf#Icon'),
					true
				);
			oldIcon = oldIcon ? oldIcon.QueryInterface(this.knsIRDFLiteral).Value : '' ;

			if (
				oldIcon == icon ||
				(oldIcon == 'data:' && !icon) ||
				(!oldIcon && icon == 'data:')
				)
				continue;
/*
			try {
				this.BookmarksDS.Assert(
					res[i],
					this.RDF.GetResource('http://home.netscape.com/NC-rdf#Icon'),
					this.RDF.GetLiteral(icon),
					true
				);
			}
			catch(e) {
				alert(e);
			}
*/
			update = true;
			break;
		}

		if (!update) return;

		try {
			if ('BookmarksUtils' in window && 'loadFavIcon' in BookmarksUtils) { // Firefox, new
				this.BookmarksDS.updateBookmarkIcon(aURI, null, null, 0);
				BookmarksUtils.loadFavIcon(aURI, icon || 'about:blank');
			}
			else // Mozilla Suite, old
				this.BookmarksDS.updateBookmarkIcon(aURI, icon);
		}
		catch(e) {
		}
	},
 
	// ブックマークに記録された固定、自動リロードなどの状態を読み込む 
	// load stored data of the bookmark
	loadBookmarkStatus : function(aID, aInfo, aDescription)
	{
		var info = aInfo || {};
		var desc = aDescription || this.loadBookmarkStatusInternal(aID);
		if (!desc) return info;

		if (this.getPref('browser.tabs.extensions.bookmarks.use_fixed_label') ||
			desc.search(/useFixedLabel=(true|yes|1)/) > -1)
			info.useFixedLabel = true;
		if (desc.indexOf('autoreloadInterval=') > -1) {
			var interval = desc.match(/autoreloadInterval=([0-9]+)/);
			if (interval)
				info.autoreloadInterval = Math.max(parseInt(interval[1]), 0);
		}
		if (desc.indexOf('textZoom=') > -1) {
			var zoom = desc.match(/textZoom=([0-9]+)/);
			if (zoom)
				info.textZoom = Math.min(Math.max(parseInt(zoom[1]), this.ZOOM_MIN), this.ZOOM_MAX);
		}

		var regexp = new RegExp();
		var allowProps = [
				'locked',
				'referrerBlocked',
				'allowPlugins',
				'allowJavascript',
				'allowMetaRedirects',
				'allowSubframes',
				'allowImages'
			];
		for (var i in allowProps)
			if (this.getPref('browser.tabs.extensions.'+allowProps[i]+'.enabled'))
				info[allowProps[i]] = !desc.match(regexp.compile('^'+allowProps[i]+'=(false|no|0)', 'm'));
			else
				info[allowProps[i]] = Boolean(desc.match(regexp.compile('^'+allowProps[i]+'=(true|yes|1)', 'm')));


		if (desc.indexOf('referrerURI=') > -1)
			info.referrerURI = desc.match(/referrerURI=(.*)[\n\r]*/)[1];
		if (desc.indexOf('autoreloadPostType=') > -1)
			info.autoreloadPostType = desc.match(/autoreloadPostType=(.*)[\n\r]*/)[1] || '' ;
		if (desc.indexOf('autoreloadPostData=') > -1)
			info.autoreloadPostData = this.unescape(desc.match(/autoreloadPostData=(.*)[\n\r]*/)[1] || '');

		return info;
	},
	
	loadBookmarkStatusInternal : function(aURIOrID) 
	{
		if (!this.isBookmarked(aURIOrID)) return null;
		var res = this.RDF.GetResource(aURIOrID);

		var desc = this.BookmarksDS.GetTarget(res, this.kNC_DESC, true);
		desc = desc ? desc.QueryInterface(this.knsIRDFLiteral).Value : null ;
		if (!desc || desc.indexOf(this.kBookmarksInfoSepStart) < 0) return null;

		return desc.substring(0, desc.indexOf(this.kBookmarksInfoSepEnd)).substring(desc.indexOf(this.kBookmarksInfoSepStart)+this.kBookmarksInfoSepStart.length+1);
	},
  
	// コモンダイアログでアイコンを選択する 
	chooseIcon : function()
	{
		const nsIFilePicker = Components.interfaces.nsIFilePicker;
		const FP = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);

		var icon = this.chooseFile(
			this.strbundle.GetStringFromName('bookmarksProperty_chooseIcon'),
			null,
			[
				{
					label   : this.strbundle.GetStringFromName('bookmarksProperty_chooseIconFilterLabel'),
					pattern : '*.ico;*.icon'
				},
				{ filter : nsIFilePicker.filterImages }//,
//				{ filter : nsIFilePicker.filterAll }
			]
		);
		if (!icon) return '';

		icon = this.getURLSpecFromFile(icon);

		return icon || '' ;
	},
  
	// link click 
	
	shouldSendReferrerWithLinkClick : function(aLinkNode) 
	{
		var linkNode = aLinkNode || TabbrowserService.getLastActiveLink();
		var linkWrapper = linkNode ? new XPCNativeWrapper(linkNode, 'ownerDocument') : null ;
		try {
			if (
				!linkNode ||
				!TabbrowserService.browser
				)
				return true;

			var w = this.getWindowFromDocument(linkWrapper.ownerDocument) ||
				this.getWindowFromDocument(linkWrapper.ownerDocument, window);
			if (!w) return true;

			var d = (
					new XPCNativeWrapper(
						(
							new XPCNativeWrapper(
								w,
								'top'
							)
						).top,
						'document'
					)
				).document;

			if (!d || d == window.document) return true;
		}
		catch(e) {
			return true;
		}

		var b = TabbrowserService.browser,
			t = b.selectedTab;

		for (var i = 0; i < b.mTabs.length; i++)
			if (b.mTabs[i].mBrowser.contentDocument == d)
				t = b.mTabs[i];

		return !t.referrerBlocked;
	},
 
	// 最後にクリックされたリンクを得る 
	getLastActiveLink : function()
	{
		var target = gContextMenu ? gContextMenu.target : null ;
		if (!target)
			return target;
		else
			return this.findParentNodeWithLocalName(target, 'a') ||
				this.findParentNodeWithLocalName(target, 'area') ||
				this.findParentNodeWithLocalName(target, 'link') ||
//				this.findParentNodeWithLocalName(target, 'q') ||
//				this.findParentNodeWithLocalName(target, 'blockquote') ||
//				this.findParentNodeWithLocalName(target, 'ins') ||
//				this.findParentNodeWithLocalName(target, 'del') ||
				null ;
	},
 
	// リンクを既訪問にする 
	markLinkVisited : function(aURI, aNode)
	{
		if ('markLinkVisited' in window) { // Firefox
			window.markLinkVisited(aURI, aNode);
			return;
		}

		var uri = this.makeURIFromSpec(aURI);

		var visited;
		try {
			visited = this.GlobalHistory2.isVisited(uri);
		}
		catch(e) { // old implementation
			visited = this.GlobalHistory.isVisited(aURI);
		}
		if (visited || !aNode || aURI.search(/^(https?|ftp|file|resource|chrome|gopher):/) < 0) return;

		try {
			this.GlobalHistory2.addURI(uri, false, true);
		}
		catch(e) { // old implementation
			try {
				this.GlobalHistory.addPage(aURI);
			}
			catch(ex) {
				return;
			}
		}

		var oldHref = aNode.href;
		aNode.href = '';
		aNode.href = oldHref;
	},
 
	// リファラブロッカーへのURIかどうか調べ、そうであれば置換後のURIを、そうでなければnullを帰す 
	// if the uri contains referrer blocker, this returns the real uri. if not, returns null.
	getRealURI : function(aURI)
	{
		var referrerBlockers = this.getPref('browser.tabs.extensions.bypass_referrerblocker.list') || '';
		if (!referrerBlockers) return null;

		var regexp = new RegExp('^(\\w+://)('+referrerBlockers+')');
		var accessFromReferrerBlocker = aURI.match(regexp);
		if (accessFromReferrerBlocker &&
			this.getPref('browser.tabs.extensions.bypass_referrerblocker')) {
			while (aURI.match(regexp))
				aURI = aURI.replace(regexp, RegExp.$1);

			return aURI;
		}

		return null;
	},
 
	// 通常のリンク読み込みをエミュレート 
	loadLinkNormally : function(aLinkInfo)
	{
		this.uriSecurityCheck(aLinkInfo.uri, aLinkInfo.source);

try{

		var topWin = Components.lookupMethod(aLinkInfo.window, 'top').call(aLinkInfo.window);
		var docShell;
		var target = aLinkInfo.window;
		var tab;
		var newWin = false;
		var done   = false;

		if (aLinkInfo.realTarget == '_self') {
		}
		else if (aLinkInfo.realTarget == '_parent' && topWin != window) {
			target = Components.lookupMethod(target, 'parent').call(target) || topWin ;
		}
		else if (
			aLinkInfo.browser &&
			aLinkInfo.browser.localName == 'tabbrowser' &&
			(tab = aLinkInfo.browser.getTabByTabId(aLinkInfo.tabId)) &&
			topWin != tab.mBrowser.contentWindow
			) { // sidebar or others
			docShell = tab.mBrowser.docShell;
		}
		else if (aLinkInfo.realTarget.search(/^_(main|top|content)$/) > -1) {
			target = topWin;
		}
		else if (aLinkInfo.realTarget) {
			docShell = tab.mBrowser.docShell;

			if (aLinkInfo.realTarget != '_blank') {
				docShell = docShell.QueryInterface(Components.interfaces.nsIDocShellTreeNode);
				if (docShell.findChildWithName.arity == 4) // Firefox 1.0 or before
					docShell = docShell.findChildWithName(
						aLinkInfo.realTarget,
						true,
						true,
						docShell
					);
				else // Firefox 1.1 or later?
					docShell = docShell.findChildWithName(
						aLinkInfo.realTarget,
						true,
						true,
						docShell,
						docShell
					);
			}

			newWin = !this.getPref('browser.block.target_new_window');
		}



		// block cross-site scriptings!
		if (
			aLinkInfo.uri.indexOf('javascript:') == 0 &&
			docShell &&
			this.makeURIFromSpec(aLinkInfo.source).host != docShell.QueryInterface(Components.interfaces.nsIWebNavigation).currentURI.host
			)
			// see http://lxr.mozilla.org/mozilla/source/dom/src/jsurl/nsJSProtocolHandler.cpp#228
			throw 'Attempt to load a javascript: URL from one host\nin a window displaying content from another host\nwas blocked by the security manager.';



		if (newWin && !docShell) {
			var nsIBrowserDOMWindow = 'nsIBrowserDOMWindow' in Components.interfaces ? Components.interfaces.nsIBrowserDOMWindow : 'nsIBrowserWindow' in Components.interfaces ? Components.interfaces.nsIBrowserWindow : null ;

			// 1 = current, 2 = new window, 3 = new tab
			var loadIn = 1;
			if (!nsIBrowserDOMWindow) {
				if (
					this.winHookMode > 0 ||
					this.getPref('browser.tabs.opentabfor.links.targetBehavior') > 0
					)
					loadIn = 3;
				else
					loadIn = 2;
			}
			else {
				switch (this.getPref('browser.link.open_newwindow'))
				{
					case nsIBrowserDOMWindow.OPEN_NEWWINDOW:
						if (
							this.winHookMode < 1 &&
							this.getPref('browser.tabs.opentabfor.links.targetBehavior') < 1
							) {
							loadIn = 2;
							break;
						}
					case nsIBrowserDOMWindow.OPEN_NEWTAB:
						loadIn = 3;
						break;
					default:
					case nsIBrowserDOMWindow.OPEN_CURRENTWINDOW:
						break;
				}
			}

			switch (loadIn)
			{
				case 2:
					window.openDialog(
						this.browserURI,
						'_blank',
						'chrome,all,dialog=no',
						aLinkInfo.uri,
						null,
						(aLinkInfo.referrerBlocked ? null : aLinkInfo.referrer )
					);
					docShell = true;
					done     = true;
					break;

				case 3:
					var newTab = gBrowser.addTabInternal(
									aLinkInfo.uri,
									(aLinkInfo.referrerBlocked ? null : aLinkInfo.referrer ),
									{
										openedFromTab : true,
										browserName : aLinkInfo.target,
										postData    : (('postData' in aLinkInfo ? aLinkInfo.postData : null ) ? gBrowser.readPostStream(aLinkInfo.postData) : null )
									}
								);

					var newWindow = newTab.mBrowser.docShell
								.QueryInterface(Components.interfaces.nsIWebNavigation)
								.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								.getInterface(Components.interfaces.nsIDOMWindow);

					window.setTimeout(this.loadLinkNormallyCallback, 10, newWindow, newTab, aLinkInfo);

					if (!aLinkInfo.loadInBackground)
						gBrowser.selectedTab = newTab;
					if (!this.loadInBackgroundWindow)
						window.focus();

					docShell = true;
					done     = true;
					break;

				default:
					break;
			}
		}

		if (!done || !docShell) {
			if (!docShell)
				docShell = target
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShell);

			docShell.QueryInterface(Components.interfaces.nsIWebNavigation)
				.loadURI(
					aLinkInfo.uri,
					(
						'loadFlags' in aLinkInfo ? aLinkInfo.loadFlags :
							Components.interfaces.nsIWebNavigation.LOAD_FLAGS_IS_LINK
					),
					(aLinkInfo.referrerBlocked ? null : aLinkInfo.referrer ),
					('postData' in aLinkInfo ? aLinkInfo.postData : null ),
					null
				);

			if (aLinkInfo.realTarget &&
				docShell.QueryInterface(Components.interfaces.nsIWebNavigation).contentWindow != aLinkInfo.window &&
				!aLinkInfo.loadInBackground) {
				var tab = gBrowser.selectedTab;
				for (var i = 0; i < gBrowser.mTabs.length; i++)
				{
					if (gBrowser.mTabs[i].mBrowser.contentWindow != topWin)
						continue;

					tab = gBrowser.mTabs[i];
					break;
				}

				gBrowser.selectedTab = tab;
				gBrowser.scrollTabbarToTab(gBrowser.selectedTab);
				gBrowser.setFocusInternal();
			}
		}

}
catch(e){
	if (this.debug)
		alert('@TabbrowserService.loadLinkNormally()\n'+e);
}
		this.markLinkVisited(aLinkInfo.originalURI, aLinkInfo.node);
	},
	loadLinkNormallyCallback : function(aNewWindow, aNewTab, aLinkInfo) {
		aNewWindow.name   = aLinkInfo.target;
		aNewWindow.opener = aLinkInfo.window;
		if (gBrowser.tabGroupsAvailable) {
			var doc = Components.lookupMethod(aLinkInfo.window, 'document').call(aLinkInfo.window);
			for (var i = 0; i < gBrowser.mTabs.length; i++)
			{
				if (gBrowser.mTabs[i].mBrowser.contentDocument != doc)
					continue;
				aNewTab.parentTab = gBrowser.mTabs[i];
				break;
			}
		}
	},
  
	// UI utils 
	
	// popup menupopup in the menubar by id 
	popupMenu : function(aID, aX, aY, aParent)
	{
		var node = document.getElementById(aID);
		if (!node) return;

		var x = (aX === void(0) ? window.screenX+20 : aX ),
			y = (aY === void(0) ? window.screenY+40 : aY );

		node.autoPosition = true;

		node.moveTo(x, y);
		node.showPopup(aParent || node.parentNode, x, y, 'popup', null, null);
	},
 
	popupAlert : function(aMessage) 
	{
		var node = document.getElementById('tabextensions-alert-popup');
		if (!node) return;

		var info = {
				node     : node,
				timeout  : 2000,
				step     : 10,
				interval : 1,
				x        : this.browser.selectedTab.mBrowser.boxObject.screenX+10,
				y        : this.browser.selectedTab.mBrowser.boxObject.screenY+10
			};


		if (node.timerInterval)
			window.clearInterval(node.timerInterval);
		if (node.timerTimeout)
			window.clearTimeout(node.timerTimeout);


		if (node.popupIsShown) {
			node.timerTimeout = window.setTimeout(this.hidePopup, info.timeout, node, node.boxObject.height, info.interval);
			return;
		}


		node.popupIsShown = true;

		var range = document.createRange();
		range.selectNodeContents(node);
		range.deleteContents();
		range.detach();

		var msg = aMessage.split('\n');
		for (var i in msg)
		{
			node.appendChild(document.createElement('label'));
			node.lastChild.setAttribute('value', msg[i]);
		}

		info.count = 0;
		info.previousHeight = 0;
		node.setAttribute('style', 'max-height: 0 !important;');

		node.autoPosition = true;
		node.moveTo(info.x, info.y);
		node.showPopup(node.parentNode, info.x, info.y, 'popup', null, null);

		node.timerInterval = window.setInterval(this.popupAlertCallback, info.interval, info);
	},
	popupAlertCallback : function(aInfo)
	{
		aInfo.count += aInfo.step;
		aInfo.node.setAttribute('style', 'max-height: '+aInfo.count+'px !important;');
		if (aInfo.previousHeight == aInfo.node.boxObject.height) {
			window.clearInterval(aInfo.node.timerInterval);
			aInfo.node.timerTimeout = window.setTimeout(TabbrowserService.hidePopup, aInfo.timeout, aInfo.node, aInfo.node.boxObject.height, aInfo.interval);

			delete aInfo;
		}
		else
			aInfo.previousHeight = aInfo.node.boxObject.height;
	},
	hidePopup : function(aNode, aStart, aInterval)
	{
		if (aNode.timerInterval)
			window.clearInterval(aNode.timerInterval);

		if (aInterval === void(0))
			aInterval = 1;

		var info = {
				node  : aNode,
				step  : 10,
				count : (aStart === void(0) ? aNode.boxObject.height : aStart )
			};
		aNode.timerInterval = window.setInterval(TabbrowserService.hidePopupCallback, aInterval, info);
	},
	hidePopupCallback : function(aInfo)
	{
		aInfo.count -= aInfo.step;
		aInfo.node.setAttribute('style', 'max-height: '+Math.max(aInfo.count, 0)+'px !important;');
		if (aInfo.count <= 0) {
			window.clearInterval(aInfo.node.timerInterval);
			aInfo.node.popupIsShown = false;
			aInfo.node.timer = null;
			aInfo.node.hidePopup();

			delete aInfo;
		}
	},
 
	closeWindow : function(aWindow, aParentWindow) 
	{
		var win = aWindow || window;
		var nav = aParentWindow;

		if (
			win.TabbrowserService &&
			win.TabbrowserService.isBrowserWindow &&
			!('__tabextensionsCloseWindow__BrowserStartup' in win) &&
			!('__tabextensionsCloseWindow__BrowserShutdown' in win)
			) {
			if (!('BrowserStartup' in win) && ('Startup' in win))
				win.BrowserStartup = win.Startup;
			win.__tabextensionsCloseWindow__BrowserStartup = win.BrowserStartup;
			win.BrowserStartup = function() {
				try {
					win.__tabextensionsCloseWindow__BrowserStartup();
				}
				catch(e) {
				}
			};
			if (!('BrowserShutdown' in win) && ('Shutdown' in win))
				win.BrowserShutdown = win.Shutdown;
			win.__tabextensionsCloseWindow__BrowserShutdown = win.BrowserShutdown;
			win.BrowserShutdown = function() {
				try {
					win.__tabextensionsCloseWindow__BrowserShutdown();
				}
				catch(e) {
				}
			};
		}

		this.hideWindow(win);

		if (win.document.documentElement)
			win.document.documentElement.removeAttribute('persist'); // prevent to save the position
		win.moveTo(300000, 300000); // move to outside of the screen

		// In some environments, "window.close" crashs Mozilla.
		// We have to use setTimeout to avoid this problem if "window.close" makes a crash.
		if (!this.getPref('browser.tabs.extensions.window_auto_close_timeout')) {
			try {
				this.setPref('browser.tabs.extensions.window_auto_close_timeout', true);
				const pref = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService);
				pref.savePrefFile(null);

				win.close();

				nav.TabbrowserService.shouldBeClosedWindowsCallbackFunc.push(function() {
					if (win.closed)
						TabbrowserService.setPref('browser.tabs.extensions.window_auto_close_timeout', false);
				});
				nav.setTimeout('TabbrowserService.closeWindowCallback();', 1500);
			}
			catch(e) {
				alert('@TabbrowserService.closeWindow()\n'+e);
			}
		}

		if (!win.closed) {
			nav.TabbrowserService.shouldBeClosedWindows.push(win);
			nav.setTimeout('TabbrowserService.closeWindowCallback();', 100);
		}

		delete nav;
	},
	
	closeWindowCallback : function() 
	{
		while (this.shouldBeClosedWindows.length)
		{
			if (!this.shouldBeClosedWindows[0].closed)
				this.shouldBeClosedWindows[0].close();
			this.shouldBeClosedWindows.shift();
		}
		while (this.shouldBeClosedWindowsCallbackFunc.length)
		{
			this.shouldBeClosedWindowsCallbackFunc[0]();
			this.shouldBeClosedWindowsCallbackFunc.shift();
		}
	},
	shouldBeClosedWindows : [],
	shouldBeClosedWindowsCallbackFunc : [],
 
	hideWindow : function(aWindow) 
	{
		var baseWin = (aWindow || window).QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShell)
					.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
					.treeOwner
					.QueryInterface(Components.interfaces.nsIBaseWindow);

		baseWin.visibility = false;
//		baseWin.enabled = false;
	},
 
	showWindow : function(aWindow) 
	{
		var baseWin = (aWindow || window).QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShell)
					.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
					.treeOwner
					.QueryInterface(Components.interfaces.nsIBaseWindow);

		baseWin.visibility = true;
//		baseWin.enabled = true;
	},
  
	checkToLoadInCurrentTabOf : function(aTabBrowser) 
	{
		return this.getPref('browser.tabs.extensions.reuse_current_blank_tab') &&
				(aTabBrowser ?
					!aTabBrowser.isBlank && aTabBrowser.selectedTab.isCurrentlyBlank :
					true
				);
	},
 
	getOwnerBrowserFromNode : function(aNode) 
	{
		if (!aNode ||
			document.documentElement.getAttribute('windowtype') != 'navigator:browser')
			return null;

		var nodeWrapper = new XPCNativeWrapper(aNode, 'ownerDocument');
		if (!nodeWrapper.ownerDocument) return null;

		var b = this.browser;
		if (!b) return null;

		var doc = new XPCNativeWrapper(nodeWrapper.ownerDocument, 'defaultView');

		if (
			b.contentDocument &&
			doc.defaultView &&
			b.contentWindow.top == (new XPCNativeWrapper(doc.defaultView, 'top')).top
			)
			return b;

		return null;
	},
  
	// file I/O 
	
	readFromURI : function(aURI) 
	{
		var uri;
		try {
			uri = aURI.QueryInterface(Components.interfaces.nsIURI);
		}
		catch(e) {
			uri = this.makeURIFromSpec(aURI);
		}

		try {
			var channel = this.IOService.newChannelFromURI(uri);
			var stream  = channel.open();

			var scriptableStream = Components.classes['@mozilla.org/scriptableinputstream;1'].createInstance(Components.interfaces.nsIScriptableInputStream);
			scriptableStream.init(stream);

			var fileContents = scriptableStream.read(scriptableStream.available());

			scriptableStream.close();
			stream.close();

			return fileContents;
		}
		catch(e) {
		}

		return null;
	},
 
	writeToURI : function(aContent, aURL) 
	{
		var file = this.getFileFromURL(aURL);
		if (file.exists()) file.remove(true);

		file.create(file.NORMAL_FILE_TYPE, 0666);

		var stream = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
		stream.init(file, 2, 0x200, false); // open as "write only"

		stream.write(aContent, aContent.length);

		stream.close();
	},
 
	chooseFile : function(aTitle, aDefaults, aFilters, aSaveMode) 
	{
		const nsIFilePicker = Components.interfaces.nsIFilePicker;
		const FP = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);

		FP.init(window, aTitle, (aSaveMode ? nsIFilePicker.modeSave : nsIFilePicker.modeOpen ));

		if (aDefaults) {
			if ('defaultString' in aDefaults)
				FP.defaultString = aDefaults.defaultString;
			if ('defaultExtension' in aDefaults)
				FP.defaultExtension = aDefaults.defaultExtension;
			if ('filterIndex' in aDefaults)
				FP.filterIndex = aDefaults.filterIndex;
			if ('displayDirectory' in aDefaults)
				FP.displayDirectory = aDefaults.displayDirectory;
		}

		if (aFilters) {
			for (var i in aFilters)
			{
				if ('filter' in aFilters[i])
					FP.appendFilters(aFilters[i].filter);
				else
					FP.appendFilter(aFilters[i].label, aFilters[i].pattern);
			}
		}
		else
			FP.appendFilters(nsIFilePicker.filterAll);

		var flag = FP.show();
		if (flag & nsIFilePicker.returnCancel) return null;

		try {
			return FP.file.QueryInterface(Components.interfaces.nsILocalFile);
		}
		catch(e) {
			return null;
		}
	},
   
	init : function(aIgnoreInitializedFlag) 
	{
		if (location.href == 'chrome://tabextensions/content/loadPresetPrefs.xul') {
			this.activated = true;
		}

		if (this.activated) return;
		this.activated = true;

		var i;


		// inherit old datafile
		var oldDataFile = this.getFileFromURL(this.profileURL+'tabextensions.rdf');
		if (oldDataFile.exists()) {
			var dataDir = this.getFileFromURL(this.profileURL+'tabextensions/');
			if (!dataDir.exists()) {
				dataDir.create(dataDir.DIRECTORY_TYPE, 0755);
			}
			var newFile = this.getFileFromURL(this.profileURL+'tabextensions/global.rdf');
			if (!newFile.exists()) {
				oldDataFile.copyTo(dataDir, 'global.rdf');
			}
		}


		var nullPointer;
		nullPointer = this.bookmarksData;
		nullPointer = this.iconData;
		delete nullPointer;


		var disabledModules = (this.getPref('browser.tabs.extensions.disabledModules') || '').split(/[ ,\|\n\r]/);
		for (i = 0; i < disabledModules.length; i++)
			if (window[disabledModules[i]])
				window[disabledModules[i]] = {};


		this.fireEventForModules('BeforeInit');

		this.loadPrefs();


		this.fireEventForModules('Init');

		if (oldDataFile.exists()) {
			try {
				oldDataFile.moveTo(oldDataFile.parent, '$tabextensions.rdf');
			}
			catch(e) {
			}
		}

		var isDefaultStartup = this.isDefaultStartup(window);

		// 起動オプションで渡されたURIを開いたウィンドウかどうか
		this.startWithOpenURLRequest = (
			('arguments' in window) &&
			window.arguments.length &&
			window.arguments[0] &&
			!isDefaultStartup
		);

		this.fireEventForModules('AfterInit');

		window.setTimeout('TabbrowserService.initWithDelay('+isDefaultStartup+');', 1); // Lately Mozilla gets the startup URI as the first argument.

	},
	
	isDefaultStartup : function(aWindow) 
	{
		var isDefaultStartup = false;
		try {
			var browserRegion,
				defaultPage = this.getPref('browser.startup.homepage');
			if (!defaultPage ||
				defaultPage.search(/(chrome|resource):.*\.properties/) > -1) {
				try {
					const STRBUNDLE = Components.classes['@mozilla.org/intl/stringbundle;1'].getService(Components.interfaces.nsIStringBundleService);
					browserRegion = STRBUNDLE.createBundle(defaultPage);

					defaultPage = '';
					try {
						defaultPage = browserRegion.GetStringFromName('browser.startup.homepage');
					}
					catch(e) {
					}
					if (!defaultPage) {
						try {
							defaultPage = browserRegion.GetStringFromName('homePageDefault');
						}
						catch(e) {
						}
					}
				}
				catch(ex) {
				}
			}
			const prefValue = (this.browserWindows.length == 1 || this.getPref('browser.windows.loadOnNewWindow') === null ?
						this.getPref('browser.startup.page') :
						this.getPref('browser.windows.loadOnNewWindow') );
			const startupPage = (prefValue == 2) ? this.BrowserHistory.lastPageVisited :
						(prefValue == 0) ? 'about:blank' :
						defaultPage ;

			isDefaultStartup = ('arguments' in aWindow && aWindow.arguments.length) ?
						((aWindow.arguments[0] || 'about:blank') == startupPage) :
						true ;
		}
		catch(e) {
//			alert('@TabbrowserService.isDefaultStartup()\n'+e);
		}
/*
dump([
	'prefValue                 : '+prefValue,
	'defaultPage               : '+defaultPage,
	'startupPage               : '+startupPage,
	'window.arguments[0]       : '+aWindow.arguments[0],
	'isDefaultStartup          : '+isDefaultStartup,
	'-------------------------------------------------------',
	'gHomeButton.getHomePage() : '+gHomeButton.getHomePage(),
	'browser.startup.homepage  : '+this.getPref('browser.startup.homepage')
	].join('\n'));
*/

		return isDefaultStartup;
	},
 
	initWithDelay : function(aArgumentIsDefaultStartup) 
	{
		this.fireEventForModules('BeforeInitWithDelay', { argumentIsDefaultStartup : aArgumentIsDefaultStartup });

//alert('TBE: start to initialize (2nd step)');
		var info = this.loadBookmarkStatus('about:blank', {});

		this.convertOldData();

		// clear garbages
		if (this.getPref('browser.tabs.extensions.auto_cleanUp')) {
			var count = this.getPref('browser.tabs.extensions.auto_cleanUp_count');
			if (count > 9) {
				if ('cleanUp' in this.bookmarksData)
					this.bookmarksData.cleanUp(true);
				else
					this.cleanUpData();

				this.setPref('browser.tabs.extensions.auto_cleanUp_count', 0);
			}
			else {
				this.setPref('browser.tabs.extensions.auto_cleanUp_count', count+1);
			}
		}

		// reset icons
		var icons = this.iconData,
			uri,
			icon;
		for (i = 0; i < icons.length; i++)
			try {
				this.BookmarksDS.updateBookmarkIcon(this.unescapeString(icons.item(i).Value.match(/[^:]+$/)), icons.getData(icons.item(i), 'IconURI'));
			}
			catch(e) {
			}

		this.fireEventForModules('InitWithDelay');

//alert('TBE: completely initialized');

		this.fireEventForModules('AfterInitWithDelay', { argumentIsDefaultStartup : aArgumentIsDefaultStartup });
	},
 
	// convert data for the old bookmark implementation to the new one 
	convertOldData : function()
	{
		if (!this.isNewTypeBookmarks && !this.bookmarksData.length)
			return;

		var bookmarks = this.bookmarksData,
			icons     = this.iconData,
			props     = [
				'UseFixedLabel',
				'Locked',
				'ReferrerBlocked',
				'AutoReload',
				'AutoReloadInterval',
				'ForbidPlugins',
				'ForbidJavascript',
				'ForbidMetaRedirects',
				'ForbidSubframes',
				'ForbidImages',
				'ReferrerURI'
			],
			item,
			res,
			value,
			info,
			i, j, k;

		for (i = bookmarks.length-1; i > -1; i--)
		{
			item = bookmarks.item(i);
			if (!item) continue;

			if (item.Value.indexOf('rdf:') == 0) {
				info = {};
				for (j in props)
					if ((value = bookmarks.getData(item, props[j])))
						info[props[j]] = value;

				this.saveBookmarkStatusInternal(item.Value, info);
			}
			else {
				if ((value = bookmarks.getData(item, 'IconURI')))
					icons.setData(item.Value.split('#')[0].split('?')[0].replace(/[^\/]+$/, '').replace(/\/$/, '')+'/', 'IconURI', value);

				res = this.getBookmarkResourcesFromURI(item.Value);
				for (j in res) {
					info = {};
					for (k in props)
						if (value = bookmarks.getData(item, props[k]))
							info[props[k]] = value;

					this.saveBookmarkStatusInternal(res[j].Value, info);
				}
			}

			bookmarks.removeData(item);
			bookmarks.removeResource(item);
		}
	},
 
	// clear all of garbages in the datasource 
	cleanUpData : function()
	{
		var resources = this.datasource.GetAllResources();
		var resource;
		var names, name, value;
		while (resources.hasMoreElements())
		{
			try {
				resource = resources.getNext().QueryInterface(this.knsIRDFResource);

				if (resource.Value.search(/:root$/) > -1 ||
					this.datasource.ArcLabelsIn(resource).hasMoreElements())
					continue;

				names = this.datasource.ArcLabelsOut(resource);
				while (names.hasMoreElements())
				{
					try {
						name = names.getNext().QueryInterface(this.knsIRDFResource);
						value = dsource.GetTarget(resource, name, true);
						this.datasource.Unassert(resource, name, value);
					}
					catch(ex) {
					}
				}
			}
			catch(e) {
			}
		}
		this.datasource.Flush();
	},
 
	// save/load prefs 
	
	loadPrefs : function() 
	{
		var preset = this.getPref('browser.tabs.extensions.default.preset');


		// backward compatibility
		if (!preset) {
			preset = this.getPref('browser.tabs.extensions.default.overlay');
			var type = this.getPref('browser.tabs.extensions.default.type');
			if (!preset && type !== null) {
				if (type == 0)
					preset = 'default';
				else
					preset = 'light';
			}
			if (preset)
				this.setPref('browser.tabs.extensions.default.preset', preset);
			else
				preset = null;
			delete type;
		}



		var selectedPreset;
		if (preset === null || preset == '_recall') {
			// when the dialog is already shown
			var dialog = this.WindowManager.getMostRecentWindow('tabextensions:loadPresetPrefs');
			if (dialog) {
				dialog.focus();
				return;
			}

			if (!this.getPref('browser.tabs.extensions.default.preset.shouldLoad'))
				window.openDialog('chrome://tabextensions/content/loadPresetPrefs.xul', '_blank', 'chrome,modal,resizable=no,titlebar=no,centerscreen', '_init');

			selectedPreset = this.getPref('browser.tabs.extensions.default.preset.shouldLoad');
			this.setPref('browser.tabs.extensions.default.preset', selectedPreset);
			this.clearPref('browser.tabs.extensions.default.preset.shouldLoad');

			delete dialog;
		}

		if (preset != '_recall' &&
			this.getPref('browser.tabs.extensions.default'))
			return;


		var selectedPreset = this.getPref('browser.tabs.extensions.default.preset');


		var overridePrefs;
		if (selectedPreset == '_restore') {
			this.setPref('browser.tabs.extensions.default.preset', this.getPref('browser.tabs.extensions.default.preset.backup') || 'default');
			this.clearPref('browser.tabs.extensions.default.preset.backup');
		}
		else if (selectedPreset == '_import') {
			overridePrefs = this.readFromURI(this.getPref('browser.tabs.extensions.default.import'));
			this.clearPref('browser.tabs.extensions.default.import');

			this.setPref('browser.tabs.extensions.default.preset', 'default');
		}


		const DEFPrefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getDefaultBranch(null);
		var nullPointer;

		var prefs = this.getDefaultPrefs();

		// Sometimes user prefs are broken by Mozilla default prefs...
		// So we have to save TBE's user prefs to the another file.
		// This section loads the escaped prefs.
		var userPrefs = {};
		var pref = function(aPrefstring, aValue) {
			userPrefs[aPrefstring] = aValue;
		}
		eval(overridePrefs || this.readFromURI(this.profileURL+'tabextensions.js') || '');

		for (var i in prefs)
		{
			this.setPref(i, prefs[i], DEFPrefs);

			if (preset == '_recall')
				this.clearPref(i);
			else if (i in userPrefs)
				this.setPref(i, userPrefs[i]);

			nullPointer = this.getPref(i);
		}


		delete preset;
		delete selectedPreset;
		delete overridePrefs;
		delete DEFPrefs;
		delete nullPointer;
		delete prefs;
		delete userPrefs;
		delete pref;
		delete i;
	},
 
	getDefaultPrefs : function() 
	{
		const dir   = 'chrome://tabextensions/content/default/';
		var defPref = [ this.readFromURI(dir+'default.js') ];
		var prop    = 'defaultPref';


		var preset = this.getPref('browser.tabs.extensions.default.preset');
		if (preset == '_restore')
			preset = this.getPref('browser.tabs.extensions.default.preset.backup') || 'default';

		var presets  = this.readFromURI(dir+'presets.txt');
		if (preset && preset == 'light')
			prop = 'defaultPrefLight';


		var modules = TabbrowserServiceModules;
		for (var i = 0; i < modules.length; i++)
			if (prop in modules[i] && typeof modules[i][prop] == 'string')
				defPref.push(this.readFromURI(modules[i][prop]));

		if (preset && presets.match((new RegExp('^'+preset+'=(.+)$', 'm'))))
			defPref.push(this.readFromURI(dir+RegExp.$1));

		this.prefs = [];

		var prefs = [];
		var TS    = this;
		var pref = function(aPrefstring, aValue) {
			prefs[aPrefstring] = aValue;
			TS.prefs[aPrefstring] = true;
		}
		eval(defPref.join('\n'));

		delete dir;
		delete defPref;
		delete prop;
		delete preset;
		delete presets;
		delete modules;
		delete i;
		delete TS;
		delete pref;

		return prefs;
	},
 
	savePrefsAs : function(aPath) 
	{
		if (!this.prefs.length) this.getDefaultPrefs();

		var prefs = [ '// Tabbrowser Extensions preferences' ];
		var value;
		for (var name in this.prefs)
		{
			value = this.getPref(name);
 			if (value !== null)
				prefs.push('pref("'+name+'", '+(typeof value == 'string' ? value.toSource()+'.valueOf()' : value )+');');
		}
		prefs.push('');
		this.writeToURI(prefs.join('\n'), aPath);
	},
   
	destruct : function() 
	{
		if (!this.activated) return;
		this.activated = false;

		this.fireEventForModules('BeforeDestruct');

		this.fireEventForModules('Destruct');

		this.fireEventForModules('AfterDestruct');


		// Save TBE user prefs to the another file, because Mozilla overwrites some entries.
		this.savePrefsAs(this.profileURL+'tabextensions.js');
	},
 
	updateTabsListMenu : function(aPopup, aShouldSort) 
	{
		var range = document.createRange();
		range.selectNodeContents(aPopup);
		if (!aShouldSort)
			range.setStartAfter(aPopup.getElementsByAttribute('class', 'tablist-sorted-separator')[0]);
		range.deleteContents();
		range.detach();

		var i,
			tabs;
		if (aShouldSort) {
			var root = { childTabs : [] };
			for (i = 0; i < gBrowser.mTabs.length; i++)
				if (!gBrowser.mTabs[i].parentTab)
					root.childTabs.push(gBrowser.mTabs[i]);
			root.childTabs.sort(gBrowser.conpareHasChildTabs);

			tabs = gBrowser.gatherChildTabsOf(root);
		}
		else
			tabs = gBrowser.mTabs;

		var label,
			tab;
		for (i = 0; i < tabs.length; i++)
		{
			aPopup.appendChild(document.createElement('menuitem'));
			aPopup.lastChild.setAttribute('value', tabs[i].tabIndex);

			label = [];
			tab   = tabs[i];
			while (tab.parentTab)
			{
				tab = tab.parentTab;
				label.push('  ');
			}
			label.push(tabs[i].label);
			aPopup.lastChild.setAttribute('label', label.join(''));

			if (tabs[i].mLabelContainer.hasAttribute('style'))
				aPopup.lastChild.setAttribute('style', tabs[i].mLabelContainer.getAttribute('style'));

			if (tabs[i] == gBrowser.selectedTab) {
				aPopup.lastChild.setAttribute('type', 'radio');
				aPopup.lastChild.setAttribute('checked', true);
			}
		}
	},
 
	/*
		制限を超えた分のタブを新しいウィンドウで開くためのオブジェクト。
		渡されたURIを保存しておき、新しいウィンドウでページを読み込む準備ができるのを待ってから、それらを一気にタブで読み込む。

		If too many URIs are handled to "addTab", then it handle them to this object.
		This object stores those URIs/referrers, opens a new browser window, and, starts to load each URI after getting ready the browser.
	*/
	overflowingTabsManager : 
	{
		shouldOpenedInfo : [],
		timer            : null,
		active           : false,
		shouldLoadURI    : false,

		addTab : function(aURI, aReferrerURI, aInfo)
		{
			aInfo.uri      = aURI;
			aInfo.referrer = aReferrerURI || null ;
			this.shouldOpenedInfo.push(aInfo);
//dump('add:'+this.shouldOpenedInfo[this.shouldOpenedInfo.length-1].uri+'\n');

			if (this.active) return;

			var w = window.openDialog(TabbrowserService.browserURI, '_blank', 'chrome,all,dialog=no', 'about:blank');
			this.souldLoadURI = true;
			this.timer = window.setInterval(this.pourTabsTo, 200, w);
			this.active = true;
		},

		pourTabsTo : function(aWindow)
		{
			var manager = TabbrowserService.overflowingTabsManager;

			// 1: If all of overflowed tabs are opened, timer is cleared.
			// 2: If the window for overflowed tabs is closed, we have to clear timer.
			if (!manager.shouldOpenedInfo.length ||
				(aWindow && ('closed' in aWindow && aWindow.closed))) {
				manager.stop();
				return;
			}

			if (!('TabbrowserService' in aWindow) ||
				!aWindow.TabbrowserService.activated ||
				!aWindow.TabbrowserService.isBrowserWindow) return;

			var info = manager.shouldOpenedInfo[0];
			manager.shouldOpenedInfo.splice(0, 1);

			if (!info || !info.uri || !info.uri.toString()) return;


			// first tab is loaded with "loadURI"
			aWindow.TabbrowserService.browser.loadURI(info.uri, info.referrer);
			var t = aWindow.TabbrowserService.browser.selectedTab;
			aWindow.TabbrowserService.browser.initTabWithTabInfo(t, info);
			t.setAttribute('tab-loadingURI', info.uri);
			manager.shouldLoadURI = false;

			var handedInfo;
			while (manager.shouldOpenedInfo.length)
			{
				info = manager.shouldOpenedInfo[0];
				manager.shouldOpenedInfo.splice(0, 1);
				if (!info || !info.uri || !info.uri.toString()) continue;

				info.parentTab = ('parentTab' in info && info.parentTab) ? t.tabId : null ;

				aWindow.TabbrowserService.browser.addTabInternal(
					info.uri,
					info.referrer,
					info
				);
			}

			manager.stop();
		},

		stop : function()
		{
			window.clearInterval(this.timer);
			this.shouldOpenedInfo = [];
			this.active           = false;
			this.souldLoadURI     = false;
		}
	},
 
	// TBE features 
	
	// Bookmarks 
	
	// Load 
	
	openBookmark : function(aID, aEvent, aOpenType, aParentRes) 
	{
try{
		if (// Ignored bookmark uris:
			!aID || // no URI, or functions
			aID.search(/bookmarks-button|BookmarksMenu|NC:PersonalToolbarFolder|innermostBox|(PT_)?bookmarks_groupmark|exBookmarks|bookmarks-menu|bookmarks-ptf|bookmarks-chevron|PersonalToolbar/i) > -1 || // Not a bookmark *item*
			// innermostBox is in NS7/Moz1.0. NC:Personal... is in 1.1.
			(aEvent && aEvent.type == 'click' && aEvent.button > 1) // right click or others
			) {
			return false;
		}

		var uri      = aID;
		var resource = null;
		try {
			resource = this.RDF.GetResource(uri);
		}
		catch(e) {
			return false;
		}


		var w = this.browserWindow;
		var b = w ? w.TabbrowserService.browser : null ;

		var middleClick = aEvent &&
					(
						(aEvent.type == 'click' && aEvent.button == 1) ||
						(
							(
								(aEvent.type == 'click' && aEvent.button == 0) ||
								aEvent.type == 'command'
							) &&
							(
								aEvent.ctrlKey || aEvent.metaKey
							)
						)
					);

		var parentItem;
		if (aEvent && aEvent.target.localName == 'menuitem')
			parentItem = aEvent.target.parentNode.parentNode;

		var behavior = (this.isLivemark(resource) && middleClick) ? this.getPref('browser.tabs.extensions.livemark.behavior.onMiddleClick') :
				(
					aParentRes ? this.isLivemark(aParentRes) :
					parentItem ? parentItem.getAttribute('livemark') == 'true' :
					false
				) ? this.getPref('browser.tabs.extensions.livemark.behavior.onItemClick') :
				-1;

		if (behavior < 0) {
			behavior = (middleClick && !this.isLivemark(resource)) ? this.getPref('browser.tabs.opentabfor.bookmarks.middleClickBehavior') :
						this.getPref('browser.tabs.opentabfor.bookmarks.behavior') ;
		}

		// for bookmark groups
		var isFolder   = this.isBookmarkFolder(resource);
		var isGroup    = (aOpenType == 'folder-as-group' && isFolder) ||
						(this.isLivemark(resource) && behavior == 3) ||
						this.isBookmarkGroup(resource);
		var shouldOpenAsGroup = (aOpenType == 'folder-as-group') ||
						(this.isLivemark(resource) && isGroup) ||
						this.shouldOpenBookmarkGroup(resource);
//dump('GROUP: '+isGroup+', Folder: '+isFolder+'\n');
		if (!isGroup && !isFolder) {
			try { // for IE favorites, etc.
				var target = this.BookmarksDS.GetTarget(
						resource,
						this.kNC_URL,
						true
					);
				if (!target) return false;
				target = target.QueryInterface(this.knsIRDFLiteral).Value;
				if (target) uri = target;
			}
			catch (e) {
				return false;
			}
		}


		var openIn = 'current';
		if (aOpenType && aOpenType != 'folder-as-group')
			openIn = aOpenType;
		else {
			if (
				uri.indexOf('javascript:') != 0 &&
				(behavior == 1 || behavior == 2)
				) {
				// 新規タブを開く操作で、ブックマークを開いてよい場合
				// Open the bookmark in new tabs
				// 例外処理
				// Exception
				if (b && this.checkToLoadInCurrentTabOf(b))
					openIn = 'current';
				else
					openIn = 'tab';
			}
			else if (!aEvent || aEvent.type == 'command' || aEvent.button == 0)
				// 新規タブを開かない動作で、ブックマークを開いてよい場合
				// Open the bookmark in the current tab
				openIn = 'current';
/*
if (aEvent)
	alert('@TabbrowserService.openBookmark()\n'+[
		'type  : '+aEvent.type,
		'key   : '+aEvent.keyCode,
		'ctrl  : '+aEvent.ctrlKey,
		'shift : '+aEvent.shiftKey,
		'alt   : '+aEvent.altKey,
		'meta  : '+aEvent.metaKey
	].join('\n'));
*/
			if (openIn == 'tab' && aEvent && aEvent.shiftKey)
				openIn = 'window';

			if (openIn == 'current' && aEvent && aEvent.altKey)
				openIn = 'properties';

			if (openIn == 'window' && this.winHookMode == 2)
				openIn = 'tab';
		}

		if (!w && openIn != 'properties')
			openIn = 'window';


		// load stored data for the bookmark
		var referrer   = this.getReferrerForBookmark(aID) || null ;
		var info       = {
				uri        : uri,
				fixedLabel : this.getFixedLabelForBookmark(aID),
				textZoom   : this.getTextZoomForBookmark(aID),
				bookmarkID : aID
			};
		if (!/^javascript:/i.test(info)) // not bookmarklets
			info.fixedLabel = this.getFixedLabelForBookmark(aID);

		if (!info.fixedLabel && this.getPref('browser.tabs.extensions.show_link_text_as_label')) {
			var name = this.getNameForBookmark(aID) || '';
			info.fixedLabelAutoDestroy = true;
			info.fixedLabel = this.strbundle.GetStringFromName('loading_temp_label').replace(/%s/gi, name).replace(/\s+/g, ' ');
			if (this.getPref('browser.tabs.extensions.show_link_text_as_label_permanently'))
				info.nextFixedLabel = name;
		}

		if (this.shouldSaveBookmarksStatus)
			info = this.loadBookmarkStatus(aID, info);

		var reloadTab = null;
		if (this.preventSameURLTab) {
			var tabs = b.mTabs;
			for (var i = 0; i < tabs.length; i++)
				if (tabs[i].getAttribute('tab-loadingURI') == uri) {
					if (this.getPref('browser.tabs.extensions.prevent_same_uri_tab.alert.show'))
						this.popupAlert(this.strbundle.GetStringFromName('status_same_uri_tab_exists'));
					reloadTab = tabs[i];
					break;
				}
		}

}
catch(e) {
		if (this.debug)
			alert('@TabbrowserService.openBookmark()\nFAILED TO OPEN A BOOKMARK:\n\n'+e);
		return false;
}

		// to avoid popup blocking...
		if (uri.indexOf('javascript:') == 0)
			uri = 'javascript:void(window.__tabextensions__triggerByUser = true);'+uri.replace(/^javascript:/i, '')+';void(delete window.__tabextensions__triggerByUser)';


		var loadInBackground = behavior == 2;

		function focusToContent()
		{
			w.focus();
			w.setTimeout('(new XPCNativeWrapper(gBrowser.contentWindow, "focus()")).focus();', 0);
		}

		switch (openIn)
		{
			case 'current':
			default:
				// web panels (Firefox)
				if (
					'BookmarksCommand' in window &&
					this.BookmarksDS.GetTarget(
						resource,
						this.kNC_WebPanel,
						true
					) &&
					'openWebPanel' in BookmarksCommand
					) {
					BookmarksCommand.openWebPanel(resource, this.BookmarksDS);
					return true;
				}

				if (shouldOpenAsGroup)
					if (
						isGroup ||
						(
							(behavior == 1 || behavior == 2) &&
							middleClick
						)
						) {
						this.openBookmarkGroup(resource, this.BookmarksDatabase);
						return true;
					}
					else
						return false;
				else if (isFolder)
					return false;

				if (reloadTab) {
					reloadTab.mBrowser.reload();
					if (!loadInBackground) {
						b.selectedTab = reloadTab;
						b.scrollTabbarToTab(b.selectedTab);
						(new XPCNativeWrapper(reloadTab.mBrowser.contentWindow, 'focus()')).focus();
					}
					break;
				}

				b.loadURI(uri, referrer);
				b.initTabWithTabInfo(b.selectedTab, info, uri);

				if (w == window || !this.loadInBackgroundWindow)
					focusToContent();

				break;

			case 'tab':
			case 'newactivetab':
				if (shouldOpenAsGroup) {
					this.openBookmarkGroup(resource, this.BookmarksDatabase);
					return true;
				}
				else if (isFolder)
					return false;

				var newTab;
				if (reloadTab) {
					reloadTab.mBrowser.reload();
					newTab = reloadTab;
				}
				else {
					newTab = b.addTabInternal(uri, referrer, info);
				}
				if (!loadInBackground || openIn == 'newactivetab') {
					b.selectedTab = newTab;
					b.scrollTabbarToTab(b.selectedTab);
				}

				if (w == window || !this.loadInBackgroundWindow)
					focusToContent();

				break;

			case 'window':
				if (shouldOpenAsGroup)
					return false;
				else if (isFolder)
					return false;
				else
					window.openDialog(
						this.browserURI,
						'_blank',
						'chrome,all,dialog=no',
						uri,
						null,
						referrer,
						info
					).addEventListener(
						'load',
						function()
						{
							var b = TabbrowserService.browser;
							b.initTabWithTabInfo(b.selectedTab, window.arguments[3]);
						},
						false
					);
				break;

			case 'properties':
				if (this.isNewTypeBrowser) // Firefox
					window.openDialog('chrome://browser/content/bookmarks/bookmarksProperties.xul', '', 'centerscreen,chrome,resizable=no', aID, {});
				else
					window.openDialog('chrome://communicator/content/bookmarks/bm-props.xul', '', 'centerscreen,chrome,dialog=no,resizable=no,dependent', aID, {});
				break;
		}

		return true;
	},
 
	openBookmarkGroup : function(aResourceOrID, aDataSource, aRDF, aCalled) // aRDF is ignored 
	{
try {
		var TS = TabbrowserService;
		var w  = TS.browserWindow;
		var i;

		var containerRes;
		try {
			containerRes = aResourceOrID.QueryInterface(TS.knsIRDFResource);
		}
		catch(e) {
			if (typeof aResourceOrID == 'string')
				containerRes = TS.RDF.GetResource(aResourceOrID);
			else
				return;
		}

		if (!aDataSource) aDataSource = TS.BookmarksDS;


		var RDFC   = Components.classes['@mozilla.org/rdf/container;1'].getService(Components.interfaces.nsIRDFContainer);
		RDFC.Init(aDataSource, containerRes);

		var items = RDFC.GetElements(),
			item,
			uri,
			referrer;
		var b = w ? w.TabbrowserService.browser : null ;
		var rootTab = b ? b.mTabs[0] : null ;

		var isGroupMode = TS.isGroupMode;
		var shouldOpenAsGroup = isGroupMode && TS.getPref('browser.tabs.extensions.group.open_bookmarkgroup_as_group');

		var shouldResutoreStatus = TS.shouldSaveBookmarksStatus;
		var loadInBackground = TS.getPref('browser.tabs.extensions.loadInBackgroundBookmarks');
		var groupBehavior = TS.bookmarkGroupBehavior;
		var preventSame = TS.preventSameURLTab;

		if (isGroupMode)
			rootTab = b.selectedTab.parentTab || b.selectedTab;

		// 全てのタブをクリアする場合
		// Clear all tabs before opening a bookmark-group
		if ((groupBehavior == 10 || groupBehavior == 11) && !aCalled) {
			if (b) {
				var shouldMakeBackLog = false,
					removedTabsInfo   = [];
				if ('replaceGroup' in b)
					for (i = 0; i < b.mTabs.length; i++)
						removedTabsInfo.push(b.getTabInfo(b.mTabs[i]));

				if (isGroupMode && groupBehavior == 11) {
					var children = rootTab.descendantTabs;
					if (children.length) {
						for (i = children.length-1; i > -1; i--)
							b.removeTab(children[i]);
					}
					else {
						rootTab = b.removeAllTabsButInternal(b.addTab('about:blank'), { preventUndo : true });
						shouldMakeBackLog = true;
					}
				}
				else {
					rootTab = b.removeAllTabsButInternal(b.addTab('about:blank'), { preventUndo : true });
					shouldMakeBackLog = true;
				}

				if (shouldMakeBackLog && 'replaceGroup' in b) {
					b.backBrowserGroup    = removedTabsInfo;
					b.forwardBrowserGroup = [];
				}
			}

			loadInBackground = false;
		}


		var t,
			info,
			parentTab,
			firstTab,
			reloaded,
			count = 0;

		var shouldShowTempLabel = TS.getPref('browser.tabs.extensions.show_link_text_as_label');
		var openIn = this.getPref('browser.tabs.extensions.open_tab_in_link');

//if (TS.debug) dump('Open livemark as group ('+containerRes.Value+')\n');

		while (items.hasMoreElements())
		{
			item = items.getNext().QueryInterface(TS.knsIRDFResource);

			// 再帰処理で全てのブックマークを開く
			// open all bookmarks in the folder reflexively
			if (TS.shouldOpenBookmarkGroup(item) &&
				TS.getPref('browser.tabs.extensions.bookmarks.open_child_folders')) {
				TS.openBookmarkGroup(item, aDataSource, null, true);
				continue;
			}

			uri = aDataSource.GetTarget(item, TS.kNC_URL, true);
			if (!uri) continue;
			uri = uri.QueryInterface(TS.knsIRDFLiteral).Value;
//if (TS.debug) dump('  livemark: '+uri+'\n');
//			dump('Open Bookmark Group: '+uri+'\n');


			if (isGroupMode) {
				if (!count) { // first item
					if (groupBehavior || shouldOpenAsGroup)
						parentTab = (groupBehavior == 1 || (groupBehavior == 21 && rootTab.hasChildTabs())) ? rootTab : null ;
					else
						parentTab = null;
				}
				else if ( // exception
						(
						groupBehavior == 10 || groupBehavior == 11 ||
						((groupBehavior == 20 || groupBehavior == 21) && !rootTab.hasChildTabs())
						) &&
						!shouldOpenAsGroup
					) {
					parentTab = null;
				}
				else if (groupBehavior || shouldOpenAsGroup)
					parentTab = rootTab;
			}

			info = {
				uri        : uri,
				parentTab  : (parentTab ? parentTab.tabId : null ),
				bookmarkID : item.Value,
				inGroup    : true,
				fixedLabel : TS.getFixedLabelForBookmark(item.Value),
				textZoom   : TS.getTextZoomForBookmark(item.Value),
				openIn     : openIn
			};
			if (shouldShowTempLabel && !info.fixedLabel) {
				info.fixedLabel = TS.strbundle.GetStringFromName('loading_temp_label').replace(/%s/gi, TS.getNameForBookmark(item.Value) || '').replace(/\s+/g, ' ');
				info.fixedLabelAutoDestroy = shouldShowTempLabel;
			}

			if (shouldResutoreStatus)
				info = TS.loadBookmarkStatus(item.Value, info);

			referrer = TS.getReferrerForBookmark(item.Value);


			reloaded = false;
			if (preventSame) {
				for (i = 0; i < b.mTabs.length; i++)
					if (b.mTabs[i].getAttribute('tab-loadingURI') == uri) {
						if (TS.getPref('browser.tabs.extensions.prevent_same_uri_tab.alert.show'))
							TS.popupAlert(TS.strbundle.GetStringFromName('status_same_uri_tab_exists'));
						b.mTabs[i].mBrowser.reload();
						t = b.mTabs[i];
						reloaded = true;
					}
			}

			if (!reloaded) {
				if (!w || !b) {
					info.parentTab = info.parentTab ? true : false ;
					TS.overflowingTabsManager.addTab(uri, referrer, info);
					t = null;
				}
				else if (
						!count &&
						!aCalled &&
						(
							groupBehavior == 10 || // when the group replaces existing tabs
							groupBehavior == 11 ||
							( // if the tab is "about:blank", load the first bookmark in the tab
								TS.checkToLoadInCurrentTabOf(b)
							) ||
							( // when the group replaces existing tab when only one tab is open
								(
									groupBehavior == 20 ||
									groupBehavior == 21
								) &&
								(
									b.mTabs.length == 1 ||
									(
										TS.isGroupMode &&
										!rootTab.hasChildTabs()
									)
								)
							)
						)
					) {
					rootTab.mBrowser.loadURI(uri, referrer);
					b.initTabWithTabInfo(rootTab, info, uri);
					if (parentTab || shouldOpenAsGroup)
						rootTab.parentTab = parentTab;

					t = rootTab;
				}
				else {
					if (firstTab) {
						info.index = Number(firstTab.tabIndex)+count;
					}

					t = b.addTabInternal(
						uri,
						referrer,
						info
					);
				}
			}

			if (!count) {
				firstTab = t;

				switch (TS.getPref('browser.tabs.extensions.open_tab_in_link'))
				{
					case 1:
						openIn = 0;
						break;
					case 2:
					default:
						openIn = 3;
						break;
				}

				if (isGroupMode) {
					// 最初のタブを新しいルートタブにする
					// set new root tab
					if (shouldOpenAsGroup)
						rootTab = t || true ; // "true" is for overflowed tabs

					if (
						t &&
						(groupBehavior || shouldOpenAsGroup) &&
						!t.parentTab
						)
						t.clearTabColor();
				}
			}

			count++;
		}

		// ブックマークグループが不正な場合、何もしない。
		// Invalid bookmark-group is ignored.
		if (!count) return;

		// ブックマークグループの最初のタブを選択する
		// Select the first tab of group.
		if (b && !loadInBackground && !aCalled) {
			b.selectedTab = firstTab;
			b.scrollTabbarToTab(b.selectedTab);
			b.setFocusInternal();
		}

		if (
			b && !aCalled &&
			(!groupBehavior || groupBehavior == 10 || groupBehavior == 11)
			)
			firstTab.shouldPurgeChildren = true;

		if (w == window || !TS.loadInBackgroundWindow) {
			b.focus();
		}

		return;
}
catch(e) {
		if (TS.debug) alert('@TabbrowserService.openBookmarkGroup()\nFAILED TO OPEN A BOOKMARK GROUP:\n\n'+e);
		return;
}
	},
  
	// Check 
	
	// ブックマークフォルダかどうか調べる 
	// is the bookmark item only a folder?
	isBookmarkFolder : function(aResource)
	{
		try {
			var type = this.BookmarksDatabase.GetTarget(
					aResource,
					this.RDF.GetResource('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
					true
				);
			if (type) {
				type = type.QueryInterface(this.knsIRDFResource).Value;
				return (type == 'http://home.netscape.com/NC-rdf#Folder');
			}
		}
		catch(e) {
		}

		return false;
	},
 
	// ブックマークグループかどうか調べる 
	// is the bookmark item a group?
	isBookmarkGroup : function(aResource)
	{
		try {
			var isGroupLiteral = this.BookmarksDatabase.GetTarget(
					aResource,
					this.RDF.GetResource('http://home.netscape.com/NC-rdf#FolderGroup'),
					true
				);
			if (isGroupLiteral) {
				isGroupLiteral = isGroupLiteral.QueryInterface(this.knsIRDFLiteral).Value;
				return (isGroupLiteral == 'true');
			}
		}
		catch(e) {
		}

		return false;
	},
 
	shouldOpenBookmarkGroup : function(aResource) 
	{
		var folderAsGroup = this.getPref('browser.tabs.opentabfor.bookmarks_folder_as_group');
		return (folderAsGroup) ? this.isBookmarkFolder(aResource) : this.isBookmarkGroup(aResource) ;
	},
 
	// ライブマークかどうか調べる 
	// is the bookmark item a livemark?
	isLivemark : function(aResource)
	{
		try {
			var type = this.BookmarksDatabase.GetTarget(
					aResource,
					this.RDF.GetResource('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
					true
				);
			if (type) {
				type = type.QueryInterface(this.knsIRDFResource).Value;
				return (type == 'http://home.netscape.com/NC-rdf#Livemark');
			}
		}
		catch(e) {
		}

		return false;
	},
  
	// Save 
	
	// make bookmark-group from tab-group 
	bookmarkTabGroup : function(aTab, aShouldBookmarkAllTabs)
	{
		if (!aTab || aTab.localName != 'tab')
			aTab = this.browser.selectedTab;

		var tabs;
		var highlightWithTabTree = true;
		if (aShouldBookmarkAllTabs) {
			tabs = [];
			for (var i = 0; i < this.browser.mTabs.length; i++)
				tabs[i] = this.browser.mTabs[i];
		}
		else {
			tabs = aTab.sameColorGroup;
			if (tabs.length == 1) {
				if (!aTab.hasChildTabs() && aTab.parentTab)
					aTab = aTab.parentTab;
				tabs = aTab.descendantTabs;
				tabs.unshift(aTab);
			}
			else
				highlightWithTabTree = false;
		}
		if (!tabs.length) return;

		tabs = tabs.sort(this.browser.conpareTabOrder);

		var info = [],
			b;
		for (var i in tabs)
		{
			b = tabs[i].mBrowser;
			try {
				doc = b.contentDocument;
				doc = new XPCNativeWrapper(doc,
						'title',
						'characterSet'
					);
			}
			catch(e) {
				doc = null;
			}
			info[i] = {
				name        : (doc ? doc.title : '' ) || b.currentURI.spec,
				url         : b.currentURI.spec,
				charset     : (doc ? doc.characterSet : null ),
				description : (doc && 'getDescriptionFromDocument' in BookmarksUtils ? BookmarksUtils.getDescriptionFromDocument(b.contentDocument) : '' ),
				bAddGroup   : true
			};
		}

		var currentInfo = info[0];
		currentInfo.forceToGroup = true;

		if (highlightWithTabTree)
			this.browser.highlightGroupFromTab(aTab, true, true);
		else
			this.browser.highlightTabs({ brothers: tabs }, true);

		// show modal dialog because we have to highligh the group of tabs while dialog is open
		if ('getDescriptionFromDocument' in BookmarksUtils) { // Firefox 1.1 or later
			var dialogArgs = currentInfo;
			try {
				if ( // Firefox 1.5 or later
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
				BROWSER_ADD_BM_FEATURES || 'modal,centerscreen,chrome,dialog,resizable,dependent',
				dialogArgs
			);
		}
		else if (this.isNewTypeBrowser) // Firefox 1.0 or before
			window.openDialog(
				'chrome://browser/content/bookmarks/addBookmark2.xul',
				'',
				'modal,centerscreen,chrome,dialog,resizable,dependent',
				currentInfo.name,
				currentInfo.url,
				null,
				currentInfo.charset,
				'addGroup,group',
				info
			);
		else // Mozilla Suite
			window.openDialog(
				'chrome://communicator/content/bookmarks/addBookmark.xul',
				'',
				'modal,centerscreen,chrome,dialog,resizable,dependent',
				currentInfo.name,
				currentInfo.url,
				null,
				currentInfo.charset,
				'addGroup,group',
				info
			);

		this.browser.cancelHighlight();
	},
 
	saveBookmarkStatus : function(aTabBrowser, aTab, aEntry) 
	{
		if (!aTabBrowser || !aTab || !aEntry ||
			!aTab.getAttribute('tab-bookmarkID') ||
			aTab.getAttribute('tab-bookmarkURI') != aTab.getAttribute('tab-loadingURI') ||
			!this.isBookmarked(aTab.getAttribute('tab-bookmarkID')))
			return;

		var id  = this.RDF.GetResource(aTab.getAttribute('tab-bookmarkID')).Value;

		var desc = this.loadBookmarkStatusInternal(id) || '' ;
		desc = desc.split('\n');
		if (!desc.length) desc = desc[0].split('\r');
		var info = {};
		for (var i in desc)
		{
			desc[i] = desc[i].split('=');
			if (!desc[i][0]) continue;
			info[desc[i][0]] = desc[i][1];
		}


		if (aEntry == 'fixedLabel') {
			if (!aTab.getAttribute('tab-fixedLabel')) {
				if ('useFixedLabel' in info) delete info.useFixedLabel;
			}
			else
				info.useFixedLabel = true;
		}
		else if (aEntry == 'textZoom') {
			if (!this.getPref('browser.tabs.extensions.bookmarks.save_textZoom')) return;

			var zoom = parseInt(aTab.mBrowser.markupDocumentViewer.textZoom*100);
			if (zoom == 100)
				delete info.textZoom;
			else
				info.textZoom = zoom;
		}
		else if (this.shouldSaveBookmarksStatus) {
			var enabledByDefault;

			if (aEntry == 'locked') {
				enabledByDefault = this.getPref('browser.tabs.extensions.locked.enabled');
				if (
					(
						enabledByDefault &&
						aTab.getAttribute('tab-locked') == 'true'
					) ||
					(
						!enabledByDefault &&
						aTab.getAttribute('tab-locked') != 'true'
					)
					) {
					if ('locked' in info) delete info.locked;
				}
				else if (enabledByDefault &&
						aTab.getAttribute('tab-locked') != 'true')
					info.locked = false;
				else if (!enabledByDefault &&
						aTab.getAttribute('tab-locked') == 'true')
					info.locked = true;
			}
			else if (aEntry == 'referrerblocked') {
				enabledByDefault = this.getPref('browser.tabs.extensions.referrerBlocked.enabled');
				if (
					(
						enabledByDefault &&
						aTab.getAttribute('tab-referrerblocked') == 'true'
					) ||
					(
						!enabledByDefault &&
						aTab.getAttribute('tab-referrerblocked') != 'true'
					)
					) {
					if ('referrerBlocked' in info) delete info.referrerBlocked;
				}
				else if (enabledByDefault &&
						aTab.getAttribute('tab-referrerblocked') != 'true')
					info.referrerBlocked = false;
				else if (!enabledByDefault &&
						aTab.getAttribute('tab-referrerblocked') == 'true')
					info.referrerBlocked = true;
			}
			else if (aEntry == 'autoreload') {
				if (!aTab.getAttribute('tab-autoreload') ||
					!aTab.autoReloadInterval) {
					if ('autoreloadInterval' in info)
						delete info.autoreloadInterval;
					if ('autoreloadPostType' in info)
						delete info.autoreloadPostType;
					if ('autoreloadPostData' in info)
						delete info.autoreloadPostData;
				}
				else {
					info.autoreloadInterval = aTab.autoReloadInterval;
					if (aTab.mBrowser.autoReloadPostData) {
						info.autoreloadPostType = aTab.mBrowser.autoReloadPostData.contentType;
						info.autoreloadPostData = this.escape(aTab.mBrowser.autoReloadPostData.content || '' );
					}
				}
			}
			else if (
					aEntry.indexOf('allow') == 0 &&
					this.shouldSaveBookmarksPermissions
					) {
				var allowProps = {
						// <property>      : <enabled by default>
						allowPlugins       : this.getPref('browser.tabs.extensions.allowPlugins.enabled'),
						allowJavascript    : this.getPref('browser.tabs.extensions.allowJavascript.enabled'),
						allowMetaRedirects : this.getPref('browser.tabs.extensions.allowMetaRedirects.enabled'),
						allowSubframes     : this.getPref('browser.tabs.extensions.allowSubframes.enabled'),
						allowImages        : this.getPref('browser.tabs.extensions.allowImages.enabled')
					};

				if (
					(
						allowProps[aEntry] &&
						aTab.mBrowser.docShell[aEntry]
					) ||
					(
						!allowProps[aEntry] &&
						!aTab.mBrowser.docShell[aEntry]
					)
					) {
					if (aEntry in info) delete info[aEntry];
				}
				else if (allowProps[aEntry] &&
						!aTab.mBrowser.docShell[aEntry])
					info[aEntry] = false;
				else if (!allowProps[aEntry] &&
						aTab.mBrowser.docShell[aEntry])
					info[aEntry] = true;
			}

		}

		this.saveBookmarkStatusInternal(id, info);
	},
	
	saveBookmarkStatusInternal : function(aBookmarkID, aInfo) 
	{
		if (!this.isBookmarked(aBookmarkID)) return;
		var res  = this.RDF.GetResource(aBookmarkID);
		var desc = this.createNewBookmarkDescription(aBookmarkID, aInfo);
		var old  = this.BookmarksDS.GetTarget(res, this.kNC_DESC, true);
		if (old) {
			old = old.QueryInterface(this.knsIRDFLiteral);
			this.BookmarksDS.Change(
				res,
				this.kNC_DESC,
				old,
				this.RDF.GetLiteral(desc),
				true
			);
		}
		else
			this.BookmarksDS.Assert(
				res,
				this.kNC_DESC,
				this.RDF.GetLiteral(desc),
				true
			);
	},
  
	createNewBookmarkDescription : function(aBookmarkID, aInfo, aOldDescription) 
	{
		if (!this.isBookmarked(aBookmarkID)) return '';
		var res = this.RDF.GetResource(aBookmarkID);

		var newStatus = [];
		for (var i in aInfo) newStatus.push(i+'='+aInfo[i]);

		var desc = aOldDescription;
		if (aOldDescription === void(0)) {
			desc = this.BookmarksDS.GetTarget(res, this.kNC_DESC, true);
			desc = desc ? desc.QueryInterface(this.knsIRDFLiteral).Value : '' ;
		}

		newStatus = newStatus.length ? [
			this.kBookmarksCommentSep,
			this.kBookmarksInfoSepStart,
			newStatus.join('\n'),
			this.kBookmarksInfoSepEnd
		].join('\n') : '' ;


		if (!desc || desc.indexOf(this.kBookmarksInfoSepStart) < 0) {
			desc = [desc, newStatus].join('');
		}
		else {
			var before = desc.substring(
					0,
					desc.indexOf(
						desc.indexOf(this.kBookmarksCommentSep) < 0 ? this.kBookmarksInfoSepStart : this.kBookmarksCommentSep
					)
				);
			var after = desc.substring(
					desc.indexOf(
						this.kBookmarksInfoSepEnd
					)+this.kBookmarksInfoSepEnd.length+1
				);
			desc = [
				before,
				(before.length && newStatus ? '\n' : '' ),
				newStatus,
				(after.length && newStatus ? '\n' : '' ),
				after
			].join('');
		}

		return desc;
	},
 
	// bookmark selection links as a bookmark group 
	bookmarkAllLinksAsGroup : function()
	{
		var links = this.getSelectionLinks(true);
		if (!links.length) return;

		var info = [];
		for (var i in links)
			info[i] = {
				name        : this.getInnerTextOf(links[i].node),
				url         : links[i].uri,
				charset     : null,
				description : '',
				bAddGroup   : true
			};

		var currentInfo = info[0];
		currentInfo.forceToGroup = true;

		if ('getDescriptionFromDocument' in BookmarksUtils) { // Firefox 1.1 or later
			var dialogArgs = currentInfo;
			if ( // Firefox 1.5 or later
				'gNavigatorBundle' in window &&
				gNavigatorBundle &&
				gNavigatorBundle.getString('bookmarkAllTabsDefault') &&
				BROWSER_ADD_BM_FEATURES in window &&
				BROWSER_ADD_BM_FEATURES
				) {
				dialogArgs = {
					objGroup         : info,
					bBookmarkAllTabs : true,
					name             : gNavigatorBundle.getString('bookmarkAllTabsDefault')
				};
			}
			dialogArgs.objGroup = info;
			window.openDialog(
				'chrome://browser/content/bookmarks/addBookmark2.xul',
				'',
				window.BROWSER_ADD_BM_FEATURES || 'modal,centerscreen,chrome,dialog,resizable,dependent',
				dialogArgs
			);
		}
		else if (this.isNewTypeBrowser) // Firefox 1.0 or before
			window.openDialog(
				'chrome://browser/content/bookmarks/addBookmark2.xul',
				'',
				'centerscreen,chrome,dialog=yes,resizable=no,dependent',
				currentInfo.name, currentInfo.url, null,
				currentInfo.charset, 'addGroup',
				info
			);
		else // Mozilla Suite
			window.openDialog(
				'chrome://communicator/content/bookmarks/addBookmark.xul',
				'',
				'centerscreen,chrome,dialog=yes,resizable,dependent',
				currentInfo.name, currentInfo.url, null,
				currentInfo.charset, 'addGroup,group',
				info
			);
	},
   
	// Context Menu 
	
	// open selection links in tabs 
	openAllLinksInTabs : function(aShouldGrouping)
	{
		var links = this.getSelectionLinks();
		if (!links.length) return;

		var targetWindow = document.commandDispatcher.focusedWindow;
		if (!targetWindow || Components.lookupMethod(targetWindow, 'top').call(targetWindow) == window)
			targetWindow = gBrowser.contentWindow;

		targetWindow = new XPCNativeWrapper(targetWindow,
				'top',
				'document'
			);
		var targetDocument = new XPCNativeWrapper(targetWindow.document,
				'location'
			);

		var w = this.browserWindow;
		var b = w ? w.TabbrowserService.browser : null ;

		var isGroupMode = this.isGroupMode;
		var rootTab = (isGroupMode && b && w == window) ? (b.selectedTab.rootTab || b.selectedTab) : null ;

		var uri;
		var realURI;
		var sourceURI = targetDocument.location;
		var referrer = (targetWindow.top == b.contentWindow && b.selectedTab.referrerBlocked) ? null : this.makeURIFromSpec(sourceURI) ;


		var i;

		if (b) {
			var t,
				info = {
					parentTab : (aShouldGrouping || !rootTab ? null : rootTab.tabId )
				},
				openIn = this.getPref('browser.tabs.extensions.open_tab_in_link');

			if (openIn > -1) info.openIn = openIn;

			var firstTab;
			var count = 0;
			for (i in links)
			{
				uri     = links[i].uri;
				realURI = this.getRealURI(uri);
				if (realURI) uri = realURI;

				try {
					if (!realURI)
						this.uriSecurityCheck(uri, sourceURI);
				}
				catch(e) {
					continue;
				}

				if (
					!firstTab &&
					this.checkToLoadInCurrentTabOf(b)
					) {
					t = b.selectedTab;
					t.mBrowser.loadURI(uri, realURI ? null : referrer );
					if (info.parentTab)
						t.parentTab = (typeof info.parentTab == 'string') ? b.getTabByTabId(info.parentTab) : info.parentTab ;
				}
				else {
					if (firstTab) {
						info.index = Number(firstTab.tabIndex)+count;
					}
					t = b.addTabInternal(uri, (realURI ? null : referrer ), info);
				}
				if (!t) continue; // if there is too many tabs, it can be canceled.

				if (!firstTab) {
					firstTab = t;
					if (aShouldGrouping) info.parentTab = t.tabId;
					if ('openIn' in info) {
						switch (info.openIn)
						{
							case 1:
								info.openIn = 0;
								break;
							case 2:
								info.openIn = 3;
								break;
							default:
								break;
						}
					}
				}

				this.markLinkVisited(links[i].uri, links[i].node);

				count++;
			}
			var loadInBackground = TabbrowserService.getPref('browser.tabs.opentabfor.links.behavior') == 2 || TabbrowserService.getPref('browser.tabs.opentabfor.links.middleClickBehavior') == 2;
			if (firstTab) { // if there is too many tabs, it can be canceled.
				if (!loadInBackground) {
					b.selectedTab = firstTab;
					b.scrollTabbarToTab(b.selectedTab);
					b.setFocusInternal();
				}
				if (aShouldGrouping)
					firstTab.shouldPurgeChildren = true;
			}
		}
		else {
			for (i in links)
			{
				uri     = links[i].uri;
				realURI = this.getRealURI(uri);
				if (realURI) uri = realURI;

				this.overflowingTabsManager.addTab(uri, (realURI ? null : referrer ), { parentTab : aShouldGrouping });
				this.markLinkVisited(links[i].uri, links[i].node);
			}
		}
	},
 
	// 選択範囲のリンクを収集する 
	getSelectionLinks : function(aShouldRejectMailto)
	{
		var links = [];

		var targetWindow = document.commandDispatcher.focusedWindow;
		if (!targetWindow || targetWindow.top == window)
			targetWindow = gBrowser.contentWindow;

		var winWrapper = new XPCNativeWrapper(targetWindow,
				'getSelection()',
				'document'
			);

		var selection = winWrapper.getSelection();
		var selectionSource = selection ? this.getSelectionSource(targetWindow, null, selection) : null ;
		if (!selection ||
			!selection.rangeCount ||
			!selectionSource)
			return links;

		// if there seems to be no link, skip operations after this line.
		if (selectionSource.search(/<[^>]+ href *= *['"]/) < 0)
			return links;

		var docWrapper = new XPCNativeWrapper(winWrapper.document, 'createRange()');

		const count = selection.rangeCount;
		var range,
			node,
			link,
			uri,
			nodeRange = docWrapper.createRange();
		for (var i = 0; i < count; i++)
		{
			range = selection.getRangeAt(0);
			node  = range.startContainer;

			traceTree:
			while (true)
			{
				nodeRange.selectNode(node);

				// 「ノードの終端が、選択範囲の先端より後にあるかどうか」をチェック。
				// 後にあるならば、そのノードは選択範囲内にあると考えられる。
				if (nodeRange.compareBoundaryPoints(Range.START_TO_END, range) > -1) {
					// 「ノードの先端が、選択範囲の終端より後にあるかどうか」をチェック。
					// 後にあるならば、そのノードは選択範囲外にあると考えられる。
					if (nodeRange.compareBoundaryPoints(Range.END_TO_START, range) > 0) {
						// 「リンクテキストが実際には選択されていないリンク」については除外する
						if (
							links.length &&
							range.startContainer.nodeType != Node.ELEMENT_NODE &&
							range.startOffset == range.startContainer.nodeValue.length &&
							links[0].node == this.getParentLink(range.startContainer)
							)
							links.splice(0, 1);

						if (
							links.length &&
							range.endContainer.nodeType != Node.ELEMENT_NODE &&
							range.endOffset == 0 &&
							links[links.length-1].node == this.getParentLink(range.endContainer)
							)
							links.splice(links.length-1, 1);
						break;
					}
					else if (link = this.getParentLink(node)) {
						try { // sometimes fails when we click a string like URI in the end edge of block level elements. why?
							var linkWrapper = new XPCNativeWrapper(link,
									'baseURI',
									'href',
									'getAttributeNS()',
									'getAttribute()'
								);
							uri = this.makeURLAbsolute(linkWrapper.baseURI, (linkWrapper.getAttributeNS(this.XLinkNS, 'href') || linkWrapper.getAttribute('href') || linkWrapper.href || link));
							if ((!aShouldRejectMailto || uri.indexOf('mailto:') < 0) && uri)
								links.push({ node : link, uri : uri });
						}
						catch(e) {
						}
					}
				}

				if (node.hasChildNodes() && !link) {
					node = node.firstChild;
				}
				else {
					while (!node.nextSibling)
					{
						node = node.parentNode;
						if (!node) break traceTree;
					}
					node = node.nextSibling;
				}
			}
		}

		nodeRange.detach();

		return links;
	},
 
	getParentLink : function(aNode) 
	{
		var node = aNode;
		while (!this.isLinkNode(node) && node.parentNode)
			node = node.parentNode;

		return this.isLinkNode(node) ? node : null ;
	},
 
	isLinkNode : function(aNode) 
	{
		return (
				aNode.nodeType == Node.ELEMENT_NODE &&
				(
					aNode.getAttributeNS(this.XLinkNS, 'href') ||
					(
						aNode.localName.toLowerCase().search(/^(a|area|link)$/) > -1 &&
						(!aNode.namespaceURI || aNode.namespaceURI == this.XHTMLNS)
					)
				)
				);
	},
  
	openLinkInNewTab : function(aURI, aLinkNode, aShouldActivateTab, aPostData, aSendReferrer) 
	{
		if (!this.browserWindow) {
			window.openDialog(this.browserURI, '_blank', 'chrome,all,dialog=no', aURI);
			return;
		}

		var browser  = this.browserWindow.TabbrowserService.browser;

		var info = {};
		var openIn = this.getPref('browser.tabs.extensions.open_tab_in_link');
		if (openIn > -1)
			info.openIn = openIn;
		if (aLinkNode)
			info.parentTab = browser.selectedTab.tabId;
		if (aPostData)
			info.postData = browser.readPostStream(aPostData);

		var referrer = (aSendReferrer === void(0) || aSendReferrer) && this.shouldSendReferrerWithLinkClick() ?
			this.getReferrer(aLinkNode) :
			null ;

		var tab = browser.addTabInternal(aURI, referrer, info);

		if (aShouldActivateTab) {
			browser.selectedTab = tab;
			browser.scrollTabbarToTab(browser.selectedTab);
			browser.setFocusInternal();
		}

		this.markLinkVisited(aURI, aLinkNode);
	},
 
	// reopen window as a tab 
	openTabInsteadSelf : function(aWindow)
	{
		this.openTabInsteadSelfInternal(aWindow || window, this);
	},
	
	openTabInsteadSelfInternal : function(aWindow, aService) 
	{
try{
		var i, j, k;
		var b, t;

		var TS  = aService;
		var win = aWindow;
		var browser = win.document.getElementById('content');
try{
		if (
//			win.gTSWindowOpenerType == 'ContentWindow' &&
			(
				!browser ||
				!('selectedTab' in browser) ||
				!browser.selectedTab ||
				!('mTabInfo' in browser.selectedTab) ||
				!browser.selectedTab.mBrowser ||
				!browser.selectedTab.mBrowser.currentMethod
			)
			) {
			if (win.gTSWindowOpenerType == 'ContentWindow')
				TS.hideWindow(win);

			win.setTimeout(TS.openTabInsteadSelfInternal, 100, aWindow, aService);
			return;
		}
}
catch(e) {
	if (TS.debug)
		alert('@TabbrowserService.openTabInsteadSelfInternal()\nOpened Type: '+win.gTSWindowOpenerType+'\n'+e)
	return;
}

		var popupInfo = {
				blocked : (TS.winHookMode == 2),
				uri     : null
			};
		if (browser)
			popupInfo.uri = (browser.selectedTab.mTabInfo ? browser.selectedTab.getAttribute('tab-loadingURI') :
					browser.currentURI ? browser.currentURI.spec :
					null )

		TS.fireEventForModules('OpenTabInsteadSelfInternal_preProcess', popupInfo);

		if (
			win.gTSWindowOpenerType == 'ContentWindow' &&
			(
				(TS.winHookMode == 1 && '__tabextensions__opener' in win) ||
				!popupInfo.blocked
			)
			) {

/*
			alert('@TabbrowserService.openTabInsteadSelfInternal()\n'+win.gTSWindowOpenerType+'\n'+TS.winHookMode+'\n'+win.__tabextensions__opener+'\n'+popupInfo.blocked);
*/

			// 「自分で開いた場合はブラウザを複数開く」設定の時で、window.open()を乗っ取った後にWebページのJavaScriptから開かれたウィンドウは、自分の意志で開いたものと見なし、タブでは開き直さない。
			delete win.__tabextensions__opener;
			win.clearInterval(win.gTSOpenTabTimer);
			win.gTSOpenTabTimer = null;
			win.gTSWindowOpenerType = 'PlatformNative';

			win.gTSWindowShouldBeDestructed = false;

			// re-post if this window isn't closed
			for (i = 0; i < browser.mTabs.length; i++)
			{
				t = browser.mTabs[i];
				if (t.mBrowser.currentMethod == 'GET' ||
					!t.mBrowser.lastPostData) continue;

				b = t.mBrowser;
				b.webNavigation.loadURI(
					t.getAttribute('tab-loadingURI'),
					Components.interfaces.nsIWebNavigation.LOAD_FLAGS_REPLACE_HISTORY,
					TS.makeURIFromSpec(t.getAttribute('tab-loadingReferrerURI')),
					browser.createPostStream(t.mBrowser.lastPostData, true),
					null
				);
			}

			TS.checkWindowShouldBeOpenedForSameURI();

			TS.showWindow();

			return;
		}
		delete win.__tabextensions__opener;

		var uris      = [];
		var names     = [];
		var referrers = [];
		var postData  = [];
		var openers   = [];
		var name, data;
		if (win.gTSWindowOpenerType != 'ContentWindow' &&
			'arguments' in win &&
			win.arguments.length) {
			uris = win.arguments[0].split('\n');
			if (win.arguments.length > 3)
				for (i in uris)
					referrers.push(TS.makeURIFromSpec(win.arguments[2]));
		}
		else {
			if (win.gTSOpenTabTimer) {
				win.clearInterval(win.gTSOpenTabTimer);
				win.gTSOpenTabTimer = null;
			}

			for (i = 0; i < browser.mTabs.length; i++)
			{
				uris.push(browser.mTabs[i].getAttribute('tab-loadingURI'));
				referrers.push(TS.makeURIFromSpec(browser.mTabs[i].getAttribute('tab-loadingReferrerURI')));

				name = browser.mTabs[i].getAttribute('tab-loadingName');
				names.push(name && name != '_blank' ? name : '' );

				if (browser.mTabs[i].mBrowser.currentMethod != 'GET')
					postData[i] = browser.mTabs[i].mBrowser.lastPostData;
				else
					postData[i] = null;

				if (!postData[i])
					postData[i] = {
						contentType : '',
						content     : '',
						method      : ''
					};

				try {
					openers[i] = browser.mTabs[i].mBrowser.docShell
							.QueryInterface(Components.interfaces.nsIWebNavigation)
							.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
							.getInterface(Components.interfaces.nsIDOMWindow);
					openers[i] = Components.lookupMethod(openers[i], 'opener').call(openers[i]) || null ;
				}
				catch(e) {
					openers[i] = null;
				}
			}
		}
		// convert file pathes to URIs
		var testURI;
		for (i = 0; i < uris.length; i++)
		{
			testURI = TS.fixupURI(uris[i]);
			if (testURI) uris[i] = testURI;
		}

		var nav = TS.browserWindows;
		if (!uris.length || !nav.length) return;

		var lastTab,
			doc,
			charset,
			shouldRemoveFirst = false;
		for (i = 0; i < nav.length; i++)
		{
			if (
				nav[i] == win ||
				!('TabbrowserService' in nav[i]) ||
				!nav[i].TabbrowserService.activated ||
				nav[i].gTSWindowOpenerType == 'ContentWindow' // if the window is opened from webpages, it seems to be a window opened by same opener.
				)
				continue;

			b = nav[i].TabbrowserService.browser;
			doc = new XPCNativeWrapper(b.contentDocument, 'characterSet');

			lastTab           = b.selectedTab;
			shouldRemoveFirst = (b.mTabs.length == 1);

			var done,
				openerTab,
				info,
				openIn;

			urisRoop:
			for (j = 0; j < uris.length; j++)
			{
				if (names[j]) {
					for (k = 0; k < b.mTabs.length; k++)
					{
						if (b.mTabs[k] != names[j]) continue;

						t = b.mTabs[k];
						t.browserName = names[j];
						if (postData[j]) {
							try {
								b.documentCharsetInfo.parentCharset = b.mAtomService.getAtom(doc.characterSet);
							}
							catch(e) {
							}
						}
						t.mBrowser.webNavigation.loadURI(
							uris[j],
							Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
							referrers[j],
							b.createPostStream(postData[j], true),
							null
						);

						if (b.tabGroupsAvailable)
							b.attachTabTo(t, null, true);

						continue urisRoop;
					}
				}

				done      = false;
				openerTab = null;
				if (TS.preventSameURLTab) {
					for (k = 0; k < b.mTabs.length; k++)
					{
						if (b.mTabs[k].getAttribute('tab-loadingURI') != uris[j]) continue;

						if (TS.getPref('browser.tabs.extensions.prevent_same_uri_tab.alert.show'))
							TS.popupAlert(TS.strbundle.GetStringFromName('status_same_uri_tab_exists'));

						b.mTabs[k].mBrowser.reload();
						t = b.mTabs[k];
						done = true;
						break;
					}
				}
				if (!done) {
					if (
						b.selectedTab.isReallyBlank ||
						(
							win.gTSWindowOpenerType == 'PlatformNative' &&
							TS.platformNativeBehavior == 1
						)
						) {
						t = b.selectedTab;
						if (names[j]) t.browserName = names[j];
						if (postData[j]) {
							try {
								b.documentCharsetInfo.parentCharset = b.mAtomService.getAtom(doc.characterSet);
							}
							catch(e) {
							}
						}
						t.mBrowser.webNavigation.loadURI(
							uris[j],
							Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE,
							referrers[j],
							b.createPostStream(postData[j], true),
							null
						);
					}
					else {
						if (b.tabGroupsAvailable && openers[j]) {
							for (k = 0; k < b.mTabs.length; k++)
							{
								if (
									b.mTabs[k].mBrowser.contentDocument !=
									Components.lookupMethod(openers[j], 'document').call(openers[j])
									)
									continue;

								openerTab = b.mTabs[k];
								break;
							}
						}

						info = {
							browserName : (names[j] ? names[j] : null),
							postData    : postData[j],
							charset     : (postData[j] ? doc.characterSet : null),
							parentTab   : openerTab
						};

						openIn = TS.getPref('browser.tabs.extensions.open_tab_in_link');
						if (openIn > -1) info.openIn = openIn;

						t = b.addTabInternal(uris[j], referrers[j], info);
					}
					try {
						if (b.tabGroupsAvailable && !openers[j])
							b.attachTabTo(t, null, true);
					}
					catch(e) {
					}
					if (TS.debug) dump('tabextensions: '+uris[j]+' reopened\n');
				}
			}

			if (
				t &&
				(
				(win.gTSWindowOpenerType == 'ContentWindow' &&
				!TS.getPref('browser.tabs.extensions.loadInBackgroundJS')) ||
				(win.gTSWindowOpenerType == 'PlatformNative' &&
				!TS.getPref('browser.tabs.extensions.loadInBackgroundPlatformNative')) ||
				(win.gTSWindowOpenerType == 'XULWindow' &&
				!TS.loadInBackground)
				)
				) {
				b.selectedTab = t;
				b.scrollTabbarToTab(b.selectedTab);
				b.setFocusInternal();
			}

			if (win.gTSWindowOpenerType == 'PlatformNative' &&
				!TS.getPref('browser.tabs.extensions.loadInBackgroundWindow.platformNative.inherit')) {
				if (!TS.getPref('browser.tabs.extensions.loadInBackgroundWindow.platformNative'))
					nav[i].focus();
			}
			else if (!TS.loadInBackgroundWindow)
				nav[i].focus();

			if (shouldRemoveFirst && lastTab.isReallyBlank)
				b.removeTabInternal(lastTab, { preventUndo : true });

			TS.closeWindow(win, nav[i]);

			break;
		}
}
catch(e){
	if (TS.debug)
		alert('@TabbrowserService.openTabInsteadSelfInternal()\n'+e);
}
	},
 
	checkWindowShouldBeOpenedForSameURI : function(aWindow) 
	{
		var win = aWindow || window ;

		if (!this.preventSameURLTab) {
			this.showWindow(win);
			return;
		}

		var uris = win.arguments[0].split('\n');
		var i;

		// convert file pathes to URIs
		var testURI;
		for (i = 0; i < uris.length; i++)
		{
			testURI = this.fixupURI(uris[i]);
			if (testURI) uris[i] = testURI;
		}

		var done = false;
		var w = this.browserWindows;
		var b;
		var parentWindow;
		for (i = 0; i < uris.length; i++)
		{
			for (j = 0; j < w.length; j++)
			{
				if (w[j] == win) continue;
				b = w[j].TabbrowserService.browser;
				for (k = 0; k < b.mTabs.length; k++)
				{
					if (b.mTabs[k].getAttribute('tab-loadingURI') != uris[i]) continue;

					if (w[j].TabbrowserService.getPref('browser.tabs.extensions.prevent_same_uri_tab.alert.show'))
						w[j].TabbrowserService.popupAlert(w[j].TabbrowserService.strbundle.GetStringFromName('status_same_uri_tab_exists'));

					b.mTabs[k].mBrowser.reload();
					if (
						(win.gTSWindowOpenerType == 'ContentWindow' &&
						!this.getPref('browser.tabs.extensions.loadInBackgroundJS')) ||
						(win.gTSWindowOpenerType == 'PlatformNative' &&
						!this.getPref('browser.tabs.extensions.loadInBackgroundPlatformNative')) ||
						(win.gTSWindowOpenerType == 'XULWindow' &&
						!this.loadInBackground)
						) {
						b.selectedTab = t;
						b.scrollTabbarToTab(b.selectedTab);
						b.setFocusInternal();
					}
					done = true;
					parentWindow = w[j];
					break;
				}
			}
		}

		if (done)
			this.closeWindow(win, parentWindow);
		else
			this.showWindow(win);
	},
 
	copyTabsFrom : function(aWindow) 
	{
		var sourceBrowser = aWindow.TabbrowserService.browser,
			firstTab      = this.browser.selectedTab,
			b             = this.browser,
			info,
			lastTab;

		b.removeAllTabsButInternal(firstTab); // close other tabs

		for (var i = 0; i < sourceBrowser.mTabs.length; i++)
		{
			info    = sourceBrowser.getTabInfo(sourceBrowser.mTabs[i]);
			lastTab = b.addTabWithTabInfo(info);
			if (info.selected) {
				b.selectedTab = lastTab;
				b.scrollTabbarToTab(b.selectedTab);
				b.setFocusInternal();
			}
		}

		b.removeTabInternal(firstTab, { preventUndo : true });
	},
  
	goPreferences : function() 
	{
		var targets = this.WindowManager.getEnumerator('mozilla:preferences', true),
			target;
		while (targets.hasMoreElements())
		{
			target = targets.getNext().QueryInterface(Components.interfaces.nsIDOMWindowInternal);
			if (target.location.href == 'chrome://tabextensions/content/pref/prefDialog.xul') {
				target.focus();
				return;
			}
		}

		window.openDialog(
			'chrome://tabextensions/content/pref/prefDialog.xul',
			'',
			'chrome,all,dependent'
		);
	},
  
	fireEventForModules : function(aEventName, aInfo) 
	{
		var modules = TabbrowserServiceModules;
		for (var i = 0; i < modules.length; i++)
			if ('on'+aEventName in modules[i] &&
				typeof modules[i]['on'+aEventName] == 'function')
				modules[i]['on'+aEventName](aInfo);
	}
 
}; 
  
// end of definition 
}
  
// initialize 
	
// initialize and shotdown 
if (TabbrowserService.isBrowserWindow &&
	!('BrowserShutdown' in window) &&
	'Shutdown' in window &&
	!('__tabextensions__Shutdown' in window))
	window.BrowserShutdown = Shutdown;

if ('BrowserShutdown' in window &&
	!('__tabextensions__BrowserShutdown' in window)) {
	/*
		Delete some codes in the original function because the code make
		troubles when TBE is installed.
		With TBE, those nasty hacks are needless.
	*/
	if (TabbrowserService.isBrowserWindow)
		eval('window.__tabextensions__BrowserShutdown = '+window.BrowserShutdown.toSource()
			.replace('os.removeObserver(gBrowser.browsers[0], "browser:purge-session-history");', '')
		);
	window.BrowserShutdown = function()
	{
		TabbrowserService.destruct();

		// to resolve "there is no observer for '***'" error
		var sv = TabbrowserService.ObserverService;
		if (TabbrowserService.isBrowserWindow) {
			if ('dlObserver' in window &&
				!sv.enumerateObservers('dl-start').hasMoreElements())
				sv.addObserver(dlObserver, 'dl-start', false);
		}

		// register again the window before do the original Shutdown() (for Linux or others)
		if (!gTSPlatformNativeBehaviorPrefListener.remoteServiceRegistered)
			gTSPlatformNativeBehaviorPrefListener.registerRemoteService(true);

		window.__tabextensions__BrowserShutdown();
	};
}
else {
	function TabbrowserServiceDestruct()
	{
		if (!TabbrowserService.activated) return;
		TabbrowserService.destruct();

		window.removeEventListener('load', TabbrowserServiceInit, false);
		window.removeEventListener('load', TabbrowserServiceInit, false);
	}
	window.addEventListener('unload', TabbrowserServiceDestruct, false);
	window.addEventListener('unload', TabbrowserServiceDestruct, false);
}
 
function TabbrowserServiceInit() 
{
	if (TabbrowserService.activated) return;
	TabbrowserService.init();
}
window.addEventListener('load', TabbrowserServiceInit, false);
window.addEventListener('load', TabbrowserServiceInit, false);
  
