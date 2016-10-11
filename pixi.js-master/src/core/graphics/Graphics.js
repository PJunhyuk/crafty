var Container = require('../display/Container'),
    RenderTexture = require('../textures/RenderTexture'),
    Texture = require('../textures/Texture'),
    GraphicsData = require('./GraphicsData'),
    Sprite = require('../sprites/Sprite'),
    math = require('../math'),
    CONST = require('../const'),
    utils = require('../utils'),
    Bounds = require('../display/Bounds'),
    bezierCurveTo = require('./utils/bezierCurveTo'),
    CanvasRenderer = require('../renderers/canvas/CanvasRenderer'),
    canvasRenderer,
    tempMatrix = new math.Matrix(),
    tempPoint = new math.Point(),
    tempColor1 = new Float32Array(4),
    tempColor2 = new Float32Array(4);

/**
 * The Graphics class contains methods used to draw primitive shapes such as lines, circles and
 * rectangles to the display, and to color and fill them.
 *
 * @class
 * @extends PIXI.Container
 * @memberof PIXI
 */
function Graphics()
{
    Container.call(this);

    /**
     * The alpha value used when filling the Graphics object.
     *
     * @member {number}
     * @default 1
     */
    this.fillAlpha = 1;

    /**
     * The width (thickness) of any lines drawn.
     *
     * @member {number}
     * @default 0
     */
    this.lineWidth = 0;

    /**
     * The color of any lines drawn.
     *
     * @member {string}
     * @default 0
     */
    this.lineColor = 0;

    /**
     * Graphics data
     *
     * @member {PIXI.GraphicsData[]}
     * @private
     */
    this.graphicsData = [];

    /**
     * The tint applied to the graphic shape. This is a hex value. Apply a value of 0xFFFFFF to reset the tint.
     *
     * @member {number}
     * @default 0xFFFFFF
     */
    this.tint = 0xFFFFFF;

    /**
     * The previous tint applied to the graphic shape. Used to compare to the current tint and check if theres change.
     *
     * @member {number}
     * @private
     * @default 0xFFFFFF
     */
    this._prevTint = 0xFFFFFF;

    /**
     * The blend mode to be applied to the graphic shape. Apply a value of `PIXI.BLEND_MODES.NORMAL` to reset the blend mode.
     *
     * @member {number}
     * @default PIXI.BLEND_MODES.NORMAL;
     * @see PIXI.BLEND_MODES
     */
    this.blendMode = CONST.BLEND_MODES.NORMAL;

    /**
     * Current path
     *
     * @member {PIXI.GraphicsData}
     * @private
     */
    this.currentPath = null;

    /**
     * Array containing some WebGL-related properties used by the WebGL renderer.
     *
     * @member {object<number, object>}
     * @private
     */
    // TODO - _webgl should use a prototype object, not a random undocumented object...
    this._webGL = {};

    /**
     * Whether this shape is being used as a mask.
     *
     * @member {boolean}
     */
    this.isMask = false;

    /**
     * The bounds' padding used for bounds calculation.
     *
     * @member {number}
     */
    this.boundsPadding = 0;

    /**
     * A cache of the local bounds to prevent recalculation.
     *
     * @member {PIXI.Rectangle}
     * @private
     */
    this._localBounds = new Bounds();

    /**
     * Used to detect if the graphics object has changed. If this is set to true then the graphics
     * object will be recalculated.
     *
     * @member {boolean}
     * @private
     */
    this.dirty = 0;

    /**
     * Used to detect if we need to do a fast rect check using the id compare method
     * @type {Number}
     */
    this.fastRectDirty = -1;

    /**
     * Used to detect if we clear the graphics webGL data
     * @type {Number}
     */
    this.clearDirty = 0;

    /**
     * Used to detect if we we need to recalculate local bounds
     * @type {Number}
     */
    this.boundsDirty = -1;

    /**
     * Used to detect if the cached sprite object needs to be updated.
     *
     * @member {boolean}
     * @private
     */
    this.cachedSpriteDirty = false;


    this._spriteRect = null;
    this._fastRect = false;

    /**
     * When cacheAsBitmap is set to true the graphics object will be rendered as if it was a sprite.
     * This is useful if your graphics element does not change often, as it will speed up the rendering
     * of the object in exchange for taking up texture memory. It is also useful if you need the graphics
     * object to be anti-aliased, because it will be rendered using canvas. This is not recommended if
     * you are constantly redrawing the graphics element.
     *
     * @name cacheAsBitmap
     * @member {boolean}
     * @memberof PIXI.Graphics#
     * @default false
     */
}

