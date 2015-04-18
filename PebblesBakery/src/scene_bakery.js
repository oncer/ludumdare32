// Create scene and add layers
var BakeryScene = cc.Scene.extend({
	gameLayer:null,
    onEnter:function () {
        this._super();
        var bgLayer = new BakeryBGLayer();
        gameLayer = new BakeryGameLayer();
        this.addChild(bgLayer);
        this.addChild(gameLayer);
		this.scheduleUpdate();
    },
	update:function(dt)
	{
		gameLayer.update(dt);
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

var BSTATES =
{
	IDLE : 0,
	DRAG1 : 1,
	KNEADING : 2,
	DRAG2 : 3
};

// Gameplay / Main layer
var BakeryGameLayer = cc.Layer.extend({
    sprite:null,
	state:BSTATES.IDLE,
	draggeddoughsprite:null,
	draggedrollsprite:null,
	touchPos:null,
	touching:false,
	dough:null,
	desk:null,
	oven:null,
    ctor:function () {
        this._super();
		//console.debug("TEST");
		state = BSTATES.IDLE;
		touching = false;
		
		dough = new Dough(cc.p(2*16, 8*16));
		desk = new Desk(cc.p(5*16, 1*16));
		oven = new Oven(cc.p(12*16, 3*16));
		draggeddoughsprite = new cc.Sprite(res.bakery_roll_dough_png);
		draggedrollsprite = new cc.Sprite(res.bakery_roll_png);
		this.addChild(dough);
		this.addChild(desk);
		this.addChild(oven);
		//this.addChild(draggeddoughsprite);
		//this.addChild(draggedrollsprite); 
		
		var touchlistener = cc.EventListener.create({
			event: cc.EventListener.TOUCH_ONE_BY_ONE,
			swallowTouches: true,
			onTouchBegan: function (touch, event) { 
				touchPos = touch.getLocation();
				touching = true;
				return true;
			},
			onTouchMoved: function (touch, event) { 
				touchPos = touch.getLocation();
				touching = true;
			},
			onTouchEnded: function (touch, event) {         
				touchPos = null;
				touching = false;
			}
		});
		cc.eventManager.addListener(touchlistener, this);
		
		
        return true;
    },
	update:function(dt)
	{
		 draggeddoughsprite.setVisible(state == BSTATES.DRAG1);
		 draggedrollsprite.setVisible(state == BSTATES.DRAG2);
		 //ARM.setVisible(state == BSTATES.DRAG1 || state == BSTATES.DRAG2);
		
			//console.debug(state);
		//Transitions
		if (state === BSTATES.IDLE)
		{
			//drag from dough
			if (touching && dough.hovered(touchPos)) {
				state = BSTATES.DRAG1;
			}
			//desk hovered & desk != empty -> DRAG2, desk := empty
			//[...]
		} else if (state === BSTATES.DRAG1)
		{
			//(dough) released -> IDLE
			if (!touching)
				state = BSTATES.IDLE;
			//desk hovered & desk == empty -> KNEADING
			//[...]
		} else if (state === BSTATES.KNEADING)
		{
			//timer 0 -> IDLE
			//[...]
		} else if (state === BSTATES.DRAG2)
		{
			//(roll) released -> IDLE
			//[...]
			//oven hovered & oven != full
			//[...]
		}
		
		//Actions
		if (state == BSTATES.IDLE)
		{
			//do nothing
		} else if (state === BSTATES.DRAG1)
		{
			//show arm + dough, update positions
			draggeddoughsprite.setPosition(touchPos);
		} else if (state === BSTATES.KNEADING)
		{
			//arm action
			//timer
		} else if (state === BSTATES.DRAG2)
		{
			//show arm + kneaded roll
		}
		
	}
	
});


var Dough = cc.Sprite.extend({
	touchbegan:false,
	touchended:false,
	ctor:function(pos) {
		this._super(res.bakery_roll_dough_png);
		cc.associateWithNative( this, cc.Sprite );
		this.setAnchorPoint(cc.p(0,0));
		this.setPosition(pos);
		return true;
	},
	hovered:function(pos)
	{
		var locationInNode = this.convertToNodeSpace(pos);    
		var s = this.getContentSize();
		var rect = cc.rect(0, 0, s.width, s.height);
		
		return (cc.rectContainsPoint(rect, locationInNode));   
	}
});


var Desk = cc.Sprite.extend({
	touchbegan:false,
	touchended:false,
	empty:true,
	ctor:function(pos) {
		this._super(res.bakery_desk_png);
		cc.associateWithNative( this, cc.Sprite );
		
		this.setAnchorPoint(cc.p(0,0));
		this.setPosition(pos);
		
		return true;
	},
	hovered:function(pos)
	{
		var locationInNode = this.convertToNodeSpace(pos);    
		var s = this.getContentSize();
		var rect = cc.rect(0, 0, s.width, s.height);
		
		return (cc.rectContainsPoint(rect, locationInNode));   
	}
});


var Oven = cc.Sprite.extend({
	empty:[true,true,true,true],
	rolls:[null,null,null,null], //TODO create roll class -> each with X sprites for %baked + listener for touch-finish
	ctor:function(pos) {
		this._super(res.bakery_oven_png);
		cc.associateWithNative( this, cc.Sprite );
		
		this.setAnchorPoint(cc.p(0,0));
		this.setPosition(pos);
		return true;
	},
	nextEmpty:function() {
		if (empty[0])
			return 0;
		else if (empty[1])
			return 1;
		else if (empty[2])
			return 2;
		else if (empty[3])
			return 3;
		else
			return -1;
	},
	isFull:function() {
		return nextEmpty == -1;
	},
	hovered:function(pos)
	{
		var locationInNode = this.convertToNodeSpace(pos);    
		var s = this.getContentSize();
		var rect = cc.rect(0, 0, s.width, s.height);
		
		return (cc.rectContainsPoint(rect, locationInNode));   
	}
});