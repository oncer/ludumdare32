var TitleLayer = cc.Layer.extend({
    sprite:null,
    ctor: function() {
        this._super();
		cc.audioEngine.setEffectsVolume(0.5);
		cc.audioEngine.stopMusic();
        this.sprite = new cc.Sprite(res.title_bg_png);
        this.sprite.attr({x:0, y:0, anchorX:0, anchorY:0});
        this.addChild(this.sprite);
		
		
		var text = new cc.LabelBMFont("Touch to play!", res.bmfont);
		text.setPosition(cc.p(160,16));
		text.setLocalZOrder(1);
		this.addChild(text);
		
		var touchlistener = cc.EventListener.create({
			event: cc.EventListener.TOUCH_ONE_BY_ONE,
			swallowTouches: true,                  
			onTouchBegan: function (touch, event) { 
                cc.director.runScene(new cc.TransitionFade(1.0, new CalendarScene(), cc.color(0, 0, 0, 0)));
            }
        });
        cc.eventManager.addListener(touchlistener, this);
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
