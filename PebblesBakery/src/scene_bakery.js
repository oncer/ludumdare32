// Create scene and add layers
var BakeryScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var bgLayer = new BakeryBGLayer();
        var gameLayer = new BakeryGameLayer();
        this.addChild(bgLayer);
        this.addChild(gameLayer);
    }
});

// Background
var BakeryBGLayer = cc.Layer.extend({
    sprite:null,
    ctor:function () {
        this._super();
		
		var spriteBG = new cc.Sprite(res.bakery_bg_png);
		/*spriteBG.position=cc.p(0,0);
		spriteBG.attr({
            x: 0,
			y: 0,
			anchorX: 0,
			anchorY: 0
        });*/
		spriteBG.setAnchorPoint(cc.p(0,0));
        this.addChild(spriteBG);
		
        return true;
    }
});

// Gameplay / Main layer
var BakeryGameLayer = cc.Layer.extend({
    sprite:null,
    ctor:function () {
        this._super();
		//...
        return true;
    }
});
