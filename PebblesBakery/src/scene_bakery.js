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
	rollcount:0,
    ctor:function () {
        this._super();
		//console.debug("TEST");
		state = BSTATES.IDLE;
		touching = false;
		mousePos = cc.p(-64,-64);
		touchstarted = false;
		countdown = 0;
		maxcountdown = 2;
		
		var deskpos = cc.p(80, 20);
		var ovenpos = cc.p(192, 52);
		dough = new Dough(cc.p(1*16, 7*16));
		desk = new Desk(deskpos, cc.p(80, 80));
		oven = new Oven(ovenpos, cc.p(96, 96));
		this.addChild(dough);
		this.addChild(desk);
		this.addChild(oven);
		
		clawsprite = new cc.Sprite(res.bakery_claw_png);
		clawsprite.setLocalZOrder(2);
		clawsprite.setAnchorPoint(cc.p(0.6,0.85));
		this.addChild(clawsprite);
		
		draggeddoughsprite = new cc.Sprite(res.bakery_dough_portion_png);
		draggeddoughsprite.setLocalZOrder(1);
		draggedrollsprite = new cc.Sprite(res.bakery_roll_raw_png);
		draggedrollsprite.setLocalZOrder(1);
		this.addChild(draggeddoughsprite);
		this.addChild(draggedrollsprite); 
		
		sittingdoughsprite = new cc.Sprite(res.bakery_dough_portion_png);
		var on_desk_pos = cc.p(deskpos.x+40,deskpos.y+40);
		sittingdoughsprite.setPosition(on_desk_pos);// + cc.p(48,48));
		sittingrollsprite = new cc.Sprite(res.bakery_roll_raw_png);
		sittingrollsprite.setPosition(on_desk_pos);// + cc.p(48,48));
		this.addChild(sittingdoughsprite);
		this.addChild(sittingrollsprite); 
		
		
		var touchlistener = cc.EventListener.create({
			event: cc.EventListener.TOUCH_ONE_BY_ONE,
			swallowTouches: true,
			onTouchBegan: function (touch, event) { 
				touchPos = touch.getLocation();
				touching = true;
				touchstarted = true;
				console.debug(touchPos);
				return true;
			},
			onTouchMoved: function (touch, event) { 
				touchPos = touch.getLocation();
				touchstarted = false;
			},
			onTouchEnded: function (touch, event) {         
				touchPos = null;
				touching = false;
				touchstarted = false;
			}
		});
		cc.eventManager.addListener(touchlistener, this);
		cc.eventManager.addListener({
			event: cc.EventListener.MOUSE,
			onMouseMove: function(event){
				mousePos = event.getLocation();//this.convert(event.getLocationX(),event.getLocationY());
			}
		},this);
		
		
        return true;
    },
	update:function(dt)
	{
		oven.updateRolls(dt);
		
		
		clawsprite.setPosition(mousePos);
		
		
		//Transitions
		if (state === BSTATES.IDLE) {
		
			
			//drag from dough
			if (touchstarted && dough.hovered(touchPos)) {
				state = BSTATES.DRAG1;
			}
			else {
				//drag kneaded roll from desk
				if (touchstarted && desk.hovered(touchPos) && !desk.empty) {
					state = BSTATES.DRAG2;
					desk.empty = true;
				}
			}
			
		} else if (state === BSTATES.DRAG1) {
			//(dough) released -> IDLE
			if (!touching)
				state = BSTATES.IDLE;
			//desk hovered & desk == empty -> KNEADING
			else if (desk.hovered(touchPos) && desk.empty)
			{
				state = BSTATES.KNEADING;
				countdown = maxcountdown;
				desk.empty = false;
				desk.filledwith = 0; //raw dough
			}
		} else if (state === BSTATES.KNEADING) {
			if(countdown <= 0) {
				state = BSTATES.IDLE;
				desk.filledwith = 1; //raw roll
			}
		} else if (state === BSTATES.DRAG2) {
			//(roll) released -> IDLE
			if (!touching) {
				state = BSTATES.IDLE;
				desk.empty = false;
			}
			//oven hovered & oven != full -> IDLE + desk := empty
			else if (oven.hovered(touchPos) && !oven.isFull())
			{
				touching = false;
				state = BSTATES.IDLE;
				oven.addRoll();
			}
		}
		
		
		draggeddoughsprite.setVisible(state === BSTATES.DRAG1);
		draggedrollsprite.setVisible(state === BSTATES.DRAG2);
		//ARM.setVisible(state == BSTATES.DRAG1 || state == BSTATES.DRAG2);
		 
		 
		sittingdoughsprite.setVisible(desk.filledwith === 0 && !desk.empty);
		sittingrollsprite.setVisible(desk.filledwith === 1 && !desk.empty);
		 
		//Actions
		if (state == BSTATES.IDLE) {
			//do nothing
		} else if (state === BSTATES.DRAG1) {
			//show arm + dough, update positions
			draggeddoughsprite.setPosition(touchPos);
		} else if (state === BSTATES.KNEADING) {
			//arm action
			//[...]
			//timer
			countdown -= dt;
		} else if (state === BSTATES.DRAG2) {
			//show arm + kneaded roll, update positions
			draggedrollsprite.setPosition(touchPos);
		}
		
		//take roll out of oven
		if (touchstarted && state == BSTATES.IDLE)
		{
			var touched_roll = oven.touch(touchPos);
			if (touched_roll != null)
			{
				if(touched_roll.state === 1) {
					++this.rollcount;
					console.log("Roll Count: " + this.rollcount);
				}
				oven.removeRoll(touched_roll.index);
			}
		}
		
	}
	
});