Graphics._SPRITE_TEXTURE = null;

// constructor
Graphics.prototype = Object.create(Container.prototype);
Graphics.prototype.constructor = Graphics;
module.exports = Graphics;

/**
 * Creates a new Graphics object with the same values as this one.
 * Note that the only the properties of the object are cloned, not its transform (position,scale,etc)
 *
 * @return {PIXI.Graphics} A clone of the graphics object
 */
Graphics.prototype.clone = function ()
{
    var clone = new Graphics();

    clone.renderable    = this.renderable;
    clone.fillAlpha     = this.fillAlpha;
    clone.lineWidth     = this.lineWidth;
    clone.lineColor     = this.lineColor;
    clone.tint          = this.tint;
    clone.blendMode     = this.blendMode;
    clone.isMask        = this.isMask;
    clone.boundsPadding = this.boundsPadding;
    clone.dirty         = 0;
    clone.cachedSpriteDirty = this.cachedSpriteDirty;

    // copy graphics data
    for (var i = 0; i < this.graphicsData.length; ++i)
    {
        clone.graphicsData.push(this.graphicsData[i].clone());
    }

    clone.currentPath = clone.graphicsData[clone.graphicsData.length - 1];

    clone.updateLocalBounds();

    return clone;
};

/**
 * Specifies the line style used for subsequent calls to Graphics methods such as the lineTo() method or the drawCircle() method.
 *
 * @param lineWidth {number} width of the line to draw, will update the objects stored style
 * @param color {number} color of the line to draw, will update the objects stored style
 * @param alpha {number} alpha of the line to draw, will update the objects stored style
 * @return {PIXI.Graphics} This Graphics object. Good for chaining method calls
 */
Graphics.prototype.lineStyle = function (lineWidth, color, alpha)
{
    this.lineWidth = lineWidth || 0;
    this.lineColor = color || 0;
    this.lineAlpha = (alpha === undefined) ? 1 : alpha;

    if (this.currentPath)
    {
        if (this.currentPath.shape.points.length)
        {
            // halfway through a line? start a new one!
            var shape = new math.Polygon(this.currentPath.shape.points.slice(-2));
            shape.closed = false;
            this.drawShape(shape);
        }
        else
        {
            // otherwise its empty so lets just set the line properties
            this.currentPath.lineWidth = this.lineWidth;
            this.currentPath.lineColor = this.lineColor;
            this.currentPath.lineAlpha = this.lineAlpha;
        }
    }

    return this;
};

/**
 * Moves the current drawing position to x, y.
 *
 * @param x {number} the X coordinate to move to
 * @param y {number} the Y coordinate to move to
 * @return {PIXI.Graphics} This Graphics object. Good for chaining method calls
 */
Graphics.prototype.moveTo = function (x, y)
{
    var shape = new math.Polygon([x,y]);
    shape.closed = false;
    this.drawShape(shape);

    return this;
};

/**
 * Draws a line using the current line style from the current drawing position to (x, y);
 * The current drawing position is then set to (x, y).
 *
 * @param x {number} the X coordinate to draw to
 * @param y {number} the Y coordinate to draw to
 * @return {PIXI.Graphics} This Graphics object. Good for chaining method calls
 */
Graphics.prototype.lineTo = function (x, y)
{
    this.currentPath.shape.points.push(x, y);
    this.dirty++;

    return this;
};

/**
 * Calculate the points for a quadratic bezier curve and then draws it.
 * Based on: https://stackoverflow.com/questions/785097/how-do-i-implement-a-bezier-curve-in-c
 *
 * @param cpX {number} Control point x
 * @param cpY {number} Control point y
 * @param toX {number} Destination point x
 * @param toY {number} Destination point y
 * @return {PIXI.Graphics} This Graphics object. Good for chaining method calls
 */
