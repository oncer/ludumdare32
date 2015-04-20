const LayerMask = {
    enemyProjectile: 1,
    enemyWall: 2,
    enemyFloor: 4,
    projectileFloor: 8,
    projectileWall: 16,
};

const LayerGroup = {
    projectile: 1,
};

const SpriteTag = {
    wall: 0,
    enemy: 1,
    projectile: 2,
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

var ForegroundLayer = cc.Layer.extend({
    sprite:null,
    ctor: function() {
        this._super();
        this.sprite = new cc.Sprite(res.shop_fg_png);
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

var Roll = cc.PhysicsSprite.extend({
    cpos: null, // enemy center pos
    offset: null, // offset from enemy center pos
    localPos: null, // calculated position relative to parent enemy
    body: null,
    shape: null,
    space: null,
    enemy: null,
    state: 0, // 0 invisible; 1 fadein; 2 attached; 3 detached

    ctor: function(enemy, cpos, offset, space) {
        this._super(res.shop_roll_png);
        this.cpos = cpos;
        this.offset = offset;
        this.space = space;
        this.enemy = enemy;

        var contentSize = this.getContentSize();
        this.body = new cp.Body(1, cp.momentForCircle(1, 0, contentSize.width / 2, cp.v(0, 0)));
        this.localPos = cc.pAdd(this.cpos, this.offset);
        this.body.v_limit = 0;
        this.space.addBody(this.body);
        this.shape = new cp.CircleShape(this.body, contentSize.width / 2, cp.v(0, 0));
        this.shape.layers = 0;
        this.shape.sprite = this;
        this.space.addShape(this.shape);
        this.setBody(this.body);
        this.visible = false;

        this.scheduleUpdate();
    },

    update: function(dt) {
        if (this.state === 2) {
            this.body.p = cc.pAdd(this.localPos, this.enemy.body.p);
        }
    },

    attach: function() {
        this.opacity = 0;
        this.body.p = cc.pAdd(this.localPos, this.enemy.body.p);
        var targetPos = this.body.p;
        this.body.p = cc.pAdd(this.body.p, cc.p(0, 10)); // 10px up
        this.runAction(cc.fadeIn(1));
        this.runAction(cc.moveTo(1, targetPos));
        this.visible = true;
        this.state = 1;
        this.scheduleOnce(function() {
                if (this.state === 1) this.state = 2;
            }, 1);
    },

    flip: function() {
        this.localPos = cc.p(this.cpos.x - this.offset.x, this.cpos.y + this.offset.y);
    },

    detach: function() {
        this.body.v_limit = Infinity;
        var impulse = cp.v(-150, this.enemy.body.vy);
        this.body.applyImpulse(impulse, cp.v(0, 0));
        this.shape.setLayers(LayerMask.projectileFloor);
        this.shape.group = LayerGroup.projectile;
        this.state = 3;
    },
});

const EnemyState = {
    Walk: 0,
    PreHurt: 1,
    Hurt: 2,
    Dying: 3,
    Dead: 4,
    Stand: 5,
    Order: 6,
};

var Enemy = cc.PhysicsSprite.extend({
    body: null,
    shape: null,
    space: null,
    roll: null,
    walkAction: null,
    hurtAction: null,
    deathAction: null,
    standAction: null,
    state: 0,
    ctor: function(space) {
        this._super("#enemy0_0.png");
        this.space = space;
        this.attr({anchorX:0, anchorY:0});

        this.roll = new Roll(this, cc.p(16, 0), cc.p(-6, 10), this.space);

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
        this.shape.layers = LayerMask.enemyProjectile | LayerMask.enemyFloor | LayerMask.enemyWall;
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
        this.state = EnemyState.PreHurt;
        this.scheduleOnce(function(){this.state = EnemyState.Hurt;}, 0.2);
        this.shape.setLayers(LayerMask.enemyFloor | LayerMask.enemyWall);
        this.roll.detach();
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
            this.roll.attach();
            this.scheduleOnce(function() {
                    // turn around
                    this.flippedX = true;
                    this.roll.flip();
                    this.shape.setLayers(LayerMask.enemyProjectile | LayerMask.enemyFloor)
                    this.body.resetForces();
                    this.body.applyForce(cp.v(500, 0), cp.v(0, 0));
                    this.body.v_limit = 40;
                    this.state = EnemyState.Walk;
                    this.stopAllActions();
                    this.runAction(this.walkAction);
                    this.setLocalZOrder(2); // render in front
                    this.roll.setLocalZOrder(2);
                }, 1);
        }
    },
});

const ProjectileState = {
    Reset: 0,
    Idle: 1,
    Pitch: 2,
    Fly: 3,
    Break: 4,
};

var Projectile = cc.PhysicsSprite.extend({
    body:null,
    shape:null,
    space:null,
    state:null,
    ctor: function(space) {
        this._super("#egg0.png");
        this.space = space;

        var idleFrames = [];
        var crackFrames = [];
        var breakFrames = [];
        var frame_str = function(frame) {
            return "egg" + frame + ".png";
        }
        for (var i = 0; i < 1; i++) {
            idleFrames.push(frame_str(i));
        }
        for (var i = 1; i < 2; i++) {
            crackFrames.push(frame_str(i));
        }
        for (var i = 2; i < 7; i++) {
            breakFrames.push(frame_str(i));
        }
        this.idleAction = cc.animate(mkAnim(idleFrames, 0.5));
        this.crackAction = cc.animate(mkAnim(crackFrames, 0.5));
        this.breakAction = cc.animate(mkAnim(breakFrames, 0.05));

        var contentSize = this.getContentSize();
        this.body = new cp.Body(1, cp.momentForCircle(1, 0, contentSize.width / 2, cp.v(0, 0)));
        this.space.addBody(this.body);
        this.shape = new cp.CircleShape(this.body, contentSize.width / 2, cp.v(0, 0));
        this.space.addShape(this.shape);
        this.shape.group = LayerGroup.projectile;
        this.shape.sprite = this;
        this.setBody(this.body);
        this.reset();
    },

    reset: function() {
        this.shape.setCollisionType(SpriteTag.projectile);
        this.body.v_limit = 0;
        this.body.vx = 0;
        this.body.vy = 0;
        this.body.p = cc.p(48, -16);
        this.body.w = 0;
        this.body.resetForces();
        this.body.setAngle(0);
        this.stopAllActions();
        this.runAction(this.idleAction);
        this.runAction(cc.moveTo(0.5, cc.p(48, 30)));
        this.state = ProjectileState.Reset;
        this.scheduleOnce(function(){ if (this.state == ProjectileState.Reset) this.state = ProjectileState.Idle; }, 0.5);
        this.shape.layers = 0;
        this.shape.e = 0.5; // elasticity
        this.shape.u = 0.8; // friction
    },

    pitch: function() {
        this.body.vx = 0;
        this.body.vy = 0;
        this.body.w = -5;
        this.body.v_limit = Infinity;
        this.body.resetForces();
        this.body.applyImpulse(cp.v(0, 350), cp.v(0, 0));
        this.state = ProjectileState.Pitch;
    },

    hit: function() {
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
            this.state = ProjectileState.Fly;
            this.shape.layers = LayerMask.projectileFloor | LayerMask.projectileWall | LayerMask.enemyProjectile;
            return true;
        }
        return false;
    },
    
    crack: function() {
        this.stopAllActions();
        this.runAction(this.crackAction);
    },

    break_: function() {
        if (this.state === ProjectileState.Break) return;
        this.stopAllActions();
        this.runAction(this.breakAction);
        this.scheduleOnce(function(){ this.reset(); }, 0.25);
        //this.shape.e = 0; // elasticity
        //this.shape.u = 2; // friction
        this.body.vy = 0;
        this.body.w = 0;
        this.body.v_limit = 20;
        this.state = ProjectileState.Break;
    },

    isAlive: function() {
        return this.state === ProjectileState.Fly;
    }
});

var AnimationLayer = cc.Layer.extend({
    space: null,
    time: 0,
    timeToSpawn: 2,
    projectile: null,
    enemies: [],

    ctor: function(space) {
        this._super();
        this.space = space;
        this.init();
    },
    init: function() {

        this.bear = new Bear();
        this.addChild(this.bear);

        this.projectile = new Projectile(this.space);
        this.addChild(this.projectile, 5);

		var touchlistener = cc.EventListener.create({
			event: cc.EventListener.TOUCH_ONE_BY_ONE,
			swallowTouches: true,                  
			onTouchBegan: function (touch, event) { 
                var target = event.getCurrentTarget();
                var bear = target.bear;
                if (target.projectile.state === ProjectileState.Idle) {
                    target.projectile.pitch();
                    bear.state = 1;
                } else if (bear.state === 1) {
                    bear.hit();
                    if (target.projectile.hit()) {
                        bear.state = 0;
                    } else {
                        bear.state = 2;
                    }
                }
			}
		});
		cc.eventManager.addListener(touchlistener, this);
    },

    update: function(dt) {
        this.time += dt;
        this.timeToSpawn -= dt;
        if (this.timeToSpawn <= 0) {
            this.timeToSpawn += Math.random() * 10;
            var enemy = new Enemy(this.space);
            this.enemies.push(enemy);
            this.addChild(enemy, 1);
            this.addChild(enemy.roll, 1);
        }

        if (this.projectile.body.p.y < 0 && this.projectile.state !== ProjectileState.Reset &&
            this.projectile.state != ProjectileState.Idle) {
            this.projectile.reset();
        }
    },
});

var StoreScene = cc.Scene.extend({
    space: null,
    animLayer: null,
    physicsTime: 0,

    onEnter:function() {
        this._super();
        cc.spriteFrameCache.addSpriteFrames(res.bear_plist);
        cc.spriteFrameCache.addSpriteFrames(res.enemy0_plist);
        cc.spriteFrameCache.addSpriteFrames(res.egg_plist);
        this.initPhysics();

        this.addChild(new BackgroundLayer());
        this.animLayer = new AnimationLayer(this.space);
        this.addChild(this.animLayer);
        this.addChild(new ForegroundLayer());

        //Add the Debug Layer:
        /*var debugNode = new cc.PhysicsDebugNode(this.space);
        debugNode.visible = true;
        this.addChild(debugNode);*/

        this.scheduleUpdate();
    },

    collisionProjectileEnemyBegin: function(arbiter, space) {
        var shapes = arbiter.getShapes();
        var projectile = shapes[0];
        var enemy = shapes[1];
        if (!projectile.sprite.isAlive()) return false;
        if (!enemy.sprite.isAlive()) return false;
        var speed = cp.v.lengthsq2(projectile.body.vx, projectile.body.vy);
        if (speed > 1000) {
            enemy.body.resetForces();
            enemy.body.v_limit = Infinity;
            enemy.body.applyImpulse(cp.v(0, 300), cp.v(0, 0));
            projectile.body.applyImpulse(cp.v(0, 200), cp.v(0, 0));
            enemy.sprite.hit();
            projectile.sprite.crack();
            return true;
        } else {
            console.log('speed: ' + speed);
        }
        return false;
    },

    collisionEnemyFloorPostSolve: function(arbiter, space) {
        var enemy = arbiter.getShapes()[0];
        if (enemy.sprite.state == EnemyState.Hurt) {
            enemy.sprite.die();
        }
        return true;
    },

    collisionProjectileFloorBegin: function(arbiter, space) {
        var projectile = arbiter.getShapes()[0];
        projectile.sprite.break_();
        return true;
    },

    collisionProjectileWallBegin: function(arbiter, space) {
        var projectile = arbiter.getShapes()[0];
        if (!projectile.sprite.isAlive()) return;
        projectile.sprite.crack();
        return true;
    },

    collisionEnemyEnemyPreSolve: function(arbiter, space) {
        var shapes = arbiter.getShapes();
        if (!shapes[0].sprite.isAlive() || !shapes[1].sprite.isAlive() || shapes[0].sprite.flippedX || shapes[1].sprite.flippedX) return false;
        return true;
    },

    initPhysics: function() {
        this.space = new cp.Space();
        this.space.gravity = cp.v(0, -600);

        var wallCounter = new cp.BoxShape2(this.space.staticBody,
                cp.bb(64, 0, 80, 52));
        var wallFloor = new cp.BoxShape2(this.space.staticBody,
                cp.bb(-16, 0, 336, 20));
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
            walls[i].layers = LayerMask.projectileWall | LayerMask.enemyWall;
            this.space.addStaticShape(walls[i]);
        }
        wallFloor.setCollisionType(SpriteTag.floor);
        wallFloor.layers = LayerMask.projectileFloor | LayerMask.enemyFloor;

        this.space.addCollisionHandler(SpriteTag.projectile, SpriteTag.enemy, this.collisionProjectileEnemyBegin.bind(this), null, null, null);
        this.space.addCollisionHandler(SpriteTag.enemy, SpriteTag.floor, null, null, this.collisionEnemyFloorPostSolve.bind(this), null);
        this.space.addCollisionHandler(SpriteTag.projectile, SpriteTag.floor, this.collisionProjectileFloorBegin.bind(this), null, null, null);
        this.space.addCollisionHandler(SpriteTag.projectile, SpriteTag.wall, this.collisionProjectileWallBegin.bind(this), null, null, null);
        this.space.addCollisionHandler(SpriteTag.enemy, SpriteTag.enemy, null, this.collisionEnemyEnemyPreSolve.bind(this), null, null);
    },

    update: function(dt) {
        this.physicsTime += dt;
        const physicsStep = 1/120;
        while (this.physicsTime > 0) {
            this.space.step(physicsStep);
            this.physicsTime -= physicsStep;
        }
        this.animLayer.update(dt);
    }
});

