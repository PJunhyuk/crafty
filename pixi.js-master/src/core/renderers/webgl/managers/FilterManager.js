
var WebGLManager = require('./WebGLManager'),
    RenderTarget = require('../utils/RenderTarget'),
    Quad = require('../utils/Quad'),
    math =  require('../../../math'),
    Shader = require('../../../Shader'),
    filterTransforms = require('../filters/filterTransforms'),
    bitTwiddle = require('bit-twiddle');

var FilterState = function()
{
    this.renderTarget = null;
    this.sourceFrame = new math.Rectangle();
    this.destinationFrame = new math.Rectangle();
    this.filters = [];
    this.target = null;
    this.resolution = 1;
};


/**
 * @class
 * @memberof PIXI
 * @extends PIXI.WebGLManager
 * @param renderer {PIXI.WebGLRenderer} The renderer this manager works for.
 */
function FilterManager(renderer)
{
    WebGLManager.call(this, renderer);

    this.gl = this.renderer.gl;
    // know about sprites!
    this.quad = new Quad(this.gl, renderer.state.attribState);

    this.shaderCache = {};
    // todo add default!
    this.pool = {};

    this.filterData = null;
}

FilterManager.prototype = Object.create(WebGLManager.prototype);
FilterManager.prototype.constructor = FilterManager;
module.exports = FilterManager;

FilterManager.prototype.pushFilter = function(target, filters)
{
    var renderer = this.renderer;

    var filterData = this.filterData;

    if(!filterData)
    {
        filterData = this.renderer._activeRenderTarget.filterStack;

        // add new stack
        var filterState = new FilterState();
        filterState.sourceFrame = filterState.destinationFrame = this.renderer._activeRenderTarget.size;
        filterState.renderTarget = renderer._activeRenderTarget;

        this.renderer._activeRenderTarget.filterData = filterData = {
            index:0,
            stack:[filterState]
        };

        this.filterData = filterData;
    }

    // get the current filter state..
    var currentState = filterData.stack[++filterData.index];
    if(!currentState)
    {
        currentState = filterData.stack[filterData.index] = new FilterState();
    }

    // for now we go off the filter of the first resolution..
    var resolution = filters[0].resolution;
    var padding = filters[0].padding;
    var targetBounds = target.filterArea || target.getBounds(true);
    var sourceFrame = currentState.sourceFrame;
    var destinationFrame = currentState.destinationFrame;

    sourceFrame.x = ((targetBounds.x * resolution) | 0) / resolution;
    sourceFrame.y = ((targetBounds.y * resolution) | 0) / resolution;
    sourceFrame.width = ((targetBounds.width * resolution) | 0) / resolution;
    sourceFrame.height = ((targetBounds.height * resolution) | 0) / resolution;

    if(filterData.stack[0].renderTarget.transform)
    {//jshint ignore:line


    }
    else
    {
        sourceFrame.fit(filterData.stack[0].destinationFrame);
    }

    // lets pplay the padding After we fit the element to the screen.
    // this should stop the strange side effects that can occour when cropping to the edges
    sourceFrame.pad(padding);



    destinationFrame.width = sourceFrame.width;
    destinationFrame.height = sourceFrame.height;

    var renderTarget = this.getPotRenderTarget(renderer.gl, sourceFrame.width, sourceFrame.height, resolution);

    currentState.target = target;
    currentState.filters = filters;
    currentState.resolution = resolution;
    currentState.renderTarget = renderTarget;

    // bind the render taget to draw the shape in the top corner..

    renderTarget.setFrame(destinationFrame, sourceFrame);
    // bind the render target
    renderer.bindRenderTarget(renderTarget);

    // clear the renderTarget
    renderer.clear();//[0.5,0.5,0.5, 1.0]);
};

FilterManager.prototype.popFilter = function()
{
    var filterData = this.filterData;

    var lastState = filterData.stack[filterData.index-1];
    var currentState = filterData.stack[filterData.index];

    this.quad.map(currentState.renderTarget.size, currentState.sourceFrame).upload();

    var filters = currentState.filters;

    if(filters.length === 1)
    {
        filters[0].apply(this, currentState.renderTarget, lastState.renderTarget, false);
        this.freePotRenderTarget(currentState.renderTarget);
    }
    else
    {
        var flip = currentState.renderTarget;
        var flop = this.getPotRenderTarget(this.renderer.gl, currentState.sourceFrame.width, currentState.sourceFrame.height, 1);
        flop.setFrame(currentState.destinationFrame, currentState.sourceFrame);

        for (var i = 0; i < filters.length-1; i++)
        {
            filters[i].apply(this, flip, flop, true);

            var t = flip;
            flip = flop;
            flop = t;
        }

        filters[i].apply(this, flip, lastState.renderTarget, false);

        this.freePotRenderTarget(flip);
        this.freePotRenderTarget(flop);
    }

    filterData.index--;

    if(filterData.index === 0)
    {
        this.filterData = null;
    }
};

