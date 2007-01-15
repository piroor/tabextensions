pref("browser.tabs.extensions.default", true);



/* clean up the datasource automatically (sometimes make the startup slow) */
pref("browser.tabs.extensions.auto_cleanUp",       true);
pref("browser.tabs.extensions.auto_cleanUp_count", 0);
/* If "browser.tabs.extensions.auto_cleanUp" is enabled, the counter increases by startup. and when the counter reaches 9, the datasource is cleaned up. */



// In some environments, "window.close" crashs Mozilla.
// We have to use setTimeout to avoid this problem if "window.close" makes a crash.
pref("browser.tabs.extensions.window_auto_close_timeout", false);



pref("browser.tabs.extensions.tab_menu.show",           true);
pref("browser.tabs.extensions.prevent_same_uri_tab",    false);
pref("browser.tabs.extensions.prevent_same_uri_tab.alert.show", true);
pref("browser.tabs.extensions.reuse_current_blank_tab", true);
pref("browser.tabs.extensions.ignore_target",           false);

pref("browser.tabs.extensions.undo_cache.cache_blank_tab", false);
pref("browser.tabs.extensions.undo_cache.local",           10);
pref("browser.tabs.extensions.undo.apply_original_index",  true);


/* window mode
	0 = normal (open other windows)
	1 = hook only requests from content window and other apps
	2 = hook any request include requests from XUL windows
	2 is "single window mode"
*/
pref("browser.tabs.extensions.window_hook_mode",            0);

/* startup page of tabs (for 1.4a or earlier)
	-1 = same to Navigator's startup page
	0  = blank
	1  = home
	2  = last visited

	this setting is replaced to "browser.tabs.loadOnNewTab" in 1.4b or later
*/
pref("browser.tabs.extensions.startup.page",               0);

pref("browser.tabs.extensions.clear_location_bar",         true);
/* to close windows with several tabs:
	-1 = ask always
	0  = allow (close all tabs and the window)
	1  = disallow (don't close window when several tabs are open)
	10 = close the current tab instead of the window
*/
pref("browser.tabs.extensions.window_close.behavior",      -1);
pref("browser.tabs.extensions.window_close.behavior.confirmOnlyForMultipleTabs", true);
pref("browser.tabs.extensions.close_only_tab",             false);


pref("browser.tabs.opentabfor.bookmarks_folder_as_group",   true);
pref("browser.tabs.opentabfor.windowopen",                  false);

pref("browser.tabs.extensions.livemark.behavior.onMiddleClick", 1);
pref("browser.tabs.extensions.livemark.behavior.onItemClick",   -1);
pref("browser.tabs.extensions.platform_native.behavior",        0);
pref("browser.tabs.extensions.platform_native.allow_window_for_homepage", true);

// 0 = top, 1 = bottom, 2 = left, 3 = right
pref("browser.tabs.extensions.tabbar_place", 0);
pref("browser.tabs.extensions.tab.invert_appearance.right",  true);
pref("browser.tabs.extensions.show_closebox.tabbar", true);
/*
	-1 = never
	0  = button on overflow
	4  = button always
	1  = scrollbar on overflow
	2  = scrollbar always
	3  = multirow
*/
pref("browser.tabs.extensions.tab_scroller",         0);
pref("browser.tabs.extensions.tabbar_max_row",       3);
pref("browser.tabs.extensions.show_blankspaces",     false);
/*
	0 = hide only tabbar
	1 = unload the tab
	2 = ignore
	3 = close the last tab
	4 = close the window
*/
pref("browser.tabs.extensions.last_tab_closing",     1);
pref("browser.tabs.extensions.limit.number",         0);
pref("browser.tabs.extensions.limit.overflow",       true);
pref("browser.tabs.extensions.tabbar.smooth_scrolling",          true);
pref("browser.tabs.extensions.tabbar.smooth_scrolling.timeout",  200);
pref("browser.tabs.extensions.tabbar.smooth_scrolling.interval", 10);

