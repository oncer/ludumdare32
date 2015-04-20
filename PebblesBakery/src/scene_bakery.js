// Create scene and add layers
var BakeryScene = cc.Scene.extend({
	gameLayer:null,
    onEnter:function () {
        this._super();
		cc.audioEngine.setEffectsVolume(0.1);
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
	rollicon:null,
	rolltext:null,
	timeleft:30,
	timetext:null,
    ctor:function () {
        this._super();
		
		debugbla = 0;
		
		this.rollicon = new cc.Sprite(res.icon_roll_png);
		this.rollicon.setPosition(cc.p(284,164));
		this.rollicon.setLocalZOrder(6);
		this.addChild(this.rollicon);
		this.rolltext = new cc.LabelTTF("0",  'Times New Roman', 16);
		this.rolltext.setPosition(cc.p(304,164));
		this.rolltext.setLocalZOrder(6);
		this.addChild(this.rolltext);
		this.timetext = new cc.LabelTTF(""+this.timeleft,  'Times New Roman', 32);
		this.timetext.setPosition(cc.p(160,160));
		this.timetext.setLocalZOrder(7);
		this.addChild(this.timetext);
		
		state = BSTATES.IDLE;
		touching = false;
		touchStartPos = cc.p(-1,-1);
		currentMousePos = cc.p(-64,-64);
		prevMousePos = currentMousePos;
		touchstarted = false;
		countdown = 0;
		maxcountdown = 2;
		kneaded = 0;
		tol = 8,
		
		cc.spriteFrameCache.addSpriteFrames(res.bakery_dough_plist); //_portion03 _dough03
		doughanim = new cc.RepeatForever(this.makeAnim(["dough0.png", "dough1.png", "dough2.png", "dough3.png"],0.1));
		kneadanim = new cc.RepeatForever(this.makeAnim(["dough_portion0.png", "dough_portion1.png", "dough_portion2.png", "dough_portion3.png"],0.07));
		
		var deskpos = cc.p(114, 34);
		var ovenpos = cc.p(216, 20);
		dough = new Dough(cc.p(1*16, 7*16));
		dough.runAction(doughanim);
		desk = new Desk(deskpos, cc.p(50, 50));
		oven = new Oven(ovenpos, cc.p(96, 105));
		bar = new Bar(cc.p(deskpos.x-16,deskpos.y-16));
		bar.setLocalZOrder(1);
		this.addChild(dough);
		this.addChild(desk);
		this.addChild(oven);
		this.addChild(bar);
		
		clawsprite = new cc.Sprite(res.bakery_claw_png);
		clawsprite.setLocalZOrder(3);
		clawsprite.setAnchorPoint(cc.p(0.55,0.65));
		this.addChild(clawsprite);
		
		draggeddoughsprite = new cc.Sprite(res.bakery_dough_portion_png);
		draggeddoughsprite.setLocalZOrder(2);
		draggedrollsprite = new cc.Sprite(res.bakery_roll_png);
		draggedrollsprite.setTextureRect(cc.rect(0,0,48,48));
		
		draggedrollsprite.setLocalZOrder(2);
		this.addChild(draggeddoughsprite);
		this.addChild(draggedrollsprite); 
		
		sittingdoughsprite = new cc.Sprite(res.bakery_dough_portion_png);
		on_desk_pos = cc.p(deskpos.x+24,deskpos.y+24);
		sittingdoughsprite.setPosition(on_desk_pos);// + cc.p(48,48));
		sittingdoughsprite.runAction(kneadanim);
		sittingdoughsprite.pause();
		sittingrollsprite = new cc.Sprite(res.bakery_roll_png);
		sittingrollsprite.setPosition(on_desk_pos);// + cc.p(48,48));
		sittingrollsprite.setTextureRect(cc.rect(0,0,48,48));
		this.addChild(sittingdoughsprite);
		this.addChild(sittingrollsprite); 
		
		
		var touchlistener = cc.EventListener.create({
			event: cc.EventListener.TOUCH_ONE_BY_ONE,
			swallowTouches: true,
			onTouchBegan: function (touch, event) { 
				touchPos = touch.getLocation();
				touchStartPos = touchPos;
				touching = true;
				touchstarted = true;
				console.debug(touchPos);
				return true;
			},
			onTouchMoved: function (touch, event) { 
				touchPos = touch.getLocation();
			},
			onTouchEnded: function (touch, event) {         
				touchPos = null;
				touching = false;
			}
		});
		cc.eventManager.addListener(touchlistener, this);
		cc.eventManager.addListener({
			event: cc.EventListener.MOUSE,
			onMouseMove: function(event){
				currentMousePos = event.getLocation();
			}
		},this);
		
		
        return true;
    },
	update:function(dt)
	{
		oven.updateRolls(dt);
		this.timeleft -= dt;
		this.timetext.setString(Math.ceil(this.timeleft));
		if(this.timeleft <= 0) {
		
			this.timetext.setString("HUEHUEHUE");
			//TODO SIMON 
			//- store this.rollcount
			//- open store scene
			
		}
		
		/* //INTPOL SCHMARN
		var sdp = sittingdoughsprite.getPosition();
		if (sdp.x !== on_desk_pos.x || sdp.y !== on_desk_pos.y) {
			var dx = (on_desk_pos.x - sdp.x)*dt;
			var dy = (on_desk_pos.y - sdp.y)*dt;
			sdp.x = sdp.x + dy;
			sdp.y = sdp.y + dx;
			if (dx < 0) sdp.x = Math.floor(sdp.x);
			else sdp.x = Math.ceil(sdp.x);
			if (dy < 0) sdp.y = Math.floor(sdp.y);
			else sdp.y = Math.ceil(sdp.y);
			sittingdoughsprite.setPosition(sdp);
		}*/
		
		//Transitions
		if (state === BSTATES.IDLE) {
			
			//drag from dough
			if (touchstarted && dough.hovered(touchStartPos,tol)) {
				state = BSTATES.DRAG1;
				cc.audioEngine.playEffect(sfx.bakery_grab, false);
			}
			else {
				//drag kneaded roll from desk
				if (touchstarted && desk.hovered(touchStartPos,tol) && !desk.empty && desk.filledwith === 1) {
					state = BSTATES.DRAG2;
					desk.empty = true;
				}
			}
			
		} else if (state === BSTATES.DRAG1) {
			//(dough) released -> IDLE
			if (!touching)
				state = BSTATES.IDLE;
			//desk hovered & desk == empty -> KNEADING
			else if (desk.hovered(touchPos,tol) && desk.empty)
			{
				state = BSTATES.IDLE;
				//countdown = maxcountdown;
				desk.empty = false;
				desk.filledwith = 0; //raw dough
				//sittingdoughsprite.setPosition(draggeddoughsprite.getPosition());
			}
		} else if (state === BSTATES.DRAG2) {
			//(roll) released -> IDLE
			if (!touching) {
				state = BSTATES.IDLE;
				desk.empty = false;
			}
			//oven hovered & oven != full -> IDLE + desk := empty
			else if (oven.hovered(touchPos,0) && !oven.isFull())
			{
				touching = false;
				state = BSTATES.IDLE;
				var r = oven.addRoll();
			}
		}
		
		//Bear claw positions
		clawsprite.setPosition(currentMousePos);
		
		//Kneading 
		var mouseDelta = cc.p(currentMousePos.x - prevMousePos.x, currentMousePos.y - prevMousePos.y);
		var neededkneaded = 5;
		if (state === BSTATES.IDLE && !desk.empty && desk.filledwith === 0) { //full unkneaded desk while idle
			if (desk.hovered(currentMousePos,tol))
			{
				var movement = Math.min(600 * dt,Math.sqrt(mouseDelta.x*mouseDelta.x + mouseDelta.y*mouseDelta.y))
				//increase
				kneaded += movement * 0.01;
				
				if (movement > 1)
					sittingdoughsprite.resume();
				else
					sittingdoughsprite.pause();
					
			}
			else { //decrease even more
				kneaded = Math.max(kneaded-dt*3,0);
			
				sittingdoughsprite.pause();
			}
			
			if (kneaded >= neededkneaded)
			{
				console.debug("DONE KNEADING");
				desk.filledwith = 1;
				kneaded = 0;
				sittingdoughsprite.pause();
			}
			
			//decrease
			kneaded = Math.max(kneaded-dt,0);
		}
		bar.updateVisibility(kneaded / neededkneaded);
		console.debug(kneaded);
		
		//if (kneaded > 0) console.debug(kneaded);
					
		draggeddoughsprite.setVisible(state === BSTATES.DRAG1);
		draggedrollsprite.setVisible(state === BSTATES.DRAG2);
		//ARM.setVisible(state == BSTATES.DRAG1 || state == BSTATES.DRAG2);
		 
		 
		sittingdoughsprite.setVisible(desk.filledwith === 0 && !desk.empty);
		sittingrollsprite.setVisible(desk.filledwith === 1 && !desk.empty);
		bar.setVisible(desk.filledwith === 0 && !desk.empty);
		 
		
		//Actions
		if (state === BSTATES.IDLE) {
			//do nothing
		} else if (state === BSTATES.DRAG1) {
			//show arm + dough, update positions
			draggeddoughsprite.setPosition(cc.p(touchPos.x+4,touchPos.y+10));
		} else if (state === BSTATES.DRAG2) {
			//show arm + kneaded roll, update positions
			draggedrollsprite.setPosition(cc.p(touchPos.x+4,touchPos.y+10));
		}
		
		//take roll out of oven
		if (touchstarted && state == BSTATES.IDLE)
		{
			var touched_roll = oven.touch(touchPos);
			if (touched_roll != null)
			{
				if(touched_roll.state === 2) {
					++this.rollcount;
					//console.log("Roll Count: " + this.rollcount);
					this.rolltext.setString(this.rollcount);
				}
				oven.removeRoll(touched_roll.index);
				
				var type = touched_roll.state < 2 ? 0 : touched_roll.state === 2 ? 1 : 2; //0 early, 1 perfect, 2 late
				var pp = new Popup(cc.p(touched_roll.pos.x+20,touched_roll.pos.y+16),1,16,res.popup_png,cc.rect(80*type,0,80,64));
				pp.setLocalZOrder(5);
				this.addChild(pp);
				
				if(type === 1)
					cc.audioEngine.playEffect(sfx.bakery_good, false);
				else
					cc.audioEngine.playEffect(sfx.bakery_bad, false);
			}
		}
		
		
		
		
		prevMousePos = currentMousePos;
		touchstarted = false;
	},
	makeAnim:function(frames,delay) {
		a = [];
		for (var i in frames) {
			a.push(cc.spriteFrameCache.getSpriteFrame(frames[i]));
		}
		return new cc.Animate(new cc.Animation(a,delay));
	}
	
});

var Popup = cc.Sprite.extend({

	sprite:null,
	ctor:function(pos,timetolive,dy, res_sprite, drect) {
		this._super();
		this.sprite = new cc.Sprite(res_sprite);
		this.sprite.setPosition(pos);
		this.addChild(this.sprite);
		this.sprite.runAction(new cc.MoveTo(timetolive, cc.p(pos.x,pos.y+dy)));
		this.sprite.setTextureRect(drect);
		this.sprite.scheduleOnce(function() { this.getParent().removeFromParent(true); }, timetolive);
		this.sprite.scheduleOnce(function() { this.runAction(new cc.FadeOut(timetolive/2)); }, timetolive/2);
	},
	finished:function() {
		this.removeFromParent(true);
	}
});

var Bar = cc.Sprite.extend({
	size:null,
	spriteEmpty:null,
	spriteFull:null,
	pos:null,
	ctor:function(pos) {
		this._super();
		this.pos = pos;
		
		this.spriteEmpty = new cc.Sprite(res.bakery_bar_png);
		this.spriteEmpty.setAnchorPoint(cc.p(0,0));
		this.spriteEmpty.setPosition(pos);
		this.spriteFull = new cc.Sprite(res.bakery_bar_png);
		this.spriteFull.setAnchorPoint(cc.p(0,0));
		this.spriteFull.setPosition(pos);
		this.size = this.spriteFull.getContentSize();
		this.addChild(this.spriteEmpty);
		this.addChild(this.spriteFull);
		
		this.updateVisibility(0);
	},
	updateVisibility:function(p) {
		var prcy = Math.min(1,Math.max(0,p)); ;
		//prcy = Math.floor(prcy*10)/10;
		this.spriteEmpty.setTextureRect(cc.rect(0,this.size.height*0,Math.ceil(this.size.width * 0.5),Math.ceil(this.size.height*(1-prcy))));
		this.spriteEmpty.setPosition(this.pos.x,this.pos.y +Math.floor(this.size.height*(prcy)));
		
		this.spriteFull.setTextureRect(cc.rect(this.size.width * 0.5,Math.floor(this.size.height * (1-prcy)),Math.ceil(this.size.width * 0.5),Math.ceil(this.size.height * (prcy))));
		
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
	hovered:function(pos,tolerance)
	{
		var locationInNode = this.convertToNodeSpace(pos);    
		var s = this.getContentSize();
		var rect = cc.rect(0-tolerance, 0-tolerance, s.width+2*tolerance, s.height+2*tolerance);
		
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
		this.drawNode = cc.DrawNode.create();
		//this.addChild(this.drawNode,100);
		this.drawNode.clear();
		this.drawNode.drawRect(pos, cc.p(pos.x+size.x,pos.y+size.y),
                           cc.color(255,255,255,128), 1 , cc.color(255,255,255,128) );
		return true;
	},
	hovered:function(pos,tolerance)
	{
		var rect = cc.rect(this.pos.x-tolerance,this.pos.y-tolerance,this.size.x+2*tolerance,this.size.y+2*tolerance);
		return (cc.rectContainsPoint(rect, pos));  
	}
});

var BRoll = cc.Sprite.extend({
	state:0,
	index:0,
	timealive:0,
	pos:null,
	s:null,
	sprite:null,
	dt:[],
	ctor:function(i) {
		this._super();
		cc.associateWithNative( this, cc.Sprite );
		this.index = i;
		var px = 216;
		var py = 26;
		var dx = 47;
		var dy = 48;
		this.pos = cc.p(px+(i%2)*dx,py+Math.floor(i/2)*dy);
		this.sprite = new cc.Sprite(res.bakery_roll_png);
		this.sprite.setPosition(this.pos);
		this.sprite.setAnchorPoint(cc.p(0,0));
		this.s = cc.p(48,48);
		this.addChild(this.sprite);
		this.state = 0;
		this.updateVisibility(this.state);
		this.dt = [5,5,1.5,0.8,0.8];//this.random_range(4,6),this.random_range(4,6),this.random_range(1,2),0.8,0.8]; //DELAYS BETWEEN BURN STATES
		console.debug("Ranges: [" + this.dt[0] + ", " + this.dt[1] + ", " + this.dt[2] + ", " + this.dt[3] + "]");
	},
	random_range:function(a,b) {
		return Math.random() * (b-a) + a; 
	},
	update:function(dt) { //burn baby burn
		if (state < 5) {
			this.timealive += dt;
			var statechanged = false;
			if (this.timealive >= this.dt[this.state]) { //0.5-1sec and state 0 -> state 1
				++this.state;
				this.timealive = 0;
				statechanged = true;
			}
				
			if (statechanged) {
				this.updateVisibility(this.state);
				if (this.state == 5)
					cc.audioEngine.playEffect(sfx.bakery_burn, false);
			}
		}
	},
	updateVisibility:function(frame) {
		this.sprite.setTextureRect(cc.rect(this.s.x*this.state,0,this.s.x,this.s.y));
	},
	hovered:function(pos,tolerance) {
		var rect = cc.rect(this.pos.x-tolerance,this.pos.y-tolerance,this.s.x+2*tolerance,this.s.y+2*tolerance);
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
		
		this.drawNode = cc.DrawNode.create();
		//this.addChild(this.drawNode,100);
		this.drawNode.clear();
		this.drawNode.drawRect(pos, cc.p(pos.x+size.x,pos.y+size.y),
                           cc.color(255,255,255,128), 1 , cc.color(255,255,255,128) );
						   
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
		this.rolls[i] = new BRoll(i);
		this.addChild(this.rolls[i]);
		return this.rolls[i];
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
				if(this.rolls[i].hovered(pos,4))
					return this.rolls[i];
		}
		return null;
	},
	hovered:function(pos,tolerance) {
		var rect = cc.rect(this.pos.x-tolerance,this.pos.y-tolerance,this.size.x+2*tolerance,this.size.y+2*tolerance);
		return (cc.rectContainsPoint(rect, pos));  
	}
});
