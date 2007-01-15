var gBookmarkID;
var gBookmarkURI;
var gBookmarkResource;
var gBookmarkURIResource;
var gInfo = {};

function getIcon()
{
	return TabbrowserService.getIconForBookmark(gBookmarkURI);
}

function setIcon(aIcon)
{
	TabbrowserService.setIconForBookmark(gBookmarkURI, aIcon);
}

function newCommit()
{
	var i;
	var TS = TabbrowserService;

	var allowProps = {
		// <property>      : <enabled by default>
		allowPlugins       : TS.getPref('browser.tabs.extensions.allowPlugins.enabled'),
		allowJavascript    : TS.getPref('browser.tabs.extensions.allowJavascript.enabled'),
		allowMetaRedirects : TS.getPref('browser.tabs.extensions.allowMetaRedirects.enabled'),
		allowSubframes     : TS.getPref('browser.tabs.extensions.allowSubframes.enabled'),
		allowImages        : TS.getPref('browser.tabs.extensions.allowImages.enabled')
	};
	for (i in allowProps)
		if (i in gInfo && gInfo[i] == allowProps[i])
			delete gInfo[i];



	var desc = document.getElementById('description');
	desc.value = TS.createNewBookmarkDescription(gBookmarkID, gInfo, desc.value);

	if (getIcon() != document.getElementById('IconURI').value) {
		try {
			var node = document.getElementById('IconURI');
			var testURI = TS.makeURIFromSpec(node.value);
			TS.iconData.setData(gBookmarkURI, 'IconURI', node.value || void(0));
		}
		catch(e) {
		}
		setIcon(node.value);
	}

	var retVal = __tabextensions__Commit();


	gInfo.uri = gBookmarkURI;

	var w = TS.browserWindows;
	var b;
	var t;

	var j;
	var name = ('useFixedLabel' in gInfo && gInfo.useFixedLabel) ? TS.getNameForBookmark(gBookmarkID) : null ;
	for (i in w)
	{
		b = w[i].TabbrowserService.browser;
		t = b.mTabs;
		for (j = 0; j < t.length; j++)
			if (t[j].getAttribute('tab-bookmarkID') == gBookmarkID) {
				b.initTabWithTabInfo(t[j], gInfo);
				if (name) b.setFixedLabelFor(t[j], name, gBookmarkURI);
			}
	}

	return retVal;
}


function tabextensionsOpenExtraDialog()
{
	window.openDialog('chrome://tabextensions/content/bookmarks/bm-props-extra.xul', '_blank', 'chrome,dialog,modal', gBookmarkID);
}


window.addEventListener(
	'load',
	function()
	{
		var i;
		var TS = TabbrowserService;
		gBookmarkID = window.arguments[0];

		gBookmarkResource = TS.RDF.GetResource(gBookmarkID);

		gBookmarkURI = TS.BookmarksDS.GetTarget(gBookmarkResource, TS.kNC_URL, true);

		gBookmarkURI = gBookmarkURI ? gBookmarkURI.QueryInterface(Components.interfaces.nsIRDFLiteral).Value : null ;
		gBookmarkURIResource = gBookmarkURI ? TS.RDF.GetResource(gBookmarkURI) : null ;


		// don't initialize if this is a folder or a bookmarklet
		if (TS.isBookmarkFolder(gBookmarkResource) ||
			!gBookmarkURI ||
			gBookmarkURI.match(/^javascript:/i)) return;


		var desc = null;
		if (document.documentElement.id == 'bmExtraPropsWindow') {
			document.documentElement.setAttribute('title', document.documentElement.getAttribute('title').replace(/%s/gi, TS.getNameForBookmark(gBookmarkID)));
			desc = document.getElementById('description').value = window.opener.document.getElementById('description').value;
		}
		var info = TS.loadBookmarkStatus(gBookmarkID, null, desc);
		var props = [
				'useFixedLabel',
				'textZoom',
				'locked',
				'referrerBlocked',
				'autoreloadInterval',
				'allowPlugins',
				'allowJavascript',
				'allowMetaRedirects',
				'allowSubframes',
				'allowImages',
				'referrerURI'
			],
			allowProps = {
				// <property>      : <enabled by default>
				allowPlugins       : TS.getPref('browser.tabs.extensions.allowPlugins.enabled'),
				allowJavascript    : TS.getPref('browser.tabs.extensions.allowJavascript.enabled'),
				allowMetaRedirects : TS.getPref('browser.tabs.extensions.allowMetaRedirects.enabled'),
				allowSubframes     : TS.getPref('browser.tabs.extensions.allowSubframes.enabled'),
				allowImages        : TS.getPref('browser.tabs.extensions.allowImages.enabled')
			};

		for (i = 0; i < props.length; i++)
			if (props[i] in info)
				gInfo[props[i]] = info[props[i]];
			else if (props[i] in allowProps)
				gInfo[props[i]] = allowProps[props[i]];


		if (document.documentElement.id == 'bmExtraPropsWindow') {
			initExtraDialog();
		}
		else {
			window.__tabextensions__Commit = window.Commit;
			window.Commit = window.newCommit;

			var extra1 = document.documentElement.getButton('extra1');
			extra1.hidden = false;
			extra1.setAttribute('label', TS.strbundle.GetStringFromName('bookmarksProperty_extra1button'));
			extra1.setAttribute('oncommand', 'tabextensionsOpenExtraDialog();');

			var extraContainer = document.createElement('box');
			extraContainer.setAttribute('collapsed', true);
			document.documentElement.appendChild(extraContainer);

			var iconURI = document.createElement('textbox');
			iconURI.setAttribute('id', 'IconURI');
			iconURI.setAttribute('value', getIcon());
			extraContainer.appendChild(iconURI);
		}

	},
	false
);