/* If you set to "true", following shortcuts are available:
	Shift+Alt+Up   : Focus to the previously selected tab
	Shift+Alt+Down : Focus to the next selected tab

	ex.:
	Tere are four tabs [A][B][C][D] and select [A]->[B]->[C]->[D],
	step 1. [Shift+Alt+Left]  > [C] is focused
	step 2. [Shift+Alt+Left]  > [B] is focused
	step 3. [Shift+Alt+Left]  > [A] is focused
	step 4. [Shift+Alt+Right] > [B] is focused
	step 5. [Shift+Alt+Right] > [C] is focused
	step 6. [Shift+Alt+Right] > [D] is focused
*/
pref("browser.tabs.extensions.focus_with_selected_order",      false);


pref("browser.tabs.extensions.show_progress.tab",       true);
pref("browser.tabs.extensions.show_progress.status",    false);
pref("browser.tabs.extensions.thumbnail.enabled",       false);
pref("browser.tabs.extensions.thumbnail.width",         -1);
pref("browser.tabs.extensions.thumbnail.width.default",  60);
pref("browser.tabs.extensions.thumbnail.height",        -1);
pref("browser.tabs.extensions.thumbnail.height.default", 45);
pref("browser.tabs.extensions.thumbnail.power",         30);
pref("browser.tabs.extensions.highlight_current",       false);
pref("browser.tabs.extensions.highlight_current.style", "");
pref("browser.tabs.extensions.highlight_unread",        false);
pref("browser.tabs.extensions.highlight_unread.style",  "italic text-red");
// -1 = none, 0 = always, 1 = only for current, 2 = only for pointed
pref("browser.tabs.extensions.show_closebox.tab",       -1);
pref("browser.tabs.extensions.show_closebox.tab.delay", 500);
pref("browser.tabs.extensions.show_closebox.tab.hide_delay", -1); // -1: inherit
pref("browser.tabs.extensions.show_closebox.tab.appearance", "builtin");
pref("browser.tabs.extensions.show_link_text_as_label",             true);
pref("browser.tabs.extensions.show_link_text_as_label_permanently", false);
// 0 = start, 1 = center, 2 = end
pref("browser.tabs.extensions.tabs_title_crop",      2);
// 0 = fit to window, 1 = fit to label, 2 = fix
pref("browser.tabs.extensions.tabs_width_type",      0);
pref("browser.tabs.extensions.tabs_width",           150);
pref("browser.tabs.extensions.tabs_min_width",       30);
pref("browser.tabs.extensions.tabs_max_width",       250);
// 0 = in left edge, 1 = left, 2 = right, 3 = in right edge
pref("browser.tabs.extensions.open_tab_in",          3);
// -1 = same to above
pref("browser.tabs.extensions.open_tab_in_link",     -1);
// if true, the behavior of tab dragging/dropping goes back to the old behavior.
pref("browser.tabs.extensions.dragdrop.only_load_uri", false);
pref("browser.tabs.extensions.dragdrop.indicator",     'default');
pref("browser.tabs.extensions.vertical.narrow_tabs",   true);


pref("browser.tabs.extensions.slow_down_autoreload_in_background.enabled", false);
pref("browser.tabs.extensions.slow_down_autoreload_in_background.rate", 5);


