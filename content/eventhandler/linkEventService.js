// start of definition 
if (!window.TBELinkEventService) {
 
// static class "TBELinkEventService" 
var TBELinkEventService =
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
		this.service.addPrefListener(gTSOpentabforLinksPrefListener);
		gTSOpentabforLinksPrefListener.observe('nsPref:changed', null, 'browser.tabs.opentabfor.links.targetBehavior');
		gTSOpentabforLinksPrefListener.observe('nsPref:changed', null, 'browser.tabs.opentabfor.links.middleClickBehavior');

		this.service.browser.startHookingContentAreaEvents();
	},
 
	onAfterInit : function() 
	{
		var b = this.service.browser;
		if (!b) return;


		var hookEvent = function(aNode, aWindow, aType)
		{
try{
			if (aType != 'click' && aType != 'keypress') return;

			var node = TBELinkEventService.findParentNodeByNameOrProp(aNode, null, 'on'+aType, 'function');
			if (!node) return;

			var nodeWrapper = new XPCNativeWrapper(node, 'nodeType');
			if (nodeWrapper.nodeType != Node.ELEMENT_NODE) return;

			nodeWrapper = new XPCNativeWrapper(node,
					'localName',
					'getAttribute()',
					'getAttributeNS()'
				);

			var linkWrapper = /^(a|area|link)$/i.test(nodeWrapper.localName) ? (new XPCNativeWrapper(node, 'href')) : null ;

			node.__tabextensions__shouldStop = false;
			node.__tabextensions__shouldVoid = false;
			node.__tabextensions__isNotLink  = (
				!nodeWrapper.getAttribute('href') &&
				!nodeWrapper.getAttributeNS('http://www.w3.org/1999/xhtml', 'href') &&
				!nodeWrapper.getAttributeNS('http://www.w3.org/1999/xlink', 'href') &&
				(!linkWrapper ? true : !linkWrapper.href )
			);

			if (
				!('on'+aType in node) ||
				'__tabextensions__on'+aType in node
				)
				return;

			var w = aWindow;

			node['__tabextensions__on'+aType] = node['on'+aType];

			node['on'+aType] = function(aEvent) {
				if (node.__tabextensions__shouldStop) {
					w.__tabextensions__currentEvent = aEvent;
					w.__tabextensions__currentNode = node;
					(w.__tabextensions_ctrlpopup__setTimeout || w.setTimeout)([
						'var active = __tabextensions__activeEventType;',
						'__tabextensions__activeEventType = "'+aType+'";',
						'__tabextensions__LastEvent = (new Date()).getTime();',
						'try {',
							'__tabextensions__currentNode.__tabextensions__retVal = __tabextensions__currentNode.__tabextensions__on'+aType+'(__tabextensions__currentEvent);',
						'}',
						'catch(e) {',
							'__tabextensions__currentNode.__tabextensions__retVal = void(0);',
						'};',
						'delete window.__tabextensions__currentEvent;',
						'delete window.__tabextensions__currentNode;',
						'__tabextensions__activeEventType = active;'
					].join(''), 0);
				}
				else if (node.__tabextensions__shouldVoid) {
					return;
				}
				else
					(w.__tabextensions_ctrlpopup__setTimeout || w.setTimeout)(arguments.callee, 0, aEvent);
			};

			delete nodeWrapper;
			delete linkWrapper;
}
catch(e) {
	dump('TBELinkEventService, hookEvent()\n'+e+'\n');
}
		}


		b.hookContentAreaEvents.extraHandlers[b.hookContentAreaEvents.extraHandlers.length] = function(aEvent, aOwnerTabBrowser)
		{
try {
			var node;
			try {
				node = aEvent.originalTarget || aEvent.target ;
			}
			catch(e) {
				node = aEvent.target;
			}

			var d = /^\[object .*Document\]$/.test(String(node)) ? node : (new XPCNativeWrapper(node, 'ownerDocument')).ownerDocument ;

			var docShell = aOwnerTabBrowser.getDocShellFromDocument(d);
			var w = docShell
					.QueryInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIDOMWindow)

			if (
				!aOwnerTabBrowser.mPrefs.getBoolPref('javascript.enabled') ||
				!docShell.allowJavascript
				)
				return;

			var __tabextensions__activeEventType_valueHolder = { value : aEvent.type };
			w.__defineGetter__(
				'__tabextensions__activeEventType',
				function() {
					return __tabextensions__activeEventType_valueHolder.value;
				}
			);
			w.__defineSetter__(
				'__tabextensions__activeEventType',
				function(aNewValue) {
					__tabextensions__activeEventType_valueHolder.value = aNewValue;
					return __tabextensions__activeEventType_valueHolder.value;
				}
			);


			if (!('__tabextensions__activeEvents' in w)) {
				var __tabextensions__activeEvents_valueHolder = { value : [] };
				w.__defineGetter__(
					'__tabextensions__activeEvents',
					function() {
						return __tabextensions__activeEvents_valueHolder.value;
					}
				);
				w.__defineSetter__(
					'__tabextensions__activeEvents',
					function(aNewValue) {
						__tabextensions__activeEvents_valueHolder.value = aNewValue;
						return __tabextensions__activeEvents_valueHolder.value;
					}
				);
			}
			if (!w.__tabextensions__activeEvents[aEvent.type])
				w.__tabextensions__activeEvents[aEvent.type] = [];


			var __tabextensions__activeEventButton_valueHolder = { value : (aEvent.type.search(/mousedown|mouseup|click|dblclick/) > -1 ? aEvent.button : null ) };
			w.__defineGetter__(
				'__tabextensions__activeEventButton',
				function() {
					return __tabextensions__activeEventButton_valueHolder.value;
				}
			);
			w.__defineSetter__(
				'__tabextensions__activeEventButton',
				function(aNewValue) {
					__tabextensions__activeEventButton_valueHolder.value = aNewValue;
					return __tabextensions__activeEventButton_valueHolder.value;
				}
			);


			window.setTimeout(function(aType) {
				try {
					if (
						'__tabextensions__activeEvents' in w &&
						aType in w.__tabextensions__activeEvents
						)
						w.__tabextensions__activeEvents[aType].pop();
				}
				catch(e) {
				}
			}, 0, aEvent.type);



			if (aEvent.type.search(/^(keypress|click|mousedown|mouseup|dblclick)$/) > -1) {
				var __tabextensions__LastEvent_valueHolder = { value : (new Date()).getTime() };
				w.__defineGetter__(
					'__tabextensions__LastEvent',
					function() {
						return __tabextensions__LastEvent_valueHolder.value;
					}
				);
				w.__defineSetter__(
					'__tabextensions__LastEvent',
					function(aNewValue) {
						__tabextensions__LastEvent_valueHolder.value = aNewValue;
						return __tabextensions__LastEvent_valueHolder.value;
					}
				);

				if (aOwnerTabBrowser.hookContentAreaClick) {
					if (
						TBELinkEventService.findParentNodeByNameOrProp(node, 'a') ||
						TBELinkEventService.findParentNodeByNameOrProp(node, 'area') ||
						TBELinkEventService.findParentNodeByNameOrProp(node, 'link')
						)
						hookEvent(node, w, aEvent.type);
				}
			}

			delete aEvent;
			delete aOwnerTabBrowser;
			delete w;
			delete d;
			delete node;
			delete docShell;
}
catch(e) {
	dump('TBELinkEventService, b.hookContentAreaEvents.extraHandlers[n]\n'+e+'\n');
}
		};

		delete b;
	},
 
	onDestruct : function() 
	{
		this.service.removePrefListener(gTSOpentabforLinksPrefListener);
		this.service.browser.endHookingContentAreaEvents();
	},
 
	// lick click 
	
	onStopEvent : function(aInfo) 
	{
		var targetNode = this.findParentNodeByProp(aInfo.DOMEvent.originalTarget, '__tabextensions__on'+aInfo.DOMEvent.type, 'function');
		if (targetNode)
			targetNode.__tabextensions__shouldVoid = true;
	},
 
	// contentAreaClick 
	
	onContentAreaClick_preProcess : function(aInfo) 
	{
		var event = aInfo.DOMEvent;
		var node = (
					this.service.findParentNodeWithLocalName(event.target, 'a') ||
					this.service.findParentNodeWithLocalName(event.target, 'area') ||
					this.service.findParentNodeWithLocalName(event.target, 'link') ||
					null
				);
		var parentEventListener = this.findParentNodeByProp(event.originalTarget, '__tabextensions__on'+event.type, 'function');

		// ignore clicks not on a link
		if (!node || (event.type == 'click' && event.button > 1)) {
			if (parentEventListener)
				parentEventListener.__tabextensions__shouldStop = true;
			aInfo.cancelProcess = true;
			aInfo.retVal = __tabextensions__contentAreaClick(event, aInfo.fieldNormalClicks);
			return;
		}

		// ignore canceled events
		var win = this.service.getWindowFromDocument((new XPCNativeWrapper(node, 'ownerDocument')).ownerDocument);
		var winWrapper;
		if (win) {
			winWrapper = new XPCNativeWrapper(win,
				'top',
				'QueryInterface()'
			);
			win = winWrapper.top;
		}
		if (
			this.service.getPref('javascript.enabled') &&
			(!win || winWrapper
				.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsIWebNavigation)
				.QueryInterface(Components.interfaces.nsIDocShell)
				.allowJavascript
			) &&
			!('__tabextensions__allowed' in event) &&
			this.isClickEventCanceled(event, aInfo.fieldNormalClicks)
			) {
			if (parentEventListener)
				parentEventListener.__tabextensions__shouldStop = true;
			aInfo.cancelProcess = true;
			aInfo.retVal = false;
			return;
		}
	},
	
	// ignore canceled events 
	isClickEventCanceled : function(aEvent, aFieldNormalClicks)
	{
		var TS = this.service;
		if (
			!aEvent.currentTarget.hookContentAreaClick ||
			(
				aEvent.type == 'click' &&
				(
					aEvent.button != 0 ||
					(
						!aEvent.originalTarget['on'+aEvent.type] &&
						!this.findParentNodeByProp(aEvent.originalTarget, 'on'+aEvent.type, 'function')
					)
				)
			)
			)
			return false;

		var targetNode = this.findParentNodeByProp(aEvent.originalTarget, '__tabextensions__on'+aEvent.type, 'function');
		if (targetNode && targetNode.__tabextensions__isNotLink)
			return false;


		// Mozilla fails to hand nsIDOMEvent object to callback function.
		// So we have to create a dummy object like the event object.
		var event = {
				__tabextensions__allowed       : true,
				__tabextensions__browserWindow : TS.browserWindow,
				__tabextensions__tabId  : TS.browser.selectedTab.tabId
			};
		for (var i in aEvent)
		{
			try {
				event[i] = typeof aEvent[i] == 'function' ? this.dummyFunc : aEvent[i] ;
			}
			catch(e) {
			}
		}


		if (targetNode)
			targetNode.__tabextensions__shouldStop = true;

		window.setTimeout(this.isClickEventCanceledCallback, 0, event, aFieldNormalClicks, targetNode);

		return true;
	},
	dummyFunc : function()
	{
	},
	isClickEventCanceledCallback : function(aEvent, aFieldNormalClicks, aTargetNode)
	{
		var target = aTargetNode || TBELinkEventService.findParentNodeByProp(aEvent.originalTarget, '__tabextensions__on'+aEvent.type, 'function');

		// wait the function is completely evaluated
		if (!target.__tabextensions__shouldStop ||
			!('__tabextensions__retVal' in target)) {
			if (target && !target.__tabextensions__shouldStop)
				target.__tabextensions__shouldStop = true;

			window.setTimeout(arguments.callee, 0, aEvent, aFieldNormalClicks, aTargetNode);
			return;
		}

		var canceled = target.__tabextensions__retVal;
		canceled = (canceled === void(0)) ? false : !canceled ;
		delete target.__tabextensions__retVal;
		target.__tabextensions__shouldStop = false;
		target.__tabextensions__shouldVoid = false;
		target.__tabextensions__isNotLink  = false;
		if (!canceled)
			contentAreaClick(aEvent, aFieldNormalClicks);
	},
  
	onContentAreaClick_noBrowserWindow : function(aInfo) 
	{
		var parentEventListener = this.findParentNodeByProp(aInfo.DOMEvent.originalTarget, '__tabextensions__on'+aInfo.DOMEvent.type, 'function');
		if (parentEventListener)
			parentEventListener.__tabextensions__shouldVoid = true;
	},
 
	onContentAreaClick_postProcess : function(aInfo) 
	{
		var parentEventListener = this.findParentNodeByProp(aInfo.DOMEvent.originalTarget, '__tabextensions__on'+aInfo.DOMEvent.type, 'function');
		if (parentEventListener)
			parentEventListener.__tabextensions__shouldStop = true;
	},
  
	// doLinkAction 
	
	onDoLinkAction_preProcess : function(aLinkInfo) 
	{
		var uri  = aLinkInfo.uri;

		if (
			!uri ||
			uri.indexOf('javascript:') != 0 ||
			uri.indexOf('javascript:window.__tabextensions__LastEvent') == 0 ||
			aLinkInfo.causedByLocked ||
			aLinkInfo.causedByAlwaysNewTab ||
			aLinkInfo.causedByMiddleClick ||
			!(aLinkInfo.newTypeBrowserOpenWindow && this.service.winHookMode > 0)
			)
			return;

		var node = aLinkInfo.node;
		var nodeWrapper = new XPCNativeWrapper(node,
				'href',
				'getAttributeNS()',
				'getAttribute()',
				'ownerDocument'
			);

		uri = 'javascript:void(window.__tabextensions__LastEvent = (new Date()).getTime());'+uri.replace(/^javascript:/i, '');
		aLinkInfo.uri = uri;

		if (nodeWrapper.href)
			nodeWrapper.href = uri;
		else if (nodeWrapper.getAttributeNS(this.service.XHTMLNS, 'href'))
			nodeWrapper.setAttributeNS(this.service.XHTMLNS, 'xhtml:href', uri);
		else if (nodeWrapper.getAttributeNS(this.service.XLinkNS, 'href'))
			nodeWrapper.setAttributeNS(this.service.XLinkNS, 'xlink:href', uri);
		else
			nodeWrapper.setAttribute('href', uri);

		window.setTimeout(doLinkActionCallback, 100, node, nodeWrapper, uri);
	},
	doLinkActionCallback : function(aNode, aNodeWrapper, aURI)
	{
		if (
			!aNode ||
			!aNodeWrapper.ownerDocument
			)
			return;

		var docShell = TabbrowserService.getDocShellFromDocument(
				aNodeWrapper.ownerDocument,
				window
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShell)
			);
		if (
			!docShell ||
			docShell
				.QueryInterface(Components.interfaces.nsIWebNavigation)
				.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsIDOMWindow)
				.closed
			)
			return;

		var uri = aURI.replace(/^javascript:void([^;]+);/, 'javascript:');
		if (aNodeWrapper.href)
			aNodeWrapper.href = uri;
		else if (aNodeWrapper.getAttributeNS(TabbrowserService.XHTMLNS, 'href'))
			aNodeWrapper.setAttributeNS(TabbrowserService.XHTMLNS, 'xhtml:href', uri);
		else if (aNodeWrapper.getAttributeNS(TabbrowserService.XLinkNS, 'href'))
			aNodeWrapper.setAttributeNS(TabbrowserService.XLinkNS, 'xlink:href', uri);
		else
			aNodeWrapper.setAttribute('href', uri);
	},
 
	onDoLinkAction_postProcess : function(aLinkInfo) 
	{
		if (
			// When the event object is a dummy, the default action of the links has been canceled. So, we have to load the page manually.
			(aLinkInfo.retVal && '__tabextensions__allowed' in aLinkInfo.DOMEvent) ||
			// If the name is used for XUL window, browser replaces the chrome window itself to the page invalidly...
			// And, this is also for blocking of new windows from links.
			aLinkInfo.target
			) {
			TabbrowserService.loadLinkNormally(aLinkInfo);
			aLinkInfo.retVal = false;
		}
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
	}
  
}; 
  