Graphics.prototype.quadraticCurveTo = function (cpX, cpY, toX, toY)
{
    if (this.currentPath)
    {
        if (this.currentPath.shape.points.length === 0)
        {
            this.currentPath.shape.points = [0, 0];
        }
    }
    else
    {
        this.moveTo(0,0);
    }


    var xa,
        ya,
        n = 20,
        points = this.currentPath.shape.points;

    if (points.length === 0)
    {
        this.moveTo(0, 0);
    }

    var fromX = points[points.length-2];
    var fromY = points[points.length-1];

    var j = 0;
    for (var i = 1; i <= n; ++i)
    {
        j = i / n;

        xa = fromX + ( (cpX - fromX) * j );
        ya = fromY + ( (cpY - fromY) * j );

        points.push( xa + ( ((cpX + ( (toX - cpX) * j )) - xa) * j ),
                     ya + ( ((cpY + ( (toY - cpY) * j )) - ya) * j ) );
    }

    this.dirty++;

    return this;
};

/**
 * Calculate the points for a bezier curve and then draws it.
 *
 * @param cpX {number} Control point x
 * @param cpY {number} Control point y
 * @param cpX2 {number} Second Control point x
 * @param cpY2 {number} Second Control point y
 * @param toX {number} Destination point x
 * @param toY {number} Destination point y
 * @return {PIXI.Graphics} This Graphics object. Good for chaining method calls
 */
Graphics.prototype.bezierCurveTo = function (cpX, cpY, cpX2, cpY2, toX, toY)
{
    if (this.currentPath)
    {
        if (this.currentPath.shape.points.length === 0)
        {
            this.currentPath.shape.points = [0, 0];
        }
    }
    else
    {
        this.moveTo(0,0);
    }

    var points = this.currentPath.shape.points;

    var fromX = points[points.length-2];
    var fromY = points[points.length-1];

    points.length -= 2;

    bezierCurveTo(fromX, fromY, cpX, cpY, cpX2, cpY2, toX, toY, points);

    this.dirty++;

    return this;
};

/**
 * The arcTo() method creates an arc/curve between two tangents on the canvas.
 *
 * "borrowed" from https://code.google.com/p/fxcanvas/ - thanks google!
 *
 * @param x1 {number} The x-coordinate of the beginning of the arc
 * @param y1 {number} The y-coordinate of the beginning of the arc
 * @param x2 {number} The x-coordinate of the end of the arc
 * @param y2 {number} The y-coordinate of the end of the arc
 * @param radius {number} The radius of the arc
 * @return {PIXI.Graphics} This Graphics object. Good for chaining method calls
 */
Graphics.prototype.arcTo = function (x1, y1, x2, y2, radius)
{
    if (this.currentPath)
    {
        if (this.currentPath.shape.points.length === 0)
        {
            this.currentPath.shape.points.push(x1, y1);
        }
    }
    else
    {
        this.moveTo(x1, y1);
    }

    var points = this.currentPath.shape.points,
        fromX = points[points.length-2],
        fromY = points[points.length-1],
        a1 = fromY - y1,
        b1 = fromX - x1,
        a2 = y2   - y1,
        b2 = x2   - x1,
        mm = Math.abs(a1 * b2 - b1 * a2);

    if (mm < 1.0e-8 || radius === 0)
    {
        if (points[points.length-2] !== x1 || points[points.length-1] !== y1)
        {
            points.push(x1, y1);
        }
    }
    else
    {
        var dd = a1 * a1 + b1 * b1,
            cc = a2 * a2 + b2 * b2,
            tt = a1 * a2 + b1 * b2,
            k1 = radius * Math.sqrt(dd) / mm,
            k2 = radius * Math.sqrt(cc) / mm,
            j1 = k1 * tt / dd,
            j2 = k2 * tt / cc,
            cx = k1 * b2 + k2 * b1,
            cy = k1 * a2 + k2 * a1,
            px = b1 * (k2 + j1),
            py = a1 * (k2 + j1),
            qx = b2 * (k1 + j2),
            qy = a2 * (k1 + j2),
            startAngle = Math.atan2(py - cy, px - cx),
            endAngle   = Math.atan2(qy - cy, qx - cx);

        this.arc(cx + x1, cy + y1, radius, startAngle, endAngle, b1 * a2 > b2 * a1);
    }

    this.dirty++;

    return this;
};

