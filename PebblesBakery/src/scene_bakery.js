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
		//console.debug("TEST");
		
		var dough = new Dough(cc.p(32, 8*16));
		this.addChild(dough);
		
		var touchlistener = cc.EventListener.create({
			event: cc.EventListener.TOUCH_ONE_BY_ONE,
			swallowTouches: true,                  
			onTouchBegan: function (touch, event) { 
				// event.getCurrentTarget() returns the *listener's* sceneGraphPriority node.   
				var target = event.getCurrentTarget();  

				//Get the position of the current point relative to the button
				var locationInNode = target.convertToNodeSpace(touch.getLocation());    
				var s = target.getContentSize();
				var rect = cc.rect(0, 0, s.width, s.height);

				//Check the click area
				if (cc.rectContainsPoint(rect, locationInNode)) {       
					//cc.log("sprite began... x = " + locationInNode.x + ", y = " + locationInNode.y);
					//Let target handle touch event
					target.touched();
					return true;
				}
				return false;
			}
		});
		cc.eventManager.addListener(touchlistener, dough);
		
		
		
        return true;
    }
	
});


var Dough = cc.Sprite.extend({
	ctor:function(pos) {
		this._super(res.bakery_roll_dough_png);
		cc.associateWithNative( this, cc.Sprite );
		this.setAnchorPoint(cc.p(0,0));
		this.setPosition(pos);
		return true;
	},
	touched:function()
	{
		this.opacity = 180;
	}
});