// Create scene and add layers
var CalendarScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
		cc.audioEngine.setEffectsVolume(0.1);
        var gameLayer = new CalendarGameLayer();
		gameLayer.scheduleUpdate();
        this.addChild(gameLayer);
    }
});


var CSTATES =
{
	IDLE : 0,
	TEAR : 1,
	TORN : 2,
	DROP : 3
};

var CalendarGameLayer = cc.Layer.extend({
	upper:null,
	day:1, //0 to 6, mon to sun
	cal_pos:null,
    ctor:function () {
        this._super();
		
		var spriteBG = new cc.Sprite(res.cal_bg);
		spriteBG.setAnchorPoint(cc.p(0,0));
        this.addChild(spriteBG);
		
		state = CSTATES.IDLE;
		
		//.setLocalZOrder(0);
		

		
		this.cal_pos = cc.p(160,100);
		
		clawsprite = new cc.Sprite(res.bakery_claw_png);
		clawsprite.setLocalZOrder(3);
		clawsprite.setAnchorPoint(cc.p(0.55,0.65));
		this.addChild(clawsprite);
		
		lower = new cc.Sprite(res.cal_lower);
		lower.setLocalZOrder(1);
		lower.setTextureRect(cc.rect(this.day*96,0,96,80));
		lower.setPosition(this.cal_pos);
		this.addChild(lower);
		
		if (this.day > 0) {
			this.upper = new cc.Sprite(res.cal_upper);
			this.upper.setLocalZOrder(2);
			this.upper.setTextureRect(cc.rect((this.day-1)*96,0,96,80));
			this.upper.setPosition(this.cal_pos);
			this.addChild(this.upper);
		}

		
		touching = false;
		touchStartPos = cc.p(-1,-1);
		currentMousePos = cc.p(-64,-64);
		prevMousePos = currentMousePos;
		touchstarted = false;
		
		cc.eventManager.addListener(cc.EventListener.create({
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
		}), this);
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
		//Bear claw positions
		clawsprite.setPosition(currentMousePos);
		
		
		//IDLE -> if upper touched -> TEAR
		
		//TEAR -> release -> IDLE
		//TEAR -> move -> TORN
		
		//TORN -> release -> DROP
		
		//TEAR: move upper and check pos dif
		
		//
		if (state === CSTATES.IDLE)
		{
			if (touchstarted) {
				if (this.upperHovered())
					state = CSTATES.TEAR;
				else if (this.day === 0)  {
					state = CSTATES.DROP;
					this.scheduleOnce(this.nextScene, 1.5);
				}
			}
		} else if (state === CSTATES.TEAR || state === CSTATES.TORN) {
			if (touching) {
				//update position
				this.upper.setPosition(cc.p(currentMousePos.x+4,currentMousePos.y+10));
				if (state === CSTATES.TEAR) {
					if (this.upper.getPosition !== this.cal_pos) {
						//check torn
						state = CSTATES.TORN;
						//SOUND cc.audioEngine.playEffect(sfx.tear, false);
						console.debug("TORN");
					}
				}
			} else {
				state = CSTATES.DROP;
				var p = this.upper.getPosition();
				this.upper.runAction(new cc.MoveTo(4,cc.p(p.x, p.y-416)));
				//TODO better anim
				//TODO schedule next scene
				this.scheduleOnce(this.nextScene, 1.5);
			}
		}
		
		prevMousePos = currentMousePos;
		touchstarted = false;
	},
	upperHovered:function()
	{
		if (this.day === 0) return false;
		var tolerance = 8;
		var p = this.upper.getPosition();
		var s = cc.p(70,80);
		var rect = cc.rect(p.x-(s.x + tolerance)*0.5,p.y-(s.y + tolerance)*0.5,(s.x + tolerance),(s.y + tolerance));
		return (cc.rectContainsPoint(rect, touchStartPos));  
	},
	nextScene:function() {
		console.debug("OPEN NEW SCENE PLOX");
	}
	
});