var LayerMask = {
    enemyProjectile: 1,
    enemyWall: 2,
    enemyFloor: 4,
    projectileFloor: 8,
    projectileWall: 16,
};

var LayerGroup = {
    projectile: 1,
};

var SpriteTag = {
    wall: 0,
    enemy: 1,
    projectile: 2,
    floor: 3,
};

var BackgroundLayer = cc.Layer.extend({
    ctor: function() {
        this._super();
        this.sprite = new cc.Sprite(res.shop_bg_png);
        this.sprite.attr({x:0, y:0, anchorX:0, anchorY:0});
        this.addChild(this.sprite);
		this.rollicon = new cc.Sprite(res.icon_roll_png);
		this.rollicon.setPosition(cc.p(24,164));
		this.addChild(this.rollicon);
        this.rollcount = g_rollCount;
		this.rolltext = new cc.LabelBMFont(this.rollcount.toString(), res.bmfont);
		this.rolltext.setPosition(cc.p(44,163));
		this.addChild(this.rolltext);
		this.moneyicon = new cc.Sprite(res.icon_money_png);
		this.moneyicon.setPosition(cc.p(304,164));
		this.addChild(this.moneyicon);
        this.score = g_score;
		this.moneytext = new cc.LabelBMFont(g_score.toString(), res.bmfont);
		this.moneytext.setPosition(cc.p(278,163));
		this.addChild(this.moneytext);
        this.scheduleUpdate();
    },

    update: function() {
        if (g_rollCount != this.rollcount) {
            this.rollcount = g_rollCount;
            this.rolltext.setString(this.rollcount.toString());
        }
        if (g_score != this.score) {
            this.score = g_score;
            this.moneytext.setString(this.score.toString());
        }
    },

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
        this.idleAction = cc.repeatForever(cc.animate(mkAnim(idleFrames, 0.1)));
        this.hitAction = cc.animate(mkAnim(hitFrames, 0.1));
        this.hurtAction = cc.repeatForever(cc.animate(mkAnim(hurtFrames, 0.1)));
        this.attr({x:32, y:20, anchorY:0});
        this.runAction(this.idleAction);
        this.state = 0;
    },

    hit: function() {
        this.stopAllActions();
        this.runAction(this.hitAction);
        this.state = 1;
        this.scheduleOnce(function(){
                if (this.state !== -1) {
                    this.stopAllActions();
                    this.runAction(this.idleAction);
                    this.state = 0;
                }
            }, 0.2);
    },

    cry: function() {
        if (this.state !== -1) {
            this.stopAllActions();
            this.runAction(this.hurtAction);
            cc.audioEngine.stopMusic();
            cc.audioEngine.playEffect(sfx.gameover, false);
            this.scheduleOnce(function(){
                    cc.director.runScene(new cc.TransitionFade(1.0, new CalendarScene(), cc.color(0, 0, 0, 0)));
                }, 5);
            this.state = -1;
        }
    },
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
        if (this.body.p.x < 0 && this.state === 3) {
            g_rollCount++;
            this.state = 4;
        }
    },

    attach: function() {
		cc.audioEngine.playEffect(sfx.buy_roll, false);
        this.opacity = 0;
        this.body.p = cc.pAdd(this.localPos, this.enemy.body.p);
        var targetPos = this.body.p;
        this.body.p = cc.pAdd(this.body.p, cc.p(0, 10)); // 10px up
        this.runAction(cc.fadeIn(1));
        this.runAction(cc.moveTo(1, targetPos));
        this.visible = true;
        this.state = 1;
        g_rollCount--;
        this.scheduleOnce(function() {
                if (this.state === 1) this.state = 2;
            }, 1);
    },

    flip: function() {
        this.localPos = cc.p(this.cpos.x - this.offset.x, this.cpos.y + this.offset.y);
    },

    detach: function() {
        if (this.state === 0) return false;
        this.body.v_limit = Infinity;
        this.shape.u = 0.5; // friction
        this.shape.e = 0.2; // elasticity
        this.w = 5;
        var impulse = cp.v(-120 - Math.random() * 30, this.enemy.body.vy);
        this.body.applyImpulse(impulse, cp.v(0, 0));
        this.shape.setLayers(LayerMask.projectileFloor);
        this.shape.group = LayerGroup.projectile;
        this.state = 3;
    },
});

