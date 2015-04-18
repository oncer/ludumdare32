var BackgroundLayer = cc.Layer.extend({
    ctor: function() {
        this._super();
    }
});

function mkAnim(frames, delay) {
    a = []
    for (var i in frames) {
        a.push(cc.spriteFrameCache.getSpriteFrame(frames[i]));
    }
    return new cc.Animation(a, delay);
}

var Bear = cc.Sprite.extend({
    idleAction: null,
    hitAction: null,
    hurtAction: null,

    ctor: function(sprite) {
        this._super(sprite);
        cc.spriteFrameCache.addSpriteFrames(res.bear_plist);
        var idleFrames = ["bear_idle0.png", "bear_idle1.png", "bear_idle2.png", "bear_idle3.png"];
        var hitFrames = ["bear_hit0.png", "bear_hit1.png", "bear_hit2.png"];
        var hurtFrames = ["bear_hurt0.png", "bear_hurt1.png", "bear_hurt2.png", "bear_hurt3.png"];
        this.idleAction = new cc.RepeatForever(new cc.Animate(mkAnim(idleFrames, 0.1)));
        this.hitAction = new cc.Animate(mkAnim(hitFrames, 0.1))
        this.hurtAction = new cc.Animate(mkAnim(hurtFrames, 0.1))
        this.attr({x:32, y:40});
        this.runAction(this.idleAction);
    },

    hit: function() {
        this.stopAllActions();
        this.runAction(this.hitAction);
        this.scheduleOnce(function(){this.runAction(this.idleAction)}, 0.33);
    }
});

var Roll = cc.PhysicsSprite.extend({
    shape:null,
    body:null,
    shape:null,
    space:null,
    ctor: function(sprite, space) {
        this._super(sprite);
        this.space = space;

        var contentSize = this.getContentSize();
        this.body = new cp.Body(1, cp.momentForBox(1, contentSize.width, contentSize.height));
        this.body.p = cc.p(48, -16);
        this.space.addBody(this.body);
        this.shape = new cp.BoxShape(this.body, contentSize.width / 2, contentSize.height / 2);
        this.space.addShape(this.shape);
        this.setBody(this.body);
    },

    hit: function() {
        if (this.body.p.y < 50 && this.body.p.y > 30) {
            var diffy = this.body.p.y - 40;
            this.body.applyImpulse(cp.v(400, diffy * 60), cp.v(0, 0));
        }
    }
});

var AnimationLayer = cc.Layer.extend({
    space: null,

    ctor: function(space) {
        this._super();
        this.space = space;
        this.init();
    },
    init: function() {
        this.roll = new Roll(res.shop_roll_png, this.space);
        this.addChild(this.roll);

        this.bear = new Bear();
        this.addChild(this.bear);

		var touchlistener = cc.EventListener.create({
			event: cc.EventListener.TOUCH_ONE_BY_ONE,
			swallowTouches: true,                  
			onTouchBegan: function (touch, event) { 
                var target = event.getCurrentTarget();
                var roll = target.roll;
                var rollb = target.roll.body;
                var bear = target.bear;
                if (rollb.p.y < 0) {
                    rollb.p = cc.p(48, -16);
                    rollb.vx = 0;
                    rollb.vy = 0;
                    rollb.w = -5;
                    rollb.applyImpulse(cp.v(0, 350), cp.v(0, 0));
                } else if (rollb.vy < 0) {
                    bear.hit();
                    roll.scheduleOnce(roll.hit, 0.15);
                }
			}
		});
		cc.eventManager.addListener(touchlistener, this);
    },
});

var StoreScene = cc.Scene.extend({
    space: null,

    onEnter:function() {
        this._super();
        this.initPhysics();

        this.addChild(new BackgroundLayer());
        this.addChild(new AnimationLayer(this.space));

        this.scheduleUpdate();
    },

    initPhysics: function() {
        this.space = new cp.Space();
        this.space.gravity = cp.v(0, -600);
        /*
        var wallBottom = new cp.SegmentShape(this.space.staticBody,
                cp.v(0, 0),
                cp.v(4294967295, 0),
                0);
        this.space.addStaticShape(wallBottom);
        */
    },

    update: function(dt) {
        this.space.step(dt)
    }
});
