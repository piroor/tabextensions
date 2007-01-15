// Tabbrowser Extensions preferences
pref("browser.tabs.extensions.default", true);
pref("browser.tabs.extensions.auto_cleanUp", true);
pref("browser.tabs.extensions.auto_cleanUp_count", 8);
pref("browser.tabs.extensions.window_auto_close_timeout", false);
pref("browser.tabs.extensions.tab_menu.show", true);
pref("browser.tabs.extensions.prevent_same_uri_tab", true);
pref("browser.tabs.extensions.prevent_same_uri_tab.alert.show", false);
pref("browser.tabs.extensions.reuse_current_blank_tab", true);
pref("browser.tabs.extensions.ignore_target", false);
pref("browser.tabs.extensions.undo_cache.cache_blank_tab", false);
pref("browser.tabs.extensions.undo_cache.local", 3);
pref("browser.tabs.extensions.undo.apply_original_index", true);
pref("browser.tabs.extensions.window_hook_mode", 1);
pref("browser.tabs.extensions.startup.page", 0);
pref("browser.tabs.extensions.clear_location_bar", true);
pref("browser.tabs.extensions.window_close.behavior", -1);
pref("browser.tabs.extensions.window_close.behavior.confirmOnlyForMultipleTabs", true);
pref("browser.tabs.extensions.close_only_tab", false);
pref("browser.tabs.opentabfor.bookmarks_folder_as_group", true);
pref("browser.tabs.opentabfor.windowopen", true);
pref("browser.tabs.extensions.livemark.behavior.onMiddleClick", 1);
pref("browser.tabs.extensions.livemark.behavior.onItemClick", -1);
pref("browser.tabs.extensions.platform_native.behavior", 2);
pref("browser.tabs.extensions.platform_native.allow_window_for_homepage", true);
pref("browser.tabs.extensions.tabbar_place", 2);
pref("browser.tabs.extensions.show_closebox.tabbar", false);
pref("browser.tabs.extensions.tab_scroller", 1);
pref("browser.tabs.extensions.tabbar_max_row", 3);
pref("browser.tabs.extensions.show_blankspaces", false);
pref("browser.tabs.extensions.switch_tabs_by_wheel",       false);
pref("browser.tabs.extensions.switch_tabs_by_wheel.count", 1);
pref("browser.tabs.extensions.switch_tabs_by_wheel.roop", true);
pref("browser.tabs.extensions.last_tab_closing", 1);
pref("browser.tabs.extensions.limit.number", 0);
pref("browser.tabs.extensions.limit.overflow", true);
pref("browser.tabs.extensions.tabbar.smooth_scrolling", true);
pref("browser.tabs.extensions.tabbar.smooth_scrolling.timeout", 200);
pref("browser.tabs.extensions.tabbar.smooth_scrolling.interval", 10);
pref("browser.tabs.extensions.tabbar_ondblclick", 1);
pref("browser.tabs.extensions.tabbar_onmiddleclick", 113);
pref("browser.tabs.extensions.tabbar_onrightclick", -1);
pref("browser.tabs.extensions.tabbar_onshiftclick", 0);
pref("browser.tabs.extensions.tabbar_onctrlclick", 113);
pref("browser.tabs.extensions.tabbar_onaltclick", 0);
pref("browser.tabs.extensions.focus_with_selected_order", false);
pref("browser.tabs.extensions.show_progress.tab", true);
pref("browser.tabs.extensions.show_progress.status", true);
pref("browser.tabs.extensions.highlight_current", true);
pref("browser.tabs.extensions.highlight_current.style", (new String("bold text-highlight bg-highlight")).valueOf());
pref("browser.tabs.extensions.highlight_unread", false);
pref("browser.tabs.extensions.highlight_unread.style", (new String("italic text-red")).valueOf());
pref("browser.tabs.extensions.show_closebox.tab", 0);
pref("browser.tabs.extensions.show_closebox.tab.delay", 500);
pref("browser.tabs.extensions.show_closebox.tab.hide_delay", -1);
pref("browser.tabs.extensions.show_closebox.tab.appearance", (new String("builtin")).valueOf());
pref("browser.tabs.extensions.show_link_text_as_label", true);
pref("browser.tabs.extensions.show_link_text_as_label_permanently", false);
pref("browser.tabs.extensions.tabs_title_crop", 2);
pref("browser.tabs.extensions.tabs_width_type", 2);
pref("browser.tabs.extensions.tabs_width", 200);
pref("browser.tabs.extensions.tabs_min_width", 30);
pref("browser.tabs.extensions.tabs_max_width", 250);
pref("browser.tabs.extensions.open_tab_in", 3);
pref("browser.tabs.extensions.open_tab_in_link", -1);
pref("browser.tabs.extensions.dragdrop.only_load_uri", false);
pref("browser.tabs.extensions.dragdrop.indicator", (new String("old")).valueOf());
pref("browser.tabs.extensions.ondblclick", 2);
pref("browser.tabs.extensions.onmiddleclick", 4);
pref("browser.tabs.extensions.onrightclick", -1);
pref("browser.tabs.extensions.onshiftclick", 0);
pref("browser.tabs.extensions.onctrlclick", 4);
pref("browser.tabs.extensions.onaltclick", 0);
pref("browser.tabs.extensions.tabFlip", false);
pref("browser.tabs.extensions.tabFlip.delay", 250);
pref("browser.tabs.extensions.tabFlip.roop", false);
pref("browser.tabs.extensions.slow_down_autoreload_in_background.enabled", false);
pref("browser.tabs.extensions.slow_down_autoreload_in_background.rate", 5);
pref("browser.tabs.opentabfor.urlbar.behavior", 1);
pref("browser.tabs.opentabfor.urlbar.foreignDomainBehavior", 1);
pref("browser.tabs.opentabfor.urlbar.modifierKeyEnterBehavior", 1);
pref("browser.tabs.opentabfor.searchbar.behavior", 1);
pref("browser.tabs.opentabfor.searchbar.foreignDomainBehavior", -1);
pref("browser.tabs.opentabfor.searchbar.modifierKeyEnterBehavior", 1);
pref("browser.tabs.opentabfor.contextsearch.behavior", 1);
pref("browser.tabs.opentabfor.contextsearch.useSearchBox", false);
pref("browser.tabs.opentabfor.links.behavior", 1);
pref("browser.tabs.opentabfor.links.lockedBehavior", 1);
pref("browser.tabs.opentabfor.links.targetBehavior", 1);
pref("browser.tabs.opentabfor.links.middleClickBehavior", 2);
pref("browser.tabs.opentabfor.links.outerBehavior", -1);
pref("browser.tabs.opentabfor.outerlink.level", 1);
pref("browser.tabs.opentabfor.links.block_uri.type", 1);
pref("browser.tabs.opentabfor.links.block_uri.rule", (new String("zip rar exe jar xpi tar jar gzip gz tgz ace bin doc xls mdb ppt iso 7z cab arj lzh uue torrent /view=att&disp=attd/ php\\?attachmentid=.* php\\?act=Attach&type=post&id=.* /download.(php|asp)\\?*/")).valueOf());
pref("browser.tabs.opentabfor.bookmarks.behavior", 1);
pref("browser.tabs.opentabfor.bookmarks.middleClickBehavior", 1);
pref("browser.tabs.opentabfor.history.behavior", 1);
pref("browser.tabs.opentabfor.history.middleClickBehavior", 1);
pref("browser.tabs.opentabfor.goToHistoryIndex.behavior", 0);
pref("browser.tabs.opentabfor.goToHistoryIndex.middleClickBehavior", 2);
pref("browser.tabs.extensions.view_source_tab", false);
pref("browser.tabs.extensions.locked.enabled", false);
pref("browser.tabs.extensions.referrerBlocked.enabled", false);
pref("browser.tabs.extensions.allowPlugins.enabled", true);
pref("browser.tabs.extensions.allowJavascript.enabled", true);
pref("browser.tabs.extensions.allowMetaRedirects.enabled", true);
pref("browser.tabs.extensions.allowSubframes.enabled", true);
pref("browser.tabs.extensions.allowImages.enabled", true);
pref("browser.tabs.extensions.overlay_icon", true);
pref("browser.tabs.extensions.keep_tab_status", false);
pref("browser.tabs.extensions.control_refresh", false);
pref("browser.tabs.extensions.inherit.onlySameSite", true);
pref("browser.tabs.extensions.inherit.textZoom", true);
pref("browser.tabs.extensions.inherit.locked", false);
pref("browser.tabs.extensions.inherit.referrerBlocked", true);
pref("browser.tabs.extensions.inherit.allow", true);
pref("browser.tabs.extensions.inherit.group.textZoom", false);
pref("browser.tabs.extensions.inherit.group.locked", false);
pref("browser.tabs.extensions.inherit.group.referrerBlocked", true);
pref("browser.tabs.extensions.inherit.group.allow", true);
pref("browser.tabs.extensions.bookmarks.use_fixed_label", false);
pref("browser.tabs.extensions.bookmarks.open_child_folders", false);
pref("browser.tabs.extensions.bookmarks.save_status", true);
pref("browser.tabs.extensions.bookmarks.save_permissions", true);
pref("browser.tabs.extensions.bookmarks.save_textZoom", true);
pref("browser.tabs.extensions.loadInBackgroundNewTab", false);
pref("browser.tabs.extensions.loadInBackgroundHistory", false);
pref("browser.tabs.extensions.loadInBackgroundJS", false);
pref("browser.tabs.extensions.loadInBackgroundPlatformNative", false);
pref("browser.tabs.extensions.loadInBackgroundViewSource", false);
pref("browser.tabs.extensions.loadInBackgroundWindow", false);
pref("browser.tabs.extensions.loadInBackgroundWindow.platformNative", false);
pref("browser.tabs.extensions.loadInBackgroundWindow.platformNative.inherit", true);
pref("browser.tabs.extensions.direction_of_focusing", 1);
pref("browser.tabs.extensions.direction_of_focusing.back_to_base_tab", false);
pref("browser.tabs.extensions.direction_of_focusing.in_group", true);
pref("browser.tabs.extensions.focus_with_mouseover", false);
pref("browser.tabs.extensions.focus_with_mouseover.delay", 100);
pref("browser.tabs.extensions.showNewActiveTabItem.bookmarks", true);
pref("browser.tabs.extensions.showNewActiveTabItem.links", true);
pref("browser.tabs.extensions.showThisTabItem.bookmarks", true);
pref("browser.tabs.extensions.showThisTabItem.links", true);
pref("browser.tabs.extensions.show_item.newTab", true);
pref("browser.tabs.extensions.show_item.bookmarkGroup", true);
pref("browser.tabs.extensions.show_item.reloadTab", true);
pref("browser.tabs.extensions.show_item.reloadAll", true);
pref("browser.tabs.extensions.show_item.moveLeft", false);
pref("browser.tabs.extensions.show_item.moveRight", false);
pref("browser.tabs.extensions.show_item.duplicateTab", false);
pref("browser.tabs.extensions.show_item.duplicateInWindow", false);
pref("browser.tabs.extensions.show_item.setFixedLabelFor", false);
pref("browser.tabs.extensions.show_item.lockTab", false);
pref("browser.tabs.extensions.show_item.lockTabAll", false);
pref("browser.tabs.extensions.show_item.blockReferrer", false);
pref("browser.tabs.extensions.show_item.blockReferrerAll", false);
pref("browser.tabs.extensions.show_item.autoreload", false);
pref("browser.tabs.extensions.show_item.autoreloadAll", false);
pref("browser.tabs.extensions.show_item.allow", false);
pref("browser.tabs.extensions.show_item.removeTab", true);
pref("browser.tabs.extensions.show_item.removeTabGroup", true);
pref("browser.tabs.extensions.show_item.removeLeft", true);
pref("browser.tabs.extensions.show_item.removeRight", true);
pref("browser.tabs.extensions.show_item.removeAll", true);
pref("browser.tabs.extensions.show_item.removeVisited", false);
pref("browser.tabs.extensions.show_item.removeOther", true);
pref("browser.tabs.extensions.show_item.undoRemoveTab", true);
pref("browser.tabs.extensions.show_item.editBookmark", true);
pref("browser.tabs.extensions.show_item.collapseExpandGroup", true);
pref("browser.tabs.extensions.show_item.sortTabsByGroup", false);
pref("browser.tabs.extensions.show_item.highlightGroup", false);
pref("browser.tabs.extensions.show_item.setTabColorFor", false);
pref("browser.tabs.extensions.show_item.editMenu", true);
pref("browser.tabs.extensions.show_context.openAllLinksInTabs", true);
pref("browser.tabs.extensions.show_context.openAllLinksInGroup", false);
pref("browser.tabs.extensions.show_context.bookmarkAllLinksAsGroup", false);
pref("browser.tabs.extensions.show_context.bookmarkTabGroup", false);
pref("browser.tabs.extensions.group.enabled", true);
pref("browser.tabs.extensions.group.auto_purge_root", false);
pref("browser.tabs.extensions.group.auto_purge", false);
pref("browser.tabs.extensions.group.auto_color", false);
pref("browser.tabs.extensions.group.edit_simple_dragdrop", false);
pref("browser.tabs.extensions.group.tree.enabled", true);
pref("browser.tabs.extensions.group.tree.animation.collapse_expand", false);
pref("browser.tabs.extensions.group.tree.max_level", 3);
pref("browser.tabs.extensions.group.tree.on_subgroup_root_removed", 1);
pref("browser.tabs.extensions.group.tree.simple_operation", false);
pref("browser.tabs.extensions.group.open_bookmarkgroup_as_group", true);
pref("browser.tabs.extensions.bookmarkgroup_behavior", 0);
pref("browser.tabs.extensions.autoreload.lastInterval", 0);
pref("browser.tabs.extensions.bypass_referrerblocker", false);
pref("browser.tabs.extensions.bypass_referrerblocker.list", (new String("ime.nu/|ime.st/|pinktower.com/")).valueOf());
pref("browser.tabs.extensions.preventToModifyWindowState.timeout", 3000);
pref("browser.tabs.loadInBackground", false);
pref("browser.tabs.autoHide", false);
pref("browser.tabs.extensions.use_multirow_rearrangable_tabs", false);
pref("browser.tabs.extensions.undo_cache.global", 5);
pref("browser.tabs.extensions.thumbnail.enabled", true);
pref("browser.tabs.extensions.back_to_ancestor",     true);
pref("browser.tabs.extensions.forward_to_following", true);
pref("browser.tabs.extensions.focus_with_drag",      true);
pref("browser.tabs.extensions.thumbnail.power",      20);