// start of definition 
if (!window.TBECompatibilityServiceSplitBrowser) {
	
// static class "TBECompatibilityServiceSplitBrowser" 
var TBECompatibilityServiceSplitBrowser =
{
	
	onBeforeInit : function() 
	{
		if (!('SplitBrowser' in window)) return;

		TBEClickEventService.getBrowserForContentAreaClick = this.getBrowserForContentAreaClick;
	},
 
	getBrowserForContentAreaClick : function(aEvent, aBrowserWindow) 
	{
		if (!aBrowserWindow) return null;

		var d = aEvent.target.ownerDocument;
		var b = aBrowserWindow.SplitBrowser.getBrowserFromFrame(d.defaultView.top);
		if (b) {
			return b.browser;
		}

		return (aBrowserWindow ? aBrowserWindow.TabbrowserService.browser : null );
	}
   
}; 

 
// end of definition 

if (!window.TabbrowserServiceModules)
	window.TabbrowserServiceModules = [];

TabbrowserServiceModules.push(TBECompatibilityServiceSplitBrowser);
}
 
