/******************************************************************/
// [ Pebble's Bakery ]
// Made for Ludum Dare 32 Jam
// April 18-20, 2015
// http://www.ludumdare.com/compo
//
// Simon Parzer - Code
// Georg Sperl - Code
// Peter Sperl - Graphics, Audio
// Matt Kapuszczak - Graphics
/******************************************************************/

cc.game.onStart = function(){
    if(!cc.sys.isNative && document.getElementById("cocosLoading")) //If referenced loading.js, please remove it
        document.body.removeChild(document.getElementById("cocosLoading"));

    // Pass true to enable retina display, disabled by default to improve performance
    cc.view.enableRetina(false);
    // Adjust viewport meta
    cc.view.adjustViewPort(true);
    // Setup the resolution policy and design resolution size
    var policy = new cc.ResolutionPolicy(cc.ContainerStrategy.ORIGINAL_CONTAINER, cc.ContentStrategy.EXACT_FIT);
    cc.view.setDesignResolutionSize(320, 180, policy);
    // The game will be resized when browser size change
    cc.view.resizeWithBrowserSize(false);
    //load resources
    cc.LoaderScene.preload(g_resources, function () {
        cc.director.runScene(new TitleScene());
    }, this);

    if (cc._renderContext instanceof WebGLRenderingContext) {

    } else if (cc._renderContext._context instanceof CanvasRenderingContext2D) {
        cc._renderContext._context.imageSmoothingEnabled = false;
        cc._renderContext._context.mozImageSmoothingEnabled = false;
        cc._renderContext._context.webkitImageSmoothingEnabled = false;
    }
};
cc.game.run();
