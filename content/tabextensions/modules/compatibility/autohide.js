// start of definition 
if (!window.TBECompatibilityServiceAutoHide) {
	
// static class "TBECompatibilityServiceAutoHide" 
var TBECompatibilityServiceAutoHide =
{
	
	onBeforeInit : function() 
	{
		if (!('autoHIDE' in window)) return;

		autoHIDE.ShowMenu = this.ShowMenu;

		autoHIDE.__tabextensions__InitHide    = autoHIDE.InitHide;
		autoHIDE.InitHide    = this.InitHide;

		autoHIDE.__tabextensions__EndFull     = autoHIDE.EndFull;
		autoHIDE.EndFull     = this.EndFull;

		autoHIDE.__tabextensions__HideToolbar = autoHIDE.HideToolbar;
		autoHIDE.HideToolbar = this.HideToolbar;

		autoHIDE.MoveC        = this.MoveC;
	},
 
	get tabbarXDelta()
	{
		return (gBrowser.mTabbarPlace > 1) ? /*gBrowser.mTabBarSplitter.boxObject.width +*/ TabbrowserService.getPref('browser.tabs.extensions.tabs_width') : 0 ;
	},
 
	ShowMenu : function(aEvent) 
	{
		if (autoHIDE.Popup)
			return;

		if (autoHIDE.ShowM)
			window.clearTimeout(autoHIDE.ShowM);

		var position = gBrowser.mTabbarPlace;
		var barDelta = autoHIDE.delta + 25;
		var tabDelta = TBECompatibilityServiceAutoHide.tabbarXDelta + 25;
		var box      = autoHIDE.Win.boxObject;
		var splitter = gBrowser.mTabBarSplitter;

		if (
			!autoHIDE.Show &&
			(
				(aEvent.screenY == autoHIDE.Win.boxObject.screenY) ||
				(position == 1 && aEvent.screenY == box.screenY + box.height) ||
				(position == 2 && aEvent.screenX <= box.screenX + splitter.boxObject.width) ||
				(position == 3 && aEvent.screenX >= box.screenX + box.width - splitter.boxObject.width)
			)
			)
			autoHIDE.ShowM = window.setTimeout("autoHIDE.HideToolbar()", autoHIDE.delay);

		if (
			autoHIDE.Show &&
			(aEvent.screenY > box.screenY + barDelta) &&
			(position != 1 || aEvent.screenY < box.screenY + box.height - barDelta) &&
			(position != 2 || aEvent.screenX > box.screenX + tabDelta) &&
			(position != 3 || aEvent.screenX < box.screenX + box.width - tabDelta)
			)
			autoHIDE.ShowM = window.setTimeout("autoHIDE.HideToolbar()", 10);
	},
 
	InitHide : function(aEvent)
	{
		this.__tabextensions__InitHide(aEvent);
		if (
			!fullScreen &&
			gBrowser.mTabbarPlace > 1 &&
			!gBrowser.mTabBarSizer
			) {
			var appcontent = document.getElementById('appcontent');
			if (appcontent) {
				var sizer = document.createElement('vbox');
				sizer.setAttribute('maxwidth', 0);
				appcontent.parentNode.insertBefore(sizer, (gBrowser.mTabbarPlace == 2) ? appcontent.nextSibling : appcontent );
				gBrowser.mTabBarSizer = sizer;
			}
		}
	},
 
	EndFull : function()
	{
		this.__tabextensions__EndFull();
		if (gBrowser.mTabBarSizer) {
			gBrowser.mTabBarSizer.parentNode.removeChild(gBrowser.mTabBarSizer);
			gBrowser.mTabBarSizer = null;
		}
	},
 
	HideToolbar : function()
	{
		if (gBrowser.mTabBarSizer) {
			if (this.Show) {
				if (!this.Pref('noFloat')) {
					gBrowser.boxObject.x;
					gBrowser.mTabBarSizer.removeAttribute('style');
					gBrowser.boxObject.x;
				}
			}
			else {
				if (!this.Pref('noFloat')) {
					gBrowser.boxObject.x;
					gBrowser.mTabBarSizer.setAttribute('style',
						((gBrowser.mTabbarPlace == 2) ? 'margin-right' : 'margin-left' )+
						':-'+ TBECompatibilityServiceAutoHide.tabbarXDelta +'px;');
					gBrowser.boxObject.x;
				}
			}
		}
		this.__tabextensions__HideToolbar();
	},
 
	MoveC : function()
	{
		if (!this.Pref('noFloat')) {
			try {
				gBrowser.markupDocumentViewer.move(
					(
						!gBrowser.mTabBarSizer ?
							0 :
						(gBrowser.mTabbarPlace == 2) ?
							-TBECompatibilityServiceAutoHide.tabbarXDelta :
						(gBrowser.mTabbarPlace == 3) ?
							TBECompatibilityServiceAutoHide.tabbarXDelta :
							0
					),
					-this.delta
				);
			}
			catch(e) {
			}
		}
	}
   
}; 

 
// end of definition 

if (!window.TabbrowserServiceModules)
	window.TabbrowserServiceModules = [];

TabbrowserServiceModules.push(TBECompatibilityServiceAutoHide);
}
 
