// Create scene and add layers
var CalendarScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
		cc.audioEngine.setEffectsVolume(0.5);
		cc.audioEngine.stopMusic();
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
	cal_pos:null,
	deltapos:null,
	state:CSTATES.IDLE,
	touchPos:null,
	touchStartPos:null,
	touchEndPos:null,
	touchstarted:false,
	touching:false,
	touchended:false,
    ctor:function () {
        this._super();
        ++g_day;
		
		var spriteBG = new cc.Sprite(res.cal_bg);
		spriteBG.setAnchorPoint(cc.p(0,0));
        this.addChild(spriteBG);
		
		//.setLocalZOrder(0);
		

		
		this.cal_pos = cc.p(160,100);
		
		clawsprite = new cc.Sprite(res.bakery_claw_png);
		clawsprite.setLocalZOrder(3);
		clawsprite.setAnchorPoint(cc.p(0.55,0.65));
		this.addChild(clawsprite);
		
		lower = new cc.Sprite(res.cal_lower);
		lower.setLocalZOrder(1);
		lower.setTextureRect(cc.rect((g_day%7)*96,0,96,80));
		lower.setPosition(this.cal_pos);
		this.addChild(lower);
		
		this.upper = new cc.Sprite(res.cal_upper);
		this.upper.setLocalZOrder(2);
		this.upper.setTextureRect(cc.rect(((g_day-1+7)%7)*96,0,96,80));
		this.upper.setPosition(this.cal_pos);
		this.addChild(this.upper);

	
		this.touchStartPos = cc.p(-64,-64);
		this.touchPos = this.touchStartPos;
		this.touchEndPos = this.touchStartPos;
		
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
		//Bear claw positions
		clawsprite.setPosition(this.touchPos);
		
		
		//IDLE -> if upper touched -> TEAR
		
		//TEAR -> release -> IDLE
		//TEAR -> move -> TORN
		
		//TORN -> release -> DROP
		
		//TEAR: move upper and check pos dif
		
		//
		if (this.state === CSTATES.IDLE)
		{
			if (this.touchstarted && this.upperHovered())
			{
				this.deltapos = cc.pSub(this.upper.getPosition(),this.touchPos);
				this.state = CSTATES.TEAR;
			}
		} else if (this.state === CSTATES.TEAR || this.state === CSTATES.TORN) {
			if (this.touching) {
				//update position
				this.upper.setPosition(cc.pAdd(this.touchPos,this.deltapos));
				if (this.state === CSTATES.TEAR) {
					if (this.upper.getPosition !== this.cal_pos) {
						//check torn
						this.state = CSTATES.TORN;
						cc.audioEngine.playEffect(sfx.cal_tear, false);
					}
				}
			} else {
				this.state = CSTATES.DROP;
				var p = this.upper.getPosition();
				this.upper.runAction(new cc.MoveTo(3,cc.p(p.x, p.y-416)));
				this.scheduleOnce(this.nextScene, 1.5);
			}
		} else if (this.state === CSTATES.DROP) {
			var p = this.upper.getPosition();
			var dy = (50-p.y)*dt;
			this.upper.setPosition(cc.pAdd(p,cc.p(0,-dy)));
		}
		
		this.touchstarted = false;
		this.touchended = false;
	},
	upperHovered:function()
	{
		var tolerance = 8;
		var p = this.upper.getPosition();
		var s = cc.p(70,80);
		var rect = cc.rect(p.x-(s.x + tolerance)*0.5,p.y-(s.y + tolerance)*0.5,(s.x + tolerance),(s.y - 5));
		return (cc.rectContainsPoint(rect, this.touchStartPos));  
	},
	nextScene:function() {
        cc.director.runScene(new cc.TransitionFade(1.0, new BakeryScene(), cc.color(0, 0, 0, 0)));
	}
	
});
