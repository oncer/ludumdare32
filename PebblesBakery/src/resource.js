var res = {
    HelloWorld_png : "res/HelloWorld.png",
    CloseNormal_png : "res/CloseNormal.png",
    CloseSelected_png : "res/CloseSelected.png",
	bakery_bg_png : "res/bakery_bg.png",
	bakery_roll_raw_png : "res/bakery_roll_raw.png",
	bakery_roll_done_png : "res/bakery_roll_done.png",
	bakery_roll_burnt_png : "res/bakery_roll_burnt.png",
	bakery_dough_png : "res/bakery_dough.png",
	bakery_dough_knead1_png : "res/bakery_dough_knead1.png",
	bakery_dough_knead2_png : "res/bakery_dough_knead2.png",
	bakery_dough_portion_png : "res/bakery_dough_portion.png"
};

var g_resources = [];
for (var i in res) {
    g_resources.push(res[i]);
}