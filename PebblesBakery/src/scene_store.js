const LayerMask = {
    enemy: 1,
    roll1: 2,
    roll2: 4,
    floor: 8,
};

const SpriteTag = {
    wall: 0,
    enemy: 1,
    roll: 2,
    floor: 3,
};

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
            }, 0.2);
    }
});

const EnemyState = {
    Walk: 0,
    Hurt: 1,
    Dying: 2,
    Dead: 3,
    Stand: 4,
    Order: 5,
};

var Enemy = cc.PhysicsSprite.extend({
    body: null,
    shape: null,
    space: null,
    rollSprite: null,
    walkAction: null,
    hurtAction: null,
    deathAction: null,
    standAction: null,
    state: 0,
    ctor: function(space) {
        this._super("#enemy0_0.png");
        this.space = space;
        this.attr({anchorX:0, anchorY:0});

        this.rollSprite = new cc.Sprite(res.shop_roll_png);
        this.rollSprite.attr({x:10, y:10, visible:false});
        this.addChild(this.rollSprite);

        var walkFrames = [];
        var hurtFrames = [];
        var deathFrames = [];
        var standFrames = [];
        var type = Math.floor(Math.random() * 1);
        var frame_str = function(type, frame) {
            return "enemy" + type + "_" + frame + ".png";
        }
        for (var i = 0; i < 4; i++) {
            walkFrames.push(frame_str(type, i));
        }
        for (var i = 4; i < 5; i++) {
            hurtFrames.push(frame_str(type, i));
        }
        for (var i = 5; i < 6; i++) {
            deathFrames.push(frame_str(type, i));
        }
        for (var i = 3; i < 4; i++) {
            standFrames.push(frame_str(type, i));
        }
        this.walkAction = new cc.RepeatForever(new cc.Animate(mkAnim(walkFrames, 0.1)));
        this.hurtAction = new cc.Animate(mkAnim(hurtFrames, 0.5));
        this.deathAction = new cc.Animate(mkAnim(deathFrames, 0.5));
        this.standAction = new cc.RepeatForever(new cc.Animate(mkAnim(standFrames, 0.5)));
        this.runAction(this.walkAction);

        var contentSize = this.getContentSize();
        this.body = new cp.Body(1, Infinity);
        this.body.p = cc.p(322, 20);
        this.body.v_limit = 20;
        this.space.addBody(this.body);
        this.shape = new cp.BoxShape2(this.body, cp.bb(contentSize.width / 4, 0, contentSize.width * 3 / 4, contentSize.height - 4));
        this.shape.setCollisionType(SpriteTag.enemy);
        this.shape.layers = LayerMask.enemy | LayerMask.roll1;
        this.shape.sprite = this;
        this.shape.e = 0.5; // elasticity
        this.shape.u = 0.4; // friction
        this.space.addShape(this.shape);
        this.setBody(this.body);

        this.body.applyForce(cp.v(-500, 0), cp.v(0, 0));
        console.log("spawned new enemy");
        this.scheduleUpdate();
    },

    hit: function() {
        this.stopAllActions();
        this.runAction(this.hurtAction);
        this.shape.setFriction(0.6);
        this.scheduleOnce(function(){this.state = EnemyState.Hurt;}, 0.2);
        this.shape.setLayers(LayerMask.floor);
    },

    die: function() {
        this.state = EnemyState.Dying;
        this.stopAllActions();
        this.runAction(this.deathAction);
        this.scheduleOnce(function(){
                this.shape.layers = 0;
                this.scheduleOnce(function(){
                    this.state = EnemyState.Dead;
                }, 1.0);
            }, 2.0);
    },

    isAlive: function() {
        return this.state === EnemyState.Walk || this.state === EnemyState.Stand || this.state === EnemyState.Order;
    },

    update: function(dt) {
        if (this.state === EnemyState.Walk && Math.abs(this.body.vx) < 3) {
            this.state = EnemyState.Stand;
            this.stopAllActions();
            this.runAction(this.standAction);
        } else if (this.state === EnemyState.Stand && Math.abs(this.body.vx) > 3) {
            this.state = EnemyState.Walk;
            this.stopAllActions();
            this.runAction(this.walkAction);
        } else if (this.state === EnemyState.Stand && this.body.p.x < 72 && !this.flippedX) {
            this.state = EnemyState.Order;
            this.rollSprite.attr({visible: true, y: 20, opacity: 0});
            this.rollSprite.runAction(cc.fadeIn(1));
            this.rollSprite.runAction(cc.moveTo(1, cc.p(10, 10)));
            this.scheduleOnce(function() {
                    // turn around
                    this.flippedX = true;
                    this.rollSprite.x = 26;
                    this.shape.layers = LayerMask.roll2;
                    this.body.resetForces();
                    this.body.applyForce(cp.v(500, 0), cp.v(0, 0));
                    this.body.v_limit = 40;
                    this.state = EnemyState.Walk;
                    this.stopAllActions();
                    this.runAction(this.walkAction);
                    this.setLocalZOrder(2);
                }, 1);
        }
    },
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
        this.shape.setCollisionType(SpriteTag.roll);
        this.space.addShape(this.shape);
        this.shape.layers = LayerMask.roll1 | LayerMask.roll2;
        this.setBody(this.body);
    },

    hit: function() {
        console.log(this.body.p.y);
        if (this.body.p.y < 70 && this.body.p.y > 34) {
            var diffy = this.body.p.y - 40;
            this.body.vx = 0;
            this.body.vy = 0;
            this.body.w = 20;
            
            if (this.body.p.y > 58) {
                this.body.p.y = 64;
                this.body.applyImpulse(cp.v(600, 250), cp.v(0, 0));
            } else if (this.body.p.y > 46) {
                this.body.p.y = 52;
                this.body.applyImpulse(cp.v(250, 250), cp.v(0, 0));
            } else {
                this.body.p.y = 40;
                this.body.applyImpulse(cp.v(70, 300), cp.v(0, 0));
            }
            return true;
        }
        return false;
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
                target.clearInactiveRolls();
                if (target.rolls.length === 0) {
                    var roll = new Roll(res.shop_roll_png, target.space);
                    var rollb = roll.body;
                    target.addChild(roll, 5);
                    target.rolls.push(roll);
                    rollb.p = cc.p(48, -16);
                    rollb.vx = 0;
                    rollb.vy = 0;
                    rollb.w = -5;
                    rollb.resetForces();
                    rollb.applyImpulse(cp.v(0, 350), cp.v(0, 0));
                    bear.state = 1;
                } else if (bear.state === 1) {
                    var roll = target.rolls[target.rolls.length - 1];
                    bear.hit();
                    if (roll.hit()) {
                        bear.state = 0;
                    } else {
                        bear.state = 2;
                    }
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
            this.addChild(enemy, 1);
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
        /*var debugNode = new cc.PhysicsDebugNode(this.space);
        debugNode.visible = true;
        this.addChild(debugNode);*/

        this.scheduleUpdate();
    },

    collisionRollEnemyBegin: function(arbiter, space) {
        var shapes = arbiter.getShapes();
        var roll = shapes[0];
        var enemy = shapes[1];
        var speed = cp.v.lengthsq2(roll.body.vx, roll.body.vy);
        if (speed > 1000) {
            enemy.body.resetForces();
            enemy.body.v_limit = Infinity;
            enemy.body.applyImpulse(cp.v(0, 300), cp.v(0, 0));
            roll.body.applyImpulse(cp.v(0, 200), cp.v(0, 0));
            enemy.sprite.hit();
            return true;
        } else {
            console.log('speed: ' + speed);
        }
        return false;
    },

    collisionEnemyFloorPostSolve: function(arbiter, space) {
        var enemy = arbiter.getShapes()[0];
        if (enemy.sprite.state == 1) {
            enemy.sprite.die();
        }
        return true;
    },

    collisionRollFloorBegin: function(arbiter, space) {
        var roll = arbiter.getShapes()[0];
        roll.layers = 0;
        return true;
    },

    collisionEnemyEnemyBegin: function(arbiter, space) {
        var shapes = arbiter.getShapes();
        if (!shapes[0].sprite.isAlive() || !shapes[1].sprite.isAlive()) return false;
        return true;
    },

    initPhysics: function() {
        this.space = new cp.Space();
        this.space.gravity = cp.v(0, -600);

        var wallCounter = new cp.BoxShape2(this.space.staticBody,
                cp.bb(64, 0, 80, 52));
        var wallFloor = new cp.BoxShape2(this.space.staticBody,
                cp.bb(80, 0, 336, 20));
        var wallCeiling = new cp.BoxShape2(this.space.staticBody,
                cp.bb(0, 164, 320, 180));
        var wallLeft = new cp.BoxShape2(this.space.staticBody,
                cp.bb(0, 71, 8, 164));
        var wallRight = new cp.BoxShape2(this.space.staticBody,
                cp.bb(312, 71, 320, 164));
        var walls = [wallCounter, wallFloor, wallCeiling,
                     wallLeft, wallRight];
        for (i in walls) {
            walls[i].e = 0.8;
            walls[i].u = 0.4;
            walls[i].setCollisionType(SpriteTag.wall);
            this.space.addStaticShape(walls[i]);
        }
        wallFloor.setCollisionType(SpriteTag.floor);

        this.space.addCollisionHandler(SpriteTag.roll, SpriteTag.enemy, this.collisionRollEnemyBegin.bind(this), null, null, null);
        this.space.addCollisionHandler(SpriteTag.enemy, SpriteTag.floor, null, null, this.collisionEnemyFloorPostSolve.bind(this), null);
        this.space.addCollisionHandler(SpriteTag.roll, SpriteTag.floor, this.collisionRollFloorBegin.bind(this), null, null, null);
        this.space.addCollisionHandler(SpriteTag.enemy, SpriteTag.enemy, this.collisionEnemyEnemyBegin.bind(this), null, null, null);
    },

    update: function(dt) {
        for (var i = 0; i < 8; i++) {
            this.space.step(dt/8)
        }
        this.animLayer.update(dt);
    }
});
