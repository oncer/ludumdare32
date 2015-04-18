var res = {
    HelloWorld_png : "res/HelloWorld.png",
    CloseNormal_png : "res/CloseNormal.png",
    CloseSelected_png : "res/CloseSelected.png",
	bakery_bg_png : "res/bakery_bg.png",
	bakery_desk_png : "res/bakery_desk.png",
	bakery_oven_png : "res/bakery_oven.png",
	bakery_roll_png : "res/bakery_roll.png",
	bakery_roll_done_png : "res/bakery_roll_done.png",
	bakery_roll_burnt_png : "res/bakery_roll_burnt.png",
	bakery_roll_dough_png : "res/bakery_roll_dough.png"
};

var g_resources = [];
for (var i in res) {
    g_resources.push(res[i]);
}