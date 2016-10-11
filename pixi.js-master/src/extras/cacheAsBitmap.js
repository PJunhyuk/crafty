var core = require('../core'),
    DisplayObject = core.DisplayObject,
    _tempMatrix = new core.Matrix();

DisplayObject.prototype._cacheAsBitmap = false;
DisplayObject.prototype._cacheData = false;

// figured theres no point adding ALL the extra variables to prototype.
// this model can hold the information needed. This can also be generated on demand as
// most objects are not cached as bitmaps.
var CacheData = function(){

    this.originalRenderWebGL = null;
    this.originalRenderCanvas = null;
    this.originalCalculateBounds = null;
    this.originalGetLocalBounds = null;

    this.originalUpdateTransform = null;
    this.originalHitTest = null;
    this.originalDestroy = null;
    this.originalMask = null;
    this.originalFilterArea = null;
    this.sprite = null;
};


Object.defineProperties(DisplayObject.prototype, {

    /**
     * Set this to true if you want this display object to be cached as a bitmap.
     * This basically takes a snap shot of the display object as it is at that moment. It can provide a performance benefit for complex static displayObjects.
     * To remove simply set this property to 'false'
     *
     * @member {boolean}
     * @memberof PIXI.DisplayObject#
     */
    cacheAsBitmap: {
        get: function ()
        {
            return this._cacheAsBitmap;
        },
        set: function (value)
        {
            if (this._cacheAsBitmap === value)
            {
                return;
            }

            this._cacheAsBitmap = value;

            var data;

            if (value)
            {

                if(!this._cacheData)
                {
                    this._cacheData = new CacheData();
                }

                data = this._cacheData;

                data.originalRenderWebGL = this.renderWebGL;
                data.originalRenderCanvas = this.renderCanvas;

                data.originalUpdateTransform = this.updateTransform;
                data.originalCalculateBounds = this._calculateBounds;
                data.originalGetLocalBounds = this.getLocalBounds;

                data.originalDestroy = this.destroy;

                data.originalContainsPoint = this.containsPoint;

                data.originalMask = this._mask;
                data.originalFilterArea = this.filterArea;



                this.renderWebGL = this._renderCachedWebGL;
                this.renderCanvas = this._renderCachedCanvas;

                this.destroy = this._cacheAsBitmapDestroy;

            }
            else
            {
                data = this._cacheData;

                if (data.sprite)
                {
                    this._destroyCachedDisplayObject();
                }


                this.renderWebGL = data.originalRenderWebGL;
                this.renderCanvas = data.originalRenderCanvas;
                this._calculateBounds = data.originalCalculateBounds;
                this.getLocalBounds = data.originalGetLocalBounds;

                this.destroy = data.originalDestroy;

                this.updateTransform = data.originalUpdateTransform;
                this.containsPoint = data.originalContainsPoint;

                this._mask = data.originalMask;
                this.filterArea = data.originalFilterArea;
            }
        }
    }
});
/**
* Renders a cached version of the sprite with WebGL
*
* @param renderer {PIXI.WebGLRenderer} the WebGL renderer
* @private
*/
DisplayObject.prototype._renderCachedWebGL = function (renderer)
{
    if (!this.visible || this.worldAlpha <= 0 || !this.renderable)
    {
        return;
    }

    this._initCachedDisplayObject( renderer );

    this._cacheData.sprite._transformID = -1;
    this._cacheData.sprite.worldAlpha = this.worldAlpha;
    this._cacheData.sprite._renderWebGL(renderer);
};