var Dough = cc.Sprite.extend({
	ctor:function(pos) {
		this._super(res.bakery_dough_png);
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
	filledwith:0,
	pos:null,
	size:null,
	empty:true,
	ctor:function(pos, size) {
		this._super();
		cc.associateWithNative( this, cc.Sprite );
		
		this.pos = pos;
		this.size = size;
		return true;
	},
	hovered:function(pos)
	{
		var rect = cc.rect(this.pos.x,this.pos.y,this.size.x,this.size.y);
		return (cc.rectContainsPoint(rect, pos));  
	}
});

var Roll = cc.Sprite.extend({
	state:0,
	index:0,
	timealive:0,
	pos:null,
	size:null,
	sprite:[null,null,null],
	ctor:function(i) {
		this._super();
		cc.associateWithNative( this, cc.Sprite );
		this.index = i;
		var px = 190;
		var py = 52;
		var dx = 49;
		var dy = 48;
		this.pos = cc.p(px+(i%2)*dx,py+Math.floor(i/2)*dy);
		this.size = cc.p(48,48);
		this.sprite[0] = new cc.Sprite(res.bakery_roll_raw_png);
		this.sprite[1] = new cc.Sprite(res.bakery_roll_done_png);
		this.sprite[2] = new cc.Sprite(res.bakery_roll_burnt_png);
		for (var k = 0; k < this.sprite.length; ++k) {
			this.sprite[k].setPosition(this.pos);
			this.sprite[k].setAnchorPoint(cc.p(0,0));
			this.sprite[k].setVisible(k === 0);
			this.addChild(this.sprite[k]);
		}
		this.state = 0;
	},
	update:function(dt) { //burn baby burn
		this.timealive += dt;
		var statechanged = false;
		if (this.timealive > 2 && this.state === 0) {
			this.state = 1;
			statechanged = true;
		} else if (this.timealive > 4 && this.state === 1) {
			this.state = 2;
			statechanged = true;
		}
			
		if (statechanged)
			for (var k = 0; k < this.sprite.length; ++k) {
				this.sprite[k].setVisible(k === this.state);
			}
	},
	hovered:function(pos) {
		var rect = cc.rect(this.pos.x,this.pos.y,this.size.x,this.size.y);
		return (cc.rectContainsPoint(rect, pos));  
	}

});


var Oven = cc.Sprite.extend({
	rolls:[null,null,null,null],
	pos:null,
	size:null,
	ctor:function(pos, size) {
		this._super();
		cc.associateWithNative( this, cc.Sprite );
		
		this.pos = pos;
		this.size = size;
		return true;
	},
	nextEmpty:function() {
		for (var i = 0; i < this.rolls.length; ++i) {
			if (this.rolls[i] === null)
				return i;
		}
		return -1;
	},
	isFull:function() {
		return this.nextEmpty() == -1;
	},
	addRoll:function() {
		var i = this.nextEmpty();
		this.rolls[i] = new Roll(i);
		this.addChild(this.rolls[i]);
	},
	updateRolls:function(dt) {
		for (var i = 0; i < this.rolls.length; ++i) {
			if(this.rolls[i] != null)
				this.rolls[i].update(dt);
		}
	},
	removeRoll:function(i) {
		this.rolls[i].removeFromParent(true);
		this.rolls[i] = null;
	},
	touch:function(pos){
		for (var i = 0; i < this.rolls.length; ++i) {
			if(this.rolls[i] != null)
				if(this.rolls[i].hovered(pos))
					return this.rolls[i];
		}
		return null;
	},
	hovered:function(pos)
	{
		var rect = cc.rect(this.pos.x,this.pos.y,this.size.x,this.size.y);
		return (cc.rectContainsPoint(rect, pos));  
	}
});