var Coin = cc.PhysicsSprite.extend({
    ctor: function(space, pos) {
        var type = Math.floor(Math.random() * 3);
        this._super("#coin" + type + ".png");
        this.space = space;

        var contentSize = this.getContentSize();
        this.body = new cp.Body(1, cp.momentForCircle(1, 0, contentSize.width / 2, cp.v(0, 0)));
        this.body.p = pos;
        this.space.addBody(this.body);
        this.shape = new cp.CircleShape(this.body, contentSize.width / 2, cp.v(0, 0));
        this.space.addShape(this.shape);
        this.shape.group = LayerGroup.projectile;
        this.shape.sprite = this;
        this.setBody(this.body);

        this.shape.group = LayerGroup.projectile;
        this.shape.layers = LayerMask.projectileFloor;
        this.body.applyImpulse(cp.v(-Math.random() * 50 - 100, Math.random() * 50 + 200), cp.v(0, 0));
        this.shape.e = 1.0;
        this.shape.u = 0.4;

        this.scheduleUpdate();

        this.state = 0;
    },

    update: function(dt) {
        if (this.body.p.x < 0 && this.state === 0) {
            ++g_score;
            this.state = 1;
        }
    },
});

var EnemyState = {
    Walk: 0,
    PreHurt: 1,
    Hurt: 2,
    Dying: 3,
    Dead: 4,
    Stand: 5,
    Order: 6,
    OrderBubble: 7,
    Unsatisfied: 8,
};

