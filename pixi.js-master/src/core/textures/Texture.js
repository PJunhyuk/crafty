var BaseTexture = require('./BaseTexture'),
    VideoBaseTexture = require('./VideoBaseTexture'),
    TextureUvs = require('./TextureUvs'),
    EventEmitter = require('eventemitter3'),
    math = require('../math'),
    utils = require('../utils');

/**
 * A texture stores the information that represents an image or part of an image. It cannot be added
 * to the display list directly. Instead use it as the texture for a Sprite. If no frame is provided then the whole image is used.
 *
 * You can directly create a texture from an image and then reuse it multiple times like this :
 *
 * ```js
 * var texture = PIXI.Texture.fromImage('assets/image.png');
 * var sprite1 = new PIXI.Sprite(texture);
 * var sprite2 = new PIXI.Sprite(texture);
 * ```
 *
 * @class
 * @memberof PIXI
 * @param baseTexture {PIXI.BaseTexture} The base texture source to create the texture from
 * @param [frame] {PIXI.Rectangle} The rectangle frame of the texture to show
 * @param [orig] {PIXI.Rectangle} The area of original texture
 * @param [trim] {PIXI.Rectangle} Trimmed rectangle of original texture
 * @param [rotate] {number} indicates how the texture was rotated by texture packer. See {@link PIXI.GroupD8}
 */
function Texture(baseTexture, frame, orig, trim, rotate)
{
    EventEmitter.call(this);

    /**
     * Does this Texture have any frame data assigned to it?
     *
     * @member {boolean}
     */
    this.noFrame = false;

    if (!frame)
    {
        this.noFrame = true;
        frame = new math.Rectangle(0, 0, 1, 1);
    }

    if (baseTexture instanceof Texture)
    {
        baseTexture = baseTexture.baseTexture;
    }

    /**
     * The base texture that this texture uses.
     *
     * @member {PIXI.BaseTexture}
     */
    this.baseTexture = baseTexture;

    /**
     * This is the area of the BaseTexture image to actually copy to the Canvas / WebGL when rendering,
     * irrespective of the actual frame size or placement (which can be influenced by trimmed texture atlases)
     *
     * @member {PIXI.Rectangle}
     */
    this._frame = frame;

    /**
     * This is the trimmed area of original texture, before it was put in atlas
     *
     * @member {PIXI.Rectangle}
     */
    this.trim = trim;

    /**
     * This will let the renderer know if the texture is valid. If it's not then it cannot be rendered.
     *
     * @member {boolean}
     */
    this.valid = false;

    /**
     * This will let a renderer know that a texture has been updated (used mainly for webGL uv updates)
     *
     * @member {boolean}
     */
    this.requiresUpdate = false;

    /**
     * The WebGL UV data cache.
     *
     * @member {PIXI.TextureUvs}
     * @private
     */
    this._uvs = null;

    /**
     * This is the area of original texture, before it was put in atlas
     *
     * @member {PIXI.Rectangle}
     */
    this.orig = orig || frame;//new math.Rectangle(0, 0, 1, 1);

    this._rotate = +(rotate || 0);

    if (rotate === true) {
        // this is old texturepacker legacy, some games/libraries are passing "true" for rotated textures
        this._rotate = 2;
    } else {
        if (this._rotate % 2 !== 0) {
            throw 'attempt to use diamond-shaped UVs. If you are sure, set rotation manually';
        }
    }

    if (baseTexture.hasLoaded)
    {
        if (this.noFrame)
        {
            frame = new math.Rectangle(0, 0, baseTexture.width, baseTexture.height);

            // if there is no frame we should monitor for any base texture changes..
            baseTexture.on('update', this.onBaseTextureUpdated, this);
        }
        this.frame = frame;
    }
    else
    {
        baseTexture.once('loaded', this.onBaseTextureLoaded, this);
    }

    /**
     * Fired when the texture is updated. This happens if the frame or the baseTexture is updated.
     *
     * @event update
     * @memberof PIXI.Texture#
     * @protected
     */


    this._updateID = 0;
}

Texture.prototype = Object.create(EventEmitter.prototype);
Texture.prototype.constructor = Texture;
module.exports = Texture;

