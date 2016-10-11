var math = require('../math'),
    TransformBase = require('./TransformBase');


/**
 * Generic class to deal with traditional 2D matrix transforms
 * local transformation is calculated from position,scale,skew and rotation
 *
 * @class
 * @extends PIXI.TransformBase
 * @memberof PIXI
 */
function Transform()
{
    TransformBase.call(this);

     /**
     * The coordinate of the object relative to the local coordinates of the parent.
     *
     * @member {PIXI.Point}
     */
    this.position = new math.Point(0,0);

    /**
     * The scale factor of the object.
     *
     * @member {PIXI.Point}
     */
    this.scale = new math.Point(1,1);

    /**
     * The skew amount, on the x and y axis.
     *
     * @member {PIXI.ObservablePoint}
     */
    this.skew = new math.ObservablePoint(this.updateSkew, this, 0,0);

    /**
     * The pivot point of the displayObject that it rotates around
     *
     * @member {PIXI.Point}
     */
    this.pivot = new math.Point(0,0);

    /**
     * The rotation value of the object, in radians
     *
     * @member {Number}
     * @private
     */
    this._rotation = 0;

    this._sr = Math.sin(0);
    this._cr = Math.cos(0);
    this._cy  = Math.cos(0);//skewY);
    this._sy  = Math.sin(0);//skewY);
    this._nsx = Math.sin(0);//skewX);
    this._cx  = Math.cos(0);//skewX);
}

Transform.prototype = Object.create(TransformBase.prototype);
Transform.prototype.constructor = Transform;

Transform.prototype.updateSkew = function ()
{
    this._cy  = Math.cos(this.skew.y);
    this._sy  = Math.sin(this.skew.y);
    this._nsx = Math.sin(this.skew.x);
    this._cx  = Math.cos(this.skew.x);
};

/**
 * Updates only local matrix
 */
Transform.prototype.updateLocalTransform = function() {
    var lt = this.localTransform;
    var a, b, c, d;

    a  =  this._cr * this.scale.x;
    b  =  this._sr * this.scale.x;
    c  = -this._sr * this.scale.y;
    d  =  this._cr * this.scale.y;

    lt.a  = this._cy * a + this._sy * c;
    lt.b  = this._cy * b + this._sy * d;
    lt.c  = this._nsx * a + this._cx * c;
    lt.d  = this._nsx * b + this._cx * d;
};

/**
 * Updates the values of the object and applies the parent's transform.
 * @param parentTransform {PIXI.Transform} The transform of the parent of this object
 */
Transform.prototype.updateTransform = function (parentTransform)
{

    var pt = parentTransform.worldTransform;
    var wt = this.worldTransform;
    var lt = this.localTransform;
    var a, b, c, d;

    a  =  this._cr * this.scale.x;
    b  =  this._sr * this.scale.x;
    c  = -this._sr * this.scale.y;
    d  =  this._cr * this.scale.y;

    lt.a  = this._cy * a + this._sy * c;
    lt.b  = this._cy * b + this._sy * d;
    lt.c  = this._nsx * a + this._cx * c;
    lt.d  = this._nsx * b + this._cx * d;

    lt.tx =  this.position.x - (this.pivot.x * lt.a + this.pivot.y * lt.c);
    lt.ty =  this.position.y - (this.pivot.x * lt.b + this.pivot.y * lt.d);

    // concat the parent matrix with the objects transform.
    wt.a  = lt.a  * pt.a + lt.b  * pt.c;
    wt.b  = lt.a  * pt.b + lt.b  * pt.d;
    wt.c  = lt.c  * pt.a + lt.d  * pt.c;
    wt.d  = lt.c  * pt.b + lt.d  * pt.d;
    wt.tx = lt.tx * pt.a + lt.ty * pt.c + pt.tx;
    wt.ty = lt.tx * pt.b + lt.ty * pt.d + pt.ty;

    this._worldID ++;
};

/**
 * Decomposes a matrix and sets the transforms properties based on it.
 * @param {PIXI.Matrix} The matrix to decompose
 */
Transform.prototype.setFromMatrix = function (matrix)
{
    matrix.decompose(this);
};


Object.defineProperties(Transform.prototype, {
    /**
     * The rotation of the object in radians.
     *
     * @member {number}
     * @memberof PIXI.Transform#
     */
    rotation: {
        get: function () {
            return this._rotation;
        },
        set: function (value) {
            this._rotation = value;
            this._sr = Math.sin(value);
            this._cr = Math.cos(value);
        }
    }
});

module.exports = Transform;