/**
 * The arc method creates an arc/curve (used to create circles, or parts of circles).
 *
 * @param cx {number} The x-coordinate of the center of the circle
 * @param cy {number} The y-coordinate of the center of the circle
 * @param radius {number} The radius of the circle
 * @param startAngle {number} The starting angle, in radians (0 is at the 3 o'clock position of the arc's circle)
 * @param endAngle {number} The ending angle, in radians
 * @param [anticlockwise=false] {boolean} Specifies whether the drawing should be counterclockwise or clockwise. False is default, and indicates clockwise, while true indicates counter-clockwise.
 * @return {PIXI.Graphics} This Graphics object. Good for chaining method calls
 */
Graphics.prototype.arc = function(cx, cy, radius, startAngle, endAngle, anticlockwise)
{
    anticlockwise = anticlockwise || false;

    if (startAngle === endAngle)
    {
        return this;
    }

    if( !anticlockwise && endAngle <= startAngle )
    {
        endAngle += Math.PI * 2;
    }
    else if( anticlockwise && startAngle <= endAngle )
    {
        startAngle += Math.PI * 2;
    }

    var sweep = anticlockwise ? (startAngle - endAngle) * -1 : (endAngle - startAngle);
    var segs =  Math.ceil(Math.abs(sweep) / (Math.PI * 2)) * 40;

    if(sweep === 0)
    {
        return this;
    }

    var startX = cx + Math.cos(startAngle) * radius;
    var startY = cy + Math.sin(startAngle) * radius;

    if (this.currentPath)
    {
        this.currentPath.shape.points.push(startX, startY);
    }
    else
    {
        this.moveTo(startX, startY);
    }

    var points = this.currentPath.shape.points;

    var theta = sweep/(segs*2);
    var theta2 = theta*2;

    var cTheta = Math.cos(theta);
    var sTheta = Math.sin(theta);

    var segMinus = segs - 1;

    var remainder = ( segMinus % 1 ) / segMinus;

    for(var i=0; i<=segMinus; i++)
    {
        var real =  i + remainder * i;


        var angle = ((theta) + startAngle + (theta2 * real));

        var c = Math.cos(angle);
        var s = -Math.sin(angle);

        points.push(( (cTheta *  c) + (sTheta * s) ) * radius + cx,
                    ( (cTheta * -s) + (sTheta * c) ) * radius + cy);
    }

    this.dirty++;

    return this;
};

/**
 * Specifies a simple one-color fill that subsequent calls to other Graphics methods
 * (such as lineTo() or drawCircle()) use when drawing.
 *
 * @param color {number} the color of the fill
 * @param alpha {number} the alpha of the fill
 * @return {PIXI.Graphics} This Graphics object. Good for chaining method calls
 */
Graphics.prototype.beginFill = function (color, alpha)
{
    this.filling = true;
    this.fillColor = color || 0;
    this.fillAlpha = (alpha === undefined) ? 1 : alpha;

    if (this.currentPath)
    {
        if (this.currentPath.shape.points.length <= 2)
        {
            this.currentPath.fill = this.filling;
            this.currentPath.fillColor = this.fillColor;
            this.currentPath.fillAlpha = this.fillAlpha;
        }
    }
    return this;
};

/**
 * Applies a fill to the lines and shapes that were added since the last call to the beginFill() method.
 *
 * @return {PIXI.Graphics} This Graphics object. Good for chaining method calls
 */
Graphics.prototype.endFill = function ()
{
    this.filling = false;
    this.fillColor = null;
    this.fillAlpha = 1;

    return this;
};

/**
 *
 * @param x {number} The X coord of the top-left of the rectangle
 * @param y {number} The Y coord of the top-left of the rectangle
 * @param width {number} The width of the rectangle
 * @param height {number} The height of the rectangle
 * @return {PIXI.Graphics} This Graphics object. Good for chaining method calls
 */
Graphics.prototype.drawRect = function ( x, y, width, height )
{
    this.drawShape(new math.Rectangle(x,y, width, height));

    return this;
};

/**
 *
 * @param x {number} The X coord of the top-left of the rectangle
 * @param y {number} The Y coord of the top-left of the rectangle
 * @param width {number} The width of the rectangle
 * @param height {number} The height of the rectangle
 * @param radius {number} Radius of the rectangle corners
 * @return {PIXI.Graphics} This Graphics object. Good for chaining method calls
 */