/*
opentabfor behavior:
	-1 = no special operation (no reaction or parse normally)
	0  = open in current tab
	1  = open in new active tab
	2  = open in new background tab
*/
pref("browser.tabs.opentabfor.urlbar.behavior",                    0);
pref("browser.tabs.opentabfor.urlbar.foreignDomainBehavior",       -1);
pref("browser.tabs.opentabfor.urlbar.modifierKeyEnterBehavior",    1);
pref("browser.tabs.opentabfor.searchbar.behavior",                 0);
pref("browser.tabs.opentabfor.searchbar.foreignDomainBehavior",    -1);
pref("browser.tabs.opentabfor.searchbar.modifierKeyEnterBehavior", 1);
pref("browser.tabs.opentabfor.contextsearch.behavior",             -1);
pref("browser.tabs.opentabfor.contextsearch.useSearchBox",         false);
pref("browser.tabs.opentabfor.links.behavior",                     0);
pref("browser.tabs.opentabfor.links.lockedBehavior",               1);
pref("browser.tabs.opentabfor.links.targetBehavior",               -1);
pref("browser.tabs.opentabfor.links.middleClickBehavior",          1);
pref("browser.tabs.opentabfor.links.outerBehavior",                1);
// 0 = disable, 1 = different domain, 2 = different user or domain
pref("browser.tabs.opentabfor.outerlink.level",                    1);
// 0 = disable, 1 = only for tabs automatically opened, 2 = any new tab
pref("browser.tabs.opentabfor.links.block_uri.type",               1);
pref("browser.tabs.opentabfor.links.block_uri.rule",               "zip rar exe jar xpi tar jar gzip gz tgz ace bin doc xls mdb ppt iso 7z cab arj lzh uue torrent /view=att&disp=attd/ php\\?attachmentid=.* php\\?act=Attach&type=post&id=.* /download.(php|asp)\\?*/");
pref("browser.tabs.opentabfor.bookmarks.behavior",                 0);
pref('browser.tabs.opentabfor.bookmarks.middleClickBehavior',      1);
pref("browser.tabs.opentabfor.history.behavior",                   0);
pref("browser.tabs.opentabfor.history.middleClickBehavior",        1);
pref("browser.tabs.opentabfor.goToHistoryIndex.behavior",          0);
pref("browser.tabs.opentabfor.goToHistoryIndex.middleClickBehavior", 2);

pref("browser.tabs.extensions.view_source_tab",                    false);



pref("browser.tabs.extensions.locked.enabled",               false);
pref("browser.tabs.extensions.referrerBlocked.enabled",      false);
pref("browser.tabs.extensions.allowPlugins.enabled",         true);
pref("browser.tabs.extensions.allowJavascript.enabled",      true);
pref("browser.tabs.extensions.allowMetaRedirects.enabled",   true);
pref("browser.tabs.extensions.allowSubframes.enabled",       true);
pref("browser.tabs.extensions.allowImages.enabled",          true);
pref("browser.tabs.extensions.overlay_icon",                 true);
pref("browser.tabs.extensions.keep_tab_status",              false);
pref("browser.tabs.extensions.control_refresh",              true);

pref("browser.tabs.extensions.inherit.onlySameSite",         true);
pref("browser.tabs.extensions.inherit.textZoom",             true);
pref("browser.tabs.extensions.inherit.locked",               false);
pref("browser.tabs.extensions.inherit.referrerBlocked",      true);
pref("browser.tabs.extensions.inherit.allow",                true);

pref("browser.tabs.extensions.inherit.group.textZoom",        false);
pref("browser.tabs.extensions.inherit.group.locked",          false);
pref("browser.tabs.extensions.inherit.group.referrerBlocked", true);
pref("browser.tabs.extensions.inherit.group.allow",           true);


pref("browser.tabs.extensions.bookmarks.use_fixed_label",    false);
pref("browser.tabs.extensions.bookmarks.open_child_folders", false);
pref("browser.tabs.extensions.bookmarks.save_status",        true);
pref("browser.tabs.extensions.bookmarks.save_permissions",   true);
pref("browser.tabs.extensions.bookmarks.save_textZoom",      true);


pref("browser.tabs.extensions.loadInBackgroundNewTab",      false);
pref("browser.tabs.extensions.loadInBackgroundHistory",     false);
pref("browser.tabs.extensions.loadInBackgroundJS",          false);
pref("browser.tabs.extensions.loadInBackgroundPlatformNative", false);
pref("browser.tabs.extensions.loadInBackgroundViewSource",  false);

pref("browser.tabs.extensions.loadInBackgroundWindow",       false);
pref("browser.tabs.extensions.loadInBackgroundWindow.platformNative", false);
pref("browser.tabs.extensions.loadInBackgroundWindow.platformNative.inherit", true);