FilterManager.prototype.applyFilter = function (filter, input, output, clear)
{
    var renderer = this.renderer;
    var shader = filter.glShaders[renderer.CONTEXT_UID];

    // cacheing..
    if(!shader)
    {
        if(filter.glShaderKey)
        {
            shader = this.shaderCache[filter.glShaderKey];

            if(!shader)
            {
                shader = filter.glShaders[renderer.CONTEXT_UID] = this.shaderCache[filter.glShaderKey] = new Shader(this.gl, filter.vertexSrc, filter.fragmentSrc);
            }
        }
        else
        {
            shader = filter.glShaders[renderer.CONTEXT_UID] = new Shader(this.gl, filter.vertexSrc, filter.fragmentSrc);
        }

        //TODO - this only needs to be done once?
        this.quad.initVao(shader);
    }

    renderer.bindRenderTarget(output);



    if(clear)
    {
        var gl = renderer.gl;

        gl.disable(gl.SCISSOR_TEST);
        renderer.clear();//[1, 1, 1, 1]);
        gl.enable(gl.SCISSOR_TEST);
    }

    // in case the render target is being masked using a scissor rect
    if(output === renderer.maskManager.scissorRenderTarget)
    {
        renderer.maskManager.pushScissorMask(null, renderer.maskManager.scissorData);
    }

    renderer.bindShader(shader);

    // this syncs the pixi filters  uniforms with glsl uniforms
    this.syncUniforms(shader, filter);

    // bind the input texture..
    input.texture.bind(0);
    // when you manually bind a texture, please switch active texture location to it
    renderer._activeTextureLocation = 0;

    renderer.state.setBlendMode( filter.blendMode );

    this.quad.draw();
};

// this returns a matrix that will normalise map filter cords in the filter to screen space
FilterManager.prototype.syncUniforms = function (shader, filter)
{
    var uniformData = filter.uniformData;
    var uniforms = filter.uniforms;

    // 0 is reserverd for the pixi texture so we start at 1!
    var textureCount = 1;
    var currentState;

    if(shader.uniforms.data.filterArea)
    {
        currentState = this.filterData.stack[this.filterData.index];
        var filterArea = shader.uniforms.filterArea;

        filterArea[0] = currentState.renderTarget.size.width;
        filterArea[1] = currentState.renderTarget.size.height;
        filterArea[2] = currentState.sourceFrame.x;
        filterArea[3] = currentState.sourceFrame.y;

        shader.uniforms.filterArea = filterArea;
    }

    // use this to clamp displaced texture coords so they belong to filterArea
    // see displacementFilter fragment shader for an example
    if(shader.uniforms.data.filterClamp)
    {
        currentState = this.filterData.stack[this.filterData.index];
        var filterClamp = shader.uniforms.filterClamp;

        filterClamp[0] = 0.5 / currentState.renderTarget.size.width;
        filterClamp[1] = 0.5 / currentState.renderTarget.size.height;
        filterClamp[2] = (currentState.sourceFrame.width - 0.5) / currentState.renderTarget.size.width;
        filterClamp[3] = (currentState.sourceFrame.height - 0.5) / currentState.renderTarget.size.height;

        shader.uniforms.filterClamp = filterClamp;
    }

    var val;
    //TODO Cacheing layer..
    for(var i in uniformData)
    {
        if(uniformData[i].type === 'sampler2D')
        {
            shader.uniforms[i] = textureCount;

            if(uniforms[i].baseTexture)
            {
                this.renderer.bindTexture(uniforms[i].baseTexture, textureCount);
            }
            else
            {
                // this is helpful as renderTargets can also be set.
                // Although thinking about it, we could probably
                // make the filter texture cache return a RenderTexture
                // rather than a renderTarget
                var gl = this.renderer.gl;
                this.renderer._activeTextureLocation = gl.TEXTURE0 + textureCount;
                gl.activeTexture(gl.TEXTURE0 + textureCount );
                uniforms[i].texture.bind();
            }

            textureCount++;
        }
        else if(uniformData[i].type === 'mat3')
        {
            // check if its pixi matrix..
            if(uniforms[i].a !== undefined)
            {
                shader.uniforms[i] = uniforms[i].toArray(true);
            }
            else
            {
                shader.uniforms[i] = uniforms[i];
            }
        }
        else if(uniformData[i].type === 'vec2')
        {
            //check if its a point..
           if(uniforms[i].x !== undefined)
           {
                val = shader.uniforms[i] || new Float32Array(2);
                val[0] = uniforms[i].x;
                val[1] = uniforms[i].y;
                shader.uniforms[i] = val;
           }
           else
           {
                shader.uniforms[i] = uniforms[i];
           }
        }
        else if(uniformData[i].type === 'float')
        {
            if(shader.uniforms.data[i].value !== uniformData[i])
            {
                shader.uniforms[i] = uniforms[i];
            }
        }
        else
        {
            shader.uniforms[i] = uniforms[i];
        }
    }
};