Object.defineProperties(Texture.prototype, {
    /**
     * The frame specifies the region of the base texture that this texture uses.
     *
     * @member {PIXI.Rectangle}
     * @memberof PIXI.Texture#
     */
    frame: {
        get: function ()
        {
            return this._frame;
        },
        set: function (frame)
        {
            this._frame = frame;

            this.noFrame = false;

            if (frame.x + frame.width > this.baseTexture.width || frame.y + frame.height > this.baseTexture.height)
            {
                throw new Error('Texture Error: frame does not fit inside the base Texture dimensions ' + this);
            }

            //this.valid = frame && frame.width && frame.height && this.baseTexture.source && this.baseTexture.hasLoaded;
            this.valid = frame && frame.width && frame.height && this.baseTexture.hasLoaded;

            if (!this.trim && !this.rotate)
            {
                this.orig = frame;
            }

            if (this.valid)
            {
                this._updateUvs();
            }
        }
    },
    /**
     * Indicates whether the texture is rotated inside the atlas
     * set to 2 to compensate for texture packer rotation
     * set to 6 to compensate for spine packer rotation
     * can be used to rotate or mirror sprites
     * See {@link PIXI.GroupD8} for explanation
     *
     * @member {number}
     */
    rotate: {
        get: function ()
        {
            return this._rotate;
        },
        set: function (rotate)
        {
            this._rotate = rotate;
            if (this.valid)
            {
                this._updateUvs();
            }
        }
    },

    /**
     * The width of the Texture in pixels.
     *
     * @member {number}
     */
    width: {
        get: function() {
            return this.orig ? this.orig.width : 0;
        }
    },

    /**
     * The height of the Texture in pixels.
     *
     * @member {number}
     */
    height: {
        get: function() {
            return this.orig ? this.orig.height : 0;
        }
    }
});

/**
 * Updates this texture on the gpu.
 *
 */
Texture.prototype.update = function ()
{
    this.baseTexture.update();
};

/**
 * Called when the base texture is loaded
 *
 * @private
 */
Texture.prototype.onBaseTextureLoaded = function (baseTexture)
{
    this._updateID++;

    // TODO this code looks confusing.. boo to abusing getters and setterss!
    if (this.noFrame)
    {
        this.frame = new math.Rectangle(0, 0, baseTexture.width, baseTexture.height);
    }
    else
    {
        this.frame = this._frame;
    }

    this.baseTexture.on('update', this.onBaseTextureUpdated, this);
    this.emit('update', this);

};

/**
 * Called when the base texture is updated
 *
 * @private
 */
Texture.prototype.onBaseTextureUpdated = function (baseTexture)
{
    this._updateID++;

    this._frame.width = baseTexture.width;
    this._frame.height = baseTexture.height;

    this.emit('update', this);
};

/**
 * Destroys this texture
 *
 * @param [destroyBase=false] {boolean} Whether to destroy the base texture as well
 */
Texture.prototype.destroy = function (destroyBase)
{
    if (this.baseTexture)
    {

        if (destroyBase)
        {
            // delete the texture if it exists in the texture cache..
            // this only needs to be removed if the base texture is actually destoryed too..
            if(utils.TextureCache[this.baseTexture.imageUrl])
            {
                delete utils.TextureCache[this.baseTexture.imageUrl];
            }

            this.baseTexture.destroy();
        }

        this.baseTexture.off('update', this.onBaseTextureUpdated, this);
        this.baseTexture.off('loaded', this.onBaseTextureLoaded, this);

        this.baseTexture = null;
    }

    this._frame = null;
    this._uvs = null;
    this.trim = null;
    this.orig = null;

    this.valid = false;

    this.off('dispose', this.dispose, this);
    this.off('update', this.update, this);
};

/**
 * Creates a new texture object that acts the same as this one.
 *
 * @return {PIXI.Texture}
 */
Texture.prototype.clone = function ()
{
    return new Texture(this.baseTexture, this.frame, this.orig, this.trim, this.rotate);
};

/**
 * Updates the internal WebGL UV cache.
 *
 * @protected
 */
Texture.prototype._updateUvs = function ()
{
    if (!this._uvs)
    {
        this._uvs = new TextureUvs();
    }

    this._uvs.set(this._frame, this.baseTexture, this.rotate);

    this._updateID++;
};

/**
 * Helper function that creates a Texture object from the given image url.
 * If the image is not in the texture cache it will be  created and loaded.
 *
 * @static
 * @param imageUrl {string} The image url of the texture
 * @param [crossorigin] {boolean} Whether requests should be treated as crossorigin
 * @param [scaleMode=PIXI.SCALE_MODES.DEFAULT] {number} See {@link PIXI.SCALE_MODES} for possible values
 * @return {PIXI.Texture} The newly created texture
 */
Texture.fromImage = function (imageUrl, crossorigin, scaleMode)
{
    var texture = utils.TextureCache[imageUrl];

    if (!texture)
    {
        texture = new Texture(BaseTexture.fromImage(imageUrl, crossorigin, scaleMode));
        utils.TextureCache[imageUrl] = texture;
    }

    return texture;
};