/* next focused tab when the current tab is closed
	0 = left tab (Default at Moz1.0)
	1 = right tab (Default at Moz1.1)
	2 = focus to the previously made
	3 = focus to the previously selected
*/
pref("browser.tabs.extensions.direction_of_focusing",          1);
pref("browser.tabs.extensions.direction_of_focusing.back_to_base_tab", false);
pref("browser.tabs.extensions.direction_of_focusing.in_group", true);


pref("browser.tabs.extensions.showNewActiveTabItem.bookmarks", true);
pref("browser.tabs.extensions.showNewActiveTabItem.links",  true);
pref("browser.tabs.extensions.showThisTabItem.bookmarks",   true);
pref("browser.tabs.extensions.showThisTabItem.links",       true);
pref("browser.tabs.extensions.show_item.newTab",            true);
pref("browser.tabs.extensions.show_item.bookmarkGroup",     true);
pref("browser.tabs.extensions.show_item.reloadTab",         true);
pref("browser.tabs.extensions.show_item.reloadAll",         true);
pref("browser.tabs.extensions.show_item.moveLeft",          false);
pref("browser.tabs.extensions.show_item.moveRight",         false);
pref("browser.tabs.extensions.show_item.duplicateTab",      true);
pref("browser.tabs.extensions.show_item.duplicateInWindow", false);
pref("browser.tabs.extensions.show_item.setFixedLabelFor",  true);
pref("browser.tabs.extensions.show_item.lockTab",           true);
pref("browser.tabs.extensions.show_item.lockTabAll",        false);
pref("browser.tabs.extensions.show_item.blockReferrer",     true);
pref("browser.tabs.extensions.show_item.blockReferrerAll",  false);
pref("browser.tabs.extensions.show_item.autoreload",        true);
pref("browser.tabs.extensions.show_item.autoreloadAll",     false);
pref("browser.tabs.extensions.show_item.allow",             true);
pref("browser.tabs.extensions.show_item.removeTab",         true);
pref("browser.tabs.extensions.show_item.removeTabGroup",    false);
pref("browser.tabs.extensions.show_item.removeLeft",        true);
pref("browser.tabs.extensions.show_item.removeRight",       true);
pref("browser.tabs.extensions.show_item.removeAll",         false);
pref("browser.tabs.extensions.show_item.removeVisited",     false);
pref("browser.tabs.extensions.show_item.removeOther",       true);
pref("browser.tabs.extensions.show_item.undoRemoveTab",     true);
pref("browser.tabs.extensions.show_item.editBookmark",      false);
pref("browser.tabs.extensions.show_item.collapseExpandGroup", true);
pref("browser.tabs.extensions.show_item.sortTabsByGroup",   false);
pref("browser.tabs.extensions.show_item.highlightGroup",    false);
pref("browser.tabs.extensions.show_item.setTabColorFor",  true);
pref("browser.tabs.extensions.show_item.editMenu",          true);
//pref("browser.tabs.extensions.show_context.openLinkInNewActiveTab",  true);
pref("browser.tabs.extensions.show_context.openAllLinksInTabs",      true);
pref("browser.tabs.extensions.show_context.openAllLinksInGroup",     true);
pref("browser.tabs.extensions.show_context.bookmarkAllLinksAsGroup", true);
pref("browser.tabs.extensions.show_context.bookmarkTabGroup",        false);


pref("browser.tabs.extensions.group.enabled",              false);
pref("browser.tabs.extensions.group.auto_purge_root",      false);
pref("browser.tabs.extensions.group.auto_purge",           false);
pref("browser.tabs.extensions.group.auto_color",           true);
pref("browser.tabs.extensions.group.edit_simple_dragdrop", false);

pref("browser.tabs.extensions.group.tree.enabled",                   false);
pref("browser.tabs.extensions.group.tree.animation.collapse_expand", true);
pref("browser.tabs.extensions.group.tree.max_level",                 3);
// 0 = do normal operation (hidden setting, buggy), 1 = purge all of children, 2 = remove all of children
pref("browser.tabs.extensions.group.tree.on_subgroup_root_removed",  1);
pref("browser.tabs.extensions.group.tree.simple_operation",          false);