var Enemy = cc.PhysicsSprite.extend({
    body: null,
    shape: null,
    layer: null,
    space: null,
    roll: null,
    bubble: null,
    walkAction: null,
    hurtAction: null,
    deathAction: null,
    standAction: null,
    screamSounds: null,
    state: 0,
    ctor: function(layer) {
        this._super("#enemy0_0.png");
        this.layer = layer;
        this.space = this.layer.space;
        this.attr({anchorX:0, anchorY:0});

        this.roll = new Roll(this, cc.p(16, 0), cc.p(-6, 9), this.space);
        this.bubble = new cc.Sprite(res.shop_roll_bubble_png);
        this.bubble.attr({visible:false});
        this.addChild(this.bubble);

        this.spawnCoins = 0;

        var type = Math.floor(Math.random() * 6);
        switch (type) {
            case 0: // old man
            case 1: // young man
            case 2: // old man
            case 5: // fat man
                this.screamSounds = [
                    sfx.scream_man1,
                    sfx.scream_man2,
                    sfx.scream_man3,
                    sfx.scream_man4
                    ];
                break;
            case 3: // boy
                this.screamSounds = [
                    sfx.scream_kid1,
                    sfx.scream_kid2
                    ];
                break;
            case 4: // young woman
                this.screamSounds = [
                    sfx.scream_woman1,
                    sfx.scream_woman2
                    ];
                break;
        }

        var walkFrames = [];
        var hurtFrames = [];
        var deathFrames = [];
        var standFrames = [];
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
        this.body.v_limit = 40;
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
        var sfxUrl = this.screamSounds[Math.floor(Math.random() * this.screamSounds.length)];
		cc.audioEngine.playEffect(sfxUrl, false);
        if (this.bubble.visible) {
            this.bubble.runAction(cc.fadeOut(0.25));
        }
        this.stopAllActions();
        this.runAction(this.hurtAction);
        this.shape.setFriction(0.6);
        this.state = EnemyState.PreHurt;
        this.shape.setLayers(LayerMask.enemyFloor | LayerMask.enemyWall);
        this.roll.detach();
        this.scheduleOnce(function() {
            this.state = EnemyState.Hurt;
            this.spawnCoins = Math.floor(Math.random() * 4);
        }, 0.1);
    },

    die: function() {
        this.state = EnemyState.Dying;
        this.stopAllActions();
        this.runAction(this.deathAction);
        this.scheduleOnce(function(){
                this.shape.layers = 0;
                this.scheduleOnce(function(){
                    this.state = EnemyState.Dead;
                }, 1);
            }, 2);
    },

    isAlive: function() {
        return this.state === EnemyState.Walk || this.state === EnemyState.Stand || this.state === EnemyState.Order || this.state === EnemyState.OrderBubble || this.state === EnemyState.Unsatisfied;
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
        } else if ((this.state === EnemyState.Stand && this.body.p.x < 72 && !this.flippedX) || (this.state === EnemyState.OrderBubble && g_rollCount > 0)) {
            if (g_rollCount > 0) {
                this.bubble.runAction(cc.fadeOut(0.25));
                this.state = EnemyState.Order;
                this.roll.attach();
                this.spawnCoins += 10;
                this.scheduleOnce(function() {
                    // turn around
                    this.flippedX = true;
                    this.roll.flip();
                    this.shape.setLayers(LayerMask.enemyProjectile | LayerMask.enemyFloor)
                    this.body.resetForces();
                    this.body.applyForce(cp.v(500, 0), cp.v(0, 0));
                    this.body.v_limit = 60;
                    this.state = EnemyState.Walk;
                    this.stopAllActions();
                    this.runAction(this.walkAction);
                    this.setLocalZOrder(2); // render in front
                    this.roll.setLocalZOrder(2);
                }, 1);
            } else {
                this.state = EnemyState.OrderBubble;
                this.setLocalZOrder(2); // render in front
                this.bubble.attr({x:28, y:32, opacity:0, visible:true});
                this.bubble.runAction(cc.fadeIn(0.25));
                this.bubble.runAction(cc.moveTo(0.25, 28, 40));
                this.scheduleOnce(function(){
                        if (this.state === EnemyState.OrderBubble) {
                            this.state = EnemyState.Unsatisfied;
                        }
                    }, 1);
            }
        }
        while (this.spawnCoins > 0) {
            this.spawnCoins--;
            this.layer.spawnCoin(cc.pAdd(this.body.p, cc.p(16, 16)));
        }
    },
});