/**
 * Helper function that creates a sprite that will contain a texture from the TextureCache based on the frameId
 * The frame ids are created when a Texture packer file has been loaded
 *
 * @static
 * @param frameId {string} The frame Id of the texture in the cache
 * @return {PIXI.Texture} The newly created texture
 */
Texture.fromFrame = function (frameId)
{
    var texture = utils.TextureCache[frameId];

    if (!texture)
    {
        throw new Error('The frameId "' + frameId + '" does not exist in the texture cache');
    }

    return texture;
};

/**
 * Helper function that creates a new Texture based on the given canvas element.
 *
 * @static
 * @param canvas {HTMLCanvasElement} The canvas element source of the texture
 * @param [scaleMode=PIXI.SCALE_MODES.DEFAULT] {number} See {@link PIXI.SCALE_MODES} for possible values
 * @return {PIXI.Texture} The newly created texture
 */
Texture.fromCanvas = function (canvas, scaleMode)
{
    return new Texture(BaseTexture.fromCanvas(canvas, scaleMode));
};

/**
 * Helper function that creates a new Texture based on the given video element.
 *
 * @static
 * @param video {HTMLVideoElement|string} The URL or actual element of the video
 * @param [scaleMode=PIXI.SCALE_MODES.DEFAULT] {number} See {@link PIXI.SCALE_MODES} for possible values
 * @return {PIXI.Texture} The newly created texture
 */
Texture.fromVideo = function (video, scaleMode)
{
    if (typeof video === 'string')
    {
        return Texture.fromVideoUrl(video, scaleMode);
    }
    else
    {
        return new Texture(VideoBaseTexture.fromVideo(video, scaleMode));
    }
};

/**
 * Helper function that creates a new Texture based on the video url.
 *
 * @static
 * @param videoUrl {string} URL of the video
 * @param [scaleMode=PIXI.SCALE_MODES.DEFAULT] {number} See {@link PIXI.SCALE_MODES} for possible values
 * @return {PIXI.Texture} The newly created texture
 */
Texture.fromVideoUrl = function (videoUrl, scaleMode)
{
    return new Texture(VideoBaseTexture.fromUrl(videoUrl, scaleMode));
};

/**
 * Helper function that creates a new Texture based on the source you provide.
 * The soucre can be - frame id, image url, video url, canvae element, video element, base texture
 *
 * @static
 * @param {number|string|PIXI.BaseTexture|HTMLCanvasElement|HTMLVideoElement} source Source to create texture from
 * @return {PIXI.Texture} The newly created texture
 */
Texture.from = function (source)
{
    //TODO auto detect cross origin..
    //TODO pass in scale mode?
    if(typeof source === 'string')
    {
        var texture = utils.TextureCache[source];

        if (!texture)
        {
            // check if its a video..
            var isVideo = source.match(/\.(mp4|webm|ogg|h264|avi|mov)$/) !== null;
            if(isVideo)
            {
                return Texture.fromVideoUrl(source);
            }

            return Texture.fromImage(source);
        }

        return texture;
    }
    else if(source instanceof HTMLCanvasElement)
    {
        return Texture.fromCanvas(source);
    }
    else if(source instanceof HTMLVideoElement)
    {
        return Texture.fromVideo(source);
    }
    else if(source instanceof BaseTexture)
    {
        return new Texture(BaseTexture);
    }
    else
    {
        // lets assume its a texture!
        return source;
    }
};


/**
 * Adds a texture to the global utils.TextureCache. This cache is shared across the whole PIXI object.
 *
 * @static
 * @param texture {PIXI.Texture} The Texture to add to the cache.
 * @param id {string} The id that the texture will be stored against.
 */
Texture.addTextureToCache = function (texture, id)
{
    utils.TextureCache[id] = texture;
};

/**
 * Remove a texture from the global utils.TextureCache.
 *
 * @static
 * @param id {string} The id of the texture to be removed
 * @return {PIXI.Texture} The texture that was removed
 */
Texture.removeTextureFromCache = function (id)
{
    var texture = utils.TextureCache[id];

    delete utils.TextureCache[id];
    delete utils.BaseTextureCache[id];

    return texture;
};

/**
 * An empty texture, used often to not have to create multiple empty textures.
 * Can not be destroyed.
 *
 * @static
 * @constant
 */
Texture.EMPTY = new Texture(new BaseTexture());
Texture.EMPTY.destroy = function() {};
Texture.EMPTY.on = function() {};
Texture.EMPTY.once = function() {};
Texture.EMPTY.emit = function() {};

