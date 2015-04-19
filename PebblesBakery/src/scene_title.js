var TitleLayer = cc.Layer.extend({
    sprite:null,
    ctor: function() {
        this._super();
        this.sprite = new cc.Sprite(res.title_bg_png);
        this.sprite.attr({x:0, y:0, anchorX:0, anchorY:0});
        this.addChild(this.sprite);
		var touchlistener = cc.EventListener.create({
			event: cc.EventListener.TOUCH_ONE_BY_ONE,
			swallowTouches: true,                  
			onTouchBegan: function (touch, event) { 
                cc.director.runScene(new BakeryScene());
            }
        });
    }
});

var TitleScene = cc.Scene.extend({
    space: null,
    animLayer: null,

    onEnter:function() {
        this._super();
        this.addChild(new TitleLayer());
    },
});