Graphics.prototype.drawRoundedRect = function ( x, y, width, height, radius )
{
    this.drawShape(new math.RoundedRectangle(x, y, width, height, radius));

    return this;
};

/**
 * Draws a circle.
 *
 * @param x {number} The X coordinate of the center of the circle
 * @param y {number} The Y coordinate of the center of the circle
 * @param radius {number} The radius of the circle
 * @return {PIXI.Graphics} This Graphics object. Good for chaining method calls
 */
Graphics.prototype.drawCircle = function (x, y, radius)
{
    this.drawShape(new math.Circle(x,y, radius));

    return this;
};

/**
 * Draws an ellipse.
 *
 * @param x {number} The X coordinate of the center of the ellipse
 * @param y {number} The Y coordinate of the center of the ellipse
 * @param width {number} The half width of the ellipse
 * @param height {number} The half height of the ellipse
 * @return {PIXI.Graphics} This Graphics object. Good for chaining method calls
 */
Graphics.prototype.drawEllipse = function (x, y, width, height)
{
    this.drawShape(new math.Ellipse(x, y, width, height));

    return this;
};

/**
 * Draws a polygon using the given path.
 *
 * @param path {number[]|PIXI.Point[]} The path data used to construct the polygon.
 * @return {PIXI.Graphics} This Graphics object. Good for chaining method calls
 */
Graphics.prototype.drawPolygon = function (path)
{
    // prevents an argument assignment deopt
    // see section 3.1: https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
    var points = path;

    var closed = true;

    if (points instanceof math.Polygon)
    {
        closed = points.closed;
        points = points.points;
    }

    if (!Array.isArray(points))
    {
        // prevents an argument leak deopt
        // see section 3.2: https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#3-managing-arguments
        points = new Array(arguments.length);

        for (var i = 0; i < points.length; ++i)
        {
            points[i] = arguments[i];
        }
    }

    var shape = new math.Polygon(points);
    shape.closed = closed;

    this.drawShape(shape);

    return this;
};

/**
 * Clears the graphics that were drawn to this Graphics object, and resets fill and line style settings.
 *
 * @return {PIXI.Graphics} This Graphics object. Good for chaining method calls
 */
Graphics.prototype.clear = function ()
{
    this.lineWidth = 0;
    this.filling = false;

    this.dirty++;
    this.clearDirty++;
    this.graphicsData = [];

    return this;
};

/**
 * True if graphics consists of one rectangle, and thus, can be drawn like a Sprite and masked with gl.scissor
 * @returns {boolean}
 */
Graphics.prototype.isFastRect = function() {
    return this.graphicsData.length === 1 && this.graphicsData[0].shape.type === CONST.SHAPES.RECT && !this.graphicsData[0].lineWidth;
};

/**
 * Renders the object using the WebGL renderer
 *
 * @param renderer {PIXI.WebGLRenderer}
 * @private
 */
Graphics.prototype._renderWebGL = function (renderer)
{
    // if the sprite is not visible or the alpha is 0 then no need to render this element
    if(this.dirty !== this.fastRectDirty)
    {
        this.fastRectDirty = this.dirty;
        this._fastRect = this.isFastRect();
    }

    //TODO this check can be moved to dirty?
    if(this._fastRect)
    {
        this._renderSpriteRect(renderer);
    }
    else
    {
        renderer.setObjectRenderer(renderer.plugins.graphics);
        renderer.plugins.graphics.render(this);
    }

};