// Listeners 
	
var gTSOpentabforLinksPrefListener = 
{
	domains : [
		'browser.tabs.opentabfor.links',
		'browser.block.target_new_window',
		'browser.tabs.opentabfor.middleclick'
	],
	observe : function(aSubject, aTopic, aPrefName)
	{
		if (aTopic != 'nsPref:changed') return;
		var TS = TabbrowserService;

		switch (aPrefName)
		{
			case 'browser.tabs.opentabfor.links.targetBehavior':
			case 'browser.block.target_new_window':
				if (
					!TS.getPref('browser.block.target_new_window') &&
					TS.getPref('browser.tabs.opentabfor.links.targetBehavior') > -1
					)
					TS.setPref('browser.block.target_new_window', true);
				break;

			case 'browser.tabs.opentabfor.links.middleClickBehavior':
			case 'browser.tabs.opentabfor.middleclick':
				if (TS.getPref('browser.tabs.opentabfor.middleclick') != (TS.getPref('browser.tabs.opentabfor.links.middleClickBehavior') > 0))
					TS.setPref('browser.tabs.opentabfor.middleclick', TS.getPref('browser.tabs.opentabfor.links.middleClickBehavior') > 0);
				break;

			default:
				break;
		}
	}
};
  
// end of definition 

if (!window.TabbrowserServiceModules)
	window.TabbrowserServiceModules = [];

TabbrowserServiceModules.push(TBELinkEventService);
}
 
