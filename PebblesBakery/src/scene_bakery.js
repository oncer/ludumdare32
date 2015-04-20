// Create scene and add layers
var BakeryScene = cc.Scene.extend({
	gameLayer:null,
    onEnter:function () {
        this._super();

		cc.audioEngine.setEffectsVolume(0.5);
		cc.audioEngine.stopMusic();
		cc.audioEngine.playMusic(sfx.bakery_bgm, true);
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
	rollicon:null,
	rolltext:null,
	timeleft:20,
	timetext:null,
	gameover:false,
	lerptime:0,
	state:BSTATES.IDLE,
	dough:null,
	desk:null,
	oven:null,
	bar:null,
	on_desk_pos:null,
	dragged_dough:null,
	sitting_dough:null,
	dragged_roll:null,
	sitting_roll:null,
	countdown:0,
	maxcountdown:2,
	kneaded:0,
	tol:8,
	neededkneaded:3,
	touchPos:null,
	touchStartPos:null,
	touchEndPos:null,
	touchstarted:false,
	touching:false,
	touchended:false,
    ctor:function () {
        this._super();
		
		
		this.rollicon = new cc.Sprite(res.icon_roll_png);
		this.rollicon.setPosition(cc.p(284,164));
		this.rollicon.setLocalZOrder(6);
		this.addChild(this.rollicon);
		this.rolltext = new cc.LabelBMFont(g_rollCount.toString(), res.bmfont);
		this.rolltext.setPosition(cc.p(304,163));
		this.rolltext.setLocalZOrder(6);
		this.addChild(this.rolltext);
		this.timetext = new cc.LabelBMFont(""+this.timeleft, res.bmfont32, -1, cc.TEXT_ALIGNMENT_CENTER);
		this.timetext.setPosition(cc.p(160,155));
		this.timetext.setLocalZOrder(7);
		this.addChild(this.timetext);
		
	
		
		cc.spriteFrameCache.addSpriteFrames(res.bakery_dough_plist); //_portion03 _dough03
		var doughanim = new cc.RepeatForever(this.makeAnim(["dough0.png", "dough1.png", "dough2.png", "dough3.png"],0.1));
		var kneadanim = new cc.RepeatForever(this.makeAnim(["dough_portion0.png", "dough_portion1.png", "dough_portion2.png", "dough_portion3.png"],0.07));
		
		var deskpos = cc.p(114, 34);
		var ovenpos = cc.p(216, 20);
		this.dough = new Dough(cc.p(1*16, 7*16));
		this.dough.runAction(doughanim);
		this.desk = new Desk(deskpos, cc.p(50, 50));
		this.oven = new Oven(ovenpos, cc.p(96, 105));
		this.bar = new Bar(cc.p(deskpos.x-16,deskpos.y-16));
		this.bar.setLocalZOrder(1);
		this.addChild(this.dough);
		this.addChild(this.desk);
		this.addChild(this.oven);
		this.addChild(this.bar);
		
		clawsprite = new cc.Sprite(res.bakery_claw_png);
		clawsprite.setLocalZOrder(3);
		clawsprite.setAnchorPoint(cc.p(0.55,0.65));
		this.addChild(clawsprite);
		
		this.dragged_dough = new cc.Sprite(res.bakery_dough_portion_png);
		this.dragged_dough.setLocalZOrder(2);
		this.dragged_roll = new cc.Sprite(res.bakery_roll_png);
		this.dragged_roll.setTextureRect(cc.rect(0,0,48,48));
		
		this.dragged_roll.setLocalZOrder(2);
		this.addChild(this.dragged_dough);
		this.addChild(this.dragged_roll); 
		
		this.sitting_dough = new cc.Sprite(res.bakery_dough_portion_png);
		this.on_desk_pos = cc.p(deskpos.x+24,deskpos.y+24);
		this.sitting_dough.setPosition(this.on_desk_pos);// + cc.p(48,48));
		this.sitting_dough.runAction(kneadanim);
		this.sitting_dough.pause();
		this.sitting_roll = new cc.Sprite(res.bakery_roll_png);
		this.sitting_roll.setPosition(this.on_desk_pos);// + cc.p(48,48));
		this.sitting_roll.setTextureRect(cc.rect(0,0,48,48));
		this.addChild(this.sitting_dough);
		this.addChild(this.sitting_roll); 
		
		
		
		this.dragged_dough.setVisible(false);
		this.dragged_roll.setVisible(false);
		this.sitting_dough.setVisible(false);
		this.sitting_roll.setVisible(false);
		this.bar.setVisible(false);
		
		
		this.touchStartPos = cc.p(-64,-64);
		this.touchPos = this.touchStartPos;
		this.touchEndPos = this.touchStartPos;
		this.prevTouchPos = this.touchPos;
		
		cc.eventManager.addListener(cc.EventListener.create({
			event: cc.EventListener.TOUCH_ONE_BY_ONE,
			swallowTouches: true,
			onTouchBegan: function (touch, event) { 
                var target = event.getCurrentTarget();
				target.touchPos = touch.getLocation();
				target.touchStartPos = target.touchPos;
				target.touching = true;
				target.touchstarted = true;
				return true;
			},
			onTouchMoved: function (touch, event) { 
                var target = event.getCurrentTarget();
				target.touchPos = touch.getLocation();
				target.touching = true;
			},
			onTouchEnded: function (touch, event) {  
                var target = event.getCurrentTarget();
				target.touching = false;
				target.touchended = true;
			}
		}), this);
		cc.eventManager.addListener({
			event: cc.EventListener.MOUSE,
			onMouseMove: function(event){
                var target = event.getCurrentTarget();
				target.touchPos = event.getLocation();
			}
		},this);
		
		
        return true;
    },
	update:function(dt)
	{

		this.oven.updateRolls(dt);
		if (!this.gameover) {
			this.timeleft -= dt;
			this.timetext.setString(Math.ceil(this.timeleft));
			if(this.timeleft <= 0) {
				
				this.gameover = true;
				this.timetext.setString("TIME UP");
				cc.audioEngine.stopMusic();
				cc.audioEngine.playEffect(sfx.bakery_timeup, false);
                cc.director.runScene(new cc.TransitionFade(1.0, new StoreScene(), cc.color(0, 0, 0, 0)));
			}
		} //else return;
		
		this.lerptime += dt;
		this.sitting_dough.setPosition(cc.pLerp(this.sitting_dough.getPosition(),this.on_desk_pos,Math.min(1,this.lerptime)));
		this.sitting_roll.setPosition(cc.pLerp(this.sitting_roll.getPosition(),this.on_desk_pos,Math.min(1,this.lerptime)));
		
		//Transitions
		if (this.state === BSTATES.IDLE) {
			
			//drag from this.dough
			if (this.touchstarted && this.dough.hovered(this.touchStartPos,this.tol)) {
				this.state = BSTATES.DRAG1;
				cc.audioEngine.playEffect(sfx.bakery_grab, false);
			}
			else {
				//drag kneaded roll from desk
				if (this.touchstarted && this.desk.hovered(this.touchStartPos,this.tol) && !this.desk.empty && this.desk.filledwith === 1) {
					this.state = BSTATES.DRAG2;
					this.desk.empty = true;
				}
			}
			
		} else if (this.state === BSTATES.DRAG1) {
			//(this.dough) released -> IDLE
			if (!this.touching)
				this.state = BSTATES.IDLE;
			//this.desk hovered & this.desk == empty -> KNEADING
			else if (this.desk.hovered(this.touchPos,this.tol+20) && this.desk.empty)
			{
				this.state = BSTATES.IDLE;
				//this.countdown = this.maxcountdown;
				this.desk.empty = false;
				this.desk.filledwith = 0; //raw this.dough
				this.sitting_dough.setPosition(this.dragged_dough.getPosition());
				this.lerptime = 0;
				this.bar.fadeIn();
			}
		} else if (this.state === BSTATES.DRAG2) {
			//(roll) released -> IDLE
			if (!this.touching) {
				this.state = BSTATES.IDLE;
				this.desk.empty = false;
				this.sitting_roll.setPosition(this.dragged_roll.getPosition());
				this.lerptime = 0;
			}
			//this.oven hovered & this.oven != full -> IDLE + this.desk := empty
			else if (this.oven.hovered(this.touchPos,30) && !this.oven.isFull())
			{
				this.touching = false;
				this.state = BSTATES.IDLE;
				var r = this.oven.addRoll(cc.pAdd(this.dragged_roll.getPosition(),cc.p(-24,-24)));
			}
		}
		
		//Bear claw positions
		clawsprite.setPosition(this.touchPos);
		
		//Kneading 
		var touchDelta = cc.p(this.touchPos.x - this.prevTouchPos.x, this.touchPos.y - this.prevTouchPos.y);
		if (this.state === BSTATES.IDLE && !this.desk.empty && this.desk.filledwith === 0) { //full unthis.kneaded this.desk while idle
			if (this.desk.hovered(this.touchPos,this.tol))
			{
				var movement = Math.min(600 * dt,Math.sqrt(touchDelta.x*touchDelta.x + touchDelta.y*touchDelta.y))
				//increase
				this.kneaded += movement * 0.01;
				
				if (movement > 1)
					this.sitting_dough.resume();
				else
					this.sitting_dough.pause();
					
			}
			else { //decrease even more
				this.kneaded = Math.max(this.kneaded-dt*3,0);
			
				this.sitting_dough.pause();
			}
			
			if (this.kneaded >= this.neededkneaded)
			{
				this.desk.filledwith = 1;
				this.kneaded = 0;
				this.sitting_dough.pause();
			}
			
			//decrease
			this.kneaded = Math.max(this.kneaded-dt,0);
		}
		this.bar.updateVisibility(this.kneaded / this.neededkneaded);
		
		//if (this.kneaded > 0) console.debug(this.kneaded);
					
		this.dragged_dough.setVisible(this.state === BSTATES.DRAG1);
		this.dragged_roll.setVisible(this.state === BSTATES.DRAG2);
		//ARM.setVisible(this.state == BSTATES.DRAG1 || this.state == BSTATES.DRAG2);
		
		
		 
		this.sitting_dough.setVisible(this.desk.filledwith === 0 && !this.desk.empty);
		this.sitting_roll.setVisible(this.desk.filledwith === 1 && !this.desk.empty);
		this.bar.setVisible(this.desk.filledwith === 0 && !this.desk.empty);
		 
		
		//Actions
		if (this.state === BSTATES.IDLE) {
			//do nothing
		} else if (this.state === BSTATES.DRAG1) {
			//show arm + this.dough, update positions
			this.dragged_dough.setPosition(cc.p(this.touchPos.x+4,this.touchPos.y+10));
		} else if (this.state === BSTATES.DRAG2) {
			//show arm + this.kneaded roll, update positions
			this.dragged_roll.setPosition(cc.p(this.touchPos.x+4,this.touchPos.y+10));
		}
		
		//take roll out of this.oven
		if (this.touchstarted && this.state == BSTATES.IDLE)
		{
			var touched_roll = this.oven.touch(this.touchPos);
			if (touched_roll != null)
			{
				if(touched_roll.state === 2) {
					++g_rollCount;
					this.rolltext.setString(g_rollCount);
				}
				this.oven.removeRoll(touched_roll.index);
				
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
		
		
		
		
		this.prevTouchPos = this.touchPos;
		
		this.touchstarted = false;
		this.touchended = false;
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
	fadeIn:function() {
		this.spriteEmpty.opacity = 0;
		this.spriteEmpty.runAction(cc.fadeIn(0.25));
		this.spriteFull.opacity = 0;
		this.spriteFull.runAction(cc.fadeIn(0.25));
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
	endpos:null,
	pos:null,
	s:null,
	sprite:null,
	dt:[],
	ctor:function(i,startpos) {
		this._super();
		cc.associateWithNative( this, cc.Sprite );
		
		this.pos = startpos;
		
		this.index = i;
		var px = 216;
		var py = 26;
		var dx = 47;
		var dy = 48;
		this.endpos = cc.p(px+(i%2)*dx,py+Math.floor(i/2)*dy);
		this.sprite = new cc.Sprite(res.bakery_roll_png);
		this.sprite.setPosition(startpos);
		this.sprite.setAnchorPoint(cc.p(0,0));
		this.s = cc.p(48,48);
		this.addChild(this.sprite);
		this.state = 0;
		this.updateVisibility(this.state);
		this.dt = [2.5,2.5,1,0.8,0.8];//[5,5,1.5,0.8,0.8];//this.random_range(4,6),this.random_range(4,6),this.random_range(1,2),0.8,0.8]; //DELAYS BETWEEN BURN this.stateS
		//console.debug("Ranges: [" + this.dt[0] + ", " + this.dt[1] + ", " + this.dt[2] + ", " + this.dt[3] + "]");
	},
	random_range:function(a,b) {
		return Math.random() * (b-a) + a; 
	},
	update:function(dt) { //burn baby burn
		
		this.pos = cc.pLerp(this.pos,this.endpos,Math.min(this.timealive,1));
		this.sprite.setPosition(this.pos);
		
		if (this.state < 5) {
			this.timealive += dt;
			var statechanged = false;
			if (this.timealive >= this.dt[this.state]) { //0.5-1sec and this.state 0 -> this.state 1
				++this.state;
				this.timealive = 0;
				this.statechanged = true;
			}
				
			if (this.statechanged) {
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
        this.rolls = [null, null, null, null];
		
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
	addRoll:function(pos) {
		var i = this.nextEmpty();
		this.rolls[i] = new BRoll(i,pos);
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
		this.rolls[i].scheduleOnce(function() {this.removeFromParent(true)},0.5);
		this.rolls[i].sprite.runAction(new cc.FadeOut(0.5));
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