pref("browser.tabs.extensions.group.open_bookmarkgroup_as_group", true);
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
pref("browser.tabs.extensions.bookmarkgroup_behavior",            0);





/*
	-1  = show context menu (only for right click)

	0   = none
	1   = New Tab
	2   = Reload Tab
	3   = Reload All Tabs
	4   = Close Tab
	5   = Close Other Tabs
	6   = Bookmark Group of Tabs as a Bookmark-Group

	101 = Duplicate Tab
	102 = Lock Tab
	103 = Auto Reload
	104 = Close Left Tabs
	105 = Close Right Tabs
	106 = Duplicate Tab in New Window
	107 = Move to Left
	108 = Move to Right
	109 = Close Group of Tabs
	110 = Sort Tabs by Group
	111 = Highlight Group of Tabs
	112 = Set Group Color
	113 = Undo Close Tab
	114 = Edit Bookmark
	115 = Block Referrer
	116 = Edit Context Menu
	117 = Remove All Tabs
	118 = Set Label
	119 = Remove Visited Tabs

	200 = Allow/Forbid Plugins
	201 = Allow/Forbid JavaScript
	202 = Allow/Forbid Redirects by Meta
	203 = Allow/Forbid Frames
	204 = Allow/Forbid Images

	300 = Lock All Tabs
	301 = Block Referrer from All Tabs
	302 = Auto Reload for All Tabs

	400 = Collapse/Expand Subgroup
*/
pref("browser.tabs.extensions.tabbar_ondblclick",    1);
pref("browser.tabs.extensions.tabbar_onmiddleclick", 113);
pref("browser.tabs.extensions.tabbar_onrightclick",  -1);
pref("browser.tabs.extensions.tabbar_onshiftclick",  0);
pref("browser.tabs.extensions.tabbar_onctrlclick",   113);
pref("browser.tabs.extensions.tabbar_onaltclick",    0);

// same to "browser.tabs.extensions.tabbar_on***"
pref("browser.tabs.extensions.ondblclick",    0);
pref("browser.tabs.extensions.onmiddleclick", 4);
pref("browser.tabs.extensions.onrightclick",  -1);
pref("browser.tabs.extensions.onshiftclick",  0);
pref("browser.tabs.extensions.onctrlclick",   4);
pref("browser.tabs.extensions.onaltclick",    400);

pref("browser.tabs.extensions.focus_with_drag",                false);
//pref("browser.tabs.extensions.focus_with_dragover",            true);
//pref("browser.tabs.extensions.focus_with_dragover.delay",      200);
pref("browser.tabs.extensions.focus_with_mouseover",           false);
pref("browser.tabs.extensions.focus_with_mouseover.delay",     100);

pref("browser.tabs.extensions.tabFlip",       false);
pref("browser.tabs.extensions.tabFlip.delay", 250);
pref("browser.tabs.extensions.tabFlip.roop",  false);

pref("browser.tabs.extensions.switch_tabs_by_wheel", false);
pref("browser.tabs.extensions.switch_tabs_by_wheel.count", 1);
pref("browser.tabs.extensions.switch_tabs_by_wheel.roop",  true);




pref("browser.tabs.extensions.back_to_ancestor",     true);
pref("browser.tabs.extensions.forward_to_following", true);






pref("browser.tabs.extensions.autoreload.lastInterval", 0);






pref("browser.tabs.extensions.bypass_referrerblocker", false);
pref("browser.tabs.extensions.bypass_referrerblocker.list", "ime.nu/|ime.st/|pinktower.com/");



pref("browser.tabs.extensions.preventToModifyWindowState.timeout", 3000);



// default settings from firefox.js, all.js, etc.
pref("browser.tabs.loadInBackground", true);
pref("browser.tabs.autoHide", true);
