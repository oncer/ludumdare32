var res = {
    HelloWorld_png : "res/HelloWorld.png",
    CloseNormal_png : "res/CloseNormal.png",
    CloseSelected_png : "res/CloseSelected.png",
	bakery_bg_png : "res/bakery_bg.png",
	bakery_roll_png : "res/bakery_roll.png",
	bakery_dough_portion_png : "res/bakery_dough_portion.png",
	bakery_dough_png : "res/bakery_dough.png",
	bakery_dough_plist : "res/bakery_dough.plist",
	popup_png : "res/popup.png",
	bakery_bar_png : "res/bakery_bar.png",
	bakery_claw_png : "res/bakery_claw.png",
	icon_roll_png : "res/icon_roll.png",
	shop_bg_png : "res/shop_bg.png",
	shop_fg_png : "res/shop_fg.png",
	shop_roll_png : "res/shop_roll.png",
	shop_roll_bubble_png : "res/shop_roll_bubble.png",
	bear_png : "res/bear.png",
	bear_plist : "res/bear.plist",
	enemy_png : "res/enemy.png",
	enemy_plist : "res/enemy.plist",
	egg_png : "res/egg.png",
	egg_plist : "res/egg.plist",
	title_bg_png : "res/title_bg.png",
	cal_bg : "res/cal_bg.png",
	cal_lower : "res/cal_lower.png",
	cal_upper : "res/cal_upper.png",
	bmfont : "res/bmfont.fnt",
	bmfont32 : "res/bmfont32.fnt",
};

var sfx = {
	bakery_grab : "res/sfx/bakery_grab_dough.ogg",
	bakery_bad : "res/sfx/bakery_oven_raw.ogg",
	bakery_good : "res/sfx/bakery_oven_good.ogg",
	bakery_burn : "res/sfx/bakery_oven_burn.ogg",
	bakery_timeup : "res/sfx/bakery_timeup.ogg",
	cal_tear : "res/sfx/tear_paper.ogg",
	buy_roll : "res/sfx/buy_roll.ogg",
	hit_egg : "res/sfx/hit_egg.ogg",
	miss_egg : "res/sfx/miss_egg.ogg",
	egg_splash : "res/sfx/egg_splash.ogg",
};

var g_resources = [];
for (var i in res) {
    g_resources.push(res[i]);
}
for (var i in sfx) {
	g_resources.push(sfx[i]);
}