FilterManager.prototype.getRenderTarget = function(clear, resolution)
{
    var currentState = this.filterData.stack[this.filterData.index];
    var renderTarget = this.getPotRenderTarget(this.renderer.gl, currentState.sourceFrame.width, currentState.sourceFrame.height, resolution || currentState.resolution);
    renderTarget.setFrame(currentState.destinationFrame, currentState.sourceFrame);

    return renderTarget;
};

FilterManager.prototype.returnRenderTarget = function(renderTarget)
{
    return this.freePotRenderTarget(renderTarget);
};

/*
 * Calculates the mapped matrix
 * @param filterArea {Rectangle} The filter area
 * @param sprite {Sprite} the target sprite
 * @param outputMatrix {Matrix} @alvin
 */
// TODO playing around here.. this is temporary - (will end up in the shader)
// thia returns a matrix that will normalise map filter cords in the filter to screen space
FilterManager.prototype.calculateScreenSpaceMatrix = function (outputMatrix)
{
    var currentState = this.filterData.stack[this.filterData.index];
    return filterTransforms.calculateScreenSpaceMatrix(outputMatrix,  currentState.sourceFrame, currentState.renderTarget.size);
};

/**
 * Multiply vTextureCoord to this matrix to achieve (0,0,1,1) for filterArea
 *
 * @param outputMatrix {PIXI.Matrix}
 */
FilterManager.prototype.calculateNormalizedScreenSpaceMatrix = function (outputMatrix)
{
    var currentState = this.filterData.stack[this.filterData.index];

    return filterTransforms.calculateNormalizedScreenSpaceMatrix(outputMatrix, currentState.sourceFrame, currentState.renderTarget.size, currentState.destinationFrame);
};

// this will map the filter coord so that a texture can be used based on the transform of a sprite
FilterManager.prototype.calculateSpriteMatrix = function (outputMatrix, sprite)
{
    var currentState = this.filterData.stack[this.filterData.index];
    return filterTransforms.calculateSpriteMatrix(outputMatrix, currentState.sourceFrame, currentState.renderTarget.size, sprite);
};

FilterManager.prototype.destroy = function()
{
     this.shaderCache = [];
     this.emptyPool();
};



//TODO move to a seperate class could be on renderer?
//also - could cause issue with multiple contexts?
FilterManager.prototype.getPotRenderTarget = function(gl, minWidth, minHeight, resolution)
{
    //TODO you coud return a bigger texture if there is not one in the pool?
    minWidth = bitTwiddle.nextPow2(minWidth * resolution);
    minHeight = bitTwiddle.nextPow2(minHeight * resolution);

    var key = ((minWidth & 0xFFFF) << 16) | ( minHeight & 0xFFFF);

    if(!this.pool[key]) {
      this.pool[key] = [];
    }

    var renderTarget = this.pool[key].pop() || new RenderTarget(gl, minWidth, minHeight, null, 1);

    //manually tweak the resolution...
    //this will not modify the size of the frame buffer, just its resolution.
    renderTarget.resolution = resolution;
    renderTarget.defaultFrame.width = renderTarget.size.width = minWidth / resolution;
    renderTarget.defaultFrame.height = renderTarget.size.height = minHeight / resolution;
    return renderTarget;
};

FilterManager.prototype.emptyPool = function()
{
    for (var i in this.pool)
    {
        var textures = this.pool[i];
        if(textures)
        {
            for (var j = 0; j < textures.length; j++)
            {
                textures[j].destroy(true);
            }
        }
    }

    this.pool = {};
};

FilterManager.prototype.freePotRenderTarget = function(renderTarget)
{
    var minWidth = renderTarget.size.width * renderTarget.resolution;
    var minHeight = renderTarget.size.height * renderTarget.resolution;

    var key = ((minWidth & 0xFFFF) << 16) | (minHeight & 0xFFFF);
    this.pool[key].push(renderTarget);
};
