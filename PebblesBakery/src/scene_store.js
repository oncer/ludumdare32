const g_

var BackgroundLayer = cc.Layer.extend({
    sprite:null,
    ctor: function() {
        this._super();
        this.sprite = new cc.Sprite(res.shop_bg_png);
        this.sprite.attr({x:0, y:0, anchorX:0, anchorY:0});
        this.addChild(this.sprite);
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

    state: 0,

    ctor: function(sprite) {
        this._super(sprite);
        var idleFrames = ["bear_idle0.png", "bear_idle1.png", "bear_idle2.png", "bear_idle3.png"];
        var hitFrames = ["bear_hit1.png", "bear_hit2.png"];
        var hurtFrames = ["bear_hurt0.png", "bear_hurt1.png", "bear_hurt2.png", "bear_hurt3.png"];
        this.idleAction = new cc.RepeatForever(new cc.Animate(mkAnim(idleFrames, 0.1)));
        this.hitAction = new cc.Animate(mkAnim(hitFrames, 0.1))
        this.hurtAction = new cc.Animate(mkAnim(hurtFrames, 0.1))
        this.attr({x:32, y:20, anchorY:0});
        this.runAction(this.idleAction);
    },

    hit: function() {
        this.stopAllActions();
        this.runAction(this.hitAction);
        this.scheduleOnce(function(){
                this.runAction(this.idleAction);
                this.state = 0;
            }, 0.2);
    }
});

var Enemy = cc.PhysicsSprite.extend({
    body: null,
    shape: null,
    space: null,
    ctor: function(space) {
        this._super("#enemy0_0.png");
        this.space = space;
        this.attr({anchorX:0, anchorY:0});

        var walkFrames = [];
        var hurtFrames = [];
        var deathFrames = [];
        var type = Math.floor(Math.random() * 1);
        for (var i = 0; i < 4; i++) {
            walkFrames.push("enemy" + this.type + "_" + i);
        }
        for (var i = 4; i < 5; i++) {
            hurtFrames.push("enemy" + this.type + "_" + i);
        }
        for (var i = 5; i < 6; i++) {
            deathFrames.push("enemy" + this.type + "_" + i);
        }
        this.walkAction = new cc.RepeatForever(new cc.Animate(mkAnim(walkFrames, 0.1)));
        this.hurtAction = new cc.Animate(mkAnim(hurtFrames));
        this.deathAction = new cc.Animate(mkAnim(deathFrames));
        this.runAction(this.walkAction);

        var contentSize = this.getContentSize();
        this.body = new cp.Body(1, cp.momentForBox(1, contentSize.width / 2, contentSize.height));
        this.body.p = cc.p(322, 20);
        this.body.e = 0.5; // elasticity
        this.body.u = 0.4; // friction
        this.space.addBody(this.body);
        this.shape = new cp.BoxShape(this.body, contentSize.width / 2, contentSize.height);
        this.space.addShape(this.shape);
        this.setBody(this.body);

        this.body.applyForce(cp.v(-100, 0), cp.v(0, 0));
        console.log("spawned new enemy");
    },

    hit: function() {
    }
});

var Roll = cc.PhysicsSprite.extend({
    body:null,
    shape:null,
    space:null,
    ctor: function(sprite, space) {
        this._super(sprite);
        this.space = space;

        var contentSize = this.getContentSize();
        this.body = new cp.Body(1, cp.momentForCircle(1, 0, contentSize.width / 2, cp.v(0, 0)));
        this.body.p = cc.p(48, -16);
        this.space.addBody(this.body);
        this.shape = new cp.CircleShape(this.body, contentSize.width / 2, cp.v(0, 0));
        this.shape.e = 0.5; // elasticity
        this.shape.u = 0.8; // friction
        this.space.addShape(this.shape);
        this.setBody(this.body);
    },

    hit: function() {
        console.log(this.body.p.y);
        if (this.body.p.y < 70 && this.body.p.y > 35) {
            var diffy = this.body.p.y - 40;
            this.body.vx = 0;
            this.body.vy = 0;
            this.body.w = 20;
            this.body.applyImpulse(cp.v(800 - diffy * 20, diffy * 15), cp.v(0, 0));
        }
    }
});

var AnimationLayer = cc.Layer.extend({
    space: null,
    time: 0,
    timeToSpawn: 2,
    rolls: [],
    enemies: [],

    ctor: function(space) {
        this._super();
        this.space = space;
        this.init();
    },
    init: function() {

        this.bear = new Bear();
        this.addChild(this.bear);

		var touchlistener = cc.EventListener.create({
			event: cc.EventListener.TOUCH_ONE_BY_ONE,
			swallowTouches: true,                  
			onTouchBegan: function (touch, event) { 
                var target = event.getCurrentTarget();
                var bear = target.bear;
                if (bear.state == 0) {
                    target.clearInactiveRolls();
                    var roll = new Roll(res.shop_roll_png, target.space);
                    var rollb = roll.body;
                    target.addChild(roll);
                    target.rolls.push(roll);
                    rollb.p = cc.p(48, -16);
                    rollb.vx = 0;
                    rollb.vy = 0;
                    rollb.w = -5;
                    rollb.resetForces();
                    rollb.applyImpulse(cp.v(0, 350), cp.v(0, 0));
                    bear.state++;
                } else if (bear.state == 1) {
                    var roll = target.rolls[target.rolls.length - 1];
                    bear.hit();
                    roll.hit();
                    bear.state++;
                }
			}
		});
		cc.eventManager.addListener(touchlistener, this);
    },

    clearInactiveRolls: function() {
        for (var i = this.rolls.length - 1; i >= 0; i--) {
            if (this.rolls[i].body.p.y < 0) {
                this.removeChild(this.rolls[i]);
                this.rolls.splice(i, 1);
            }
        }
    },

    update: function(dt) {
        this.time += dt;
        this.timeToSpawn -= dt;
        if (this.timeToSpawn <= 0) {
            this.timeToSpawn += Math.random() * 10;
            var enemy = new Enemy(this.space);
            this.enemies.push(enemy);
            this.addChild(enemy);
        }
    },
});

var StoreScene = cc.Scene.extend({
    space: null,
    animLayer: null,

    onEnter:function() {
        this._super();
        cc.spriteFrameCache.addSpriteFrames(res.bear_plist);
        cc.spriteFrameCache.addSpriteFrames(res.enemy0_plist);
        this.initPhysics();

        this.addChild(new BackgroundLayer());
        this.animLayer = new AnimationLayer(this.space);
        this.addChild(this.animLayer);

        //Add the Debug Layer:
        var debugNode = new cc.PhysicsDebugNode(this.space);
        debugNode.visible = true;
        this.addChild(debugNode);

        this.scheduleUpdate();
    },

    initPhysics: function() {
        this.space = new cp.Space();
        this.space.gravity = cp.v(0, -600);

        var wallCounter = new cp.BoxShape2(this.space.staticBody,
                new cp.bb(64, 0, 80, 52));
        var wallFloor = new cp.BoxShape2(this.space.staticBody,
                new cp.bb(80, 0, 336, 20));
        var wallCeiling = new cp.BoxShape2(this.space.staticBody,
                new cp.bb(0, 164, 320, 180));
        var wallLeft = new cp.BoxShape2(this.space.staticBody,
                new cp.bb(0, 71, 8, 164));
        var wallRight = new cp.BoxShape2(this.space.staticBody,
                new cp.bb(312, 71, 320, 164));
        var walls = [wallCounter, wallFloor, wallCeiling,
                     wallLeft, wallRight];
        for (i in walls) {
            walls[i].e = 0.8;
            walls[i].u = 0.4;
            this.space.addStaticShape(walls[i]);
        }
    },

    update: function(dt) {
        for (var i = 0; i < 8; i++) {
            this.space.step(dt/8)
        }
        this.animLayer.update(dt);
    }
});