Graphics.prototype._renderSpriteRect = function (renderer)
{
    var rect = this.graphicsData[0].shape;
    if(!this._spriteRect)
    {
        if(!Graphics._SPRITE_TEXTURE)
        {
            var canvas = document.createElement('canvas');
            canvas.width = 10;
            canvas.height = 10;
            var context = canvas.getContext('2d');
            context.fillStyle = 'white';
            context.fillRect(0, 0, 10, 10);
            Graphics._SPRITE_TEXTURE = Texture.fromCanvas(canvas);
        }

        this._spriteRect = new Sprite(Graphics._SPRITE_TEXTURE);
    }
    if (this.tint === 0xffffff) {
        this._spriteRect.tint = this.graphicsData[0].fillColor;
    } else {
        var t1 = tempColor1;
        var t2 = tempColor2;
        utils.hex2rgb(this.graphicsData[0].fillColor, t1);
        utils.hex2rgb(this.tint, t2);
        t1[0] *= t2[0];
        t1[1] *= t2[1];
        t1[2] *= t2[2];
        this._spriteRect.tint = utils.rgb2hex(t1);
    }
    this._spriteRect.alpha = this.graphicsData[0].fillAlpha;
    this._spriteRect.worldAlpha = this.worldAlpha * this._spriteRect.alpha;

    Graphics._SPRITE_TEXTURE._frame.width = rect.width;
    Graphics._SPRITE_TEXTURE._frame.height = rect.height;

    this._spriteRect.transform.worldTransform = this.transform.worldTransform;

    this._spriteRect.anchor.set(-rect.x / rect.width, -rect.y / rect.height);
    this._spriteRect.onAnchorUpdate();

    this._spriteRect._renderWebGL(renderer);
};

/**
 * Renders the object using the Canvas renderer
 *
 * @param renderer {PIXI.CanvasRenderer}
 * @private
 */
Graphics.prototype._renderCanvas = function (renderer)
{
    if (this.isMask === true)
    {
        return;
    }

    renderer.plugins.graphics.render(this);
};

/**
 * Retrieves the bounds of the graphic shape as a rectangle object
 *
 * @param [matrix] {PIXI.Matrix} The world transform matrix to use, defaults to this
 *  object's worldTransform.
 * @return {PIXI.Rectangle} the rectangular bounding area
 */
Graphics.prototype._calculateBounds = function ()
{
    if (!this.renderable)
    {
        return;
    }

    if (this.boundsDirty !== this.dirty)
    {
        this.boundsDirty = this.dirty;
        this.updateLocalBounds();

        this.dirty++;
        this.cachedSpriteDirty = true;
    }

    var lb = this._localBounds;
    this._bounds.addFrame(this.transform, lb.minX, lb.minY, lb.maxX, lb.maxY);
};

/**
* Tests if a point is inside this graphics object
*
* @param point {PIXI.Point} the point to test
* @return {boolean} the result of the test
*/
Graphics.prototype.containsPoint = function( point )
{
    this.worldTransform.applyInverse(point,  tempPoint);

    var graphicsData = this.graphicsData;

    for (var i = 0; i < graphicsData.length; i++)
    {
        var data = graphicsData[i];

        if (!data.fill)
        {
            continue;
        }

        // only deal with fills..
        if (data.shape)
        {
            if ( data.shape.contains( tempPoint.x, tempPoint.y ) )
            {
                return true;
            }
        }
    }

    return false;
};

/**
 * Update the bounds of the object
 *
 */
Graphics.prototype.updateLocalBounds = function ()
{
    var minX = Infinity;
    var maxX = -Infinity;

    var minY = Infinity;
    var maxY = -Infinity;

    if (this.graphicsData.length)
    {
        var shape, points, x, y, w, h;

        for (var i = 0; i < this.graphicsData.length; i++)
        {
            var data = this.graphicsData[i];
            var type = data.type;
            var lineWidth = data.lineWidth;
            shape = data.shape;

            if (type === CONST.SHAPES.RECT || type === CONST.SHAPES.RREC)
            {
                x = shape.x - lineWidth/2;
                y = shape.y - lineWidth/2;
                w = shape.width + lineWidth;
                h = shape.height + lineWidth;

                minX = x < minX ? x : minX;
                maxX = x + w > maxX ? x + w : maxX;

                minY = y < minY ? y : minY;
                maxY = y + h > maxY ? y + h : maxY;
            }
            else if (type === CONST.SHAPES.CIRC)
            {
                x = shape.x;
                y = shape.y;
                w = shape.radius + lineWidth/2;
                h = shape.radius + lineWidth/2;

                minX = x - w < minX ? x - w : minX;
                maxX = x + w > maxX ? x + w : maxX;

                minY = y - h < minY ? y - h : minY;
                maxY = y + h > maxY ? y + h : maxY;
            }
            else if (type === CONST.SHAPES.ELIP)
            {
                x = shape.x;
                y = shape.y;
                w = shape.width + lineWidth/2;
                h = shape.height + lineWidth/2;

                minX = x - w < minX ? x - w : minX;
                maxX = x + w > maxX ? x + w : maxX;

                minY = y - h < minY ? y - h : minY;
                maxY = y + h > maxY ? y + h : maxY;
            }
            else
            {
                // POLY
                points = shape.points;

                for (var j = 0; j < points.length; j += 2)
                {
                    x = points[j];
                    y = points[j+1];

                    minX = x-lineWidth < minX ? x-lineWidth : minX;
                    maxX = x+lineWidth > maxX ? x+lineWidth : maxX;

                    minY = y-lineWidth < minY ? y-lineWidth : minY;
                    maxY = y+lineWidth > maxY ? y+lineWidth : maxY;
                }
            }
        }
    }
    else
    {
        minX = 0;
        maxX = 0;
        minY = 0;
        maxY = 0;
    }

    var padding = this.boundsPadding;

    this._localBounds.minX = minX - padding;
    this._localBounds.maxX = maxX + padding * 2;

    this._localBounds.minY = minY - padding;
    this._localBounds.maxY = maxY + padding * 2;
};