var ProjectileState = {
    Reset: 0,
    Idle: 1,
    Pitch: 2,
    Fly: 3,
    Break: 4,
    Dead: 5, // safe to remove
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
        for (var i = 2; i < 8; i++) {
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
        this.body.w_limit = Infinity;
        this.body.resetForces();
        this.body.applyImpulse(cp.v(0, 270), cp.v(0, 0));
        this.state = ProjectileState.Pitch;
    },

    hit: function() {
        if (this.body.p.y < 70 && this.body.p.y > 34) {
		    cc.audioEngine.playEffect(sfx.hit_egg, false);
            var diffy = this.body.p.y - 40;
            this.body.vx = 0;
            this.body.vy = 0;
            this.body.w = 20;
            
            if (this.body.p.y > 58) {
                this.body.p.y = 64;
                this.body.applyImpulse(cp.v(280, 210), cp.v(0, 0));
            } else if (this.body.p.y > 46) {
                this.body.p.y = 52;
                this.body.applyImpulse(cp.v(180, 250), cp.v(0, 0));
            } else {
                this.body.p.y = 40;
                this.body.applyImpulse(cp.v(60, 220), cp.v(0, 0));
            }
            this.state = ProjectileState.Fly;
            this.shape.layers = LayerMask.projectileFloor | LayerMask.projectileWall | LayerMask.enemyProjectile;
            return true;
        }
		cc.audioEngine.playEffect(sfx.miss_egg, false);
        return false;
    },
    
    crack: function() {
        this.stopAllActions();
        this.runAction(this.crackAction);
    },

    break_: function() {
		cc.audioEngine.playEffect(sfx.egg_splash, false);
        if (this.state === ProjectileState.Break) return;
        this.stopAllActions();
        this.runAction(this.breakAction);
        this.scheduleOnce(function(){ this.state = ProjectileState.Dead }, 0.3);
        this.body.vy = 0;
        this.body.w = 0;
        this.body.v_limit = 0;
        this.body.w_limit = 0;
        this.body.setAngle(0);
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

    ctor: function(space) {
        this._super();
        this.space = space;
        this.init();
    },
    init: function() {

        this.bear = new Bear();
        this.addChild(this.bear);

        this.projectiles = [];

        this.enemies = [];
        this.coins = [];

		var touchlistener = cc.EventListener.create({
			event: cc.EventListener.TOUCH_ONE_BY_ONE,
			swallowTouches: true,                  
			onTouchBegan: function (touch, event) { 
                var target = event.getCurrentTarget();
                var bear = target.bear;
                if (target.projectiles.length > 0) {
                    var projectile = target.projectiles[target.projectiles.length - 1];
                    if (projectile.state === ProjectileState.Idle && bear.state === 0) {
                        projectile.pitch();
                    } else if (projectile.state === ProjectileState.Pitch && bear.state === 0) {
                        bear.hit();
                        projectile.hit();
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
            var enemy = new Enemy(this);
            this.enemies.push(enemy);
            this.addChild(enemy, 1);
            this.addChild(enemy.roll, 1);
        }

        for (var i = this.coins.length - 1; i >= 0; i--) {
            if (this.coins[i].state === 1) {
                this.removeChild(this.coins[i]);
                this.coins.splice(i, 1);
            }
        }

        for (var i = this.projectiles.length - 1; i >= 0; i--) {
            if ((this.projectiles[i].body.p.y < 0 && this.projectiles[i].state !== ProjectileState.Reset) || this.projectiles[i].state === ProjectileState.Dead) {
                this.removeChild(this.projectiles[i]);
                this.projectiles.splice(i, 1);
            }
        }

        if (this.projectiles.length == 0 ||
                this.projectiles[this.projectiles.length - 1].state === ProjectileState.Fly) {
            var projectile = new Projectile(this.space);
            this.projectiles.push(projectile);
            this.addChild(projectile);
        }

        for (var i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].state === EnemyState.Unsatisfied) {
                this.bear.cry();
            }
        }
    },

    spawnCoin: function(pos) {
        var coin = new Coin(this.space, pos);
        this.coins.push(coin);
        this.addChild(coin);
    },
});

var StoreScene = cc.Scene.extend({
    space: null,
    animLayer: null,
    physicsTime: 0,

    onEnter:function() {
        this._super();
		cc.audioEngine.setEffectsVolume(0.5);
		cc.audioEngine.stopMusic();
		cc.audioEngine.playMusic(sfx.store_bgm, true);
        cc.spriteFrameCache.addSpriteFrames(res.bear_plist);
        cc.spriteFrameCache.addSpriteFrames(res.enemy_plist);
        cc.spriteFrameCache.addSpriteFrames(res.egg_plist);
        cc.spriteFrameCache.addSpriteFrames(res.coin_plist);
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
        if (enemy.sprite.state === EnemyState.Hurt) {
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
        this.space.addCollisionHandler(SpriteTag.enemy, SpriteTag.wall, null, null, this.collisionEnemyFloorPostSolve.bind(this), null);
        this.space.addCollisionHandler(SpriteTag.projectile, SpriteTag.floor, this.collisionProjectileFloorBegin.bind(this), null, null, null);
        this.space.addCollisionHandler(SpriteTag.projectile, SpriteTag.wall, this.collisionProjectileWallBegin.bind(this), null, null, null);
        this.space.addCollisionHandler(SpriteTag.enemy, SpriteTag.enemy, null, this.collisionEnemyEnemyPreSolve.bind(this), null, null);
    },

    update: function(dt) {
        this.physicsTime += dt;
        var physicsStep = 1/120;
        while (this.physicsTime > 0) {
            this.space.step(physicsStep);
            this.physicsTime -= physicsStep;
        }
        this.animLayer.update(dt);
    }
});