/**
* Prepares the WebGL renderer to cache the sprite
*
* @param renderer {PIXI.WebGLRenderer} the WebGL renderer
* @private
*/
DisplayObject.prototype._initCachedDisplayObject = function (renderer)
{
    if(this._cacheData && this._cacheData.sprite)
    {
        return;
    }

    // make sure alpha is set to 1 otherwise it will get rendered as invisible!
    var cacheAlpha = this.alpha;
    this.alpha = 1;

    // first we flush anything left in the renderer (otherwise it would get rendered to the cached texture)
    renderer.currentRenderer.flush();
    //this.filters= [];
    // next we find the dimensions of the untransformed object
    // this function also calls updatetransform on all its children as part of the measuring. This means we don't need to update the transform again in this function
    // TODO pass an object to clone too? saves having to create a new one each time!
    var bounds = this.getLocalBounds().clone();

    // add some padding!
    if(this._filters)
    {
        var padding = this._filters[0].padding;

        bounds.pad(padding);
    }

    // for now we cache the current renderTarget that the webGL renderer is currently using.
    // this could be more elegent..
    var cachedRenderTarget = renderer._activeRenderTarget;
    // We also store the filter stack - I will definitely look to change how this works a little later down the line.
    var stack = renderer.filterManager.filterStack;

    // this renderTexture will be used to store the cached DisplayObject

    var renderTexture = core.RenderTexture.create(bounds.width | 0, bounds.height | 0);

    // need to set //
    var m = _tempMatrix;
    m.tx = -bounds.x;
    m.ty = -bounds.y;

    // reset
    this.transform.worldTransform.identity();

    // set all properties to there original so we can render to a texture
    this.renderWebGL = this._cacheData.originalRenderWebGL;


    renderer.render(this, renderTexture, true, m, true);
    // now restore the state be setting the new properties

    renderer.bindRenderTarget(cachedRenderTarget);

    renderer.filterManager.filterStack = stack;

    this.renderWebGL     = this._renderCachedWebGL;
    this.updateTransform = this.displayObjectUpdateTransform;

    this._mask = null;
    this.filterArea = null;

    // create our cached sprite
    var cachedSprite = new core.Sprite(renderTexture);
    cachedSprite.transform.worldTransform = this.transform.worldTransform;
    cachedSprite.anchor.x = -( bounds.x / bounds.width );
    cachedSprite.anchor.y = -( bounds.y / bounds.height );
    cachedSprite.alpha = cacheAlpha;
    cachedSprite._bounds =  this._bounds;

    //easy bounds..
    this._calculateBounds  = this._calculateCachedBounds;
    this.getLocalBounds  = this._getCachedLocalBounds;

    this._cacheData.sprite = cachedSprite;

    this.transform._parentID = -1;
    // restore the transform of the cached sprite to avoid the nasty flicker..
    this.updateTransform();

    // map the hit test..
    this.containsPoint = cachedSprite.containsPoint.bind(cachedSprite);
};

/**
* Renders a cached version of the sprite with canvas
*
* @param renderer {PIXI.CanvasRenderer} the Canvas renderer
* @private
*/
DisplayObject.prototype._renderCachedCanvas = function (renderer)
{
    if (!this.visible || this.worldAlpha <= 0 || !this.renderable)
    {
        return;
    }

    this._initCachedDisplayObjectCanvas( renderer );

    this._cacheData.sprite.worldAlpha = this.worldAlpha;

    this._cacheData.sprite.renderCanvas(renderer);
};

//TODO this can be the same as the webGL verison.. will need to do a little tweaking first though..
/**
* Prepares the Canvas renderer to cache the sprite
*
* @param renderer {PIXI.CanvasRenderer} the Canvas renderer
* @private
*/
DisplayObject.prototype._initCachedDisplayObjectCanvas = function (renderer)
{
    if(this._cacheData && this._cacheData.sprite)
    {
        return;
    }

    //get bounds actually transforms the object for us already!
    var bounds = this.getLocalBounds();

    var cacheAlpha = this.alpha;
    this.alpha = 1;

    var cachedRenderTarget = renderer.context;

    var renderTexture = new core.RenderTexture.create(bounds.width | 0, bounds.height | 0);

    // need to set //
    var m = _tempMatrix;
    this.transform.worldTransform.copy(m);
    m.invert();

    m.tx -= bounds.x;
    m.ty -= bounds.y;

    //m.append(this.transform.worldTransform.)
     // set all properties to there original so we can render to a texture
    this.renderCanvas = this._cacheData.originalRenderCanvas;

    //renderTexture.render(this, m, true);
    renderer.render(this, renderTexture, true, m, false);

    // now restore the state be setting the new properties
    renderer.context = cachedRenderTarget;

    this.renderCanvas = this._renderCachedCanvas;
    this._calculateBounds  = this._calculateCachedBounds;

    this._mask = null;
    this.filterArea = null;

    // create our cached sprite
    var cachedSprite = new core.Sprite(renderTexture);
    cachedSprite.transform.worldTransform = this.transform.worldTransform;
    cachedSprite.anchor.x = -( bounds.x / bounds.width );
    cachedSprite.anchor.y = -( bounds.y / bounds.height );
    cachedSprite._bounds =  this._bounds;
    cachedSprite.alpha = cacheAlpha;

    this.updateTransform();
    this.updateTransform = this.displayObjectUpdateTransform;

    this._cacheData.sprite = cachedSprite;

    this.containsPoint = cachedSprite.containsPoint.bind(cachedSprite);


};

/**
* Calculates the bounds of the cached sprite
*
* @private
*/
DisplayObject.prototype._calculateCachedBounds = function ()
{
    return this._cacheData.sprite._calculateBounds();
};

DisplayObject.prototype._getCachedLocalBounds = function ()
{
    return this._cacheData.sprite.getLocalBounds();
};

/**
* Destroys the cached sprite.
*
* @private
*/
DisplayObject.prototype._destroyCachedDisplayObject = function ()
{
    this._cacheData.sprite._texture.destroy(true);
    this._cacheData.sprite = null;
};

DisplayObject.prototype._cacheAsBitmapDestroy = function ()
{
    this.cacheAsBitmap = false;
    this.destroy();
};