/**
 * Draws the given shape to this Graphics object. Can be any of Circle, Rectangle, Ellipse, Line or Polygon.
 *
 * @param shape {PIXI.Circle|PIXI.Ellipse|PIXI.Polygon|PIXI.Rectangle|PIXI.RoundedRectangle} The shape object to draw.
 * @return {PIXI.GraphicsData} The generated GraphicsData object.
 */
Graphics.prototype.drawShape = function (shape)
{
    if (this.currentPath)
    {
        // check current path!
        if (this.currentPath.shape.points.length <= 2)
        {
            this.graphicsData.pop();
        }
    }

    this.currentPath = null;

    var data = new GraphicsData(this.lineWidth, this.lineColor, this.lineAlpha, this.fillColor, this.fillAlpha, this.filling, shape);

    this.graphicsData.push(data);

    if (data.type === CONST.SHAPES.POLY)
    {
        data.shape.closed = data.shape.closed || this.filling;
        this.currentPath = data;
    }

    this.dirty++;

    return data;
};

Graphics.prototype.generateCanvasTexture = function(scaleMode, resolution)
{
    resolution = resolution || 1;

    var bounds = this.getLocalBounds();

    var canvasBuffer = new RenderTexture.create(bounds.width * resolution, bounds.height * resolution);

    if(!canvasRenderer)
    {
        canvasRenderer = new CanvasRenderer();
    }

    tempMatrix.tx = -bounds.x;
    tempMatrix.ty = -bounds.y;

    canvasRenderer.render(this, canvasBuffer, false, tempMatrix);

    var texture = Texture.fromCanvas(canvasBuffer.baseTexture._canvasRenderTarget.canvas, scaleMode);
    texture.baseTexture.resolution = resolution;

    return texture;
};

Graphics.prototype.closePath = function ()
{
    // ok so close path assumes next one is a hole!
    var currentPath = this.currentPath;
    if (currentPath && currentPath.shape)
    {
        currentPath.shape.close();
    }
    return this;
};

Graphics.prototype.addHole = function()
{
    // this is a hole!
    var hole = this.graphicsData.pop();

    this.currentPath = this.graphicsData[this.graphicsData.length-1];

    this.currentPath.addHole(hole.shape);
    this.currentPath = null;

    return this;
};

/**
 * Destroys the Graphics object.
 */
Graphics.prototype.destroy = function ()
{
    Container.prototype.destroy.apply(this, arguments);

    // destroy each of the GraphicsData objects
    for (var i = 0; i < this.graphicsData.length; ++i) {
        this.graphicsData[i].destroy();
    }

    // for each webgl data entry, destroy the WebGLGraphicsData
    for (var id in this._webgl) {
        for (var j = 0; j < this._webgl[id].data.length; ++j) {
            this._webgl[id].data[j].destroy();
        }
    }

    if(this._spriteRect)
    {
        this._spriteRect.destroy();
    }
    this.graphicsData = null;

    this.currentPath = null;
    this._webgl = null;
    this._localBounds = null;
};
