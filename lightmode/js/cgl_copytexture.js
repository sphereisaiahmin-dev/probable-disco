/******/ (() => { // webpackBootstrap
/******/ 	// runtime can't be in strict mode because a global variable is assign and maybe created.
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  CopyTexture: () => (/* binding */ CopyTexture)
});

;// CONCATENATED MODULE: external "CABLES"
const external_CABLES_namespaceObject = CABLES;
;// CONCATENATED MODULE: external "CABLES.SHARED"
const external_CABLES_SHARED_namespaceObject = CABLES.SHARED;
;// CONCATENATED MODULE: ./src/corelibs/cg/cg_texture.js


const DEFAULT_TEXTURE_SIZE = 8;

/**
 * @typedef {Object} CglTextureOptions
 * @property {number} [width]
 * @property {number} [height]
 * @property {string} [pixelformat]
 */
class CgTexture
{

    /**
     * @param {CglTextureOptions} options={}
     */
    constructor(options = {})
    {
        this.id = external_CABLES_namespaceObject.utils.uuid();
        this.width = 0;
        this.height = 0;
        this.name = "unknown";

        options = options || {};
        this.pixelFormat = options.pixelFormat || CgTexture.PFORMATSTR_RGBA8UB;

        this.name = options.name || "unknown";

        if (!options.width) options.width = DEFAULT_TEXTURE_SIZE;
        if (!options.height) options.height = DEFAULT_TEXTURE_SIZE;
    }
}

CgTexture.getDefaultTextureData = (name, size, options = {}) =>
{
    if (name == "empty")
    {
        return new Uint8Array(size * size * 4).fill(0);
    }
    else
    if (name == "color")
    {
        const data = new Uint8Array(size * size * 4);
        let r = options.r || 1;
        let g = options.g || 1;
        let b = options.b || 1;

        for (let x = 0; x < size * size; x++)
        {
            data[x * 4 + 0] = r;
            data[x * 4 + 1] = g;
            data[x * 4 + 2] = b;
            data[x * 4 + 3] = 255;
        }
        return data;
    }
    else
    if (name == "randomUInt")
    {
        const data = new Uint8Array(size * size * 4);

        for (let x = 0; x < size * size; x++)
        {
            data[x * 4 + 0] = Math.random() * 255;
            data[x * 4 + 1] = Math.random() * 255;
            data[x * 4 + 2] = Math.random() * 255;
            data[x * 4 + 3] = 255;
        }
        return data;
    }
    else
    if (name == "random" || name == "randomFloat")
    {
        const data = new Float32Array(size * size * 4);

        for (let x = 0; x < size * size; x++)
        {
            data[x * 4 + 0] = (Math.random() - 0.5) * 2.0;
            data[x * 4 + 1] = (Math.random() - 0.5) * 2.0;
            data[x * 4 + 2] = (Math.random() - 0.5) * 2.0;
            data[x * 4 + 3] = 1;
        }
        return data;
    }
    else
    if (name == "stripes")
    {
        const arr = [];

        let r = options.r;
        let g = options.g;
        let b = options.b;

        if (r === undefined)r = 1;
        if (g === undefined)g = 1;
        if (b === undefined)b = 1;

        for (let y = 0; y < size; y++)
        {
            for (let x = 0; x < size; x++)
            {
                if ((x + y) % 64 < 32)
                {
                    arr.push((200 + (y / size) * 25 + (x / size) * 25) * r);
                    arr.push((200 + (y / size) * 25 + (x / size) * 25) * g);
                    arr.push((200 + (y / size) * 25 + (x / size) * 25) * b);
                }
                else
                {
                    arr.push((40 + (y / size) * 25 + (x / size) * 25) * r);
                    arr.push((40 + (y / size) * 25 + (x / size) * 25) * g);
                    arr.push((40 + (y / size) * 25 + (x / size) * 25) * b);
                }
                arr.push(255);
            }
        }

        return new Uint8Array(arr);
    }
    else
    {
        console.warn("unknown default texture", name);
        return CgTexture.getDefaultTextureData("stripes", size, { "r": 1, "g": 0, "b": 0 });
    }
};

CgTexture.FILTER_NEAREST = 0;
CgTexture.FILTER_LINEAR = 1;
CgTexture.FILTER_MIPMAP = 2;

CgTexture.WRAP_REPEAT = 0;
CgTexture.WRAP_MIRRORED_REPEAT = 1;
CgTexture.WRAP_CLAMP_TO_EDGE = 2;

CgTexture.TYPE_DEFAULT = 0;
CgTexture.TYPE_DEPTH = 1;
CgTexture.TYPE_FLOAT = 2;

CgTexture.PFORMATSTR_RGB565 = "RGB 5/6/5bit ubyte";

CgTexture.PFORMATSTR_R8UB = "R 8bit ubyte";
CgTexture.PFORMATSTR_RG8UB = "RG 8bit ubyte";
CgTexture.PFORMATSTR_RGB8UB = "RGB 8bit ubyte";
CgTexture.PFORMATSTR_RGBA8UB = "RGBA 8bit ubyte";

CgTexture.PFORMATSTR_SRGBA8 = "SRGBA 8bit ubyte";

CgTexture.PFORMATSTR_R11FG11FB10F = "RGB 11/11/10bit float";

CgTexture.PFORMATSTR_R16F = "R 16bit float";
CgTexture.PFORMATSTR_RG16F = "RG 16bit float";
CgTexture.PFORMATSTR_RGB16F = "RGB 16bit float";
CgTexture.PFORMATSTR_RGBA16F = "RGBA 16bit float";

CgTexture.PFORMATSTR_R32F = "R 32bit float";
CgTexture.PFORMATSTR_RG32F = "RG 32bit float";
CgTexture.PFORMATSTR_RGB32F = "RGB 32bit float";
CgTexture.PFORMATSTR_RGBA32F = "RGBA 32bit float";

CgTexture.PFORMATSTR_DEPTH = "DEPTH";

CgTexture.PIXELFORMATS = [

    CgTexture.PFORMATSTR_RGB565,

    CgTexture.PFORMATSTR_R8UB,
    CgTexture.PFORMATSTR_RG8UB,
    CgTexture.PFORMATSTR_RGB8UB,
    CgTexture.PFORMATSTR_RGBA8UB,

    CgTexture.PFORMATSTR_SRGBA8,

    CgTexture.PFORMATSTR_R11FG11FB10F,
    CgTexture.PFORMATSTR_R16F,
    CgTexture.PFORMATSTR_RG16F,
    CgTexture.PFORMATSTR_RGBA16F,

    CgTexture.PFORMATSTR_R32F,
    CgTexture.PFORMATSTR_RGBA32F

];

;// CONCATENATED MODULE: ./src/corelibs/cgl/cgl_texture.js





const cgl_texture_DEFAULT_TEXTURE_SIZE = 8;

const log = new external_CABLES_SHARED_namespaceObject.Logger("cgl_texture");

/**
 * A Texture
 * @namespace external:CGL
 * @class
 * @param {CglContext} __cgl cgl
 * @param {Object} options
 * @hideconstructor
 * @example
 * // generate a 256x256 pixel texture of random colors
 * const size=256;
 * const data = new Uint8Array(size*size*4);
 *
 * for(var x=0;x<size*size*4;x++) data[ x*4+3]=255;
 *
 * const tex=new CGL.Texture(cgl);
 * tex.initFromData(data,size,size,CGL.Texture.FILTER_NEAREST,CGL.Texture.WRAP_REPEAT);
 */
class Texture extends CgTexture
{

    /**
     * @param {CglContext} __cgl
     */
    constructor(__cgl, options = {})
    {
        super(options);
        if (!__cgl) throw new Error("no cgl");

        this._cgl = __cgl;
        this._log = new external_CABLES_SHARED_namespaceObject.Logger("tex");
        this.tex = this._cgl.gl.createTexture();
        this.loading = false;
        this.flip = true;
        this.flipped = false;
        this.shadowMap = false;
        this.deleted = false;
        this.image = null;
        this.anisotropic = 0;
        this.filter = Texture.FILTER_NEAREST;
        this.wrap = Texture.WRAP_CLAMP_TO_EDGE;
        this.texTarget = this._cgl.gl.TEXTURE_2D;
        if (options && options.type) this.texTarget = options.type;
        this.textureType = Texture.TYPE_DEFAULT;
        this.unpackAlpha = true;
        this._fromData = true;

        this._glDataType = -1;
        this._glInternalFormat = -1;
        this._glDataFormat = -1;

        if (options)
        {
            if (options.isDepthTexture) this.textureType = Texture.TYPE_DEPTH;
            if (options.isFloatingPointTexture === true) this.textureType = Texture.TYPE_FLOAT;

            if ("textureType" in options) this.textureType = options.textureType;
            if ("filter" in options) this.filter = options.filter;
            if ("wrap" in options) this.wrap = options.wrap;
            if ("unpackAlpha" in options) this.unpackAlpha = options.unpackAlpha;
            if ("flip" in options) this.flip = options.flip;
            if ("shadowMap" in options) this.shadowMap = options.shadowMap;
            if ("anisotropic" in options) this.anisotropic = options.anisotropic;
        }
        else
        {
            options = {};
        }

        if (!options.pixelFormat && options.isFloatingPointTexture) this.pixelFormat = Texture.PFORMATSTR_RGBA32F;

        if (this.textureType == Texture.TYPE_DEPTH) this.pixelFormat = Texture.PFORMATSTR_DEPTH;

        this._cgl.profileData.profileTextureNew++;

        this.setFormat(Texture.setUpGlPixelFormat(this._cgl, this.pixelFormat));
        this._cgl.profileData.addHeavyEvent("texture created", this.name, options.width + "x" + options.height);

        this.setSize(options.width, options.height);
        this.getInfoOneLine();
    }

    isFloatingPoint()
    {
        return Texture.isPixelFormatFloat(this.pixelFormat);
    }

    /**
     * returns true if otherTexture has same options (width/height/filter/wrap etc)
     * @function compareSettings
     * @memberof Texture
     * @instance
     * @param {Texture} tex otherTexture
     * @returns {Boolean}
     */
    compareSettings(tex)
    {
    // if (!tex) { this._log.warn("compare: no tex"); return false; }
    // if (tex.width != this.width) this._log.warn("tex.width not equal", tex.width, this.width);
    // if (tex.height != this.height) this._log.warn("tex.height not equal", tex.height, this.height);
    // if (tex.filter != this.filter) this._log.warn("tex.filter not equal");
    // if (tex.wrap != this.wrap) this._log.warn("tex.wrap not equal");
    // if (tex.textureType != this.textureType) this._log.warn("tex.textureType not equal");
    // if (tex.unpackAlpha != this.unpackAlpha) this._log.warn("tex.unpackAlpha not equal");
    // if (tex.anisotropic != this.anisotropic) this._log.warn("tex.anisotropic not equal");
    // if (tex.shadowMap != this.shadowMap) this._log.warn("tex.shadowMap not equal");
    // if (tex.texTarget != this.texTarget) this._log.warn("tex.texTarget not equal");
    // if (tex.flip != this.flip) this._log.warn("tex.flip not equal");

        if (!tex) return false;
        return (
            tex.width == this.width &&
            tex.height == this.height &&
            tex.filter == this.filter &&
            tex.wrap == this.wrap &&
            tex.textureType == this.textureType &&
            tex.unpackAlpha == this.unpackAlpha &&
            tex.anisotropic == this.anisotropic &&
            tex.shadowMap == this.shadowMap &&
            tex.texTarget == this.texTarget &&
            tex.flip == this.flip
        );
    }

    /**
     * returns a new texture with the same settings (does not copy texture itself)
     * @function clone
     * @memberof Texture
     * @instance
     * @returns {Texture}
     */
    clone()
    {
        const newTex = new Texture(this._cgl, {
            "name": this.name,
            "filter": this.filter,
            "anisotropic": this.anisotropic,
            "wrap": this.wrap,
            "textureType": this.textureType,
            "pixelFormat": this.pixelFormat,
            "unpackAlpha": this.unpackAlpha,
            "flip": this.flip,
            "width": this.width,
            "height": this.height,
        });

        this._cgl.profileData.addHeavyEvent("texture created", this.name, this.width + "x" + this.height);

        if (!this.compareSettings(newTex))
        {
            this._log.error("Cloned texture settings do not compare!");
            this._log.error(this);
            this._log.error(newTex);
        }

        return newTex;
    }

    /**
     * @param {object} o
     */
    setFormat(o)
    {
        this.pixelFormat = o.pixelFormat;
        this._glDataFormat = o.glDataFormat;
        this._glInternalFormat = o.glInternalFormat;
        this._glDataType = o.glDataType;
    }

    /**
     * set pixel size of texture
     * @function setSize
     * @memberof Texture
     * @instance
     * @param {Number} w width
     * @param {Number} h height
     */
    setSize(w, h)
    {
        if (this._cgl.aborted) return;
        if (w != w || w <= 0 || !w) w = cgl_texture_DEFAULT_TEXTURE_SIZE;
        if (h != h || h <= 0 || !h) h = cgl_texture_DEFAULT_TEXTURE_SIZE;

        if (w > this._cgl.maxTexSize || h > this._cgl.maxTexSize) this._log.error("texture size too big! " + w + "x" + h + " / max: " + this._cgl.maxTexSize);

        w = Math.min(w, this._cgl.maxTexSize);
        h = Math.min(h, this._cgl.maxTexSize);

        w = Math.floor(w);
        h = Math.floor(h);
        if (this.width == w && this.height == h) return;

        w = this._cgl.checkTextureSize(w);
        h = this._cgl.checkTextureSize(h);

        this.width = w;
        this.height = h;
        this.deleted = false;

        this.setFormat(Texture.setUpGlPixelFormat(this._cgl, this.pixelFormat));

        this.shortInfoString = this.getInfoOneLine();// w + "x" + h + "";

        this._cgl.gl.bindTexture(this.texTarget, this.tex);
        this._cgl.profileData.profileTextureResize++;

        const uarr = null;

        this._cgl.gl.texImage2D(this.texTarget, 0, this._glInternalFormat, w, h, 0, this._glDataFormat, this._glDataType, uarr);

        this._setFilter();

        this.updateMipMap();

        this._cgl.gl.bindTexture(this.texTarget, null);
    }

    /**
     * @function initFromData
     * @memberof Texture
     * @instance
     * @description create texturem from rgb data
     * @param {Array<Number>} data rgb color array [r,g,b,a,r,g,b,a,...]
     * @param {Number} w width
     * @param {Number} h height
     * @param {Number} filter
     * @param {Number} wrap
     */
    initFromData(data, w, h, filter, wrap)
    {
        this.filter = filter;
        this.wrap = wrap;
        if (filter == undefined) this.filter = Texture.FILTER_LINEAR;
        if (wrap == undefined) this.wrap = Texture.WRAP_CLAMP_TO_EDGE;
        this.width = w;
        this.height = h;
        this._fromData = true;
        this.deleted = false;

        if (this.height > this._cgl.maxTexSize || this.width > this._cgl.maxTexSize)
        {
            const t = CGL.Texture.getTempTexture(this._cgl);
            this.width = t.width;
            this.height = t.height;
            this.tex = t.tex;
            this._log.warn("[cgl_texture] texture size too big!", this.width, this.height, this._cgl.maxTexSize);
            return;
        }

        if (this.flip) this._cgl.gl.pixelStorei(this._cgl.gl.UNPACK_FLIP_Y_WEBGL, this.flip);

        this._cgl.gl.bindTexture(this.texTarget, this.tex);

        this.setFormat(Texture.setUpGlPixelFormat(this._cgl, this.pixelFormat));

        this._cgl.gl.texImage2D(this.texTarget, 0, this._glInternalFormat, w, h, 0, this._glDataFormat, this._glDataType, data);

        this._setFilter();
        this.updateMipMap();

        if (this.flip) this._cgl.gl.pixelStorei(this._cgl.gl.UNPACK_FLIP_Y_WEBGL, false);
        this._cgl.gl.bindTexture(this.texTarget, null);
    }

    updateMipMap()
    {
        if ((this._cgl.glVersion == 2 || this.isPowerOfTwo()) && this.filter == Texture.FILTER_MIPMAP)
        {
            this._cgl.gl.generateMipmap(this.texTarget);
            this._cgl.profileData.profileGenMipMap++;
        }
    }

    /**
     * set texture data from an image/canvas object
     * @function initTexture
     * @memberof Texture
     * @instance
     * @param {Object} img image
     * @param {Number} filter
     */
    initTexture(img, filter = null)
    {
        this._cgl.printError("before initTexture");
        this._cgl.checkFrameStarted("texture inittexture");
        this._fromData = false;

        this._cgl.gl.pixelStorei(this._cgl.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.unpackAlpha);
        if (img.width || img.videoWidth) this.width = img.videoWidth || img.width;
        if (img.height || img.videoHeight) this.height = img.videoHeight || img.height;

        if (filter !== null) this.filter = filter; // todo: can we remove this filter param?

        if (img.height > this._cgl.maxTexSize || img.width > this._cgl.maxTexSize)
        {
            const t = CGL.Texture.getTempTexture(this._cgl);
            this.width = t.width;
            this.height = t.height;
            this.tex = t.tex;
            this._log.warn("[cgl_texture] texture size too big!", img.width, img.height, this._cgl.maxTexSize);
            return;
        }

        this._cgl.gl.bindTexture(this.texTarget, this.tex);

        this.deleted = false;
        this.flipped = !this.flip;
        if (this.flipped) this._cgl.gl.pixelStorei(this._cgl.gl.UNPACK_FLIP_Y_WEBGL, this.flipped);

        this.setFormat(Texture.setUpGlPixelFormat(this._cgl, this.pixelFormat));

        this._cgl.gl.texImage2D(this.texTarget, 0, this._glInternalFormat, this._glDataFormat, this._glDataType, img);

        this._setFilter();
        this.updateMipMap();

        this._cgl.gl.bindTexture(this.texTarget, null);
        this._cgl.gl.pixelStorei(this._cgl.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        if (this.flipped) this._cgl.gl.pixelStorei(this._cgl.gl.UNPACK_FLIP_Y_WEBGL, false);

        this.getInfoOneLine();
        this._cgl.printError("initTexture");
    }

    /**
     * delete texture. use this when texture is no longer needed
     * @function delete
     * @memberof Texture
     * @instance
     */
    dispose()
    {
        this.delete();
    }

    delete()
    {
        if (this.loading)
        {
            // cant delete texture when still loading
            // setTimeout(this.delete.bind(this), 50);
            return;
        }

        this.deleted = true;
        this.width = 0;
        this.height = 0;
        this._cgl.profileData.profileTextureDelete++;
        this._cgl.gl.deleteTexture(this.tex);
        this.image = null;

        this.tex = null;
    }

    /**
     * @function isPowerOfTwo
     * @memberof Texture
     * @instance
     * @description return true if texture width and height are both power of two
     * @return {Boolean}
     */
    isPowerOfTwo()
    {
        return Texture.isPowerOfTwo(this.width) && Texture.isPowerOfTwo(this.height);
    }

    printInfo()
    {
        log.log(this.getInfo());
    }

    getInfoReadable()
    {
        const info = this.getInfo();
        let html = "";

        info.name = info.name.substr(0, info.name.indexOf("?rnd="));

        for (const i in info)
        {
            html += "* " + i + ":  **" + info[i] + "**\n";
        }

        return html;
    }

    getInfoOneLine()
    {
        let txt = "" + this.width + "x" + this.height;
        txt += " ";
        // if (this.textureType === CGL.Texture.TYPE_FLOAT) txt += " 32bit"; else txt += " 8bit";
        // if (this.textureType === CGL.Texture.TYPE_FLOAT) txt += " 32bit"; else txt += " 8bit";
        txt += this.pixelFormat;

        if (this.filter === Texture.FILTER_NEAREST) txt += " nearest";
        if (this.filter === Texture.FILTER_LINEAR) txt += " linear";
        if (this.filter === Texture.FILTER_MIPMAP) txt += " mipmap";

        if (this.wrap === Texture.WRAP_CLAMP_TO_EDGE) txt += " clamp";
        if (this.wrap === Texture.WRAP_REPEAT) txt += " repeat";
        if (this.wrap === Texture.WRAP_MIRRORED_REPEAT) txt += " repeatmir";

        this.shortInfoString = txt;

        return txt;
    }

    getInfoOneLineShort()
    {
        let txt = "" + this.width + "x" + this.height;
        // if (this.textureType === CGL.Texture.TYPE_FLOAT) txt += " 32bit"; else txt += " 8bit";
        txt += " ";
        txt += this.pixelFormat;

        this.shortInfoString = txt;

        return txt;
    }

    getInfo()
    {
        return Texture.getTexInfo(this);
    }

    _setFilter()
    {
        this._cgl.printError("before _setFilter");

        if (!this._fromData)
        {
            this._cgl.gl.pixelStorei(this._cgl.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.unpackAlpha);
        }

        if (this.shadowMap)
        {
            this._cgl.gl.texParameteri(this._cgl.gl.TEXTURE_2D, this._cgl.gl.TEXTURE_COMPARE_MODE, this._cgl.gl.COMPARE_REF_TO_TEXTURE);
            this._cgl.gl.texParameteri(this._cgl.gl.TEXTURE_2D, this._cgl.gl.TEXTURE_COMPARE_FUNC, this._cgl.gl.LEQUAL);
        }

        if (this.textureType == Texture.TYPE_FLOAT && this.filter == Texture.FILTER_MIPMAP)
        {
            this.filter = Texture.FILTER_LINEAR;
            this._log.stack("texture: HDR and mipmap filtering at the same time is not possible");
        }

        if (this._cgl.glVersion == 1 && !this.isPowerOfTwo())
        {
            this._cgl.gl.texParameteri(this.texTarget, this._cgl.gl.TEXTURE_MAG_FILTER, this._cgl.gl.NEAREST);
            this._cgl.gl.texParameteri(this.texTarget, this._cgl.gl.TEXTURE_MIN_FILTER, this._cgl.gl.NEAREST);

            this._cgl.gl.texParameteri(this.texTarget, this._cgl.gl.TEXTURE_WRAP_S, this._cgl.gl.CLAMP_TO_EDGE);
            this._cgl.gl.texParameteri(this.texTarget, this._cgl.gl.TEXTURE_WRAP_T, this._cgl.gl.CLAMP_TO_EDGE);

            this.filter = Texture.FILTER_NEAREST;
            this.wrap = Texture.WRAP_CLAMP_TO_EDGE;
        }
        else
        {
            if (this.wrap == Texture.WRAP_CLAMP_TO_EDGE)
            {
                this._cgl.gl.texParameteri(this.texTarget, this._cgl.gl.TEXTURE_WRAP_S, this._cgl.gl.CLAMP_TO_EDGE);
                this._cgl.gl.texParameteri(this.texTarget, this._cgl.gl.TEXTURE_WRAP_T, this._cgl.gl.CLAMP_TO_EDGE);
            }
            else if (this.wrap == Texture.WRAP_REPEAT)
            {
                this._cgl.gl.texParameteri(this.texTarget, this._cgl.gl.TEXTURE_WRAP_S, this._cgl.gl.REPEAT);
                this._cgl.gl.texParameteri(this.texTarget, this._cgl.gl.TEXTURE_WRAP_T, this._cgl.gl.REPEAT);
            }
            else if (this.wrap == Texture.WRAP_MIRRORED_REPEAT)
            {
                this._cgl.gl.texParameteri(this.texTarget, this._cgl.gl.TEXTURE_WRAP_S, this._cgl.gl.MIRRORED_REPEAT);
                this._cgl.gl.texParameteri(this.texTarget, this._cgl.gl.TEXTURE_WRAP_T, this._cgl.gl.MIRRORED_REPEAT);
            }

            if (this.filter == Texture.FILTER_NEAREST)
            {
                this._cgl.gl.texParameteri(this.texTarget, this._cgl.gl.TEXTURE_MAG_FILTER, this._cgl.gl.NEAREST);
                this._cgl.gl.texParameteri(this.texTarget, this._cgl.gl.TEXTURE_MIN_FILTER, this._cgl.gl.NEAREST);
            }
            else if (this.filter == Texture.FILTER_LINEAR)
            {
                this._cgl.gl.texParameteri(this.texTarget, this._cgl.gl.TEXTURE_MIN_FILTER, this._cgl.gl.LINEAR);
                this._cgl.gl.texParameteri(this.texTarget, this._cgl.gl.TEXTURE_MAG_FILTER, this._cgl.gl.LINEAR);
            }
            else if (this.filter == Texture.FILTER_MIPMAP)
            {
                this._cgl.gl.texParameteri(this.texTarget, this._cgl.gl.TEXTURE_MAG_FILTER, this._cgl.gl.LINEAR);
                this._cgl.gl.texParameteri(this.texTarget, this._cgl.gl.TEXTURE_MIN_FILTER, this._cgl.gl.LINEAR_MIPMAP_LINEAR);
            }
            else
            {
                this._log.log("unknown texture filter!", this.filter);
                throw new Error("unknown texture filter!" + this.filter);
            }

            if (this.anisotropic)
            {
                const ext = this._cgl.enableExtension("EXT_texture_filter_anisotropic");

                if (this._cgl.maxAnisotropic)
                {
                    const aniso = Math.min(this._cgl.maxAnisotropic, this.anisotropic);
                    this._cgl.gl.texParameterf(this._cgl.gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, aniso);
                }
            }
        }
        this.getInfoOneLine();
        this._cgl.printError("_setFilter");
    }
}

/**
 * @function load
 * @static
 * @memberof Texture
 * @description load an image from an url
 * @param {CglContext} cgl
 * @param {String} url
 * @param {Function} finishedCallback
 * @param {Object} settings
 * @return {Texture}
 */
Texture.load = function (cgl, url, finishedCallback, settings)
{
    if (!url) return finishedCallback({ "error": true });
    let loadingId = null;
    if (!cgl.patch.loading.existByName(url)) loadingId = cgl.patch.loading.start("cgl.texture", url);

    const texture = new Texture(cgl);
    texture.name = url;

    texture.image = new Image();
    texture.image.crossOrigin = "anonymous";
    texture.loading = true;

    if (settings && settings.hasOwnProperty("filter")) texture.filter = settings.filter;
    if (settings && settings.hasOwnProperty("flip")) texture.flip = settings.flip;
    if (settings && settings.hasOwnProperty("wrap")) texture.wrap = settings.wrap;
    if (settings && settings.hasOwnProperty("anisotropic")) texture.anisotropic = settings.anisotropic;
    if (settings && settings.hasOwnProperty("unpackAlpha")) texture.unpackAlpha = settings.unpackAlpha;
    if (settings && settings.hasOwnProperty("pixelFormat")) texture.pixelFormat = settings.pixelFormat;

    texture.image.onabort = texture.image.onerror = (e) =>
    {
        console.warn("[cgl.texture.load] error loading texture", url, e);
        texture.loading = false;
        if (loadingId) cgl.patch.loading.finished(loadingId);
        const error = { "error": true };
        if (finishedCallback) finishedCallback(error, texture);
    };

    texture.image.onload = function (e)
    {
        cgl.addNextFrameOnceCallback(() =>
        {
            texture.initTexture(texture.image);
            if (loadingId) cgl.patch.loading.finished(loadingId);
            texture.loading = false;

            if (finishedCallback) finishedCallback(null, texture);
        });
    };
    texture.image.src = url;

    return texture;
};

/**
 * @static
 * @function getTempTexture
 * @memberof Texture
 * @description returns the default temporary texture (grey diagonal stipes)
 // * @param {CglContext} cgl
 * @return {Texture}
 */
Texture.getTempTexture = function (cgl)
{
    if (!cgl) console.error("[getTempTexture] no cgl!");
    if (!cgl.tempTexture) cgl.tempTexture = Texture.getTemporaryTexture(cgl, 256, Texture.FILTER_LINEAR, Texture.REPEAT);
    return cgl.tempTexture;
};

/**
 * @static
 * @function getErrorTexture
 * @memberof Texture
 * @description returns the default temporary texture (grey diagonal stipes)
 * @param {CglContext} cgl
 * @return {Texture}
 */
Texture.getErrorTexture = function (cgl)
{
    if (!cgl) console.error("[getTempTexture] no cgl!");
    if (!cgl.errorTexture) cgl.errorTexture = Texture.getTemporaryTexture(cgl, 256, Texture.FILTER_LINEAR, Texture.REPEAT, 1, 0.2, 0.2);
    return cgl.errorTexture;
};

/**
 * @function getEmptyTexture
 * @memberof Texture
 * @instance
 * @param cgl
 * @param fp
 * @description returns a reference to a small empty (transparent) texture
 * @return {Texture}
 */
Texture.getEmptyTexture = function (cgl, fp)
{
    if (fp) return Texture.getEmptyTextureFloat(cgl);
    if (!cgl) console.error("[getEmptyTexture] no cgl!");
    if (cgl.tempTextureEmpty) return cgl.tempTextureEmpty;

    let size = 8;

    cgl.tempTextureEmpty = new Texture(cgl, { "name": "emptyTexture" });
    const data = Texture.getDefaultTextureData("empty", size);

    cgl.tempTextureEmpty.initFromData(data, size, size, Texture.FILTER_NEAREST, Texture.WRAP_REPEAT);

    return cgl.tempTextureEmpty;
};

/**
 * @function getEmptyTextureFloat
 * @memberof Texture
 * @instance
 * @param cgl
 * @description returns a reference to a small empty (transparent) 32bit texture
 * @return {Texture}
 */
Texture.getEmptyTextureFloat = function (cgl)
{
    if (!cgl) console.error("[getEmptyTextureFloat] no cgl!");
    if (cgl.tempTextureEmptyFloat) return cgl.tempTextureEmptyFloat;

    cgl.tempTextureEmptyFloat = new Texture(cgl, { "name": "emptyTexture", "isFloatingPointTexture": true });
    const data = new Float32Array(8 * 8 * 4).fill(1);
    for (let i = 0; i < 8 * 8 * 4; i += 4) data[i + 3] = 0;

    cgl.tempTextureEmptyFloat.initFromData(data, 8, 8, Texture.FILTER_NEAREST, Texture.WRAP_REPEAT);

    return cgl.tempTextureEmptyFloat;
};

/**
 * @function getRandomTexture
 * @memberof Texture
 * @static
 * @param cgl
 * @description returns a reference to a random texture
 * @return {Texture}
 */
Texture.getRandomTexture = function (cgl)
{
    if (!cgl) console.error("[getRandomTexture] no cgl!");
    if (cgl.randomTexture) return cgl.randomTexture;

    const size = 256;
    const data = Texture.getDefaultTextureData("randomUInt", size);

    cgl.randomTexture = new Texture(cgl);
    cgl.randomTexture.initFromData(data, size, size, Texture.FILTER_NEAREST, Texture.WRAP_REPEAT);

    return cgl.randomTexture;
};

/**
 * @function getRandomFloatTexture
 * @memberof Texture
 * @static
 * @param cgl
 * @description returns a reference to a texture containing random numbers between -1 and 1
 * @return {Texture}
 */
Texture.getRandomFloatTexture = function (cgl)
{
    if (!cgl) console.error("[getRandomTexture] no cgl!");
    if (cgl.getRandomFloatTexture) return cgl.getRandomFloatTexture;

    const size = 256;
    const data = Texture.getDefaultTextureData("randomFloat", size);

    cgl.getRandomFloatTexture = new Texture(cgl, { "isFloatingPointTexture": true });
    cgl.getRandomFloatTexture.initFromData(data, size, size, Texture.FILTER_NEAREST, Texture.WRAP_REPEAT);

    return cgl.getRandomFloatTexture;
};

/**
 * @function getBlackTexture
 * @memberof Texture
 * @static
 * @param {CglContext} cgl
 * @description returns a reference to a black texture
 * @return {Texture}
 */
Texture.getBlackTexture = function (cgl)
{
    if (cgl.blackTexture) return cgl.blackTexture;

    const size = 8;
    const data = Texture.getDefaultTextureData("color", size, { "r": 0, "g": 0, "b": 0 });

    cgl.blackTexture = new Texture(cgl);
    cgl.blackTexture.initFromData(data, size, size, Texture.FILTER_NEAREST, Texture.WRAP_REPEAT);

    return cgl.blackTexture;
};

/**
 * @function getEmptyCubemapTexture
 * @memberof Texture
 * @static
 * @param cgl
 * @description returns an empty cubemap texture with rgba = [0, 0, 0, 0]
 * @return {Texture}
 */
Texture.getEmptyCubemapTexture = function (cgl)
{
    const faces = [
        cgl.gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        cgl.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        cgl.gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        cgl.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        cgl.gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        cgl.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ];

    const tex = cgl.gl.createTexture();
    const target = cgl.gl.TEXTURE_CUBE_MAP;
    const filter = Texture.FILTER_NEAREST;
    const wrap = Texture.WRAP_CLAMP_TO_EDGE;
    const width = 8;
    const height = 8;

    cgl.profileData.profileTextureNew++;

    cgl.gl.bindTexture(target, tex);
    cgl.profileData.profileTextureResize++;

    for (let i = 0; i < 6; i += 1)
    {
        const data = new Uint8Array(8 * 8 * 4);

        cgl.gl.texImage2D(faces[i], 0, cgl.gl.RGBA, 8, 8, 0, cgl.gl.RGBA, cgl.gl.UNSIGNED_BYTE, data);
        cgl.gl.texParameteri(target, cgl.gl.TEXTURE_MAG_FILTER, cgl.gl.NEAREST);
        cgl.gl.texParameteri(target, cgl.gl.TEXTURE_MIN_FILTER, cgl.gl.NEAREST);

        cgl.gl.texParameteri(target, cgl.gl.TEXTURE_WRAP_S, cgl.gl.CLAMP_TO_EDGE);
        cgl.gl.texParameteri(target, cgl.gl.TEXTURE_WRAP_T, cgl.gl.CLAMP_TO_EDGE);
    }

    cgl.gl.bindTexture(target, null);

    return {
        "id": external_CABLES_namespaceObject.utils.uuid(),
        "tex": tex,
        "cubemap": tex,
        "width": width,
        "height": height,
        "filter": filter,
        "wrap": wrap,
        "unpackAlpha": true,
        "flip": true,
        "_fromData": true,
        "name": "emptyCubemapTexture",
        "anisotropic": 0,
    };
};

Texture.getTempGradientTexture = function (cgl) // deprecated...
{
    if (!cgl) console.error("[getTempGradientTexture] no cgl!");
    return Texture.getTempTexture(cgl);
};

Texture.getTemporaryTexture = function (cgl, size, filter, wrap, r, g, b)
{
    const data = Texture.getDefaultTextureData("stripes", 256, { "r": r, "g": g, "b": b });
    const temptex = new Texture(cgl);
    temptex.initFromData(data, size, size, filter, wrap);
    return temptex;
};

/**
 * @static
 * @function createFromImage
 * @memberof Texture
 * @description create texturem from image data (e.g. image or canvas)
 * @param {CglContext} cgl
 * @param {Object} img image
 * @param {Object} options
 */
Texture.createFromImage = function (cgl, img, options)
{
    options = options || {};
    const texture = new Texture(cgl, options);
    texture.flip = false;
    texture.image = img;
    texture.width = img.videoWidth || img.width || 8;
    texture.height = img.videoHeight || img.height || 8;
    if (options.hasOwnProperty("wrap"))texture.wrap = options.wrap;

    texture.initTexture(img, options.filter);

    return texture;
};

// deprecated!
Texture.fromImage = function (cgl, img, filter, wrap)
{
    console.error("deprecated texture from image...");

    const texture = new Texture(cgl);
    texture.flip = false;
    if (filter) texture.filter = filter;
    if (wrap) texture.wrap = wrap;
    texture.image = img;
    texture.initTexture(img);
    return texture;
};

/**
 * @static
 * @function isPowerOfTwo
 * @memberof Texture
 * @description returns true if x is power of two
 * @param {Number} x
 * @return {Boolean}
 */
Texture.isPowerOfTwo = function (x)
{
    return x == 1 || x == 2 || x == 4 || x == 8 || x == 16 || x == 32 || x == 64 || x == 128 || x == 256 || x == 512 || x == 1024 || x == 2048 || x == 4096 || x == 8192 || x == 16384;
};

Texture.getTexInfo = function (tex)
{
    const obj = {};

    obj.name = tex.name;
    obj["power of two"] = tex.isPowerOfTwo();
    obj.size = tex.width + " x " + tex.height;

    let targetString = tex.texTarget;
    if (tex.texTarget == tex._cgl.gl.TEXTURE_2D) targetString = "TEXTURE_2D";
    obj.target = targetString;

    obj.unpackAlpha = tex.unpackAlpha;

    if (tex.cubemap)obj.cubemap = true;

    if (tex.textureType == Texture.TYPE_FLOAT) obj.textureType = "TYPE_FLOAT";
    if (tex.textureType == Texture.TYPE_HALF_FLOAT) obj.textureType = "TYPE_HALF_FLOAT";
    else if (tex.textureType == Texture.TYPE_DEPTH) obj.textureType = "TYPE_DEPTH";
    else if (tex.textureType == Texture.TYPE_DEFAULT) obj.textureType = "TYPE_DEFAULT";
    else obj.textureType = "UNKNOWN " + this.textureType;

    if (tex.wrap == Texture.WRAP_CLAMP_TO_EDGE) obj.wrap = "CLAMP_TO_EDGE";
    else if (tex.wrap == Texture.WRAP_REPEAT) obj.wrap = "WRAP_REPEAT";
    else if (tex.wrap == Texture.WRAP_MIRRORED_REPEAT) obj.wrap = "WRAP_MIRRORED_REPEAT";
    else obj.wrap = "UNKNOWN";

    if (tex.filter == Texture.FILTER_NEAREST) obj.filter = "FILTER_NEAREST";
    else if (tex.filter == Texture.FILTER_LINEAR) obj.filter = "FILTER_LINEAR";
    else if (tex.filter == Texture.FILTER_MIPMAP) obj.filter = "FILTER_MIPMAP";
    else obj.filter = "UNKNOWN";

    obj.pixelFormat = tex.pixelFormat || "unknown";

    return obj;
};

Texture.setUpGlPixelFormat = function (cgl, pixelFormatStr)
{
    const o = {};

    if (!pixelFormatStr)
    {
        cgl._log.error("no pixelformatstr!");
        cgl._log.log(new Error());
        pixelFormatStr = Texture.PFORMATSTR_RGBA8UB;
    }

    o.pixelFormatBase = pixelFormatStr;
    o.pixelFormat = pixelFormatStr;
    o.glDataType = cgl.gl.UNSIGNED_BYTE;
    o.glInternalFormat = cgl.gl.RGBA8;
    o.glDataFormat = cgl.gl.RGBA;

    let floatDatatype = cgl.gl.FLOAT;

    if (cgl.glUseHalfFloatTex)
    {
        if (pixelFormatStr == Texture.PFORMATSTR_RGBA32F) pixelFormatStr = Texture.PFORMATSTR_RGBA16F;
        if (pixelFormatStr == Texture.PFORMATSTR_RG32F) pixelFormatStr = Texture.PFORMATSTR_RG16F;
        if (pixelFormatStr == Texture.PFORMATSTR_R32F) pixelFormatStr = Texture.PFORMATSTR_R16F;
    }

    if (pixelFormatStr.includes("16bit"))
    {
        if (cgl.glVersion == 2)
        {
            // cgl.enableExtension("OES_texture_half_float");
            const hasExt = cgl.enableExtension("EXT_color_buffer_half_float");

            if (!hasExt)
            {
                console.warn("no 16bit extension, fallback to 32bit", pixelFormatStr);
                // fallback to 32 bit?
                if (pixelFormatStr == Texture.PFORMATSTR_RGBA16F) pixelFormatStr = Texture.PFORMATSTR_RGBA32F;
                if (pixelFormatStr == Texture.PFORMATSTR_RGB16F) pixelFormatStr = Texture.PFORMATSTR_RGB32F;
                if (pixelFormatStr == Texture.PFORMATSTR_RG16F) pixelFormatStr = Texture.PFORMATSTR_RG32F;
                if (pixelFormatStr == Texture.PFORMATSTR_R16F) pixelFormatStr = Texture.PFORMATSTR_R32F;
            }
            else
            {
                floatDatatype = cgl.gl.HALF_FLOAT;
            }
        }
    }

    if (cgl.glVersion == 1)
    {
        o.glInternalFormat = cgl.gl.RGBA;

        if (pixelFormatStr == Texture.PFORMATSTR_RGBA16F || pixelFormatStr == Texture.PFORMATSTR_RG16F || pixelFormatStr == Texture.PFORMATSTR_R16F)
        {
            const ext = cgl.enableExtension("OES_texture_half_float");
            if (!ext) throw new Error("no half float texture extension");

            floatDatatype = ext.HALF_FLOAT_OES;
        }
    }

    if (pixelFormatStr == Texture.PFORMATSTR_RGBA8UB)
    {
    }
    else if (pixelFormatStr == Texture.PFORMATSTR_RGB565)
    {
        o.glInternalFormat = cgl.gl.RGB565;
        o.glDataFormat = cgl.gl.RGB;
    }
    else if (pixelFormatStr == Texture.PFORMATSTR_R8UB)
    {
        o.glInternalFormat = cgl.gl.R8;
        o.glDataFormat = cgl.gl.RED;
    }
    else if (pixelFormatStr == Texture.PFORMATSTR_RG8UB)
    {
        o.glInternalFormat = cgl.gl.RG8;
        o.glDataFormat = cgl.gl.RG;
    }
    else if (pixelFormatStr == Texture.PFORMATSTR_RGB8UB)
    {
        o.glInternalFormat = cgl.gl.RGB8;
        o.glDataFormat = cgl.gl.RGB;
    }
    else if (pixelFormatStr == Texture.PFORMATSTR_SRGBA8)
    {
        o.glInternalFormat = cgl.gl.SRGB8_ALPHA8;
    }

    else if (pixelFormatStr == Texture.PFORMATSTR_R32F)
    {
        o.glInternalFormat = cgl.gl.R32F;
        o.glDataFormat = cgl.gl.RED;
        o.glDataType = floatDatatype;
    }
    else if (pixelFormatStr == Texture.PFORMATSTR_R16F)
    {
        o.glInternalFormat = cgl.gl.R16F;
        o.glDataType = floatDatatype;
        o.glDataFormat = cgl.gl.RED;
    }
    else if (pixelFormatStr == Texture.PFORMATSTR_RG16F)
    {
        o.glInternalFormat = cgl.gl.RG16F;
        o.glDataType = floatDatatype;
        o.glDataFormat = cgl.gl.RG;
    }
    else if (pixelFormatStr == Texture.PFORMATSTR_RGBA16F)
    {
        if (cgl.glVersion == 1) o.glInternalFormat = cgl.gl.RGBA;
        else o.glInternalFormat = cgl.gl.RGBA16F;
        o.glDataType = floatDatatype;
    }
    else if (pixelFormatStr == Texture.PFORMATSTR_R11FG11FB10F)
    {
        o.glInternalFormat = cgl.gl.R11F_G11F_B10F;
        o.glDataType = floatDatatype;
        o.glDataFormat = cgl.gl.RGB;
    }
    else if (pixelFormatStr == Texture.PFORMATSTR_RGBA32F)
    {
        if (cgl.glVersion == 1) o.glInternalFormat = cgl.gl.RGBA;
        else o.glInternalFormat = cgl.gl.RGBA32F;
        o.glDataType = floatDatatype;
    }
    else if (pixelFormatStr == Texture.PFORMATSTR_DEPTH)
    {
        if (cgl.glVersion == 1)
        {
            o.glInternalFormat = cgl.gl.DEPTH_COMPONENT;
            o.glDataType = cgl.gl.UNSIGNED_SHORT;
            o.glDataFormat = cgl.gl.DEPTH_COMPONENT;
        }
        else
        {
            o.glInternalFormat = cgl.gl.DEPTH_COMPONENT32F;
            o.glDataType = cgl.gl.FLOAT;
            o.glDataFormat = cgl.gl.DEPTH_COMPONENT;
        }
    }
    else
    {
        log.log("unknown pixelformat ", pixelFormatStr);
    }

    /// //////

    if (pixelFormatStr.includes("32bit") || pixelFormatStr == Texture.PFORMATSTR_R11FG11FB10F)
    {
        if (cgl.glVersion == 2) cgl.enableExtension("EXT_color_buffer_float");
        if (cgl.glVersion == 2) cgl.enableExtension("EXT_float_blend");

        cgl.enableExtension("OES_texture_float_linear"); // yes, i am sure, this is a webgl 1 and 2 ext
    }

    o.numColorChannels = Texture.getPixelFormatNumChannels(pixelFormatStr);

    if (!o.glDataType || !o.glInternalFormat || !o.glDataFormat) log.log("pixelformat wrong ?!", pixelFormatStr, o.glDataType, o.glInternalFormat, o.glDataFormat, this);

    return o;
};

Texture.getPixelFormatNumChannels =
    (pxlFrmtStr) =>
    {
        if (pxlFrmtStr.startsWith("RGBA")) return 4;
        if (pxlFrmtStr.startsWith("RGB")) return 3;
        if (pxlFrmtStr.startsWith("RG")) return 2;
        return 1;
    };

Texture.isPixelFormatFloat =
    (pxlFrmtStr) =>
    {
        return (pxlFrmtStr || "").includes("float");
    };

Texture.isPixelFormatHalfFloat =
    (pxlFrmtStr) =>
    {
        return (pxlFrmtStr || "").includes("float") && (pxlFrmtStr || "").includes("16bit");
    };

;// CONCATENATED MODULE: ./src/corelibs/cgl/cgl_framebuffer2.js




class Framebuffer2
{

    /**
     * @param {CglContext} cgl
     * @param {number} w
     * @param {number} h
     * @param {object} options
     */
    constructor(cgl, w, h, options)
    {
        this._log = new external_CABLES_SHARED_namespaceObject.Logger("cgl_framebuffer2");
        if (cgl.glVersion == 1) this._log.error("framebuffer2 used on webgl1");
        this.Framebuffer2DrawTargetsDefault = null;
        this.Framebuffer2BlittingFramebuffer = null;
        this.Framebuffer2FinalFramebuffer = null;
        this._cgl = cgl;

        this._cgl.printError("before framebuffer2 constructor");

        this._width = 0;
        this._height = 0;
        this.valid = true;

        this._depthRenderbuffer = null;
        this._frameBuffer = null;
        this._textureFrameBuffer = null;
        this._colorRenderbuffers = [];
        this._drawTargetArray = [];
        this._disposed = false;

        if (!this.Framebuffer2BlittingFramebuffer) this.Framebuffer2BlittingFramebuffer = cgl.gl.createFramebuffer();
        if (!this.Framebuffer2FinalFramebuffer) this.Framebuffer2FinalFramebuffer = cgl.gl.createFramebuffer();

        if (!this.Framebuffer2DrawTargetsDefault) this.Framebuffer2DrawTargetsDefault = [cgl.gl.COLOR_ATTACHMENT0];

        this._options = options || {
            "isFloatingPointTexture": false,
        };

        this.name = this._options.name || "unknown";

        this._cgl.profileData.addHeavyEvent("framebuffer create", this.name);

        if (!this._options.hasOwnProperty("numRenderBuffers")) this._options.numRenderBuffers = 1;
        if (!this._options.hasOwnProperty("depth")) this._options.depth = true;
        if (!this._options.hasOwnProperty("clear")) this._options.clear = true;
        if (!this._options.hasOwnProperty("multisampling"))
        {
            this._options.multisampling = false;
            this._options.multisamplingSamples = 0;
        }

        if (this._options.multisamplingSamples)
        {
            if (this._cgl.glSlowRenderer) this._options.multisamplingSamples = 0;
            if (!this._cgl.gl.MAX_SAMPLES) this._options.multisamplingSamples = 0;
            else this._options.multisamplingSamples = Math.min(this._cgl.maxSamples, this._options.multisamplingSamples);
        }

        if (!this._options.hasOwnProperty("filter")) this._options.filter = Texture.FILTER_LINEAR;
        if (!this._options.hasOwnProperty("wrap")) this._options.wrap = Texture.WRAP_REPEAT;

        this._numRenderBuffers = this._options.numRenderBuffers;
        this._colorTextures = [];

        this.clearColors = [];
        for (let i = 0; i < this._numRenderBuffers; i++) this.clearColors.push([0, 0, 0, 1]);

        if (!options.pixelFormat)
        {
            if (options.isFloatingPointTexture) this._options.pixelFormat = Texture.PFORMATSTR_RGBA32F;
            else this._options.pixelFormat = Texture.PFORMATSTR_RGBA8UB;
        }

        for (let i = 0; i < this._numRenderBuffers; i++)
        {
            this._colorTextures[i] = new Texture(cgl, {
                "name": "fb2 " + this.name + " " + i,
                "isFloatingPointTexture": this._options.isFloatingPointTexture,
                "anisotropic": this._options.anisotropic || 0,
                "pixelFormat": this._options.pixelFormat,
                "filter": this._options.filter,
                "wrap": this._options.wrap,
            });
        }

        let fil = Texture.FILTER_NEAREST;
        if (this._options.shadowMap) fil = Texture.FILTER_LINEAR;

        const defaultTexSize = 512;

        if (this._options.depth)
        {
            this._textureDepth = new Texture(cgl,
                {
                    "name": "fb2 depth " + this.name,
                    "isDepthTexture": true,
                    "filter": fil,
                    "shadowMap": this._options.shadowMap || false,
                    "width": w || defaultTexSize,
                    "height": h || defaultTexSize,
                });
        }

        if (cgl.aborted) return;

        this.setSize(w || defaultTexSize, h || defaultTexSize);

        this._cgl.printError("framebuffer2 constructor");
    }

    getWidth()
    {
        return this._width;
    }

    getHeight()
    {
        return this._height;
    }

    getGlFrameBuffer()
    {
        return this._frameBuffer;
    }

    getDepthRenderBuffer()
    {
        return this._depthRenderbuffer;
    }

    getTextureColor()
    {
        return this._colorTextures[0];
    }

    getTextureColorNum(i)
    {
        return this._colorTextures[i];
    }

    getTextureDepth()
    {
        return this._textureDepth;
    }

    setFilter(f)
    {
        for (let i = 0; i < this._numRenderBuffers; i++)
        {
            this._colorTextures[i].filter = f;
            this._colorTextures[i].setSize(this._width, this._height);
        }
    }

    delete()
    {
        this.dispose();
    }

    dispose()
    {
        this._disposed = true;
        let i = 0;
        for (i = 0; i < this._numRenderBuffers; i++) this._colorTextures[i].delete();
        // this._texture.delete();
        if (this._textureDepth) this._textureDepth.delete();
        for (i = 0; i < this._numRenderBuffers; i++) this._cgl.gl.deleteRenderbuffer(this._colorRenderbuffers[i]);
        this._cgl.gl.deleteRenderbuffer(this._depthRenderbuffer);
        this._cgl.gl.deleteFramebuffer(this._frameBuffer);
        this._cgl.gl.deleteFramebuffer(this._textureFrameBuffer);
    }

    /**
     * @param {number} w
     * @param {number} h
     */
    setSize(w, h)
    {
        if (this._disposed) return this._log.warn("disposed framebuffer setsize...");
        this._cgl.profileData.addHeavyEvent("framebuffer resize", this.name);

        let i = 0;

        this._width = this._cgl.checkTextureSize(w);
        this._height = this._cgl.checkTextureSize(h);

        this._cgl.profileData.profileFrameBuffercreate++;

        if (this._frameBuffer)
        {
            for (i = 0; i < this._numRenderBuffers; i++) this._cgl.gl.deleteRenderbuffer(this._colorRenderbuffers[i]);
            // this._cgl.gl.deleteRenderbuffer(this._colorRenderbuffer);
            this._cgl.gl.deleteRenderbuffer(this._depthRenderbuffer);
            this._cgl.gl.deleteFramebuffer(this._frameBuffer);
            this._cgl.gl.deleteFramebuffer(this._textureFrameBuffer);
        }

        this._frameBuffer = this._cgl.gl.createFramebuffer();
        this._textureFrameBuffer = this._cgl.gl.createFramebuffer();

        const depth = this._options.depth;

        for (i = 0; i < this._numRenderBuffers; i++)
        {
            this._colorTextures[i].setSize(this._width, this._height);
        }

        for (i = 0; i < this._numRenderBuffers; i++)
        {
            const renderBuffer = this._cgl.gl.createRenderbuffer();

            // color renderbuffer

            this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, this._frameBuffer);
            this._cgl.gl.bindRenderbuffer(this._cgl.gl.RENDERBUFFER, renderBuffer);

            const info = Texture.setUpGlPixelFormat(this._cgl, this._options.pixelFormat);
            let internFormat = info.glInternalFormat;

            // if (this._options.isFloatingPointTexture)
            // {
            if (CGL.Texture.isPixelFormatHalfFloat(info.pixelFormat))
            {
                if (!this._cgl.enableExtension("OES_texture_float_linear"))
                {
                    this._options.filter = Texture.FILTER_NEAREST;
                    this.setFilter(this._options.filter);
                }
            }
            else if (CGL.Texture.isPixelFormatFloat(info.pixelFormat))
            {
                if (!this._cgl.enableExtension("OES_texture_float_linear"))
                {
                    this._log.warn("no linear pixelformat,using nearest");
                    this._options.filter = Texture.FILTER_NEAREST;
                    this.setFilter(this._options.filter);
                }
            }
            // else if (info.pixelFormat == Texture.PFORMATSTR_RGBA32F || info.pixelFormat == Texture.PFORMATSTR_R11FG11FB10F
            // else if (info.pixelFormat == Texture.PFORMATSTR_RGBA32F || info.pixelFormat == Texture.PFORMATSTR_R11FG11FB10F
            // else if (info.pixelFormat == Texture.PFORMATSTR_RG16F)
            // {
            //     const extcb = this._cgl.enableExtension("EXT_color_buffer_float");

            //     if (!this._cgl.enableExtension("OES_texture_float_linear"))
            //     {
            //         console.log("no linear pixelformat,switching to nearest");
            //         this._options.filter = Texture.FILTER_NEAREST;
            //         this.setFilter(this._options.filter);
            //     }
            // }
            // }

            if (this._options.multisampling && this._options.multisamplingSamples)
            {
                this._cgl.gl.renderbufferStorageMultisample(this._cgl.gl.RENDERBUFFER, this._options.multisamplingSamples, internFormat, this._width, this._height);
            }
            else
            {
                this._cgl.gl.renderbufferStorage(this._cgl.gl.RENDERBUFFER, internFormat, this._width, this._height);
            }

            this._cgl.gl.framebufferRenderbuffer(this._cgl.gl.FRAMEBUFFER, this._cgl.gl.COLOR_ATTACHMENT0 + i, this._cgl.gl.RENDERBUFFER, renderBuffer);
            this._colorRenderbuffers[i] = renderBuffer;
        }

        // this._cgl.gl.bindFramebuffer(this._cgl.gl.DRAW_FRAMEBUFFER, this._textureFrameBuffer);
        this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, this._textureFrameBuffer);

        for (i = 0; i < this._numRenderBuffers; i++)
        {
            this._cgl.gl.framebufferTexture2D(this._cgl.gl.FRAMEBUFFER, this._cgl.gl.COLOR_ATTACHMENT0 + i, this._cgl.gl.TEXTURE_2D, this._colorTextures[i].tex, 0);
        }

        if (this._options.depth)
        {
            this._cgl.gl.framebufferTexture2D(this._cgl.gl.FRAMEBUFFER, this._cgl.gl.DEPTH_ATTACHMENT, this._cgl.gl.TEXTURE_2D, this._textureDepth.tex, 0);
        }

        // depth renderbuffer

        this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, this._frameBuffer);

        let depthType = this._cgl.gl.DEPTH_COMPONENT32F;

        if (this._cgl.glSlowRenderer) depthType = this._cgl.gl.DEPTH_COMPONENT16;
        if (depth)
        {
            this._textureDepth.setSize(this._width, this._height);
            this._depthRenderbuffer = this._cgl.gl.createRenderbuffer();

            this._cgl.gl.bindRenderbuffer(this._cgl.gl.RENDERBUFFER, this._depthRenderbuffer);
            if (this._options.isFloatingPointTexture)
            {
                if (this._options.multisampling) this._cgl.gl.renderbufferStorageMultisample(this._cgl.gl.RENDERBUFFER, this._options.multisamplingSamples, depthType, this._width, this._height);
                else this._cgl.gl.renderbufferStorage(this._cgl.gl.RENDERBUFFER, depthType, this._width, this._height);
            }
            else if (this._options.multisampling)
            {
                this._cgl.gl.renderbufferStorageMultisample(this._cgl.gl.RENDERBUFFER, this._options.multisamplingSamples, depthType, this._width, this._height);
            // this._cgl.gl.renderbufferStorage(this._cgl.gl.RENDERBUFFER,depthType, this._width, this._height);
            }
            else
            {
                this._cgl.gl.renderbufferStorage(this._cgl.gl.RENDERBUFFER, depthType, this._width, this._height);
            }

            this._cgl.gl.framebufferRenderbuffer(this._cgl.gl.FRAMEBUFFER, this._cgl.gl.DEPTH_ATTACHMENT, this._cgl.gl.RENDERBUFFER, this._depthRenderbuffer);
        }

        // this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, null);
        // this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, this._textureFrameBuffer);

        this._drawTargetArray.length = 0;
        for (i = 0; i < this._numRenderBuffers; i++) this._drawTargetArray.push(this._cgl.gl.COLOR_ATTACHMENT0 + i);

        // this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, null);

        if (!this._cgl.gl.isFramebuffer(this._textureFrameBuffer)) this._log.warn("invalid framebuffer");// throw new Error("Invalid framebuffer");
        const status = this._cgl.gl.checkFramebufferStatus(this._cgl.gl.FRAMEBUFFER);

        if (status != this._cgl.gl.FRAMEBUFFER_COMPLETE)
        {
            this._log.error("framebuffer incomplete: " + this.name, this);
            this._log.log("options", this._options);
            this._log.log("options pixelformat", this._options.pixelFormat);

            switch (status)
            {
            case this._cgl.gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
                this._log.warn("FRAMEBUFFER_INCOMPLETE_ATTACHMENT...", this);
                throw new Error("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
            case this._cgl.gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
                this._log.warn("FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
                throw new Error("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
            case this._cgl.gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
                this._log.warn("FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
                throw new Error("Incomplete framebuffer: FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
            case this._cgl.gl.FRAMEBUFFER_UNSUPPORTED:
                this._log.warn("FRAMEBUFFER_UNSUPPORTED");
                throw new Error("Incomplete framebuffer: FRAMEBUFFER_UNSUPPORTED");
            default:
                this.valid = false;
                this._log.error("incomplete framebuffer", status, this._frameBuffer);
                this._cgl.printError();

                this._frameBuffer = null;
                // debugger;
                throw new Error("Incomplete framebuffer: " + status);

        // throw("Incomplete framebuffer: " + status);
            }
        }

        this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, null);
        this._cgl.gl.bindRenderbuffer(this._cgl.gl.RENDERBUFFER, null);

    // this._cgl.printError("fb setsize");
    }

    renderStart()
    {
        if (this._disposed) return this._log.warn("disposed framebuffer renderStart...");
        this._cgl.checkFrameStarted("fb2 renderstart");
        this._cgl.pushModelMatrix(); // needed ??

        this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, this._frameBuffer);
        this._cgl.pushGlFrameBuffer(this._frameBuffer);
        this._cgl.pushFrameBuffer(this);

        this._cgl.pushPMatrix();
        this._cgl.pushViewPort(0, 0, this._width, this._height);

        this._cgl.gl.drawBuffers(this._drawTargetArray);

        if (this._options.clear)
        {
            this._cgl.gl.clearColor(0, 0, 0, 0);
            this._cgl.gl.clear(this._cgl.gl.COLOR_BUFFER_BIT | this._cgl.gl.DEPTH_BUFFER_BIT);
        }
    }

    clear()
    {
        if (this._numRenderBuffers <= 1)
        {
            this._cgl.gl.bindFramebuffer(this._cgl.gl.READ_FRAMEBUFFER, this._frameBuffer);
            this._cgl.gl.bindFramebuffer(this._cgl.gl.DRAW_FRAMEBUFFER, this._textureFrameBuffer);
        }
        else this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, this._frameBuffer);

        this._cgl.gl.drawBuffers(this._drawTargetArray);

        for (let i = 0; i < this._numRenderBuffers; i++)
        {
            this._cgl.gl.framebufferTexture2D(this._cgl.gl.FRAMEBUFFER, this._cgl.gl.COLOR_ATTACHMENT0 + i, this._cgl.gl.TEXTURE_2D, this._colorTextures[i].tex, 0);
            this._cgl.gl.clearBufferfv(this._cgl.gl.COLOR, i, this.clearColors[i]);
        }
        this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, null);
    }

    renderEnd()
    {
        if (this._disposed) return this._log.warn("disposed framebuffer renderEnd...");
        this._cgl.popPMatrix();

        this._cgl.profileData.profileFramebuffer++;

        if (this._numRenderBuffers <= 1)
        {
            this._cgl.gl.bindFramebuffer(this._cgl.gl.READ_FRAMEBUFFER, this._frameBuffer);
            this._cgl.gl.bindFramebuffer(this._cgl.gl.DRAW_FRAMEBUFFER, this._textureFrameBuffer);

            this._cgl.gl.clearBufferfv(this._cgl.gl.COLOR, 0, [0.0, 0.0, 0.0, 1.0]);
            this._cgl.gl.blitFramebuffer(0, 0, this._width, this._height, 0, 0, this._width, this._height, this._cgl.gl.COLOR_BUFFER_BIT | this._cgl.gl.DEPTH_BUFFER_BIT, this._cgl.gl.NEAREST);
        }
        else
        {
            this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, this.Framebuffer2BlittingFramebuffer);
            this._cgl.gl.framebufferRenderbuffer(this._cgl.gl.FRAMEBUFFER, this._cgl.gl.DEPTH_ATTACHMENT, this._cgl.gl.RENDERBUFFER, this._depthRenderbuffer);

            this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, this.Framebuffer2FinalFramebuffer);
            this._cgl.gl.framebufferTexture2D(this._cgl.gl.FRAMEBUFFER, this._cgl.gl.DEPTH_ATTACHMENT, this._cgl.gl.TEXTURE_2D, this._textureDepth.tex, 0);

            for (let i = 0; i < this._numRenderBuffers; i++)
            {
                this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, this.Framebuffer2BlittingFramebuffer);
                this._cgl.gl.framebufferRenderbuffer(this._cgl.gl.FRAMEBUFFER, this._cgl.gl.COLOR_ATTACHMENT0, this._cgl.gl.RENDERBUFFER, this._colorRenderbuffers[i]);

                this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, this.Framebuffer2FinalFramebuffer);
                this._cgl.gl.framebufferTexture2D(this._cgl.gl.FRAMEBUFFER, this._cgl.gl.COLOR_ATTACHMENT0, this._cgl.gl.TEXTURE_2D, this._colorTextures[i].tex, 0);

                this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, null);

                this._cgl.gl.bindFramebuffer(this._cgl.gl.READ_FRAMEBUFFER, this.Framebuffer2BlittingFramebuffer);
                this._cgl.gl.bindFramebuffer(this._cgl.gl.DRAW_FRAMEBUFFER, this.Framebuffer2FinalFramebuffer);

                // this._cgl.gl.clearBufferfv(this._cgl.gl.COLOR, i, [0.0, 0.0, 0.0, 1.0]);

                let flags = this._cgl.gl.COLOR_BUFFER_BIT;
                if (i == 0) flags |= this._cgl.gl.DEPTH_BUFFER_BIT;

                this._cgl.gl.blitFramebuffer(0, 0, this._width, this._height, 0, 0, this._width, this._height, flags, this._cgl.gl.NEAREST);
            }
        }

        this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, this._cgl.popGlFrameBuffer());
        this._cgl.popFrameBuffer();

        this._cgl.popModelMatrix();
        this._cgl.popViewPort();

        if (this._colorTextures[0].filter == Texture.FILTER_MIPMAP)
        {
            for (let i = 0; i < this._numRenderBuffers; i++)
            {
                this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, this._colorTextures[i].tex);
                this._colorTextures[i].updateMipMap();
                this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, null);
            }
        }
    }
}

;// CONCATENATED MODULE: ./src/corelibs/cgl/cgl_marker.js
/** @type {function}
 * @deprecated
*/
const Marker = function (_cgl) // deprecated...
{
    this.draw = function (cgl, _size, depthTest) {};
};

/** @type {function}
 * @deprecated
*/
const WirePoint = function (cgl) // deprecated...
{
    this.render = function (_cgl, _size) {};
};

/** @type {function}
 * @deprecated
*/
const WireCube = function (cgl) // deprecated...
{
    this.render = function (_cgl, sizeX, sizeY, sizeZ) {};
};

;// CONCATENATED MODULE: ./src/corelibs/cg/cg_uniform.js






class CgUniform
{

    /**
     * Description
     * @param {CgShader|CgpShader|Shader} __shader
     * @param {string} __type
     * @param {string} __name
     * @param {Number|Port} _value
     * @param {Port} _port2
     * @param {Port} _port3
     * @param {Port} _port4
     */
    constructor(__shader, __type, __name, _value, _port2, _port3, _port4, _structUniformName, _structName, _propertyName)
    {
        this._log = new external_CABLES_SHARED_namespaceObject.Logger("cg_uniform");
        this._type = __type;
        this._name = __name;

        /** @type {CgShader} */
        this._shader = __shader;
        this._value = 0.00001;
        this._oldValue = null;
        this._port = null;

        this._structName = _structName;
        this._structUniformName = _structUniformName;
        this._propertyName = _propertyName;

        if (this._shader._addUniform) this._shader._addUniform(this);
        this.needsUpdate = true;
        this.shaderType = null;
        this.comment = null;

        if (__type == "f")
        {
            this.set = this.setValue = this.setValueF.bind(this);
            this.updateValue = this.updateValueF.bind(this);
        }
        else if (__type == "f[]")
        {
            this.set = this.setValue = this.setValueArrayF.bind(this);
            this.updateValue = this.updateValueArrayF.bind(this);
        }
        else if (__type == "2f[]")
        {
            this.set = this.setValue = this.setValueArray2F.bind(this);
            this.updateValue = this.updateValueArray2F.bind(this);
        }
        else if (__type == "3f[]")
        {
            this.set = this.setValue = this.setValueArray3F.bind(this);
            this.updateValue = this.updateValueArray3F.bind(this);
        }
        else if (__type == "4f[]")
        {
            this.set = this.setValue = this.setValueArray4F.bind(this);
            this.updateValue = this.updateValueArray4F.bind(this);
        }
        else if (__type == "i")
        {
            this.set = this.setValue = this.setValueI.bind(this);
            this.updateValue = this.updateValueI.bind(this);
        }
        else if (__type == "2i")
        {
            this.set = this.setValue = this.setValue2I.bind(this);
            this.updateValue = this.updateValue2I.bind(this);
        }
        else if (__type == "3i")
        {
            this.set = this.setValue = this.setValue3I.bind(this);
            this.updateValue = this.updateValue3I.bind(this);
        }
        else if (__type == "4i")
        {
            this.set = this.setValue = this.setValue4I.bind(this);
            this.updateValue = this.updateValue4I.bind(this);
        }
        else if (__type == "b")
        {
            this.set = this.setValue = this.setValueBool.bind(this);
            this.updateValue = this.updateValueBool.bind(this);
        }
        else if (__type == "4f")
        {
            this.set = this.setValue = this.setValue4F.bind(this);
            this.updateValue = this.updateValue4F.bind(this);
        }
        else if (__type == "3f")
        {
            this.set = this.setValue = this.setValue3F.bind(this);
            this.updateValue = this.updateValue3F.bind(this);
        }
        else if (__type == "2f")
        {
            this.set = this.setValue = this.setValue2F.bind(this);
            this.updateValue = this.updateValue2F.bind(this);
        }
        else if (__type == "t")
        {
            this.set = this.setValue = this.setValueT.bind(this);
            this.updateValue = this.updateValueT.bind(this);
        }
        else if (__type == "sampler")
        {
            if (this.setValueAny)
            {
                this.set = this.setValue = this.setValueAny.bind(this);
                this.updateValue = this.updateValueAny.bind(this);
            }
        }
        else if (__type == "tc")
        {
            this.set = this.setValue = this.setValueT.bind(this);
            this.updateValue = this.updateValueT.bind(this);
        }
        else if (__type == "t[]")
        {
            this.set = this.setValue = this.setValueArrayT.bind(this);
            this.updateValue = this.updateValueArrayT.bind(this);
        }
        else if (__type == "m4" || __type == "m4[]")
        {
            this.set = this.setValue = this.setValueM4.bind(this);
            this.updateValue = this.updateValueM4.bind(this);
        }
        else
        {
            // console.error("unknown");
            this._log.error("Unknown uniform type " + __type, __name, typeof this._shader);
        }

        if (typeof _value == "object" && _value instanceof external_CABLES_namespaceObject.Port)
        {
            this._port = _value;
            this._value = this._port.get();

            if (_port2 && _port3 && _port4)
            {
                if (!(_port2 instanceof external_CABLES_namespaceObject.Port) || !(_port3 instanceof external_CABLES_namespaceObject.Port) || !(_port4 instanceof external_CABLES_namespaceObject.Port))
                {
                    this._log.error("[cgl_uniform] mixed port/value parameter for vec4 ", this._name);
                }

                this._value = [0, 0, 0, 0];
                this._port2 = _port2;
                this._port3 = _port3;
                this._port4 = _port4;

                this._port.on("change", this.updateFromPort4f.bind(this));
                this._port2.on("change", this.updateFromPort4f.bind(this));
                this._port3.on("change", this.updateFromPort4f.bind(this));
                this._port4.on("change", this.updateFromPort4f.bind(this));

                // this._port.onChange = this._port2.onChange = this._port3.onChange = this._port4.onChange = this.updateFromPort4f.bind(this);
                this.updateFromPort4f();
            }
            else if (_port2 && _port3)
            {
                if (!(_port2 instanceof external_CABLES_namespaceObject.Port) || !(_port3 instanceof external_CABLES_namespaceObject.Port))
                {
                    this._log.error("[cgl_uniform] mixed port/value parameter for vec4 ", this._name);
                }

                this._value = [0, 0, 0];
                this._port2 = _port2;
                this._port3 = _port3;
                // this._port.onChange = this._port2.onChange = this._port3.onChange = this.updateFromPort3f.bind(this);
                this._port.on("change", this.updateFromPort3f.bind(this));
                this._port2.on("change", this.updateFromPort3f.bind(this));
                this._port3.on("change", this.updateFromPort3f.bind(this));

                this.updateFromPort3f();
            }
            else if (_port2)
            {
                if (!(_port2 instanceof external_CABLES_namespaceObject.Port))
                {
                    this._log.error("[cgl_uniform] mixed port/value parameter for vec4 ", this._name);
                }

                this._value = [0, 0];
                this._port2 = _port2;
                // this._port.onChange = this._port2.onChange = this.updateFromPort2f.bind(this);
                this._port.on("change", this.updateFromPort2f.bind(this));
                this._port2.on("change", this.updateFromPort2f.bind(this));

                this.updateFromPort2f();
            }
            else
            {
                // this._port.on = this.updateFromPort.bind(this);
                this._port.on("change", this.updateFromPort.bind(this));
            }
        }
        else this._value = _value;

        if (this._value == undefined)
        {
            this._value = 0;
        }

        this.setValue(this._value);

        this.needsUpdate = true;
    }

    getType()
    {
        return this._type;
    }

    get type()
    {
        return this._type;
    }

    get name()
    {
        return this._name;
    }

    getName()
    {
        return this._name;
    }

    getValue()
    {
        return this._value;
    }

    getShaderType()
    {
        return this.shaderType;
    }

    isStructMember()
    {
        return !!this._structName;
    }

    updateFromPort4f()
    {
        this._value[0] = this._port.get();
        this._value[1] = this._port2.get();
        this._value[2] = this._port3.get();
        this._value[3] = this._port4.get();
        this.setValue(this._value);
    }

    updateFromPort3f()
    {
        this._value[0] = this._port.get();
        this._value[1] = this._port2.get();
        this._value[2] = this._port3.get();
        this.setValue(this._value);
    }

    updateFromPort2f()
    {
        this._value[0] = this._port.get();
        this._value[1] = this._port2.get();
        this.setValue(this._value);
    }

    updateFromPort()
    {
        this.setValue(this._port.get());
    }

    get port()
    {
        return this._port;
    }
}

;// CONCATENATED MODULE: ./src/corelibs/cgl/cgl_shader_uniform.js




/**
 * Shader uniforms
 *
 * types:
 * <pre>
 * f    - float
 * 2f   - vec2
 * 3f   - vec3
 * 4f   - vec4
 * i    - integer
 * t    - texture
 * m4   - mat4, 4x4 float matrix
 * f[]  - array of floats
 * 2f[] - array of float vec2
 * 3f[] - array of float vec3
 * 4f[] - array of float vec4
 * </pre>
 *
 * @namespace external:CGL
 * @class
 * @param {CgShader} shader
 * @param {String} [type=f]
 * @param {String} name
 * @param {Number|Port} value  can be a Number,Matrix or Port
 * @example
 * // bind float uniform called myfloat and initialize with value 1.0
 * const unir=new CGL.Uniform(shader,'f','myfloat',1.0);
 * unir.setValue(1.0);
 *
 * // bind float uniform called myfloat and automatically set it to input port value
 * const myPort=op.inFloat("input");
 * const pv=new CGL.Uniform(shader,'f','myfloat',myPort);
 *
 */

// export const Uniform(__shader, __type, __name, _value, _port2, _port3, _port4, _structUniformName, _structName, _propertyName)

class Uniform extends CgUniform
{
    constructor(__shader, __type, __name, _value, _port2, _port3, _port4, _structUniformName, _structName, _propertyName)
    {
        super(__shader, __type, __name, _value, _port2, _port3, _port4, _structUniformName, _structName, _propertyName);
        this._loc = -1;
        this._cgl = __shader._cgl;
    }

    get name()
    {
        return this._name;
    }

    copy(newShader)
    {
        const uni = new Uniform(newShader, this._type, this._name, this._value, this._port2, this._port3, this._port4, this._structUniformName, this._structName, this._propertyName);
        uni.shaderType = this.shaderType;
        return uni;
    }

    /**
     * returns type as glsl type string. e.g. 'f' returns 'float'
     * @function getGlslTypeString
     * @memberof Uniform
     * @instance
     * @return {string} type as string
     */
    getGlslTypeString()
    {
        return Uniform.glslTypeString(this._type);
    }

    _isValidLoc()
    {
        return this._loc != -1;// && this._loc != null;
    }

    resetLoc()
    {
        this._loc = -1;
        this.needsUpdate = true;
    }

    bindTextures() {}

    getLoc()
    {
        return this._loc;
    }

    updateFromPort4f()
    {
        this._value[0] = this._port.get();
        this._value[1] = this._port2.get();
        this._value[2] = this._port3.get();
        this._value[3] = this._port4.get();
        this.setValue(this._value);
    }

    updateFromPort3f()
    {
        this._value[0] = this._port.get();
        this._value[1] = this._port2.get();
        this._value[2] = this._port3.get();
        this.setValue(this._value);
    }

    updateFromPort2f()
    {
        this._value[0] = this._port.get();
        this._value[1] = this._port2.get();
        this.setValue(this._value);
    }

    updateFromPort()
    {
        this.setValue(this._port.get());
    }

    updateValueF()
    {
        if (!this._isValidLoc()) this._loc = this._shader.getCgl().gl.getUniformLocation(this._shader.getProgram(), this._name);
        else this.needsUpdate = false;

        this._shader.getCgl().gl.uniform1f(this._loc, this._value);
        this._cgl.profileData.profileUniformCount++;
    }

    setValueF(v)
    {
        if (v != this._value)
        {
            this.needsUpdate = true;
            this._value = v;
        }
    }

    updateValueI()
    {
        if (!this._isValidLoc()) this._loc = this._shader.getCgl().gl.getUniformLocation(this._shader.getProgram(), this._name);
        else this.needsUpdate = false;

        this._shader.getCgl().gl.uniform1i(this._loc, this._value);
        this._cgl.profileData.profileUniformCount++;
    }

    updateValue2I()
    {
        if (!this._value) return;

        if (!this._isValidLoc())
        {
            this._loc = this._shader.getCgl().gl.getUniformLocation(this._shader.getProgram(), this._name);
            this._cgl.profileData.profileShaderGetUniform++;
            this._cgl.profileData.profileShaderGetUniformName = this._name;
        }

        this._shader.getCgl().gl.uniform2i(this._loc, this._value[0], this._value[1]);

        this.needsUpdate = false;
        this._cgl.profileData.profileUniformCount++;
    }

    updateValue3I()
    {
        if (!this._value) return;
        if (!this._isValidLoc())
        {
            this._loc = this._shader.getCgl().gl.getUniformLocation(this._shader.getProgram(), this._name);
            this._cgl.profileData.profileShaderGetUniform++;
            this._cgl.profileData.profileShaderGetUniformName = this._name;
        }

        this._shader.getCgl().gl.uniform3i(this._loc, this._value[0], this._value[1], this._value[2]);
        this.needsUpdate = false;
        this._cgl.profileData.profileUniformCount++;
    }

    updateValue4I()
    {
        if (!this._isValidLoc())
        {
            this._loc = this._shader.getCgl().gl.getUniformLocation(this._shader.getProgram(), this._name);
            this._cgl.profileData.profileShaderGetUniform++;
            this._cgl.profileData.profileShaderGetUniformName = this._name;
        }
        this._shader.getCgl().gl.uniform4i(this._loc, this._value[0], this._value[1], this._value[2], this._value[3]);
        this._cgl.profileData.profileUniformCount++;
    }

    setValueI(v)
    {
        if (v != this._value)
        {
            this.needsUpdate = true;
            this._value = v;
        }
    }

    setValue2I(v)
    {
        if (!v) return;
        if (!this._oldValue)
        {
            this._oldValue = [v[0] - 1, 1];
            this.needsUpdate = true;
        }
        else if (v[0] != this._oldValue[0] || v[1] != this._oldValue[1])
        {
            this._oldValue[0] = v[0];
            this._oldValue[1] = v[1];
            this.needsUpdate = true;
        }

        this._value = v;
    }

    setValue3I(v)
    {
        if (!v) return;
        if (!this._oldValue)
        {
            this._oldValue = [v[0] - 1, 1, 2];
            this.needsUpdate = true;
        }
        else if (v[0] != this._oldValue[0] || v[1] != this._oldValue[1] || v[2] != this._oldValue[2])
        {
            this._oldValue[0] = v[0];
            this._oldValue[1] = v[1];
            this._oldValue[2] = v[2];
            this.needsUpdate = true;
        }

        this._value = v;
    }

    setValue4I(v)
    {
        this.needsUpdate = true;
        this._value = v || vec4.create();
    }

    updateValueBool()
    {
        if (!this._isValidLoc()) this._loc = this._shader.getCgl().gl.getUniformLocation(this._shader.getProgram(), this._name);
        else this.needsUpdate = false;
        this._shader.getCgl().gl.uniform1i(this._loc, this._value ? 1 : 0);

        this._cgl.profileData.profileUniformCount++;
    }

    setValueBool(v)
    {
        if (v != this._value)
        {
            this.needsUpdate = true;
            this._value = v;
        }
    }

    setValueArray4F(v)
    {
        this.needsUpdate = true;
        this._value = v;
    }

    updateValueArray4F()
    {
        if (!this._isValidLoc()) this._loc = this._shader.getCgl().gl.getUniformLocation(this._shader.getProgram(), this._name);
        else this.needsUpdate = false;

        if (!this._value) return;
        this._shader.getCgl().gl.uniform4fv(this._loc, this._value);
        this._cgl.profileData.profileUniformCount++;
    }

    setValueArray3F(v)
    {
        this.needsUpdate = true;
        this._value = v;
    }

    updateValueArray3F()
    {
        if (!this._isValidLoc()) this._loc = this._shader.getCgl().gl.getUniformLocation(this._shader.getProgram(), this._name);
        else this.needsUpdate = false;

        if (!this._value) return;
        this._shader.getCgl().gl.uniform3fv(this._loc, this._value);
        this._cgl.profileData.profileUniformCount++;
    }

    setValueArray2F(v)
    {
        this.needsUpdate = true;
        this._value = v;
    }

    updateValueArray2F()
    {
        if (!this._isValidLoc()) this._loc = this._shader.getCgl().gl.getUniformLocation(this._shader.getProgram(), this._name);
        else this.needsUpdate = false;

        if (!this._value) return;
        this._shader.getCgl().gl.uniform2fv(this._loc, this._value);
        this._cgl.profileData.profileUniformCount++;
    }

    setValueArrayF(v)
    {
        this.needsUpdate = true;
        this._value = v;
    }

    updateValueArrayF()
    {
        if (!this._isValidLoc()) this._loc = this._shader.getCgl().gl.getUniformLocation(this._shader.getProgram(), this._name);
        else this.needsUpdate = false;

        if (!this._value) return;
        this._shader.getCgl().gl.uniform1fv(this._loc, this._value);
        this._cgl.profileData.profileUniformCount++;
    }

    setValueArrayT(v)
    {
        this.needsUpdate = true;
        this._value = v;
    }

    updateValue3F()
    {
        if (!this._value) return;
        if (!this._isValidLoc())
        {
            this._loc = this._shader.getCgl().gl.getUniformLocation(this._shader.getProgram(), this._name);
            this._cgl.profileData.profileShaderGetUniform++;
            this._cgl.profileData.profileShaderGetUniformName = this._name;
        }

        this._shader.getCgl().gl.uniform3f(this._loc, this._value[0], this._value[1], this._value[2]);
        this.needsUpdate = false;
        this._cgl.profileData.profileUniformCount++;
    }

    setValue3F(v)
    {
        if (!v) return;
        if (!this._oldValue)
        {
            this._oldValue = [v[0] - 1, 1, 2];
            this.needsUpdate = true;
        }
        else if (v[0] != this._oldValue[0] || v[1] != this._oldValue[1] || v[2] != this._oldValue[2])
        {
            this._oldValue[0] = v[0];
            this._oldValue[1] = v[1];
            this._oldValue[2] = v[2];
            this.needsUpdate = true;
        }

        this._value = v;
    }

    updateValue2F()
    {
        if (!this._value) return;

        if (!this._isValidLoc())
        {
            this._loc = this._shader.getCgl().gl.getUniformLocation(this._shader.getProgram(), this._name);
            this._cgl.profileData.profileShaderGetUniform++;
            this._cgl.profileData.profileShaderGetUniformName = this._name;
        }

        this._shader.getCgl().gl.uniform2f(this._loc, this._value[0], this._value[1]);
        this.needsUpdate = false;
        this._cgl.profileData.profileUniformCount++;
    }

    setValue2F(v)
    {
        if (!v) return;
        if (!this._oldValue)
        {
            this._oldValue = [v[0] - 1, 1];
            this.needsUpdate = true;
        }
        else if (v[0] != this._oldValue[0] || v[1] != this._oldValue[1])
        {
            this._oldValue[0] = v[0];
            this._oldValue[1] = v[1];
            this.needsUpdate = true;
        }
        this._value = v;
    }

    updateValue4F()
    {
        if (!this._isValidLoc())
        {
            this._loc = this._shader.getCgl().gl.getUniformLocation(this._shader.getProgram(), this._name);
            this._cgl.profileData.profileShaderGetUniform++;
            this._cgl.profileData.profileShaderGetUniformName = this._name;
        }

        if (!this._value)
        {
            this._log.warn("no value for uniform", this._name, this);
            this._value = [0, 0, 0, 0];
        }

        this.needsUpdate = false;
        this._shader.getCgl().gl.uniform4f(this._loc, this._value[0], this._value[1], this._value[2], this._value[3]);
        this._cgl.profileData.profileUniformCount++;
    }

    setValue4F(v)
    {
        if (typeof this.value == "number") this.value = vec4.create(); // this should not be needed, but somehow it crashes with some shadermods

        if (!v) return;
        if (!this._oldValue)
        {
            this._oldValue = [v[0] - 1, 1, 2, 3];
            this.needsUpdate = true;
        }
        else if (v[0] != this._oldValue[0] || v[1] != this._oldValue[1] || v[2] != this._oldValue[2] || v[3] != this._oldValue[3])
        {
            this._oldValue[0] = v[0];
            this._oldValue[1] = v[1];
            this._oldValue[2] = v[2];
            this.needsUpdate = true;
        }

        this._value = v;
    }

    updateValueM4()
    {
        if (!this._isValidLoc())
        {
            this._loc = this._shader.getCgl().gl.getUniformLocation(this._shader.getProgram(), this._name);
            this._cgl.profileData.profileShaderGetUniform++;
            this._cgl.profileData.profileShaderGetUniformName = this._name;
        }
        if (!this._value || this._value.length % 16 != 0) return console.log("this.name", this._name, this._value);

        this._shader.getCgl().gl.uniformMatrix4fv(this._loc, false, this._value);
        this._cgl.profileData.profileUniformCount++;
    }

    setValueM4(v)
    {
        this.needsUpdate = true;
        this._value = v || mat4.create();
    }

    updateValueArrayT()
    {
        if (!this._isValidLoc()) this._loc = this._shader.getCgl().gl.getUniformLocation(this._shader.getProgram(), this._name);
        else this.needsUpdate = false;

        if (!this._value) return;
        this._shader.getCgl().gl.uniform1iv(this._loc, this._value);
        this._cgl.profileData.profileUniformCount++;
    }

    updateValueT()
    {
        if (!this._isValidLoc())
        {
            this._loc = this._shader.getCgl().gl.getUniformLocation(this._shader.getProgram(), this._name);
            this._cgl.profileData.profileShaderGetUniform++;
            this._cgl.profileData.profileShaderGetUniformName = this._name;
        }

        this._cgl.profileData.profileUniformCount++;
        this._shader.getCgl().gl.uniform1i(this._loc, this._value);
        this.needsUpdate = false;
    }

    setValueT(v)
    {
        this.needsUpdate = true;
        this._value = v;
    }
}

Uniform.glslTypeString = (t) =>
{
    if (t == "f") return "float";
    if (t == "b") return "bool";
    if (t == "i") return "int";
    if (t == "2i") return "ivec2";
    if (t == "2f") return "vec2";
    if (t == "3f") return "vec3";
    if (t == "4f") return "vec4";
    if (t == "m4") return "mat4";

    if (t == "t") return "sampler2D";
    if (t == "tc") return "samplerCube";

    if (t == "3f[]") return null; // ignore this for now...
    if (t == "m4[]") return null; // ignore this for now...
    if (t == "f[]") return null; // ignore this for now...

    console.warn("[CGL UNIFORM] unknown glsl type string ", t);
};

/**
 * @function setValue
 * @memberof Uniform
 * @instance
 * @param {Number|Array|Matrix|Texture} value
 */

;// CONCATENATED MODULE: ./src/corelibs/cgl/constants.js
const SHADER = {
    // default attributes
    "SHADERVAR_VERTEX_POSITION": "vPosition",
    "SHADERVAR_VERTEX_NUMBER": "attrVertIndex",
    "SHADERVAR_VERTEX_NORMAL": "attrVertNormal",
    "SHADERVAR_VERTEX_TEXCOORD": "attrTexCoord",
    "SHADERVAR_INSTANCE_MMATRIX": "instMat",
    "SHADERVAR_VERTEX_COLOR": "attrVertColor",

    "SHADERVAR_INSTANCE_INDEX": "instanceIndex",

    // default uniforms
    "SHADERVAR_UNI_PROJMAT": "projMatrix",
    "SHADERVAR_UNI_VIEWMAT": "viewMatrix",
    "SHADERVAR_UNI_MODELMAT": "modelMatrix",
    "SHADERVAR_UNI_NORMALMAT": "normalMatrix",
    "SHADERVAR_UNI_INVVIEWMAT": "inverseViewMatrix",
    "SHADERVAR_UNI_INVPROJMAT": "invProjMatrix",
    "SHADERVAR_UNI_MATERIALID": "materialId",
    "SHADERVAR_UNI_OBJECTID": "objectId",

    "SHADERVAR_UNI_VIEWPOS": "camPos",
};

const BLEND_MODES = {
    "BLEND_NONE": 0,
    "BLEND_NORMAL": 1,
    "BLEND_ADD": 2,
    "BLEND_SUB": 3,
    "BLEND_MUL": 4,
};

const RAD2DEG = 180.0 / Math.PI;
const DEG2RAD = Math.PI / 180.0;

const CONSTANTS = {
    "MATH": {
        "DEG2RAD": DEG2RAD,
        "RAD2DEG": RAD2DEG,
    },
    "SHADER": SHADER,
    "BLEND_MODES": BLEND_MODES,
};
const nl = "\n";// newline


;// CONCATENATED MODULE: ./src/corelibs/cg/cg_mesh.js
class CgMesh
{
    _name = "unknown";

    constructor()
    {
    }

}

;// CONCATENATED MODULE: ./src/corelibs/cgl/cgl_mesh.js











const MESH = {};
MESH.lastMesh = null;

/**
 * @typedef {Object} CglMeshAttributeOptions
 * @property {boolean} [instanced]
 * @property {Function} [cb]
 * @property {Function} [type]
 */

/**
 * @type Object
 * @typedef CglMeshOptions
 * @property {Number} [glPrimitive]
 * @property {String} [opId]
 */

/**
 * webgl renderable 3d object
 * @class
 * @namespace external:CGL
 * @hideconstructor
 * @example
 * const cgl=this._cgl
 * const mesh=new CGL.Mesh(cgl, geometry);
 *
 * function render()
 * {
 *   mesh.render(cgl.getShader());
 * }
 *
 */
class Mesh extends CgMesh
{

    /** @type {CglContext} */
    #cgl = null;

    /** @type {Geometry} */
    #geom = null;

    /** @type {WebGLBuffer} */
    #bufVerticesIndizes = null;

    /**
     * @param {CglContext} _cgl cgl
     * @param {Geometry} __geom geometry
     * @param {CglMeshOptions} _options
     */
    constructor(_cgl, __geom, _options = {})
    {
        super();
        this.#cgl = _cgl;

        let options = _options || {};
        if (external_CABLES_namespaceObject.utils.isNumeric(options))options = { "glPrimitive": _options }; // old constructor fallback...
        this._log = new external_CABLES_SHARED_namespaceObject.Logger("cgl_mesh");
        this._bufVertexAttrib = null;
        this.#bufVerticesIndizes = this.#cgl.gl.createBuffer();
        this._indexType = this.#cgl.gl.UNSIGNED_SHORT;
        this._attributes = [];
        this._attribLocs = {};

        this._lastShader = null;
        this._numInstances = 0;
        this._glPrimitive = options.glPrimitive;

        this.opId = options.opId || "";
        this._preWireframeGeom = null;
        this.addVertexNumbers = false;

        this.feedBackAttributes = [];
        this.setGeom(__geom);

        this._feedBacks = [];
        this._feedBacksChanged = false;
        this._transformFeedBackLoc = -1;
        this._lastAttrUpdate = 0;

        this.memFreed = false;

        this.#cgl.profileData.addHeavyEvent("mesh constructed", this._name);

        this._queryExt = null;
    }

    get geom()
    {
        return this.#geom;
    }

    get numInstances()
    {
        return this._numInstances;
    }

    set numInstances(v)
    {
        this.setNumInstances(v);
    }

    freeMem()
    {
        this.memFreed = true;

        for (let i = 0; i < this._attributes.length; i++)
            this._attributes[i].floatArray = null;
    }

    /**
     * @function updateVertices
     * @memberof Mesh
     * @instance
     * @description update vertices only from a geometry
     * @param {Geometry} geom
     */
    updateVertices(geom)
    {
        this.setAttribute(CONSTANTS.SHADER.SHADERVAR_VERTEX_POSITION, geom.vertices, 3);
        this._numVerts = geom.vertices.length / 3;
    }

    /**
     * @param {String} attrName
     * @param {String} name
     * @param {Number} stride
     * @param {Number} offset
      */
    setAttributePointer(attrName, name, stride, offset)
    {
        for (let i = 0; i < this._attributes.length; i++)
        {
            if (this._attributes[i].name == attrName)
            {
                if (!this._attributes[i].pointer) this._attributes[i].pointer = [];

                this._attributes[i].pointer.push(
                    {
                        "loc": -1,
                        "name": name,
                        "stride": stride,
                        "offset": offset,
                        "instanced": attrName == CONSTANTS.SHADER.SHADERVAR_INSTANCE_MMATRIX,
                    }
                );
            }
        }
    }

    /**
     * @param {String} name
     * @returns {AttributeObject}
     */
    getAttribute(name)
    {
        for (let i = 0; i < this._attributes.length; i++) if (this._attributes[i].name == name) return this._attributes[i];
    }

    /**
     * @param {AttributeOject} attr
     * @param { Float32Array } array
     * @param {number} start
     * @param {number} end
     */
    setAttributeRange(attr, array, start, end)
    {
        if (!attr) return;
        if (!start && !end) return;

        if (!attr.name)
            this._log.stack("no attrname?!");

        const gl = this.#cgl.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
        this.#cgl.profileData.profileMeshAttributes += (end - start) || 0;

        this.#cgl.profileData.profileSingleMeshAttribute[this._name] = this.#cgl.profileData.profileSingleMeshAttribute[this._name] || 0;
        this.#cgl.profileData.profileSingleMeshAttribute[this._name] += (end - start) || 0;

        if (attr.numItems < array.length / attr.itemSize)
        {
            this._resizeAttr(array, attr);
        }

        if (end > array.length && !this.warned)
        {
            this.warned = true;
            this._log.warn(this.#cgl.canvas.id + " " + attr.name + " buffersubdata out of bounds ?", array.length, end, start, attr);
            return;
        }

        // if (glVersion == 1) gl.bufferSubData(gl.ARRAY_BUFFER, 0, array); // probably slow/ maybe create and array with only changed size ??
        // else
        gl.bufferSubData(gl.ARRAY_BUFFER, start * 4, array, start, (end - start));
    }

    _resizeAttr(array, attr)
    {
        const gl = this.#cgl.gl;

        if (attr.buffer)
            gl.deleteBuffer(attr.buffer);

        attr.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
        this._bufferArray(array, attr);
        attr.numItems = array.length / attr.itemSize;// numItems;
    }

    _bufferArray(array, attr)
    {
        let floatArray = attr.floatArray || null;
        if (!array) return;

        if (this.#cgl.debugOneFrame)
        {
        console.log("_bufferArray", array.length, attr.name); // eslint-disable-line
        }

        if (!(array instanceof Float32Array))
        {
            if (attr && floatArray && floatArray.length == array.length)
            {
                floatArray.set(array);
            }
            else
            {
                floatArray = new Float32Array(array);

                if (this.#cgl.debugOneFrame)
                {
                console.log("_bufferArray create new float32array", array.length, attr.name); // eslint-disable-line
                }

                if (array.length > 10000)
                {
                    this.#cgl.profileData.profileNonTypedAttrib++;
                    this.#cgl.profileData.profileNonTypedAttribNames = "(" + this._name + ":" + attr.name + ")";
                }
            }
        }
        else floatArray = array;

        attr.arrayLength = floatArray.length;
        attr.floatArray = null;// floatArray;

        this.#cgl.gl.bufferData(this.#cgl.gl.ARRAY_BUFFER, floatArray, this.#cgl.gl.DYNAMIC_DRAW);
    }

    /**
     * @function setAttribute
     * @description update attribute
     * @memberof Mesh
     * @instance
     * @param {String} name
     * @param {Array} array
     * @param {Number} itemSize
     * @param {Object} options
     */
    addAttribute(name, array, itemSize, options)
    {
        this.setAttribute(name, array, itemSize, options);
    }

    /**
     * @param {String} name
     * @param {Array|Float32Array} array
     * @param {Number} itemSize Integer
     * @param {CglMeshAttributeOptions} options
     */
    setAttribute(name, array, itemSize, options = {})
    {
        if (!array)
        {
            this._log.error("mesh addAttribute - no array given! " + name);
            throw new Error();
        }
        let cb = null;
        let instanced = false;
        let i = 0;
        const numItems = array.length / itemSize;

        this.#cgl.profileData.profileMeshAttributes += numItems || 0;

        if (typeof options == "function")
        {
            cb = options;
        }

        if (typeof options == "object")
        {
            if (options.cb) cb = options.cb;
            if (options.instanced) instanced = options.instanced;
        }

        if (name == CONSTANTS.SHADER.SHADERVAR_INSTANCE_MMATRIX) instanced = true;

        for (i = 0; i < this._attributes.length; i++)
        {
            const attr = this._attributes[i];
            if (attr.name == name)
            {
                if (attr.numItems === numItems)
                {
                }
                else
                {
                    this._resizeAttr(array, attr);
                }

                this.#cgl.gl.bindBuffer(this.#cgl.gl.ARRAY_BUFFER, attr.buffer);
                this._bufferArray(array, attr);

                return attr;
            }
        }

        // create new buffer...

        const buffer = this.#cgl.gl.createBuffer();

        this.#cgl.gl.bindBuffer(this.#cgl.gl.ARRAY_BUFFER, buffer);
        // this._cgl.gl.bufferData(this._cgl.gl.ARRAY_BUFFER, floatArray, this._cgl.gl.DYNAMIC_DRAW);

        let type = this.#cgl.gl.FLOAT;
        if (options && options.type) type = options.type;
        const attr = {
            "buffer": buffer,
            "name": name,
            "cb": cb,
            "itemSize": itemSize,
            "numItems": numItems,
            "startItem": 0,
            "instanced": instanced,
            "type": type
        };

        this._bufferArray(array, attr);

        if (name == CONSTANTS.SHADER.SHADERVAR_VERTEX_POSITION) this._bufVertexAttrib = attr;
        this._attributes.push(attr);
        this._attribLocs = {};

        return attr;
    }

    getAttributes()
    {
        return this._attributes;
    }

    /**
     * @function updateTexCoords
     * @description update texture coordinates only from a geometry
     * @memberof Mesh
     * @instance
     * @param {Geometry} geom
     */
    updateTexCoords(geom)
    {
        if (geom.texCoords && geom.texCoords.length > 0)
        {
            this.setAttribute(CONSTANTS.SHADER.SHADERVAR_VERTEX_TEXCOORD, geom.texCoords, 2);
        }
        else
        {
            const tcBuff = new Float32Array(Math.round((geom.vertices.length / 3) * 2));
            this.setAttribute(CONSTANTS.SHADER.SHADERVAR_VERTEX_TEXCOORD, tcBuff, 2);
        }
    }

    /**
     * @function updateNormals
     * @description update normals only from a geometry
     * @memberof Mesh
     * @instance
     * @param {Geometry} geom
     */
    updateNormals(geom)
    {
        if (geom.vertexNormals && geom.vertexNormals.length > 0)
        {
            this.setAttribute(CONSTANTS.SHADER.SHADERVAR_VERTEX_NORMAL, geom.vertexNormals, 3);
        }
        else
        {
            const tcBuff = new Float32Array(Math.round((geom.vertices.length)));
            this.setAttribute(CONSTANTS.SHADER.SHADERVAR_VERTEX_NORMAL, tcBuff, 3);
        }
    }

    /**
     * @param {Array} [arr]
     */
    _setVertexNumbers(arr = null)
    {
        if (!this._verticesNumbers || this._verticesNumbers.length != this._numVerts || arr)
        {
            if (arr) this._verticesNumbers = arr;
            else
            {
                this._verticesNumbers = new Float32Array(this._numVerts);
                for (let i = 0; i < this._numVerts; i++) this._verticesNumbers[i] = i;
            }

            this.setAttribute(CONSTANTS.SHADER.SHADERVAR_VERTEX_NUMBER, this._verticesNumbers, 1, (_attr, _geom, shader) =>
            {
                if (!shader.uniformNumVertices) shader.uniformNumVertices = new Uniform(shader, "f", "numVertices", this._numVerts);
                shader.uniformNumVertices.setValue(this._numVerts);
            });
        }
    }

    /**
     * @function setVertexIndices
     * @description update vertex indices / faces
     * @memberof Mesh
     * @instance
     * @param {array} vertIndices
     */
    setVertexIndices(vertIndices)
    {
        if (!this.#bufVerticesIndizes)
        {
            this._log.warn("no bufVerticesIndizes: " + this._name);
            return;
        }
        if (vertIndices.length > 0)
        {
            if (vertIndices instanceof Float32Array) this._log.warn("vertIndices float32Array: " + this._name);

            for (let i = 0; i < vertIndices.length; i++)
            {
                if (vertIndices[i] >= this._numVerts)
                {
                    this._log.warn("invalid index in " + this._name, i, vertIndices[i]);
                    return;
                }
            }

            this.#cgl.gl.bindBuffer(this.#cgl.gl.ELEMENT_ARRAY_BUFFER, this.#bufVerticesIndizes);

            /*
             * todo cache this ?
             * if(!this.vertIndicesTyped || this.vertIndicesTyped.length!=this._geom.verticesIndices.length)
             */

            if (vertIndices.length > 65535)
            {
                this.vertIndicesTyped = new Uint32Array(vertIndices);
                this._indexType = this.#cgl.gl.UNSIGNED_INT;
            }
            else
            if (vertIndices instanceof Uint32Array)
            {
                this.vertIndicesTyped = vertIndices;
                this._indexType = this.#cgl.gl.UNSIGNED_INT;
            }
            else
            if (!(vertIndices instanceof Uint16Array))
            {
                this.vertIndicesTyped = new Uint16Array(vertIndices);
                this._indexType = this.#cgl.gl.UNSIGNED_SHORT;
            }
            else this.vertIndicesTyped = vertIndices;

            this.#cgl.gl.bufferData(this.#cgl.gl.ELEMENT_ARRAY_BUFFER, this.vertIndicesTyped, this.#cgl.gl.DYNAMIC_DRAW);
            this.#bufVerticesIndizes.itemSize = 1;
            this.#bufVerticesIndizes.numItems = vertIndices.length;
        }
        else this.#bufVerticesIndizes.numItems = 0;
    }

    /**
     * @function setGeom
     * @memberof Mesh
     * @instance
     * @description set geometry for mesh
     * @param {Geometry} geom
     * @param {boolean} removeRef
     */
    setGeom(geom, removeRef = false)
    {
        this.#geom = geom;
        if (geom.glPrimitive != null) this._glPrimitive = geom.glPrimitive;
        if (this.#geom && this.#geom.name) this._name = "mesh " + this.#geom.name;

        MESH.lastMesh = null;
        this.#cgl.profileData.profileMeshSetGeom++;

        this._disposeAttributes();

        this.updateVertices(this.#geom);
        this.setVertexIndices(this.#geom.verticesIndices);

        if (this.addVertexNumbers) this._setVertexNumbers();

        const geomAttribs = this.#geom.getAttributes();

        const attribAssoc = {
            "texCoords": CONSTANTS.SHADER.SHADERVAR_VERTEX_TEXCOORD,
            "vertexNormals": CONSTANTS.SHADER.SHADERVAR_VERTEX_NORMAL,
            "vertexColors": CONSTANTS.SHADER.SHADERVAR_VERTEX_COLOR,
            "tangents": "attrTangent",
            "biTangents": "attrBiTangent",
        };

        for (const index in geomAttribs)
            if (geomAttribs[index].data && geomAttribs[index].data.length)
                this.setAttribute(attribAssoc[index] || index, geomAttribs[index].data, geomAttribs[index].itemSize);

        if (removeRef)
        {
            this.#geom = null;
        }
    }

    _preBind(shader)
    {
        for (let i = 0; i < this._attributes.length; i++)
            if (this._attributes[i].cb)
                this._attributes[i].cb(this._attributes[i], this.#geom, shader);
    }

    _checkAttrLengths()
    {
        if (this.memFreed) return;
        // check length
        for (let i = 0; i < this._attributes.length; i++)
        {
            if (this._attributes[i].arrayLength / this._attributes[i].itemSize < this._attributes[0].arrayLength / this._attributes[0].itemSize)
            {
                let name = "unknown";
                if (this.#geom)name = this.#geom.name;

            /*
             * this._log.warn(
             *     name + ": " + this._attributes[i].name +
             *     " wrong attr length. is:", this._attributes[i].arrayLength / this._attributes[i].itemSize,
             *     " should be:", this._attributes[0].arrayLength / this._attributes[0].itemSize,
             * );
             */
            }
        }
    }

    _bind(shader)
    {
        if (!shader) return;
        if (!shader.isValid()) return;

        let attrLocs = [];
        if (this._attribLocs[shader.id]) attrLocs = this._attribLocs[shader.id];
        else this._attribLocs[shader.id] = attrLocs;

        this._lastShader = shader;
        if (shader.lastCompile > this._lastAttrUpdate || attrLocs.length != this._attributes.length)
        {
            this._lastAttrUpdate = shader.lastCompile;
            for (let i = 0; i < this._attributes.length; i++) attrLocs[i] = -1;
        }

        for (let i = 0; i < this._attributes.length; i++)
        {
            const attribute = this._attributes[i];
            if (attrLocs[i] == -1)
            {
                if (attribute._attrLocationLastShaderTime != shader.lastCompile)
                {
                    attribute._attrLocationLastShaderTime = shader.lastCompile;
                    attrLocs[i] = this.#cgl.glGetAttribLocation(shader.getProgram(), attribute.name);
                    // this._log.log('attribloc',attribute.name,attrLocs[i]);
                    this.#cgl.profileData.profileAttrLoc++;
                }
            }

            if (attrLocs[i] != -1)
            {
                this.#cgl.gl.enableVertexAttribArray(attrLocs[i]);
                this.#cgl.gl.bindBuffer(this.#cgl.gl.ARRAY_BUFFER, attribute.buffer);

                if (attribute.instanced)
                {
                // todo: easier way to fill mat4 attribs...
                    if (attribute.itemSize <= 4)
                    {
                        if (!attribute.itemSize || attribute.itemSize == 0) this._log.warn("instanced attrib itemsize error", this.#geom.name, attribute);

                        this.#cgl.gl.vertexAttribPointer(attrLocs[i], attribute.itemSize, attribute.type, false, attribute.itemSize * 4, 0);
                        this.#cgl.gl.vertexAttribDivisor(attrLocs[i], 1);
                    }
                    else if (attribute.itemSize == 16)
                    {
                        const stride = 16 * 4;

                        this.#cgl.gl.vertexAttribPointer(attrLocs[i], 4, attribute.type, false, stride, 0);
                        this.#cgl.gl.enableVertexAttribArray(attrLocs[i] + 1);
                        this.#cgl.gl.vertexAttribPointer(attrLocs[i] + 1, 4, attribute.type, false, stride, 4 * 4 * 1);
                        this.#cgl.gl.enableVertexAttribArray(attrLocs[i] + 2);
                        this.#cgl.gl.vertexAttribPointer(attrLocs[i] + 2, 4, attribute.type, false, stride, 4 * 4 * 2);
                        this.#cgl.gl.enableVertexAttribArray(attrLocs[i] + 3);
                        this.#cgl.gl.vertexAttribPointer(attrLocs[i] + 3, 4, attribute.type, false, stride, 4 * 4 * 3);

                        this.#cgl.gl.vertexAttribDivisor(attrLocs[i], 1);
                        this.#cgl.gl.vertexAttribDivisor(attrLocs[i] + 1, 1);
                        this.#cgl.gl.vertexAttribDivisor(attrLocs[i] + 2, 1);
                        this.#cgl.gl.vertexAttribDivisor(attrLocs[i] + 3, 1);
                    }
                    else
                    {
                        this._log.warn("unknown instance attrib size", attribute.name);
                    }
                }
                else
                {
                    if (!attribute.itemSize || attribute.itemSize == 0) this._log.warn("attrib itemsize error", this._name, attribute);
                    this.#cgl.gl.vertexAttribPointer(attrLocs[i], attribute.itemSize, attribute.type, false, attribute.itemSize * 4, 0);

                    if (attribute.pointer)
                    {
                        for (let ip = 0; ip < attribute.pointer.length; ip++)
                        {
                            const pointer = attribute.pointer[ip];

                            if (pointer.loc == -1)
                                pointer.loc = this.#cgl.glGetAttribLocation(shader.getProgram(), pointer.name);

                            this.#cgl.profileData.profileAttrLoc++;

                            this.#cgl.gl.enableVertexAttribArray(pointer.loc);
                            this.#cgl.gl.vertexAttribPointer(pointer.loc, attribute.itemSize, attribute.type, false, pointer.stride, pointer.offset);
                        }
                    }
                    if (this.bindFeedback) this.bindFeedback(attribute);
                }
            }
        }

        if (this.#bufVerticesIndizes && this.#bufVerticesIndizes.numItems !== 0) this.#cgl.gl.bindBuffer(this.#cgl.gl.ELEMENT_ARRAY_BUFFER, this.#bufVerticesIndizes);
    }

    unBind()
    {
        const shader = this._lastShader;
        this._lastShader = null;
        if (!shader) return;

        let attrLocs = [];
        if (this._attribLocs[shader.id]) attrLocs = this._attribLocs[shader.id];
        else this._attribLocs[shader.id] = attrLocs;

        MESH.lastMesh = null;

        for (let i = 0; i < this._attributes.length; i++)
        {
            if (this._attributes[i].instanced)
            {
            // todo: easier way to fill mat4 attribs...
                if (this._attributes[i].itemSize <= 4)
                {
                    if (attrLocs[i] != -1) this.#cgl.gl.vertexAttribDivisor(attrLocs[i], 0);
                    if (attrLocs[i] >= 0) this.#cgl.gl.disableVertexAttribArray(attrLocs[i]);
                }
                else
                {
                    this.#cgl.gl.vertexAttribDivisor(attrLocs[i], 0);
                    this.#cgl.gl.vertexAttribDivisor(attrLocs[i] + 1, 0);
                    this.#cgl.gl.vertexAttribDivisor(attrLocs[i] + 2, 0);
                    this.#cgl.gl.vertexAttribDivisor(attrLocs[i] + 3, 0);
                    this.#cgl.gl.disableVertexAttribArray(attrLocs[i] + 1);
                    this.#cgl.gl.disableVertexAttribArray(attrLocs[i] + 2);
                    this.#cgl.gl.disableVertexAttribArray(attrLocs[i] + 3);
                }
            }

            if (attrLocs[i] != -1) this.#cgl.gl.disableVertexAttribArray(attrLocs[i]);

        }
    }

    meshChanged()
    {
        return this.#cgl.lastMesh && this.#cgl.lastMesh != this;
    }

    printDebug()
    {
        console.log("--attributes");
        for (let i = 0; i < this._attributes.length; i++)
        {
            console.log("attribute " + i + " " + this._attributes[i].name);
        }
    }

    /**
     * @param {Number} num
     */
    setNumVertices(num)
    {
        // this._bufVerticesIndizes.numItems = num;
        this._bufVertexAttrib.numItems = num;
    }

    /**
     * @returns {Number}
     */
    getNumVertices()
    {
        // return this._bufVerticesIndizes.numItems;
        return this._bufVertexAttrib.numItems;
    }

    /**
     * @param {Number} num
     */
    setNumIndices(num)
    {
        this.#bufVerticesIndizes.numItems = num;
    }

    /**
     * @returns {Number}
     */
    getNumIndices()
    {
        return this.#bufVerticesIndizes.numItems;
    }

    /**
     * @function render
     * @memberof Mesh
     * @instance
     * @description draw mesh to screen
     * @param {Shader} shader
     */
    render(shader)
    {
        // TODO: enable/disablevertex only if the mesh has changed... think drawing 10000x the same mesh

        if (this.#cgl.aborted) return;
        shader = shader || this.#cgl.getShader();

        if (!shader)
        {
            return console.log("shader not valid");
        }

        if (!shader.isValid())
        {
            shader = this.#cgl.getErrorShader();
        }

        this._checkAttrLengths();

        if (this.#geom)
        {
            if (this._preWireframeGeom && !shader.wireframe && !this.#geom.isIndexed())
            {
                this.setGeom(this._preWireframeGeom);
                this._preWireframeGeom = null;
            }

            if (shader.wireframe)
            {
                let changed = false;

                if (this.#geom.isIndexed())
                {
                    if (!this._preWireframeGeom)
                    {
                        this._preWireframeGeom = this.#geom;
                        this.#geom = this.#geom.copy();
                    }

                    this.#geom.unIndex();
                    changed = true;
                }

                if (!this.#geom.getAttribute("attrBarycentric"))
                {
                    if (!this._preWireframeGeom)
                    {
                        this._preWireframeGeom = this.#geom;
                        this.#geom = this.#geom.copy();
                    }
                    changed = true;

                    this.#geom.calcBarycentric();
                }
                if (changed) this.setGeom(this.#geom);
            }
        }

        let needsBind = false;
        if (MESH.lastMesh != this)
        {
            if (MESH.lastMesh) MESH.lastMesh.unBind();
            needsBind = true;
        }

        if (needsBind) this._preBind(shader);

        if (!shader.bind()) return;

        this._bind(shader);
        if (this.addVertexNumbers) this._setVertexNumbers();

        MESH.lastMesh = this;

        let prim = this.#cgl.gl.TRIANGLES;
        if (this._glPrimitive !== undefined) prim = this._glPrimitive;
        if (shader.glPrimitive !== null) prim = shader.glPrimitive;

        let elementDiv = 1;
        let doQuery = this.#cgl.profileData.doProfileGlQuery;
        let queryStarted = false;
        if (doQuery)
        {
            let id = this._name + " - " + shader.getName() + " #" + shader.id;
            if (this._numInstances) id += " instanced " + this._numInstances + "x";

            let queryProfilerData = this.#cgl.profileData.glQueryData[id];

            if (!queryProfilerData) queryProfilerData = { "id": id, "num": 0 };

            if (shader.opId)queryProfilerData.shaderOp = shader.opId;
            if (this.opId)queryProfilerData.meshOp = this.opId;

            this.#cgl.profileData.glQueryData[id] = queryProfilerData;

            if (!this._queryExt && this._queryExt !== false) this._queryExt = this.#cgl.enableExtension("EXT_disjoint_timer_query_webgl2") || false;
            if (this._queryExt)
            {
                if (queryProfilerData._drawQuery)
                {
                    const available = this.#cgl.gl.getQueryParameter(queryProfilerData._drawQuery, this.#cgl.gl.QUERY_RESULT_AVAILABLE);
                    if (available)
                    {
                        const elapsedNanos = this.#cgl.gl.getQueryParameter(queryProfilerData._drawQuery, this.#cgl.gl.QUERY_RESULT);
                        const currentTimeGPU = elapsedNanos / 1000000;

                        queryProfilerData._times = queryProfilerData._times || 0;
                        queryProfilerData._times += currentTimeGPU;
                        queryProfilerData._numcount++;
                        queryProfilerData.when = performance.now();
                        queryProfilerData._drawQuery = null;
                        queryProfilerData.queryStarted = false;
                    }
                }

                if (!queryProfilerData.queryStarted)
                {
                    queryProfilerData._drawQuery = this.#cgl.gl.createQuery();
                    this.#cgl.gl.beginQuery(this._queryExt.TIME_ELAPSED_EXT, queryProfilerData._drawQuery);
                    queryStarted = queryProfilerData.queryStarted = true;
                }
            }
        }

        if (this.hasFeedbacks && this.hasFeedbacks()) this.drawFeedbacks(shader, prim);
        else if (!this.#bufVerticesIndizes || this.#bufVerticesIndizes.numItems === 0)
        {

            /*
             * for (let i = 0; i < this._attributes.length; i++)
             * {
             *     if (this._attributes[i].arrayLength / this._attributes[i].itemSize != this._bufVertexAttrib.floatArray.length / 3)
             *     {
             *         this._log.warn("attrib buffer length wrong! ", this._attributes[i].name, this._attributes[i].arrayLength / this._attributes[i].itemSize, this._bufVertexAttrib.floatArray.length / 3, this._attributes[i].itemSize);
             *         // this._log.log(this);
             *         // debugger;
             *         return;
             *     }
             * }
             */

            if (prim == this.#cgl.gl.TRIANGLES)elementDiv = 3;

            if (this._numInstances === 0) this.#cgl.gl.drawArrays(prim, this._bufVertexAttrib.startItem, this._bufVertexAttrib.numItems - this._bufVertexAttrib.startItem);
            else this.#cgl.gl.drawArraysInstanced(prim, this._bufVertexAttrib.startItem, this._bufVertexAttrib.numItems, this._numInstances);
        }
        else
        {
            if (prim == this.#cgl.gl.TRIANGLES)elementDiv = 3;
            if (this._numInstances === 0)
            {
                this.#cgl.gl.drawElements(prim, this.#bufVerticesIndizes.numItems, this._indexType, 0);
            }
            else
            {
                this.#cgl.gl.drawElementsInstanced(prim, this.#bufVerticesIndizes.numItems, this._indexType, 0, this._numInstances);
            }
        }

        if (this.#cgl.debugOneFrame && this.#cgl.gl.getError() != this.#cgl.gl.NO_ERROR)
        {
            this._log.error("mesh draw gl error");
            this._log.error("mesh", this);
            this._log.error("shader", shader);

            const attribNames = [];
            for (let i = 0; i < this.#cgl.gl.getProgramParameter(shader.getProgram(), this.#cgl.gl.ACTIVE_ATTRIBUTES); i++)
            {
                const name = this.#cgl.gl.getActiveAttrib(shader.getProgram(), i).name;
                this._log.error("attrib ", name);
            }
        }

        this.#cgl.profileData.profileMeshNumElements += (this._bufVertexAttrib.numItems / elementDiv) * (this._numInstances || 1);
        this.#cgl.profileData.profileMeshDraw++;

        if (doQuery && queryStarted)
        {
            this.#cgl.gl.endQuery(this._queryExt.TIME_ELAPSED_EXT);
        }

        this.#cgl.printError("mesh render " + this._name);

        this.unBind();
    }

    setNumInstances(n)
    {
        n = Math.max(0, n);
        if (this._numInstances != n)
        {
            this._numInstances = n;
            const indexArr = new Float32Array(n);
            for (let i = 0; i < n; i++) indexArr[i] = i;
            this.setAttribute(CONSTANTS.SHADER.SHADERVAR_INSTANCE_INDEX, indexArr, 1, { "instanced": true });
        }
    }

    _disposeAttributes()
    {
        if (!this._attributes) return;

        for (let i = 0; i < this._attributes.length; i++)
        {
            if (this._attributes[i].buffer)
            {
                this.#cgl.gl.deleteBuffer(this._attributes[i].buffer);
                this._attributes[i].buffer = null;
            }
        }
        this._attributes.length = 0;
    }

    dispose()
    {
        if (this.#cgl.aborted) return;
        if (this._bufVertexAttrib && this._bufVertexAttrib.buffer) this.#cgl.gl.deleteBuffer(this._bufVertexAttrib.buffer);
        if (this.#bufVerticesIndizes) this.#cgl.gl.deleteBuffer(this.#bufVerticesIndizes);
        this.#bufVerticesIndizes = null;

        this._disposeAttributes();
        return null;
    }
}



;// CONCATENATED MODULE: external "CABLES.GLMatrix"
const external_CABLES_GLMatrix_namespaceObject = CABLES.GLMatrix;
;// CONCATENATED MODULE: ./src/corelibs/cg/cg_boundingbox.js





/**
 * bounding box
 *
 * @namespace external:CGL
 * @param {Geometry} geometry or bounding box
 */
class BoundingBox
{

    /**
     * @param {Geometry} [geom]
     */
    constructor(geom)
    {
        this._init();
        this._first = true;
        this._wireMesh = null;

        if (geom) this.applyGeom(geom);
    }

    _init()
    {
        this._max = [-0, -0, -0];
        this._min = [0, 0, 0];
        this._center = [0, 0, 0];
        this._size = [0, 0, 0];
        this._maxAxis = 0.0;
        this._first = true;
    }

    /**
     * get biggest number of maxX,maxY,maxZ
     * @type {Number}
     */
    get maxAxis() { return this._maxAxis || 1; }

    /**
     * size of bounding box
     * @type {vec3}
     */
    get size() { return this._size; }

    /**
     * center of bounding box
     * @type {vec3}
     */
    get center() { return this._center; }

    /**
     * center x
     * @type {Number}
     */
    get x() { return this._center[0]; }

    /**
     * center y
     * @type {Number}
     */
    get y() { return this._center[1]; }

    /**
     * center z
     * @type {Number}
     */
    get z() { return this._center[2]; }

    /**
     * minimum x
     * @type {Number}
     */
    get minX() { return this._min[0]; }

    /**
     * minimum y
     * @type {Number}
     */
    get minY() { return this._min[1]; }

    /**
     * minimum z
     * @type {Number}
     */
    get minZ() { return this._min[2]; }

    /**
     * maximum x
     * @type {Number}
     */
    get maxX() { return this._max[0]; }

    /**
     * maximum y
     * @type {Number}
     */
    get maxY() { return this._max[1]; }

    /**
     * maximum z
     * @type {Number}
     */
    get maxZ() { return this._max[2]; }

    /**
     * @deprecated
     * @param {Geometry} geom
     */
    apply(geom)
    {
        return this.applyGeom(geom);
    }

    /**
     * @param {Geometry} geom
     */
    applyGeom(geom)
    {
        if (!geom) return;

        if (geom instanceof BoundingBox)
        {
            const bb = geom;

            this.applyPos(bb.maxX, bb.maxY, bb.maxZ);
            this.applyPos(bb.minX, bb.minY, bb.minZ);
        }
        else
        {
            if (geom.isGeometry)
                for (let i = 0; i < geom.vertices.length; i += 3)
                    this.applyPos(geom.vertices[i], geom.vertices[i + 1], geom.vertices[i + 2]);
        }
        this.calcCenterSize();
    }

    /**
     * returns a copy of the bounding box
     * @function copy
     * @memberof BoundingBox
     * @instance
     */
    copy()
    {
        return new BoundingBox(this);
    }

    get changed()
    {
        return !(this._max[0] == -Number.MAX_VALUE && this._max[1] == -Number.MAX_VALUE && this._max[2] == -Number.MAX_VALUE);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    applyPos(x, y, z)
    {
        if (x == Number.MAX_VALUE || x == -Number.MAX_VALUE ||
            y == Number.MAX_VALUE || y == -Number.MAX_VALUE ||
            z == Number.MAX_VALUE || z == -Number.MAX_VALUE) return;

        if (!external_CABLES_namespaceObject.utils.isNumeric(x) || !external_CABLES_namespaceObject.utils.isNumeric(y) || !external_CABLES_namespaceObject.utils.isNumeric(z)) return;

        if (this._first)
        {
            this._max[0] = x;
            this._max[1] = y;
            this._max[2] = z;

            this._min[0] = x;
            this._min[1] = y;
            this._min[2] = z;
            this._first = false;
            return;
        }

        this._max[0] = Math.max(this._max[0], x);
        this._max[1] = Math.max(this._max[1], y);
        this._max[2] = Math.max(this._max[2], z);

        this._min[0] = Math.min(this._min[0], x);
        this._min[1] = Math.min(this._min[1], y);
        this._min[2] = Math.min(this._min[2], z);
    }

    calcCenterSize()
    {
        if (this._first) return;

        this._size[0] = this._max[0] - this._min[0];
        this._size[1] = this._max[1] - this._min[1];
        this._size[2] = this._max[2] - this._min[2];

        this._center[0] = (this._min[0] + this._max[0]) / 2;
        this._center[1] = (this._min[1] + this._max[1]) / 2;
        this._center[2] = (this._min[2] + this._max[2]) / 2;

        this._maxAxis = Math.max(this._size[2], Math.max(this._size[0], this._size[1]));
    }

    /**
     * @param {mat4} m
     */
    mulMat4(m)
    {
        if (this._first)
        {
            this._max[0] = 0;
            this._max[1] = 0;
            this._max[2] = 0;

            this._min[0] = 0;
            this._min[1] = 0;
            this._min[2] = 0;
            this._first = false;
        }
        external_CABLES_GLMatrix_namespaceObject.vec3.transformMat4(this._max, this._max, m);
        external_CABLES_GLMatrix_namespaceObject.vec3.transformMat4(this._min, this._min, m);
        this.calcCenterSize();
    }

    /**
     * @param {CglContext} cgl
     * @param {Shader} _shader
     * @param {Op} op
     */
    render(cgl, _shader, op)
    {
        if (!this._wireMesh) this._wireMesh = new CGL.WireCube(cgl);

        cgl.pushModelMatrix();
        external_CABLES_GLMatrix_namespaceObject.mat4.translate(cgl.mMatrix, cgl.mMatrix, this._center);

        if (CABLES.UI && op)
        {
            CABLES.UI.OverlayMeshes.drawCube(op, this._size[0] / 2, this._size[1] / 2, this._size[2] / 2);
        }

        cgl.popModelMatrix();
    }
}

;// CONCATENATED MODULE: ./src/corelibs/cg/cg_geom.js





/**
 * a geometry contains all information about a mesh, vertices, texturecoordinates etc. etc.
 * @param {String} name
 * @example
 * // create a triangle with all attributes
 * const geom=new Geometry("triangle"),
 *
 * geom.vertices = [
 *      0.0,           sizeH.get(),  0.0,
 *     -sizeW.get(),  -sizeH.get(),  0.0,
 *      sizeW.get(),  -sizeH.get(),  0.0 ];
 *
 * geom.vertexNormals = [
 *      0.0,  0.0,  1.0,
 *      0.0,  0.0,  1.0,
 *      0.0,  0.0,  1.0 ];
 *
 * geom.tangents = [
 *     1,0,0,
 *     1,0,0,
 *     1,0,0 ];
 *
 * geom.biTangents = [
 *     0,1,0,
 *     0,1,0,
 *     0,1,0 ];
 *
 * geom.texCoords = [
 *      0.5,  0.0,
 *      1.0,  1.0,
 *      0.0,  1.0, ];
 *
 * geom.verticesIndices = [
 *     0, 1, 2 ];
 *
 */

class Geometry
{
    isGeometry = true;

    /**
     * @param {String} name
    */
    constructor(name)
    {
        this.name = name || "unknown";
        this._log = new external_CABLES_SHARED_namespaceObject.Logger("cgl_geometry");

        this.faceVertCount = 3;
        this.glPrimitive = null;
        this._attributes = {};

        /** @type {Array|Float32Array} */
        this._vertices = [];

        /** @type {Array} */
        this.verticesIndices = [];

        this.morphTargets = [];
    }

    get vertices()
    {
        return this._vertices;
    }

    set vertices(v)
    {
        this.setVertices(v);
    }

    get texCoords()
    {
        const att = this.getAttribute("texCoords");
        if (!att) return [];
        return att.data;
    }

    set texCoords(v)
    {
        this.setAttribute("texCoords", v, 2);
    }

    get vertexNormals()
    {
        const att = this.getAttribute("vertexNormals");
        if (!att) return [];
        return att.data;
    }

    set vertexNormals(v)
    {
        this.setAttribute("vertexNormals", v, 3);
    }

    get tangents()
    {
        const att = this.getAttribute("tangents");
        if (!att) return [];
        return att.data;
    }

    set tangents(v)
    {
        this.setAttribute("tangents", v, 3);
    }

    get biTangents()
    {
        const att = this.getAttribute("biTangents");
        if (!att) return [];
        return att.data;
    }

    set biTangents(v)
    {
        this.setAttribute("biTangents", v, 3);
    }

    get vertexColors()
    {
        const att = this.getAttribute("vertexColors");
        if (!att) return [];
        return att.data;
    }

    set vertexColors(v)
    {
        this.setAttribute("vertexColors", v, 4);
    }

    /**
     * @description clear all buffers/set them to length 0
     */
    clear()
    {
        this._vertices = new Float32Array([]);
        this.verticesIndices = [];
        this.texCoords = new Float32Array([]);
        this.vertexNormals = new Float32Array([]);
        this.tangents = [];
        this.biTangents = [];
        this._attributes = {};
    }

    /**
    * @return {Object} returns array of attribute objects
    */
    getAttributes()
    {
        return this._attributes;
    }

    /**
     * @function getAttribute
     * @memberof Geometry
     * @instance
     * @param {String} name
     * @return {Object}
     */
    getAttribute(name)
    {
        for (const i in this._attributes)
        {
            if (this._attributes[i].name == name) return this._attributes[i];
        }
        return null;
    }

    /**
     * @function setAttribute
     * @description create an attribute
     * @memberof Geometry
     * @instance
     * @param {String} name
     * @param {Array} arr
     * @param {Number} itemSize
     */
    setAttribute(name, arr, itemSize)
    {
        let attrType = "";
        if (!itemSize || itemSize > 4)
        {
            this._log.warn("itemsize wrong?", itemSize, name);
            this._log.stack("itemsize");

            itemSize = 3;
        }

        if (itemSize == 1) attrType = "float";
        else if (itemSize == 2) attrType = "vec2";
        else if (itemSize == 3) attrType = "vec3";
        else if (itemSize == 4) attrType = "vec4";

        const attr = {
            "name": name,
            "data": arr,
            "itemSize": itemSize,
            "type": attrType,
        };

        this._attributes[name] = attr;
    }

    /**
     * @param {string} name
     * @param {Geometry} newgeom
     */
    copyAttribute(name, newgeom)
    {
        const attr = this.getAttribute(name);
        newgeom.setAttribute(name, new Float32Array(attr.data), attr.itemSize);
    }

    /**
     * @function setVertices
     * @memberof Geometry
     * @instance
     * @description set vertices
     * @param {Array|Float32Array} arr [x,y,z,x,y,z,...]
     */
    setVertices(arr)
    {
        if (arr instanceof Float32Array) this._vertices = arr;
        else this._vertices = new Float32Array(arr);
    }

    /**
     * set texcoords
     * @param {Array|Float32Array} arr [u,v,u,v,...]
     */
    setTexCoords(arr)
    {
        if (arr instanceof Float32Array) this.texCoords = arr;
        else this.texCoords = new Float32Array(arr);
    }

    // deprecated
    calcNormals(smooth)
    {
        const options = { "smooth": smooth };
        this.calculateNormals(options);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    flipNormals(x, y, z)
    {
        let vec = external_CABLES_GLMatrix_namespaceObject.vec3.create();

        if (x == undefined)x = 1;
        if (y == undefined)y = 1;
        if (z == undefined)z = 1;

        for (let i = 0; i < this.vertexNormals.length; i += 3)
        {
            external_CABLES_GLMatrix_namespaceObject.vec3.set(vec,
                this.vertexNormals[i + 0],
                this.vertexNormals[i + 1],
                this.vertexNormals[i + 2]);

            vec[0] *= -x;
            vec[1] *= -y;
            vec[2] *= -z;

            external_CABLES_GLMatrix_namespaceObject.vec3.normalize(vec, vec);

            this.vertexNormals[i + 0] = vec[0];
            this.vertexNormals[i + 1] = vec[1];
            this.vertexNormals[i + 2] = vec[2];
        }
    }

    getNumTriangles()
    {
        if (this.verticesIndices && this.verticesIndices.length) return this.verticesIndices.length / 3;
        return this.vertices.length / 3;
    }

    /**
     * flip order of vertices in geom faces
     */
    flipVertDir()
    {
        const newInd = [];
        newInd.length = this.verticesIndices.length;
        for (let i = 0; i < this.verticesIndices.length; i += 3)
        {
            newInd[i] = this.verticesIndices[i + 2];
            newInd[i + 1] = this.verticesIndices[i + 1];
            newInd[i + 2] = this.verticesIndices[i];
        }
        this.verticesIndices = newInd;
    }

    /**
     * @param {Array} verts
     */
    setPointVertices(verts)
    {
        if (verts.length % 3 !== 0)
        {
            this._log.error("SetPointVertices: Array must be multiple of three.");
            return;
        }

        if (!(verts instanceof Float32Array)) this.vertices = new Float32Array(verts);
        else this.vertices = verts;

        if (!(this.texCoords instanceof Float32Array)) this.texCoords = new Float32Array((verts.length / 3) * 2);

        // this.texCoords.length=verts.length/3*2;
        this.verticesIndices.length = verts.length / 3;
        // this.verticesIndices=[];

        for (let i = 0; i < verts.length / 3; i++)
        {
            this.verticesIndices[i] = i;
            this.texCoords[i * 2] = 0;
            this.texCoords[i * 2 + 1] = 0;
        }
    }

    /**
     * merge a different geometry into the this geometry
     * @param {Geometry} geom
     */
    merge(geom)
    {
        if (!geom) return;

        if (this.isIndexed() != geom.isIndexed())
        {
            if (this.isIndexed())
            {
                this.unIndex(false, true);
            }
            if (geom.isIndexed())
            {
                const g = geom.copy();
                g.unIndex(false, true);
                geom = g;
            }
        }

        const oldIndizesLength = this.verticesIndices.length;
        const vertLength = this._vertices.length / 3;

        this.verticesIndices.length += geom.verticesIndices.length;
        for (let i = 0; i < geom.verticesIndices.length; i++)
            this.verticesIndices[oldIndizesLength + i] = geom.verticesIndices[i] + vertLength;

        this.vertices = external_CABLES_namespaceObject.utils.float32Concat(this._vertices, geom.vertices);
        this.texCoords = external_CABLES_namespaceObject.utils.float32Concat(this.texCoords, geom.texCoords);
        this.vertexNormals = external_CABLES_namespaceObject.utils.float32Concat(this.vertexNormals, geom.vertexNormals);
        this.tangents = external_CABLES_namespaceObject.utils.float32Concat(this.tangents, geom.tangents);
        this.biTangents = external_CABLES_namespaceObject.utils.float32Concat(this.biTangents, geom.biTangents);
    }

    /**
     *   a copy of the geometry
     * @function copy
     * @memberof Geometry
     * @instance
     */
    copy()
    {
        const geom = new Geometry(this.name + " copy");
        geom.faceVertCount = this.faceVertCount;
        geom.glPrimitive = this.glPrimitive;

        geom.setVertices(this._vertices.slice(0));

        if (this.verticesIndices)
        {
            geom.verticesIndices.length = this.verticesIndices.length;
            for (let i = 0; i < this.verticesIndices.length; i++) geom.verticesIndices[i] = this.verticesIndices[i];
        }

        for (let i in this._attributes) this.copyAttribute(i, geom);

        geom.morphTargets.length = this.morphTargets.length;
        for (let i = 0; i < this.morphTargets.length; i++) geom.morphTargets[i] = this.morphTargets[i];

        return geom;
    }

    /**
     * Calculaten normals
     * @function calculateNormals
     * @param {{ smooth?: any; forceZUp?: any; }} options
     */
    calculateNormals(options = null)
    {
        // todo: should check angle of normals to get edges    https://community.khronos.org/t/calculating-accurate-vertex-normals/28152
        options = options || {};
        if (options.smooth === false) this.unIndex();

        const u = external_CABLES_GLMatrix_namespaceObject.vec3.create();
        const v = external_CABLES_GLMatrix_namespaceObject.vec3.create();
        const n = external_CABLES_GLMatrix_namespaceObject.vec3.create();

        function calcNormal(triangle)
        {
            external_CABLES_GLMatrix_namespaceObject.vec3.subtract(u, triangle[0], triangle[1]);
            external_CABLES_GLMatrix_namespaceObject.vec3.subtract(v, triangle[0], triangle[2]);
            external_CABLES_GLMatrix_namespaceObject.vec3.cross(n, u, v);
            external_CABLES_GLMatrix_namespaceObject.vec3.normalize(n, n);

            if (options && options.forceZUp)
            {
                if (n[2] < 0)
                {
                    n[0] *= -1;
                    n[1] *= -1;
                    n[2] *= -1;
                }
            }
            return n;
        }

        this.getVertexVec = function (which)
        {
            const vec = [0, 0, 0];
            vec[0] = this.vertices[which * 3 + 0];
            vec[1] = this.vertices[which * 3 + 1];
            vec[2] = this.vertices[which * 3 + 2];
            return vec;
        };

        if (!(this.vertexNormals instanceof Float32Array) || this.vertexNormals.length != this.vertices.length) this.vertexNormals = new Float32Array(this.vertices.length);

        for (let i = 0; i < this.vertices.length; i++)
        {
            this.vertexNormals[i] = 0;
        }

        if (!this.isIndexed())
        {
            const norms = [];
            for (let i = 0; i < this.vertices.length; i += 9)
            {
                const triangle = [[this.vertices[i + 0], this.vertices[i + 1], this.vertices[i + 2]], [this.vertices[i + 3], this.vertices[i + 4], this.vertices[i + 5]], [this.vertices[i + 6], this.vertices[i + 7], this.vertices[i + 8]]];
                const nn = calcNormal(triangle);
                norms.push(nn[0], nn[1], nn[2], nn[0], nn[1], nn[2], nn[0], nn[1], nn[2]);
            }
            this.vertexNormals = norms;
        }
        else
        {
            const faceNormals = [];

            faceNormals.length = Math.floor(this.verticesIndices.length / 3);

            for (let i = 0; i < this.verticesIndices.length; i += 3)
            {
                const triangle = [this.getVertexVec(this.verticesIndices[i + 0]), this.getVertexVec(this.verticesIndices[i + 1]), this.getVertexVec(this.verticesIndices[i + 2])];

                faceNormals[i / 3] = calcNormal(triangle);

                this.vertexNormals[this.verticesIndices[i + 0] * 3 + 0] += faceNormals[i / 3][0];
                this.vertexNormals[this.verticesIndices[i + 0] * 3 + 1] += faceNormals[i / 3][1];
                this.vertexNormals[this.verticesIndices[i + 0] * 3 + 2] += faceNormals[i / 3][2];

                this.vertexNormals[this.verticesIndices[i + 1] * 3 + 0] += faceNormals[i / 3][0];
                this.vertexNormals[this.verticesIndices[i + 1] * 3 + 1] += faceNormals[i / 3][1];
                this.vertexNormals[this.verticesIndices[i + 1] * 3 + 2] += faceNormals[i / 3][2];

                this.vertexNormals[this.verticesIndices[i + 2] * 3 + 0] += faceNormals[i / 3][0];
                this.vertexNormals[this.verticesIndices[i + 2] * 3 + 1] += faceNormals[i / 3][1];
                this.vertexNormals[this.verticesIndices[i + 2] * 3 + 2] += faceNormals[i / 3][2];
            }

            for (let i = 0; i < this.verticesIndices.length; i += 3) // faces
            {
                for (let k = 0; k < 3; k++) // triangles
                {
                    const vv = [this.vertexNormals[this.verticesIndices[i + k] * 3 + 0], this.vertexNormals[this.verticesIndices[i + k] * 3 + 1], this.vertexNormals[this.verticesIndices[i + k] * 3 + 2]];
                    external_CABLES_GLMatrix_namespaceObject.vec3.normalize(vv, vv);
                    this.vertexNormals[this.verticesIndices[i + k] * 3 + 0] = vv[0];
                    this.vertexNormals[this.verticesIndices[i + k] * 3 + 1] = vv[1];
                    this.vertexNormals[this.verticesIndices[i + k] * 3 + 2] = vv[2];
                }
            }
        }
    }

    /**
     * Calculates tangents & bitangents with the help of uv-coordinates. Adapted from
     * Lengyel, Eric. “Computing Tangent Space Basis Vectors for an Arbitrary Mesh”.
     * Terathon Software 3D Graphics Library.
     * https://fenix.tecnico.ulisboa.pt/downloadFile/845043405449073/Tangent%20Space%20Calculation.pdf
     *
     * @function calcTangentsBitangents
     */
    calcTangentsBitangents()
    {
        if (!this.vertices.length)
        {
            // this._log.error("Cannot calculate tangents/bitangents without vertices.");
            return;
        }
        if (!this.vertexNormals.length)
        {
            // this._log.error("Cannot calculate tangents/bitangents without normals.");
            return;
        }
        if (!this.texCoords.length)
        {
            const texCoordLength = (this.vertices.length / 3) * 2;
            this.texCoords = new Float32Array(texCoordLength);
            for (let i = 0; i < texCoordLength; i += 1) this.texCoords[i] = 0;
        }
        if (!this.verticesIndices || !this.verticesIndices.length)
        {
            // this._log.error("Cannot calculate tangents/bitangents without vertex indices.");
            return;
        }
        // this code assumes that we have three indices per triangle
        if (this.verticesIndices.length % 3 !== 0)
        {
            this._log.error("Vertex indices mismatch!");
            return;
        }

        const triangleCount = this.verticesIndices.length / 3;
        const vertexCount = this.vertices.length / 3;

        this.tangents = new Float32Array(this.vertexNormals.length);
        this.biTangents = new Float32Array(this.vertexNormals.length);

        // temporary buffers
        const tempVertices = [];
        tempVertices.length = vertexCount * 2;
        const v1 = external_CABLES_GLMatrix_namespaceObject.vec3.create();
        const v2 = external_CABLES_GLMatrix_namespaceObject.vec3.create();
        const v3 = external_CABLES_GLMatrix_namespaceObject.vec3.create();

        const w1 = external_CABLES_GLMatrix_namespaceObject.vec2.create();
        const w2 = external_CABLES_GLMatrix_namespaceObject.vec2.create();
        const w3 = external_CABLES_GLMatrix_namespaceObject.vec2.create();

        const sdir = external_CABLES_GLMatrix_namespaceObject.vec3.create();
        const tdir = external_CABLES_GLMatrix_namespaceObject.vec3.create();

        // for details on calculation, see article referenced above
        for (let tri = 0; tri < triangleCount; tri += 1)
        {
            // indices of the three vertices for a triangle
            const i1 = this.verticesIndices[tri * 3];
            const i2 = this.verticesIndices[tri * 3 + 1];
            const i3 = this.verticesIndices[tri * 3 + 2];

            // vertex position as vec3
            external_CABLES_GLMatrix_namespaceObject.vec3.set(v1, this.vertices[i1 * 3], this.vertices[i1 * 3 + 1], this.vertices[i1 * 3 + 2]);
            external_CABLES_GLMatrix_namespaceObject.vec3.set(v2, this.vertices[i2 * 3], this.vertices[i2 * 3 + 1], this.vertices[i2 * 3 + 2]);
            external_CABLES_GLMatrix_namespaceObject.vec3.set(v3, this.vertices[i3 * 3], this.vertices[i3 * 3 + 1], this.vertices[i3 * 3 + 2]);

            // texture coordinate as vec2
            external_CABLES_GLMatrix_namespaceObject.vec2.set(w1, this.texCoords[i1 * 2], this.texCoords[i1 * 2 + 1]);
            external_CABLES_GLMatrix_namespaceObject.vec2.set(w2, this.texCoords[i2 * 2], this.texCoords[i2 * 2 + 1]);
            external_CABLES_GLMatrix_namespaceObject.vec2.set(w3, this.texCoords[i3 * 2], this.texCoords[i3 * 2 + 1]);

            const x1 = v2[0] - v1[0];
            const x2 = v3[0] - v1[0];
            const y1 = v2[1] - v1[1];
            const y2 = v3[1] - v1[1];
            const z1 = v2[2] - v1[2];
            const z2 = v3[2] - v1[2];

            const s1 = w2[0] - w1[0];
            const s2 = w3[0] - w1[0];
            const t1 = w2[1] - w1[1];
            const t2 = w3[1] - w1[1];

            const r = 1.0 / (s1 * t2 - s2 * t1);

            external_CABLES_GLMatrix_namespaceObject.vec3.set(sdir, (t2 * x1 - t1 * x2) * r, (t2 * y1 - t1 * y2) * r, (t2 * z1 - t1 * z2) * r);
            external_CABLES_GLMatrix_namespaceObject.vec3.set(tdir, (s1 * x2 - s2 * x1) * r, (s1 * y2 - s2 * y1) * r, (s1 * z2 - s2 * z1) * r);

            tempVertices[i1] = sdir;
            tempVertices[i2] = sdir;
            tempVertices[i3] = sdir;

            tempVertices[i1 + vertexCount] = tdir;
            tempVertices[i2 + vertexCount] = tdir;
            tempVertices[i3 + vertexCount] = tdir;
        }

        const normal = external_CABLES_GLMatrix_namespaceObject.vec3.create();
        const tempVert = external_CABLES_GLMatrix_namespaceObject.vec3.create();
        const tan = external_CABLES_GLMatrix_namespaceObject.vec3.create();
        const bitan = external_CABLES_GLMatrix_namespaceObject.vec3.create();
        const temp1 = external_CABLES_GLMatrix_namespaceObject.vec3.create();
        const temp2 = external_CABLES_GLMatrix_namespaceObject.vec3.create();
        const crossPd = external_CABLES_GLMatrix_namespaceObject.vec3.create();
        const normalized = external_CABLES_GLMatrix_namespaceObject.vec3.create();

        for (let vert = 0; vert < vertexCount; vert += 1)
        {
            // NOTE: some meshes don't have index 0 - n in their indexbuffer, if this is the case, skip calculation of this vertex
            if (!tempVertices[vert]) continue;

            external_CABLES_GLMatrix_namespaceObject.vec3.set(normal, this.vertexNormals[vert * 3], this.vertexNormals[vert * 3 + 1], this.vertexNormals[vert * 3 + 2]);
            external_CABLES_GLMatrix_namespaceObject.vec3.set(tempVert, tempVertices[vert][0], tempVertices[vert][1], tempVertices[vert][2]);

            // Gram-Schmidt orthagonalize
            const _dp = external_CABLES_GLMatrix_namespaceObject.vec3.dot(normal, tempVert);
            external_CABLES_GLMatrix_namespaceObject.vec3.scale(temp1, normal, _dp);
            external_CABLES_GLMatrix_namespaceObject.vec3.subtract(temp2, tempVert, temp1);

            external_CABLES_GLMatrix_namespaceObject.vec3.normalize(normalized, temp2);
            external_CABLES_GLMatrix_namespaceObject.vec3.cross(crossPd, normal, tempVert);

            // const intermDot = vec3.dot(crossPd, tempVertices[vert + vertexCount]);
            const w = 1.0;// intermDot < 0.0 ? -1.0 : 1.0;

            external_CABLES_GLMatrix_namespaceObject.vec3.scale(tan, normalized, 1 / w);
            external_CABLES_GLMatrix_namespaceObject.vec3.cross(bitan, normal, tan);

            this.tangents[vert * 3 + 0] = tan[0];
            this.tangents[vert * 3 + 1] = tan[1];
            this.tangents[vert * 3 + 2] = tan[2];
            this.biTangents[vert * 3 + 0] = bitan[0];
            this.biTangents[vert * 3 + 1] = bitan[1];
            this.biTangents[vert * 3 + 2] = bitan[2];
        }
    }

    isIndexed()
    {
        if (this._vertices.length == 0) return true;
        return this.verticesIndices.length != 0;
    }

    /**
     * @function unIndex
     * @memberof Geometry
     * @instance
     * @description remove all vertex indizes, vertices array will contain 3*XYZ for every triangle
     * @param {boolean} reIndex
     * @param {boolean} dontCalcNormals
     */
    unIndex(reIndex = false, dontCalcNormals = false)
    {
        const newVerts = [];
        const newIndizes = [];
        let count = 0;

        for (let j in this._attributes)
        {
            const attr = this._attributes[j];
            let na = [];

            for (let i = 0; i < this.verticesIndices.length; i += 3)
            {
                for (let s = 0; s < 3; s++)
                {
                    if (attr.itemSize == 3)
                        na.push(
                            attr.data[this.verticesIndices[i + s] * 3 + 0],
                            attr.data[this.verticesIndices[i + s] * 3 + 1],
                            attr.data[this.verticesIndices[i + s] * 3 + 2]);
                    else if (attr.itemSize == 4)
                        na.push(
                            attr.data[this.verticesIndices[i + s] * 4 + 0],
                            attr.data[this.verticesIndices[i + s] * 4 + 1],
                            attr.data[this.verticesIndices[i + s] * 4 + 2],
                            attr.data[this.verticesIndices[i + s] * 4 + 3]);
                    else if (attr.itemSize == 2)
                        na.push(
                            attr.data[this.verticesIndices[i + s] * 2 + 0],
                            attr.data[this.verticesIndices[i + s] * 2 + 1]);
                    else if (attr.itemSize == 1)
                        na.push(
                            attr.data[this.verticesIndices[i + s]]);
                    else this._log.warn("unknown attr", attr);
                }
            }
            this.setAttribute(attr.name, na, attr.itemSize);
        }

        for (let i = 0; i < this.verticesIndices.length; i += 3)
        {
            newVerts.push(
                this.vertices[this.verticesIndices[i + 0] * 3 + 0],
                this.vertices[this.verticesIndices[i + 0] * 3 + 1],
                this.vertices[this.verticesIndices[i + 0] * 3 + 2]);

            newIndizes.push(count);
            count++;

            newVerts.push(
                this.vertices[this.verticesIndices[i + 1] * 3 + 0],
                this.vertices[this.verticesIndices[i + 1] * 3 + 1],
                this.vertices[this.verticesIndices[i + 1] * 3 + 2]);

            newIndizes.push(count);
            count++;

            newVerts.push(
                this.vertices[this.verticesIndices[i + 2] * 3 + 0],
                this.vertices[this.verticesIndices[i + 2] * 3 + 1],
                this.vertices[this.verticesIndices[i + 2] * 3 + 2]);

            newIndizes.push(count);
            count++;
        }

        this.vertices = newVerts;

        this.verticesIndices = [];
        if (reIndex) this.verticesIndices = newIndizes;

        if (!dontCalcNormals) this.calculateNormals();
    }

    calcBarycentric()
    {
        let barycentrics = [];
        barycentrics.length = this.vertices.length;
        for (let i = 0; i < this.vertices.length; i++) barycentrics[i] = 0;

        let count = 0;
        for (let i = 0; i < this.vertices.length; i += 3)
        {
            barycentrics[i + count] = 1;
            count++;
            if (count == 3) count = 0;
        }

        this.setAttribute("attrBarycentric", barycentrics, 3);
    }

    getBounds()
    {
        return new BoundingBox(this);
    }

    /**
     * @param {boolean} x
     * @param {boolean} y
     * @param {boolean} z
     * @returns {Array} offset
     */
    center(x, y, z)
    {
        if (x === undefined)
        {
            x = true;
            y = true;
            z = true;
        }

        let i = 0;
        const bounds = this.getBounds();
        const offset = [bounds.minX + (bounds.maxX - bounds.minX) / 2, bounds.minY + (bounds.maxY - bounds.minY) / 2, bounds.minZ + (bounds.maxZ - bounds.minZ) / 2];

        for (i = 0; i < this.vertices.length; i += 3)
        {
            if (this.vertices[i + 0] == this.vertices[i + 0])
            {
                if (x) this.vertices[i + 0] -= offset[0];
                if (y) this.vertices[i + 1] -= offset[1];
                if (z) this.vertices[i + 2] -= offset[2];
            }
        }

        return offset;
    }

    mapTexCoords2d()
    {
        const bounds = this.getBounds();
        const num = this.vertices.length / 3;

        this.texCoords = new Float32Array(num * 2);

        for (let i = 0; i < num; i++)
        {
            const vertX = this.vertices[i * 3 + 0];
            const vertY = this.vertices[i * 3 + 1];
            this.texCoords[i * 2 + 0] = vertX / (bounds.maxX - bounds.minX) + 0.5;
            this.texCoords[i * 2 + 1] = 1.0 - vertY / (bounds.maxY - bounds.minY) + 0.5;
        }
    }

    getInfoOneLine()
    {
        let txt = "";
        if (this.faceVertCount == 3 && this.verticesIndices)txt += this.verticesIndices.length / 3;
        else txt += 0;

        txt += " tris ";

        if (this.vertices)txt += this.vertices.length / 3;
        else txt += 0;

        txt += " verts";

        return txt;
    }

    getInfo()
    {
        const info = {};

        info.name = this.name;
        info.class = this.constructor.name;

        if (this.faceVertCount == 3 && this.verticesIndices)info.numFaces = this.verticesIndices.length / 3;
        else info.numFaces = 0;

        if (this.verticesIndices && this.verticesIndices.length)info.indices = this.verticesIndices.length;

        if (this.vertices)info.numVerts = this.vertices.length / 3;
        else info.numVerts = 0;

        if (this.vertexNormals) info.numNormals = this.vertexNormals.length / 3;
        else info.numNormals = 0;

        if (this.texCoords) info.numTexCoords = this.texCoords.length / 2;
        else info.numTexCoords = 0;

        if (this.tangents) info.numTangents = this.tangents.length / 3;
        else info.numTangents = 0;

        if (this.biTangents) info.numBiTangents = this.biTangents.length / 3;
        else info.numBiTangents = 0;

        if (this.biTangents) info.numBiTangents = this.biTangents.length / 3;
        else info.numBiTangents = 0;

        if (this.vertexColors) info.numVertexColors = this.vertexColors.length / 4;
        else info.numVertexColors = 0;

        if (this.getAttributes()) info.numAttribs = Object.keys(this.getAttributes()).length;
        else info.numAttribs = 0;

        info.isIndexed = this.isIndexed();

        return info;
    }

    // -----------------
}

// TODO : rewritwe circle op 1
/** @deprecated */
Geometry.buildFromFaces = function (arr, name, optimize)
{
    const vertices = [];
    const verticesIndices = [];

    for (let i = 0; i < arr.length; i += 3)
    {
        const a = arr[i + 0];
        const b = arr[i + 1];
        const c = arr[i + 2];
        const face = [-1, -1, -1];

        if (optimize)
            for (let iv = 0; iv < vertices.length; iv += 3)
            {
                if (vertices[iv + 0] == a[0] && vertices[iv + 1] == a[1] && vertices[iv + 2] == a[2]) face[0] = iv / 3;
                if (vertices[iv + 0] == b[0] && vertices[iv + 1] == b[1] && vertices[iv + 2] == b[2]) face[1] = iv / 3;
                if (vertices[iv + 0] == c[0] && vertices[iv + 1] == c[1] && vertices[iv + 2] == c[2]) face[2] = iv / 3;
            }

        if (face[0] == -1)
        {
            vertices.push(a[0], a[1], a[2]);
            face[0] = (vertices.length - 1) / 3;
        }

        if (face[1] == -1)
        {
            vertices.push(b[0], b[1], b[2]);
            face[1] = (vertices.length - 1) / 3;
        }

        if (face[2] == -1)
        {
            vertices.push(c[0], c[1], c[2]);
            face[2] = (vertices.length - 1) / 3;
        }

        verticesIndices.push(face[0]);
        verticesIndices.push(face[1]);
        verticesIndices.push(face[2]);
    }

    const geom = new Geometry(name);
    geom.name = name;
    geom.vertices = vertices;
    geom.verticesIndices = verticesIndices;

    return geom;
};

;// CONCATENATED MODULE: ./src/corelibs/cgl/cgl_simplerect.js



const MESHES = {};

MESHES.getSimpleRect = function (cgl, name, size = 1.0)
{
    const geom = new Geometry(name);

    geom.vertices = [1.0 * size, 1.0 * size, 0.0, -1.0 * size, 1.0 * size, 0.0, 1.0 * size, -1.0 * size, 0.0, -1.0 * size, -1.0 * size, 0.0];
    geom.texCoords = [1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0];
    geom.verticesIndices = [0, 1, 2, 2, 1, 3];
    geom.vertexNormals = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

    return cgl.createMesh(geom);
};

MESHES.getSimpleCube = function (cgl, name)
{
    const geom = new Geometry(name);
    geom.vertices = [-1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1];
    geom.setTexCoords([0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0,]);
    geom.verticesIndices = [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23];
    geom.vertexNormals = new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0]);
    geom.tangents = new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
    geom.biTangents = new Float32Array([-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1]);

    return new Mesh(cgl, geom);
};



;// CONCATENATED MODULE: ./src/corelibs/cgl/cgl_textureeffect.js




class TextureEffect
{
    constructor(cgl, options)
    {
        this._cgl = cgl;
        this._log = new external_CABLES_SHARED_namespaceObject.Logger("cgl_TextureEffect");

        if (!cgl.TextureEffectMesh) this.createMesh();

        this._textureSource = null;
        this._options = options;
        this.name = options.name || "unknown";

        this.imgCompVer = 0;
        this.aspectRatio = 1;
        this._textureTarget = null; // new CGL.Texture(this._cgl,opts);
        this._frameBuf = this._cgl.gl.createFramebuffer();
        this._frameBuf2 = this._cgl.gl.createFramebuffer();
        this._renderbuffer = this._cgl.gl.createRenderbuffer();
        this._renderbuffer2 = this._cgl.gl.createRenderbuffer();
        this.switched = false;
        this.depth = false;
    }

    dispose()
    {
        if (this._renderbuffer) this._cgl.gl.deleteRenderbuffer(this._renderbuffer);
        if (this._frameBuf) this._cgl.gl.deleteFramebuffer(this._frameBuf);
        if (this._renderbuffer2) this._cgl.gl.deleteRenderbuffer(this._renderbuffer2);
        if (this._frameBuf2) this._cgl.gl.deleteFramebuffer(this._frameBuf2);
    }

    getWidth()
    {
        return this._textureSource.width;
    }

    getHeight()
    {
        return this._textureSource.height;
    }

    setSourceTexture(tex)
    {
        if (tex === null)
        {
            this._textureSource = new Texture(this._cgl);
            this._textureSource.setSize(16, 16);
        }
        else
        {
            this._textureSource = tex;
        }

        if (!this._textureSource.compareSettings(this._textureTarget))
        {
            if (this._textureTarget) this._textureTarget.delete();

            this._textureTarget = this._textureSource.clone();

            this._cgl.profileData.profileEffectBuffercreate++;

            this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, this._frameBuf);

            this._cgl.gl.bindRenderbuffer(this._cgl.gl.RENDERBUFFER, this._renderbuffer);

            // if(tex.textureType==CGL.Texture.TYPE_FLOAT) this._cgl.gl.renderbufferStorage(this._cgl.gl.RENDERBUFFER,this._cgl.gl.RGBA32F, this._textureSource.width,this._textureSource.height);
            // else this._cgl.gl.renderbufferStorage(this._cgl.gl.RENDERBUFFER,this._cgl.gl.RGBA8, this._textureSource.width,this._textureSource.height);

            if (this.depth) this._cgl.gl.renderbufferStorage(this._cgl.gl.RENDERBUFFER, this._cgl.gl.DEPTH_COMPONENT16, this._textureSource.width, this._textureSource.height);
            this._cgl.gl.framebufferTexture2D(this._cgl.gl.FRAMEBUFFER, this._cgl.gl.COLOR_ATTACHMENT0, this._cgl.gl.TEXTURE_2D, this._textureTarget.tex, 0);
            if (this.depth) this._cgl.gl.framebufferRenderbuffer(this._cgl.gl.FRAMEBUFFER, this._cgl.gl.DEPTH_ATTACHMENT, this._cgl.gl.RENDERBUFFER, this._renderbuffer);

            // this._cgl.gl.framebufferTexture2D(this._cgl.gl.FRAMEBUFFER, this._cgl.gl.COLOR_ATTACHMENT0, this._cgl.gl.TEXTURE_2D, this._textureTarget.tex, 0);

            this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, null);
            this._cgl.gl.bindRenderbuffer(this._cgl.gl.RENDERBUFFER, null);
            this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, null);

            this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, this._frameBuf2);

            this._cgl.gl.bindRenderbuffer(this._cgl.gl.RENDERBUFFER, this._renderbuffer2);

            // if(tex.textureType==CGL.Texture.TYPE_FLOAT) this._cgl.gl.renderbufferStorage(this._cgl.gl.RENDERBUFFER,this._cgl.gl.RGBA32F, this._textureSource.width,this._textureSource.height);
            // else this._cgl.gl.renderbufferStorage(this._cgl.gl.RENDERBUFFER,this._cgl.gl.RGBA8, this._textureSource.width,this._textureSource.height);

            if (this.depth) this._cgl.gl.renderbufferStorage(this._cgl.gl.RENDERBUFFER, this._cgl.gl.DEPTH_COMPONENT16, this._textureSource.width, this._textureSource.height);
            this._cgl.gl.framebufferTexture2D(this._cgl.gl.FRAMEBUFFER, this._cgl.gl.COLOR_ATTACHMENT0, this._cgl.gl.TEXTURE_2D, this._textureSource.tex, 0);

            if (this.depth) this._cgl.gl.framebufferRenderbuffer(this._cgl.gl.FRAMEBUFFER, this._cgl.gl.DEPTH_ATTACHMENT, this._cgl.gl.RENDERBUFFER, this._renderbuffer2);

            // this._cgl.gl.framebufferTexture2D(this._cgl.gl.FRAMEBUFFER, this._cgl.gl.COLOR_ATTACHMENT0, this._cgl.gl.TEXTURE_2D, this._textureSource.tex, 0);

            this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, null);
            this._cgl.gl.bindRenderbuffer(this._cgl.gl.RENDERBUFFER, null);
            this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, null);
        }

        this.aspectRatio = this._textureSource.width / this._textureSource.height;
    }

    continueEffect()
    {
        this._cgl.pushDepthTest(false);
        this._cgl.pushModelMatrix();
        this._cgl.pushPMatrix();
        // todo why two pushs?

        this._cgl.pushViewPort(0, 0, this.getCurrentTargetTexture().width, this.getCurrentTargetTexture().height);

        mat4.perspective(this._cgl.pMatrix, 45, this.getCurrentTargetTexture().width / this.getCurrentTargetTexture().height, 0.1, 1100.0); // todo: why?

        this._cgl.pushPMatrix();
        mat4.identity(this._cgl.pMatrix);

        this._cgl.pushViewMatrix();
        mat4.identity(this._cgl.vMatrix);

        this._cgl.pushModelMatrix();
        mat4.identity(this._cgl.mMatrix);
    }

    startEffect(bgTex)
    {
        if (!this._textureTarget)
        {
            this._log.warn("effect has no target");
            return;
        }

        this.switched = false;

        this.continueEffect();

        if (bgTex)
        {
            this._bgTex = bgTex;
        }
        this._countEffects = 0;
    }

    endEffect()
    {
        this._cgl.popDepthTest();
        this._cgl.popModelMatrix();

        this._cgl.popPMatrix();
        this._cgl.popModelMatrix();
        this._cgl.popViewMatrix();

        this._cgl.popPMatrix();
        this._cgl.popViewPort();
    }

    bind()
    {
        if (this._textureSource === null)
        {
            this._log.warn("no base texture set!");
            return;
        }

        if (!this.switched)
        {
            this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, this._frameBuf);
            this._cgl.pushGlFrameBuffer(this._frameBuf);
        }
        else
        {
            this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, this._frameBuf2);
            this._cgl.pushGlFrameBuffer(this._frameBuf2);
        }
    }

    finish()
    {
        if (this._textureSource === null)
        {
            this._log.warn("no base texture set!");
            return;
        }

        this._cgl.TextureEffectMesh.render(this._cgl.getShader());

        this._cgl.gl.bindFramebuffer(this._cgl.gl.FRAMEBUFFER, this._cgl.popGlFrameBuffer());

        this._cgl.profileData.profileTextureEffect++;

        if (this._textureTarget.filter == Texture.FILTER_MIPMAP)
        {
            if (!this.switched)
            {
                this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, this._textureTarget.tex);
                this._textureTarget.updateMipMap();
            }
            else
            {
                this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, this._textureSource.tex);
                this._textureSource.updateMipMap();
            }

            this._cgl.gl.bindTexture(this._cgl.gl.TEXTURE_2D, null);
        }

        this.switched = !this.switched;
        this._countEffects++;
    }

    getCurrentTargetTexture()
    {
        if (this.switched) return this._textureSource;
        return this._textureTarget;
    }

    getCurrentSourceTexture()
    {
        if (this._countEffects == 0 && this._bgTex) return this._bgTex;

        if (this.switched) return this._textureTarget;
        return this._textureSource;
    }

    delete()
    {
        if (this._textureTarget) this._textureTarget.delete();
        if (this._textureSource) this._textureSource.delete();
        this._cgl.gl.deleteRenderbuffer(this._renderbuffer);
        this._cgl.gl.deleteFramebuffer(this._frameBuf);
    }

    createMesh()
    {
        this._cgl.TextureEffectMesh = MESHES.getSimpleRect(this._cgl, "texEffectRect");
    }

    // ---------------------------------------------------------------------------------
}

TextureEffect.checkOpNotInTextureEffect = function (op)
{
    if (!op.patch.cgl) return true;
    if (op.uiAttribs.error && !op.patch.cgl.currentTextureEffect)
    {
        op.setUiError("textureeffect", null);
        return true;
    }
    if (!op.patch.cgl.currentTextureEffect) return true;

    if (op.patch.cgl.currentTextureEffect && !op.uiAttribs.error)
    {
        op.setUiError("textureeffect", "This op can not be a child of a ImageCompose/texture effect! imagecompose should only have textureeffect childs.", 0);
        return false;
    }

    if (op.patch.cgl.currentTextureEffect) return false;
    return true;
};

TextureEffect.checkOpInEffect = function (op, minver)
{
    minver = minver || 0;

    if (op.patch.cgl.currentTextureEffect)
    {
        if (op.uiAttribs.uierrors && op.patch.cgl.currentTextureEffect.imgCompVer >= minver)
        {
            op.setUiError("texeffect", null);
            return true;
        }

        if (minver && op.patch.cgl.currentTextureEffect.imgCompVer < minver)
        {
            op.setUiError("texeffect", "This op must be a child of an ImageCompose op with version >=" + minver + " <span class=\"button-small\" onclick=\"gui.patchView.downGradeOp('" + op.id + "','" + op.name + "')\">Downgrade</span> to previous version", 1);
        }
    }

    if (op.patch.cgl.currentTextureEffect) return true;

    if (!op.patch.cgl.currentTextureEffect && (!op.uiAttribs.uierrors || op.uiAttribs.uierrors.length == 0))
    {
        op.setUiError("texeffect", "This op must be a child of an ImageCompose op! More infos <a href=\"https://cables.gl/docs/image_composition/image_composition.html\" target=\"_blank\">here</a>. ", 1);
        return false;
    }

    if (!op.patch.cgl.currentTextureEffect) return false;
    return true;
};

TextureEffect.getBlendCode = function (ver)
{
    let src = "".endl()
        + "vec3 _blend(vec3 base,vec3 blend)".endl()
        + "{".endl()
        + "   vec3 colNew=blend;".endl()
        + "   #ifdef BM_MULTIPLY".endl()
        + "       colNew=base*blend;".endl()
        + "   #endif".endl()
        + "   #ifdef BM_MULTIPLY_INV".endl()
        + "       colNew=base* vec3(1.0)-blend;".endl()
        + "   #endif".endl()
        + "   #ifdef BM_AVERAGE".endl()
        + "       colNew=((base + blend) / 2.0);".endl()
        + "   #endif".endl()
        + "   #ifdef BM_ADD".endl()
        + "       colNew=min(base + blend, vec3(1.0));".endl()
        + "   #endif".endl()
        + "   #ifdef BM_SUBTRACT_ONE".endl()
        + "       colNew=max(base + blend - vec3(1.0), vec3(0.0));".endl()
        + "   #endif".endl()

        + "   #ifdef BM_SUBTRACT".endl()
        + "       colNew=base - blend;".endl()
        + "   #endif".endl()

        + "   #ifdef BM_DIFFERENCE".endl()
        + "       colNew=abs(base - blend);".endl()
        + "   #endif".endl()
        + "   #ifdef BM_NEGATION".endl()
        + "       colNew=(vec3(1.0) - abs(vec3(1.0) - base - blend));".endl()
        + "   #endif".endl()
        + "   #ifdef BM_EXCLUSION".endl()
        + "       colNew=(base + blend - 2.0 * base * blend);".endl()
        + "   #endif".endl()
        + "   #ifdef BM_LIGHTEN".endl()
        + "       colNew=max(blend, base);".endl()
        + "   #endif".endl()
        + "   #ifdef BM_DARKEN".endl()
        + "       colNew=min(blend, base);".endl()
        + "   #endif".endl()
        + "   #ifdef BM_OVERLAY".endl()
        + "      #define BlendOverlayf(base, blend)  (base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)))"
            // .endl()+'       #define BlendOverlay(base, blend)       Blend(base, blend, BlendOverlayf)'
            //    .endl()+'      colNew=Blend(base, blend, BlendOverlayf);'
            .endl()
        + "      colNew=vec3(BlendOverlayf(base.r, blend.r),BlendOverlayf(base.g, blend.g),BlendOverlayf(base.b, blend.b));".endl()
        + "   #endif".endl()
        + "   #ifdef BM_SCREEN".endl()
        + "      #define BlendScreenf(base, blend)       (1.0 - ((1.0 - base) * (1.0 - blend)))"
            // .endl()+'       #define BlendScreen(base, blend)        Blend(base, blend, BlendScreenf)'
            // .endl()+'      colNew=Blend(base, blend, BlendScreenf);'
            .endl()
        + "      colNew=vec3(BlendScreenf(base.r, blend.r),BlendScreenf(base.g, blend.g),BlendScreenf(base.b, blend.b));".endl()
        + "   #endif".endl()
        + "   #ifdef BM_SOFTLIGHT".endl()
        + "      #define BlendSoftLightf(base, blend)    ((blend < 0.5) ? (2.0 * base * blend + base * base * (1.0 - 2.0 * blend)) : (sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend)))"
            // .endl()+'       #define BlendSoftLight(base, blend)     Blend(base, blend, BlendSoftLightf)'
            //    .endl()+'      colNew=Blend(base, blend, BlendSoftLightf);'
            .endl()
        + "      colNew=vec3(BlendSoftLightf(base.r, blend.r),BlendSoftLightf(base.g, blend.g),BlendSoftLightf(base.b, blend.b));".endl()
        + "   #endif".endl()
        + "   #ifdef BM_HARDLIGHT".endl()
        + "      #define BlendOverlayf(base, blend)  (base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)))"
            // .endl()+'       #define BlendOverlay(base, blend)       Blend(base, blend, BlendOverlayf)'
            // .endl()+'      colNew=Blend(blend, base, BlendOverlayf);'
            .endl()
        + "      colNew=vec3(BlendOverlayf(base.r, blend.r),BlendOverlayf(base.g, blend.g),BlendOverlayf(base.b, blend.b));".endl()
        + "   #endif".endl()
        + "   #ifdef BM_COLORDODGE".endl()
        + "      #define BlendColorDodgef(base, blend)   ((blend == 1.0) ? blend : min(base / (1.0 - blend), 1.0))"
            // .endl()+'      colNew=Blend(base, blend, BlendColorDodgef);'
            .endl()
        + "      colNew=vec3(BlendColorDodgef(base.r, blend.r),BlendColorDodgef(base.g, blend.g),BlendColorDodgef(base.b, blend.b));".endl()
        + "   #endif".endl()
        + "   #ifdef BM_COLORBURN".endl()
        + "      #define BlendColorBurnf(base, blend)    ((blend == 0.0) ? blend : max((1.0 - ((1.0 - base) / blend)), 0.0))"
            // .endl()+'      colNew=Blend(base, blend, BlendColorBurnf);'
            .endl()
        + "      colNew=vec3(BlendColorBurnf(base.r, blend.r),BlendColorBurnf(base.g, blend.g),BlendColorBurnf(base.b, blend.b));".endl()
        + "   #endif".endl()

        + "   return colNew;".endl()
        + "}".endl();

    if (!ver)
        src += "vec4 cgl_blend(vec4 oldColor,vec4 newColor,float amount)".endl()
                + "{".endl()
                    + "vec4 col=vec4( _blend(oldColor.rgb,newColor.rgb) ,1.0);".endl()
                    + "col=vec4( mix( col.rgb, oldColor.rgb ,1.0-oldColor.a*amount),1.0);".endl()
                    + "return col;".endl()
                + "}".endl();

    if (ver >= 3)
        src += "vec4 cgl_blendPixel(vec4 base,vec4 col,float amount)".endl() +
                "{".endl() +

                "#ifdef BM_MATH_ADD".endl() +
                "   return vec4(base.rgb+col.rgb*amount,1.0);".endl() +
                "#endif".endl() +

                "#ifdef BM_MATH_SUB".endl() +
                "   return vec4(base.rgb-col.rgb*amount,1.0);".endl() +
                "#endif".endl() +

                "#ifdef BM_MATH_MUL".endl() +
                "   return vec4(base.rgb*col.rgb*amount,1.0);".endl() +
                "#endif".endl() +

                "#ifdef BM_MATH_DIV".endl() +
                "   return vec4(base.rgb/col.rgb*amount,1.0);".endl() +
                "#endif".endl() +

                    "#ifndef BM_MATH".endl() +
                        "vec3 colNew=_blend(base.rgb,col.rgb);".endl() +

                        "float newA=clamp(base.a+(col.a*amount),0.,1.);".endl() +

                        "#ifdef BM_ALPHAMASKED".endl() +
                            "newA=base.a;".endl() +
                        "#endif".endl() +

                        "return vec4(".endl() +
                            "mix(colNew,base.rgb,1.0-(amount*col.a)),".endl() +
                            "newA);".endl() +

                    "#endif".endl() +
    "}".endl();

    return src;
};

TextureEffect.onChangeBlendSelect = function (shader, blendName, maskAlpha = false)
{
    blendName = String(blendName);
    shader.toggleDefine("BM_NORMAL", blendName == "normal");
    shader.toggleDefine("BM_MULTIPLY", blendName == "multiply");
    shader.toggleDefine("BM_MULTIPLY_INV", blendName == "multiply invert");
    shader.toggleDefine("BM_AVERAGE", blendName == "average");
    shader.toggleDefine("BM_ADD", blendName == "add");
    shader.toggleDefine("BM_SUBTRACT_ONE", blendName == "subtract one");
    shader.toggleDefine("BM_SUBTRACT", blendName == "subtract");
    shader.toggleDefine("BM_DIFFERENCE", blendName == "difference");
    shader.toggleDefine("BM_NEGATION", blendName == "negation");
    shader.toggleDefine("BM_EXCLUSION", blendName == "exclusion");
    shader.toggleDefine("BM_LIGHTEN", blendName == "lighten");
    shader.toggleDefine("BM_DARKEN", blendName == "darken");
    shader.toggleDefine("BM_OVERLAY", blendName == "overlay");
    shader.toggleDefine("BM_SCREEN", blendName == "screen");
    shader.toggleDefine("BM_SOFTLIGHT", blendName == "softlight");
    shader.toggleDefine("BM_HARDLIGHT", blendName == "hardlight");
    shader.toggleDefine("BM_COLORDODGE", blendName == "color dodge");
    shader.toggleDefine("BM_COLORBURN", blendName == "color burn");

    shader.toggleDefine("BM_MATH_ADD", blendName == "Math Add");
    shader.toggleDefine("BM_MATH_SUB", blendName == "Math Subtract");
    shader.toggleDefine("BM_MATH_MUL", blendName == "Math Multiply");
    shader.toggleDefine("BM_MATH_DIV", blendName == "Math Divide");

    shader.toggleDefine("BM_MATH", blendName.indexOf("Math ") == 0);

    shader.toggleDefine("BM_ALPHAMASKED", maskAlpha);
};

TextureEffect.AddBlendSelect = function (op, name, defaultMode)
{
    const p = op.inValueSelect(name || "Blend Mode", [
        "normal", "lighten", "darken", "multiply", "multiply invert", "average", "add", "subtract", "difference", "negation", "exclusion", "overlay", "screen", "color dodge", "color burn", "softlight", "hardlight", "subtract one",
        "Math Add",
        "Math Subtract",
        "Math Multiply",
        "Math Divide",

    ], defaultMode || "normal");
    return p;
};

TextureEffect.AddBlendAlphaMask = function (op, name, defaultMode)
{
    const p = op.inSwitch(name || "Alpha Mask", ["Off", "On"], defaultMode || "Off");
    return p;
};

TextureEffect.setupBlending = function (op, shader, blendPort, amountPort, alphaMaskPort)
{
    const onChange = () =>
    {
        let maskAlpha = false;
        if (alphaMaskPort) maskAlpha = alphaMaskPort.get() == "On";
        TextureEffect.onChangeBlendSelect(shader, blendPort.get(), maskAlpha);

        let str = blendPort.get();
        if (str == "normal") str = null;
        else if (str == "multiply") str = "mul";
        else if (str == "multiply invert") str = "mulinv";
        else if (str == "lighten") str = "light";
        else if (str == "darken") str = "darken";
        else if (str == "average") str = "avg";
        else if (str == "subtract one") str = "sub one";
        else if (str == "subtract") str = "sub";
        else if (str == "difference") str = "diff";
        else if (str == "negation") str = "neg";
        else if (str == "exclusion") str = "exc";
        else if (str == "overlay") str = "ovl";
        else if (str == "color dodge") str = "dodge";
        else if (str == "color burn") str = "burn";
        else if (str == "softlight") str = "soft";
        else if (str == "hardlight") str = "hard";
        else if (str == "Math Add") str = "+";
        else if (str == "Math Subtract") str = "-";
        else if (str == "Math Multiply") str = "*";
        else if (str == "Math Divide") str = "/";

        op.setUiAttrib({ "extendTitle": str });
    };
    op.setPortGroup("Blending", [blendPort, amountPort, alphaMaskPort]);

    let maskAlpha = false;

    blendPort.onChange = onChange;
    if (alphaMaskPort)
    {
        alphaMaskPort.onChange = onChange;
        maskAlpha = alphaMaskPort.get() == "On";
    }

    TextureEffect.onChangeBlendSelect(shader, blendPort.get(), maskAlpha);
};

;// CONCATENATED MODULE: ./src/corelibs/cgl/cgl_shader_lib.js




/** @type {Object} */
const ShaderLibMods = {
    "CGL.BLENDMODES": function ()
    {
        this.name = "blendmodes";
        this.srcHeadFrag = TextureEffect.getBlendCode();
    },

    "CGL.BLENDMODES3": function ()
    {
        this.name = "blendmodes3";
        this.srcHeadFrag = TextureEffect.getBlendCode(3);
    },

    "CGL.LUMINANCE": function ()
    {
        this.name = "luminance";
        this.srcHeadFrag = "".endl()
            + "float cgl_luminance(vec3 c)".endl()
            + "{".endl()
            + "    return dot(vec3(0.2126,0.7152,0.0722),c);".endl()
            + "}".endl();
    },

    // quite good random numbers, but somehow don't work in ANGLE
    "CGL.RANDOM_OLD": function ()
    {
        this.name = "randomNumber";
        this.srcHeadFrag = "".endl()
            + "float cgl_random(vec2 co)".endl()
            + "{".endl()
            + "    return fract(sin(dot(co.xy ,vec2(12.9898,4.1414))) * 432758.5453);".endl()
            + "}".endl()
            + "vec3 cgl_random3(vec2 co)".endl()
            + "{".endl()
            + "    return vec3( cgl_random(co),cgl_random(co+0.5711),cgl_random(co+1.5711));".endl()
            + "}";
    },

    // low quality generative ranodm numbers
    "CGL.RANDOM_LOW": function ()
    {
        this.name = "randomNumber";
        this.srcHeadFrag = "".endl()
            + "float cgl_random(vec2 co)".endl()
            + "{".endl()
            + "    return fract(sin(dot(co.xy ,vec2(12.9898,4.1414))) * 358.5453);".endl()
            + "}".endl()
            + "vec3 cgl_random3(vec2 co)".endl()
            + "{".endl()
            + "    return vec3( cgl_random(co),cgl_random(co+0.5711),cgl_random(co+1.5711));".endl()
            + "}";
    },

    "CGL.RANDOM_TEX": function ()
    {
        this.name = "randomNumbertex";

        this.srcHeadFrag = "".endl()
            + "UNI sampler2D CGLRNDTEX;".endl()
            + "float cgl_random(vec2 co)".endl()
            + "{".endl()
            + "    return texture(CGLRNDTEX,co*5711.0).r;".endl()
            + "}".endl()
            + "vec3 cgl_random3(vec2 co)".endl()
            + "{".endl()
            + "    return texture(CGLRNDTEX,co*5711.0).rgb;".endl()
            + "}";

        this.initUniforms = function (shader)
        {
            return [new Uniform(shader, "t", "CGLRNDTEX", 7)];
        };

        this.onBind = function (cgl, shader)
        {
            Texture.getRandomTexture(cgl);
            cgl.setTexture(7, Texture.getRandomTexture(cgl).tex);
        };
    }

};

;// CONCATENATED MODULE: ./src/corelibs/cgl/cgl_unicolorshader.js


class UniColorShader
{
    constructor(_cgl)
    {
        this.shader = new CGL.Shader(_cgl, "markermaterial");

        const frag = ""
            .endl() + "void main()"
            .endl() + "{"
            .endl() + "    outColor = vec4(color.rgb,1.0);"
            .endl() + "}";

        const vert = ""
            .endl() + "IN vec3 vPosition;"
            .endl() + "UNI mat4 projMatrix;"
            .endl() + "UNI mat4 mvMatrix;"

            .endl() + "void main()"
            .endl() + "{"
            .endl() + "   gl_Position = projMatrix * mvMatrix * vec4(vPosition,1.0);"
            .endl() + "}";

        this.shader.setSource(vert, frag);
        this.coloruni = this.shader.addUniformFrag("4f", "color", [1, 0.777, 1, 1]);
    }

    setColor(r, g, b, a)
    {
        this.coloruni.set(r, g, b, a);
    }
}

;// CONCATENATED MODULE: ./src/corelibs/cg/cg_shader.js



/**
 * @typedef ShaderModule
 * @property {String} title
 * @property {String} name
 * @property {Number} id
 * @property {Number} numId
 * @property {String} group
 * @property {String} prefix
 * @property {Number} priority
 * @property {Number} num
 * @property {String} attributes
 * @property {String} srcBodyFrag
 * @property {String} srcBodyVert
 * @property {String} srcHeadFrag
 * @property {String} srcHeadVert
  */

class CgShader extends external_CABLES_SHARED_namespaceObject.Events
{
    id = external_CABLES_namespaceObject.utils.simpleId();
    _isValid = true;

    /** @type {Array<Array<String>>} */
    _defines = [];

    /** @type {Array<String>} */
    _moduleNames = [];

    _moduleNumId = 0;
    _needsRecompile = true;
    _compileReason = "initial";

    /** @type {Array<ShaderModule>} */
    _modules = [];

    _compileCount = 0;

    logError = true;
    num = -1;
    lastCompile = 0;

    constructor()
    {
        super();
    }

    /**
     * @param {string} reason
     */
    setWhyCompile(reason)
    {
        this._compileReason = reason;
        this._needsRecompile = true;
    }

    getWhyCompile()
    {
        return this._compileReason;
    }

    needsRecompile()
    {
        return this._needsRecompile;
    }

    /**
     * @param {string} name
     */
    removeUniform(name)
    {
        for (let i = 0; i < this._uniforms.length; i++)
        {
            if (this._uniforms[i].getName() == name)
            {
                this._uniforms.splice(i, 1);
            }
        }
        this.setWhyCompile("remove uniform " + name);
    }

    /**
     * @param {String} name
     * @param {number} stage
     */
    hasUniformInStage(name, stage)
    {

        let binding = this.defaultUniBindingFrag;
        if (stage == GPUShaderStage.VERTEX) binding = this.defaultUniBindingVert;
        if (stage == GPUShaderStage.COMPUTE) binding = this.defaultUniBindingCompute;

        for (let i = 0; i < this._uniforms.length; i++)
        {

            console.log("hasuniiiiiiiiiiiiiii", this._uniforms[i].getName(), name);
            if (this._uniforms[i].getName() == name) return true;
        }
        return false;
    }

    /**
     * @param {String} name
     */
    hasUniform(name)
    {
    }

    /**
     * easily enable/disable a define without a value
     * @param {String} name
     * @param {Port|boolean} enabled value or port
     */
    toggleDefine(name, enabled)
    {
        if (enabled && typeof (enabled) == "object" && enabled.addEventListener) // port
        {
            if (enabled.changeListener)enabled.off(enabled.changeListener);

            enabled.onToggleDefine = (v) =>
            {
                this.toggleDefine(name, v);
            };

            enabled.changeListener = enabled.on("change", enabled.onToggleDefine);
            enabled = enabled.get();
        }

        if (enabled) this.define(name);
        else this.removeDefine(name);
    }

    /**
     * add a define to a shader, e.g.  #define DO_THIS_THAT 1
     * @param {String} name
     * @param {any} value (can be empty)
     */
    define(name, value = "")
    {
        if (value === null || value === undefined) value = "";

        if (typeof (value) == "object") // port
        {
            value.removeEventListener("change", value.onDefineChange);
            value.onDefineChange = (v) =>
            {
                this.define(name, v);
            };
            value.on("change", value.onDefineChange);

            value = value.get();
        }

        for (let i = 0; i < this._defines.length; i++)
        {
            if (this._defines[i][0] == name && this._defines[i][1] == value) return;
            if (this._defines[i][0] == name)
            {
                this._defines[i][1] = value;
                this.setWhyCompile("define " + name + " " + value);
                return;
            }
        }
        this.setWhyCompile("define " + name + " " + value);

        this._defines.push([name, value]);
    }

    getDefines()
    {
        return this._defines;
    }

    /**
     * @param {string} name
     */
    getDefine(name)
    {
        for (let i = 0; i < this._defines.length; i++)
            if (this._defines[i][0] == name) return this._defines[i][1];
        return null;
    }

    /**
     * return true if shader has define
     * @function hasDefine
     * @memberof Shader
     * @instance
     * @param {String} name
     * @return {Boolean}
     */
    hasDefine(name)
    {
        for (let i = 0; i < this._defines.length; i++)
            if (this._defines[i][0] == name) return true;
    }

    /**
     * remove a define from a shader
     * @param {string} name
     */
    removeDefine(name)
    {
        for (let i = 0; i < this._defines.length; i++)
        {
            if (this._defines[i][0] == name)
            {
                this._defines.splice(i, 1);
                this.setWhyCompile("define removed:" + name);
                return;
            }
        }
    }

    /**
     * @param {any} modId
     */
    hasModule(modId)
    {
        for (let i = 0; i < this._modules.length; i++)
            if (this._modules[i].id == modId) return true;

        return false;
    }

    /**
     *
     * @param {Array<String>} names
     */
    setModules(names)
    {
        this._moduleNames = names;
    }

    /**
     * remove a module from shader
     * @param {ShaderModule} mod the module to be removed
     */
    removeModule(mod)
    {
        for (let i = 0; i < this._modules.length; i++)
        {
            if (mod && mod.id)
            {
                if (this._modules[i].id == mod.id || !this._modules[i])
                {
                    let found = true;
                    while (found)
                    {
                        found = false;
                        for (let j = 0; j < this._uniforms.length; j++)
                        {
                            if (this._uniforms[j].getName().startsWith(mod.prefix))
                            {
                                this._uniforms.splice(j, 1);
                                found = true;
                                continue;
                            }
                        }
                    }

                    this.setWhyCompile("remove module " + mod.title);
                    this._modules.splice(i, 1);
                    break;
                }
            }
        }
    }

    getNumModules()
    {
        return this._modules.length;
    }

    getCurrentModules() { return this._modules; }

    /**
     * add a module
     * @param {ShaderModule} mod the module to be added
     * @param {ShaderModule} [sibling] sibling module, new module will share the same group
     */
    addModule(mod, sibling)
    {
        if (this.hasModule(mod.id)) return;
        if (!mod.id) mod.id = external_CABLES_namespaceObject.utils.simpleId();
        if (!mod.numId) mod.numId = this._moduleNumId;
        if (!mod.num)mod.num = this._modules.length;
        if (sibling && !sibling.group) sibling.group = external_CABLES_namespaceObject.utils.simpleId();

        if (!mod.group)
            if (sibling) mod.group = sibling.group;
            else mod.group = external_CABLES_namespaceObject.utils.simpleId();

        mod.prefix = "mod" + mod.group + "_";
        this._modules.push(mod);

        this.setWhyCompile("add module " + mod.title);
        this._moduleNumId++;

        return mod;
    }

    isValid()
    {
        return this._isValid;
    }

}

;// CONCATENATED MODULE: ./src/corelibs/cgl/cgl_shader.js











// ---------------------------------------------------------------------------

/*

proposal default shader variable names:

attrVertex - currently: vPosition
attrVertexIndex - currently: attrVertIndex
attrTexCoord
attrInstMat - currently: instMat
attrVertColor
attrTangent
attrBiTangent

uProjMatrix - currently: projMatrix
uModelMatrix - currently: modelMatrix
uNormalMatrix - currently: normalMatrix
uCamPosition - currently: camPos

*/

// ---------------------------------------------------------------------------

// eslint-disable-next-line no-restricted-syntax
const defaultShaderSrcVert = `
{{MODULES_HEAD}}
IN vec3 vPosition; //!@
IN vec2 attrTexCoord;
IN vec3 attrVertNormal;
IN vec3 attrTangent,attrBiTangent;

IN float attrVertIndex;

OUT vec2 texCoord;
OUT vec3 norm;
UNI mat4 projMatrix;
UNI mat4 viewMatrix;
UNI mat4 modelMatrix;

void main()
{
    texCoord=attrTexCoord;
    norm=attrVertNormal;
    vec4 pos=vec4(vPosition,  1.0);
    vec3 tangent=attrTangent;
    vec3 bitangent=attrBiTangent;
    mat4 mMatrix=modelMatrix;
    gl_PointSize=10.0;

    {{MODULE_VERTEX_POSITION}}

    mat4 modelViewMatrix=viewMatrix*mMatrix;
    {{MODULE_VERTEX_MODELVIEW}}

    gl_Position = projMatrix * modelViewMatrix * pos;
}
`;
let materialIdCounter = 0;

function getDefaultVertexShader()
{
    return defaultShaderSrcVert;
}

/**
 * @param {number} [r]
 * @param {number} [g]
 * @param {number} [b]
 */
function getDefaultFragmentShader(r, g, b)
{
    if (r == undefined)
    {
        r = 0.5;
        g = 0.5;
        b = 0.5;
    }
    return ""
        + nl + "IN vec2 texCoord;"
        + nl + "{{MODULES_HEAD}}"
        + nl + "void main()"
        + nl + "{"

        + nl + "    vec4 col=vec4(" + r + "," + g + "," + b + ",1.0);"
        + nl + "    {{MODULE_COLOR}}"
        + nl + "    outColor = col;"
        + nl + "}";
}

/**
 * @class
 * @namespace external:CGL
 * @hideconstructor
 * @param _cgl
 * @param _name
 * @param _op
 * @example
 * var shader=new CGL.Shader(cgl,'MinimalMaterial');
 * shader.setSource(attachments.shader_vert,attachments.shader_frag);
 */
class CglShader extends CgShader
{

    /** @type {Uniform[]} */
    _uniforms = [];

    /**
     * @param {CglContext} _cgl
     * @param {string} _name
     * @param {Op} [_op]
     */
    constructor(_cgl, _name, _op)
    {
        super();
        if (!_cgl) throw new Error("shader constructed without cgl " + _name);

        this._log = new external_CABLES_SHARED_namespaceObject.Logger("cgl_shader");
        this._cgl = _cgl;

        if (!_name) this._log.stack("no shader name given");
        this._name = _name || "unknown";

        if (_op) this.opId = _op.id;
        this.glslVersion = 0;
        if (_cgl.glVersion > 1) this.glslVersion = 300;

        this._materialId = ++materialIdCounter;

        this._program = null;
        this._drawBuffers = [true];
        this.error = null;

        this.ignoreMissingUniforms = false;
        this._projMatrixUniform = null;
        this._mvMatrixUniform = null;
        this._mMatrixUniform = null;
        this._vMatrixUniform = null;
        this._camPosUniform = null;
        this._normalMatrixUniform = null;
        this._inverseViewMatrixUniform = null;
        this._fromUserInteraction = false;

        this._attrVertexPos = -1;
        this.precision = _cgl.patch.config.glslPrecision || "highp";

        this._pMatrixState = -1;
        this._vMatrixState = -1;

        this._countMissingUniforms = 0;
        this._modGroupCount = 0; // not needed anymore...
        this._feedBackNames = [];
        this._attributes = [];

        this.glPrimitive = null;
        this.offScreenPass = false;
        this._extensions = [];
        this.srcVert = getDefaultVertexShader();
        this.srcFrag = getDefaultFragmentShader();
        this.lastCompile = 0;

        this._libs = [];
        this._structNames = [];
        this._structUniformNames = [];
        this._textureStackUni = [];
        this._textureStackTex = [];
        this._textureStackType = [];
        this._textureStackTexCgl = [];

        this._tempNormalMatrix = external_CABLES_GLMatrix_namespaceObject.mat4.create();
        this._tempCamPosMatrix = external_CABLES_GLMatrix_namespaceObject.mat4.create();
        this._tempInverseViewMatrix = external_CABLES_GLMatrix_namespaceObject.mat4.create();
        this._tempInverseProjMatrix = external_CABLES_GLMatrix_namespaceObject.mat4.create();

        this.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_NORMAL", "MODULE_BEGIN_FRAG", "MODULE_VERTEX_MODELVIEW"]);
    }

    isValid()
    {
        return this._isValid;
    }

    getCgl()
    {
        return this._cgl;
    }

    getName()
    {
        return this._name;
    }

    /**
     * @param {string} name
     */
    enableExtension(name)
    {
        this.setWhyCompile("enable extension " + name);

        this._extensions.push(name);
    }

    getAttrVertexPos()
    {
        return this._attrVertexPos;
    }

    hasTextureUniforms()
    {
        for (let i = 0; i < this._uniforms.length; i++)
            if (this._uniforms[i].getType() == "t") return true;
        return false;
    }

    /**
     * copy all uniform values from another shader
     * @param {CglShader} origShader uniform values will be copied from this shader
     */
    copyUniformValues(origShader)
    {
        for (let i = 0; i < origShader._uniforms.length; i++)
        {
            if (!this._uniforms[i])
            {
                this._log.log("unknown uniform?!");
                continue;
            }

            this.getUniform(origShader._uniforms[i].getName()).set(origShader._uniforms[i].getValue());
        }

        this.popTextures();
        for (let i = 0; i < origShader._textureStackUni.length; i++)
        {
            this._textureStackUni[i] = origShader._textureStackUni[i];
            this._textureStackTex[i] = origShader._textureStackTex[i];
            this._textureStackType[i] = origShader._textureStackType[i];
            this._textureStackTexCgl[i] = origShader._textureStackTexCgl[i];
        }

    }

    /**
     * copy current shader
     * @returns {CglShader} newShader
     */
    copy()
    {
        const shader = new CglShader(this._cgl, this._name + " copy");
        shader.setSource(this.srcVert, this.srcFrag);

        shader._modules = JSON.parse(JSON.stringify(this._modules));
        shader._defines = JSON.parse(JSON.stringify(this._defines));

        shader._modGroupCount = this._modGroupCount;
        shader._moduleNames = this._moduleNames;
        shader.glPrimitive = this.glPrimitive;
        shader.offScreenPass = this.offScreenPass;
        shader._extensions = this._extensions;
        shader.wireframe = this.wireframe;
        shader._attributes = this._attributes;

        for (let i = 0; i < this._uniforms.length; i++)
        {
            const u = this._uniforms[i].copy(shader);
            u.resetLoc();
        }

        shader.setWhyCompile("copy");
        return shader;
    }

    /**
     * set shader source code
     * @param {String} srcVert
     * @param {String} srcFrag
     * @param {Boolean} fromUserInteraction
     */
    setSource(srcVert, srcFrag, fromUserInteraction = false)
    {
        this._fromUserInteraction = fromUserInteraction;
        this.srcVert = srcVert;
        this.srcFrag = srcFrag;
        this.setWhyCompile("Source changed");
        this._isValid = true;
    }

    _addLibs(src)
    {
        for (const id in ShaderLibMods)
        {
            if (src.includes(id))
            {
                const lib = new ShaderLibMods[id]();
                src = src.replace("{{" + id + "}}", lib.srcHeadFrag);
                this._libs.push(lib);
                if (lib.initUniforms)lib.initUniforms(this);
            }
        }

        return src;
    }

    createStructUniforms()
    {
        // * create structs
        let structStrFrag = "";
        let structStrVert = ""; // TODO: not used yet

        this._structNames = [];
        // * reset the arrays holding the value each recompile so we don't skip structs
        // * key value mapping so the same struct can be added twice (two times the same modifier)
        this._injectedStringsFrag = {};
        this._injectedStringsVert = {};

        this._structUniformNamesIndicesFrag = [];
        this._structUniformNamesIndicesVert = [];

        for (let i = 0; i < this._uniforms.length; i++)
        {
            // * only add uniforms to struct that are a member of a struct
            if (this._uniforms[i].isStructMember())
            {
                const injectionString = "{{INJECTION_POINT_STRUCT_" + this._uniforms[i]._structName + "}}";

                // * check if struct is not already part of shader
                if (!this._structNames.includes(this._uniforms[i]._structName))
                {
                    // * create struct definition with placeholder string to inject
                    const structDefinition = "struct "
                        + this._uniforms[i]._structName + " {" + nl
                        + injectionString
                        + "};" + nl + nl;

                    if (this._uniforms[i].getShaderType() === "both" || this._uniforms[i].getShaderType() === "frag")
                        structStrFrag = structStrFrag.concat(structDefinition);

                    if (this._uniforms[i].getShaderType() === "both" || this._uniforms[i].getShaderType() === "vert")
                        structStrVert = structStrVert.concat(structDefinition);

                    this._structNames.push(this._uniforms[i]._structName);
                    this._injectedStringsFrag[this._uniforms[i]._structName] = [];
                    this._injectedStringsVert[this._uniforms[i]._structName] = [];
                }

                // * create member & comment
                let comment = "";
                if (this._uniforms[i].comment) comment = " // " + this._uniforms[i].comment;

                let stringToInsert = "";
                if (this._uniforms[i].getGlslTypeString() == undefined)stringToInsert += "//";
                stringToInsert += "  " + this._uniforms[i].getGlslTypeString()
                        + " " + this._uniforms[i]._propertyName + ";"
                        + comment;

                if (this._uniforms[i].getShaderType() === "both")
                {
                    // * inject member before {injectionString}
                    if (
                        !this._injectedStringsFrag[this._uniforms[i]._structName].includes(stringToInsert)
                    && !this._injectedStringsVert[this._uniforms[i]._structName].includes(stringToInsert))
                    {
                        const insertionIndexFrag = structStrFrag.lastIndexOf(injectionString);
                        const insertionIndexVert = structStrVert.lastIndexOf(injectionString);

                        structStrFrag =
                            structStrFrag.slice(0, insertionIndexFrag)
                            + stringToInsert + structStrFrag.slice(insertionIndexFrag - 1);

                        structStrVert =
                            structStrVert.slice(0, insertionIndexVert)
                            + stringToInsert + structStrVert.slice(insertionIndexVert - 1);

                        this._injectedStringsFrag[this._uniforms[i]._structName].push(stringToInsert);
                        this._injectedStringsVert[this._uniforms[i]._structName].push(stringToInsert);
                    }

                    if (!this._structUniformNamesIndicesFrag.includes(i)) this._structUniformNamesIndicesFrag.push(i);
                    if (!this._structUniformNamesIndicesVert.includes(i)) this._structUniformNamesIndicesVert.push(i);
                }
                else if (this._uniforms[i].getShaderType() === "frag")
                {
                    // * inject member before {injectionString}
                    if (!this._injectedStringsFrag[this._uniforms[i]._structName].includes(stringToInsert)) //
                    {
                        const insertionIndexFrag = structStrFrag.lastIndexOf(injectionString);

                        structStrFrag =
                            structStrFrag.slice(0, insertionIndexFrag)
                            + stringToInsert + structStrFrag.slice(insertionIndexFrag - 1);

                        this._injectedStringsFrag[this._uniforms[i]._structName].push(stringToInsert);
                    }

                    if (!this._structUniformNamesIndicesFrag.includes(i)) this._structUniformNamesIndicesFrag.push(i);
                }
                else if (this._uniforms[i].getShaderType() === "vert")
                {
                    // * inject member before {injectionString}
                    if (!this._injectedStringsVert[this._uniforms[i]._structName].includes(stringToInsert))
                    {
                        const insertionIndexVert = structStrVert.lastIndexOf(injectionString);

                        structStrVert =
                            structStrVert.slice(0, insertionIndexVert)
                            + stringToInsert + structStrVert.slice(insertionIndexVert - 1);

                        this._injectedStringsVert[this._uniforms[i]._structName].push(stringToInsert);
                    }

                    if (!this._structUniformNamesIndicesVert.includes(i)) this._structUniformNamesIndicesVert.push(i);
                }
            }
        }

        // * dedupe injected uni declarations
        this._uniDeclarationsFrag = [];
        this._uniDeclarationsVert = [];

        // * remove struct injection points and add uniform in fragment
        for (let i = 0; i < this._structUniformNamesIndicesFrag.length; i += 1)
        {
            const index = this._structUniformNamesIndicesFrag[i];
            const uniDeclarationString = "UNI " + this._uniforms[index]._structName + " " + this._uniforms[index]._structUniformName + ";" + nl;

            if (!this._uniDeclarationsFrag.includes(uniDeclarationString))
            {
                const injectionString = "{{INJECTION_POINT_STRUCT_" + this._uniforms[index]._structName + "}}";

                structStrFrag = structStrFrag.replace(injectionString, "");
                structStrFrag += uniDeclarationString;

                this._uniDeclarationsFrag.push(uniDeclarationString);
            }
        }

        // * remove struct injection points and add uniform in vertex
        for (let i = 0; i < this._structUniformNamesIndicesVert.length; i += 1)
        {
            const index = this._structUniformNamesIndicesVert[i];
            const uniDeclarationString = "UNI " + this._uniforms[index]._structName + " " + this._uniforms[index]._structUniformName + ";" + nl;

            if (!this._uniDeclarationsVert.includes(uniDeclarationString))
            {
                const injectionString = "{{INJECTION_POINT_STRUCT_" + this._uniforms[index]._structName + "}}";

                structStrVert = structStrVert.replace(injectionString, "");
                structStrVert += uniDeclarationString;
                this._uniDeclarationsVert.push(uniDeclarationString);
            }
        }

        return [structStrVert, structStrFrag];
    }

    _getAttrSrc(attr, firstLevel)
    {
        const r = {};
        if (attr.name && attr.type)
        {
            r.srcHeadVert = "";
            if (!firstLevel) r.srcHeadVert += "#ifndef ATTRIB_" + attr.name + nl;
            r.srcHeadVert += "#define ATTRIB_" + attr.name + nl;
            r.srcHeadVert += "IN " + attr.type + " " + attr.name + ";" + nl;
            if (!firstLevel) r.srcHeadVert += "#endif" + nl;

            if (attr.nameFrag)
            {
                r.srcHeadVert += "";
                if (!firstLevel) r.srcHeadVert += "#ifndef ATTRIB_" + attr.nameFrag + nl;
                r.srcHeadVert += "#define ATTRIB_" + attr.nameFrag + nl;
                r.srcHeadVert += "OUT " + attr.type + " " + attr.nameFrag + ";" + nl;
                if (!firstLevel) r.srcHeadVert += "#endif" + nl;

                r.srcVert = "" + nl + attr.nameFrag + "=" + attr.name + ";";

                r.srcHeadFrag = "";
                if (!firstLevel) r.srcHeadFrag += "#ifndef ATTRIB_" + attr.nameFrag + nl;
                r.srcHeadFrag += "#define ATTRIB_" + attr.nameFrag + nl;
                r.srcHeadFrag += "IN " + attr.type + " " + attr.nameFrag + ";" + nl;
                if (!firstLevel) r.srcHeadFrag += "#endif" + nl;
            }
        }
        return r;
    }

    compile()
    {
        if (this._cgl.aborted) return;
        const startTime = performance.now();

        this._cgl.profileData.profileShaderCompiles++;
        this._cgl.profileData.profileShaderCompileName = this._name + " [" + this._compileReason + "]";

        let extensionString = "";
        if (this._extensions)
            for (let i = 0; i < this._extensions.length; i++)
                extensionString += "#extension " + this._extensions[i] + " : enable" + nl;

        let definesStr = "";
        if (this._defines.length) definesStr = "\n// cgl generated" + nl;
        for (let i = 0; i < this._defines.length; i++)
            definesStr += "#define " + this._defines[i][0] + " " + this._defines[i][1] + "" + nl;

        const structStrings = this.createStructUniforms();
        this._cgl.profileData.addHeavyEvent("shader compile", this._name + " [" + this._compileReason + "]");
        this._compileReason = "";

        if (this._uniforms)
        {
            // * we create an array of the uniform names to check our indices & an array to save them
            const uniNames = this._uniforms.map((uni) => { return uni._name; });
            const indicesToRemove = [];

            // * we go through our uniforms and check if the same name is contained somewhere further in the array
            // * if so, we add the current index to be removed later
            for (let i = 0; i < this._uniforms.length; i++)
            {
                const uni = this._uniforms[i];
                const nextIndex = uniNames.indexOf(uni._name, i + 1);
                if (nextIndex > -1) indicesToRemove.push(i);
            }

            // * after that, we go through the uniforms backwards (so we keep the order) and remove the indices
            // * also, we reset the locations of all the other valid uniforms
            for (let j = this._uniforms.length - 1; j >= 0; j -= 1)
            {
                if (indicesToRemove.includes(j)) this._uniforms.splice(j, 1);
                else this._uniforms[j].resetLoc();
            }
        }

        this._cgl.printError("uniform resets");

        this._compileCount++;
        if (this.hasTextureUniforms()) definesStr += "#define HAS_TEXTURES" + nl;

        let vs = "";
        let fs = "";

        if (!this.srcFrag)
        {
            this._log.warn("[cgl shader] has no fragment source!", this._name, this);
            this.srcVert = getDefaultVertexShader();
            this.srcFrag = getDefaultFragmentShader();
        }

        vs = "#version 300 es"
            + nl + "// "
            + nl + "// vertex shader " + this._name
            + nl + "// "
            + nl + "precision " + this.precision + " float;"
            + nl + "precision " + this.precision + " sampler2D;"
            + nl + ""
            + nl + "#define WEBGL2"
            + nl + "#define texture2D texture"
            + nl + "#define UNI uniform"
            + nl + "#define IN in"
            + nl + "#define OUT out"
            + nl;

        fs = "#version 300 es"
            + nl + "// "
            + nl + "// fragment shader " + this._name
            + nl + "// "
            + nl + "precision " + this.precision + " float;"
            + nl + "precision " + this.precision + " sampler2D;"
            + nl + ""
            + nl + "#define WEBGL2"
            + nl + "#define texture2D texture"
            + nl + "#define IN in"
            + nl + "#define OUT out"
            + nl + "#define UNI uniform"
            + nl + "{{DRAWBUFFER}}"

            + nl;

        let uniformsStrVert = "\n// cgl generated" + nl;
        let uniformsStrFrag = "\n// cgl generated" + nl;

        fs += "\n// active mods: --------------- ";
        vs += "\n// active mods: --------------- ";

        let foundModsFrag = false;
        let foundModsVert = false;
        for (let i = 0; i < this._moduleNames.length; i++)
        {
            for (let j = 0; j < this._modules.length; j++)
            {
                if (this._modules[j].name == this._moduleNames[i])
                {
                    if (this._modules[j].srcBodyFrag || this._modules[j].srcHeadFrag)
                    {
                        foundModsFrag = true;
                        fs += "\n// " + i + "." + j + ". " + this._modules[j].title + " (" + this._modules[j].name + ")";
                    }
                    if (this._modules[j].srcBodyVert || this._modules[j].srcHeadVert)
                    {
                        vs += "\n// " + i + "." + j + ". " + this._modules[j].title + " (" + this._modules[j].name + ")";
                        foundModsVert = true;
                    }
                }
            }
        }
        if (!foundModsVert)fs += "\n// no mods used...";
        if (!foundModsFrag)fs += "\n// no mods used...";
        fs += "\n";
        vs += "\n";

        for (let i = 0; i < this._uniforms.length; i++)
        {
            if (this._uniforms[i].shaderType && !this._uniforms[i].isStructMember())
            {
                let uniStr = "";
                if (!this._uniforms[i].getGlslTypeString())uniStr += "// ";
                uniStr += "UNI " + this._uniforms[i].getGlslTypeString() + " " + this._uniforms[i].getName();
                let comment = "";
                if (this._uniforms[i].comment) comment = " // " + this._uniforms[i].comment;

                if (this._uniforms[i].shaderType == "vert" || this._uniforms[i].shaderType == "both")
                    if (!this.srcVert.includes(uniStr) && !this.srcVert.includes("uniform " + this._uniforms[i].getGlslTypeString() + " " + this._uniforms[i].getName()))
                        uniformsStrVert += uniStr + ";" + comment + nl;

                if (this._uniforms[i].shaderType == "frag" || this._uniforms[i].shaderType == "both")
                    if (!this.srcFrag.includes(uniStr) && !this.srcFrag.includes("uniform " + this._uniforms[i].getGlslTypeString() + " " + this._uniforms[i].getName()))
                        uniformsStrFrag += uniStr + ";" + comment + nl;
            }
        }

        let countUniFrag = 0;
        let countUniVert = 0;
        for (let i = 0; i < this._uniforms.length; i++)
        {
            if (this._uniforms[i].shaderType && !this._uniforms[i].isStructMember())
            {
                if (this._uniforms[i].shaderType == "vert" || this._uniforms[i].shaderType == "both") countUniVert++;
                if (this._uniforms[i].shaderType == "frag" || this._uniforms[i].shaderType == "both") countUniFrag++;
            }
        }
        if (countUniFrag >= this._cgl.maxUniformsFrag) this._log.warn("[cgl_shader] num uniforms frag: " + countUniFrag + " / " + this._cgl.maxUniformsFrag);
        if (countUniVert >= this._cgl.maxUniformsVert) this._log.warn("[cgl_shader] num uniforms vert: " + countUniVert + " / " + this._cgl.maxUniformsVert);

        if (!fs.includes("precision")) fs = "precision " + this.precision + " float;" + nl + fs;
        if (!vs.includes("precision")) vs = "precision " + this.precision + " float;" + nl + vs;
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
        {
            fs += "#define MOBILE" + nl;
            vs += "#define MOBILE" + nl;
        }
        vs = extensionString + vs + definesStr + structStrings[0] + uniformsStrVert + "\n// -- \n" + this.srcVert;
        fs = extensionString + fs + definesStr + structStrings[1] + uniformsStrFrag + "\n// -- \n" + this.srcFrag;

        let srcHeadVert = "";
        let srcHeadFrag = "";

        this._modules.sort(function (a, b)
        {
            return a.priority || 0 - b.priority || 0;
        });

        let addedAttribs = false;

        for (let i = 0; i < this._moduleNames.length; i++)
        {
            let srcVert = "";
            let srcFrag = "";

            if (!addedAttribs)
            {
                addedAttribs = true;

                for (let k = 0; k < this._attributes.length; k++)
                {
                    const r = this._getAttrSrc(this._attributes[k], true);
                    if (r.srcHeadVert)srcHeadVert += r.srcHeadVert;
                    if (r.srcVert)srcVert += r.srcVert;
                    if (r.srcHeadFrag)srcHeadFrag += r.srcHeadFrag;
                }
            }

            for (let j = 0; j < this._modules.length; j++)
            {
                const mod = this._modules[j];
                if (mod.name == this._moduleNames[i])
                {
                    srcHeadVert += "\n//---- MOD: group:" + mod.group + ": idx:" + j + " - prfx:" + mod.prefix + " - " + mod.title + " ------\n";
                    srcHeadFrag += "\n//---- MOD: group:" + mod.group + ": idx:" + j + " - prfx:" + mod.prefix + " - " + mod.title + " ------\n";

                    srcVert += "\n\n//---- MOD: " + mod.title + " / " + mod.priority + " ------\n";
                    srcFrag += "\n\n//---- MOD: " + mod.title + " / " + mod.priority + " ------\n";

                    if (mod.attributes)
                        for (let k = 0; k < mod.attributes.length; k++)
                        {
                            const r = this._getAttrSrc(mod.attributes[k], false);
                            if (r.srcHeadVert)srcHeadVert += r.srcHeadVert;
                            if (r.srcVert)srcVert += r.srcVert;
                            if (r.srcHeadFrag)srcHeadFrag += r.srcHeadFrag;
                        }

                    srcHeadVert += mod.srcHeadVert || "";
                    srcHeadFrag += mod.srcHeadFrag || "";
                    srcVert += mod.srcBodyVert || "";
                    srcFrag += mod.srcBodyFrag || "";

                    srcHeadVert += "\n//---- end mod ------\n";
                    srcHeadFrag += "\n//---- end mod ------\n";

                    srcVert += "\n//---- end mod ------\n";
                    srcFrag += "\n//---- end mod ------\n";

                    srcVert = srcVert.replace(/{{mod}}/g, mod.prefix);
                    srcFrag = srcFrag.replace(/{{mod}}/g, mod.prefix);
                    srcHeadVert = srcHeadVert.replace(/{{mod}}/g, mod.prefix);
                    srcHeadFrag = srcHeadFrag.replace(/{{mod}}/g, mod.prefix);

                    srcVert = srcVert.replace(/MOD_/g, mod.prefix);
                    srcFrag = srcFrag.replace(/MOD_/g, mod.prefix);
                    srcHeadVert = srcHeadVert.replace(/MOD_/g, mod.prefix);
                    srcHeadFrag = srcHeadFrag.replace(/MOD_/g, mod.prefix);
                }
            }

            vs = vs.replace("{{" + this._moduleNames[i] + "}}", srcVert);
            fs = fs.replace("{{" + this._moduleNames[i] + "}}", srcFrag);
        }

        vs = vs.replace("{{MODULES_HEAD}}", srcHeadVert);
        fs = fs.replace("{{MODULES_HEAD}}", srcHeadFrag);

        vs = this._addLibs(vs);
        fs = this._addLibs(fs);

        // SETUP draw buffers / multi texture render targets

        let drawBufferStr = "";
        for (let i = 0; i < 16; i++)
            if (fs.includes("outColor" + i)) this._drawBuffers[i] = true;

        if (this._drawBuffers.length == 1)
        {
            drawBufferStr = "out vec4 outColor;" + nl;
            drawBufferStr += "#define gl_FragColor outColor" + nl;
        }
        else
        {
            drawBufferStr += "#define MULTI_COLORTARGETS" + nl;
            drawBufferStr += "vec4 outColor;" + nl;

            let count = 0;
            for (let i = 0; i < this._drawBuffers.length; i++)
            {
                if (count == 0) drawBufferStr += "#define gl_FragColor outColor" + i + "" + nl;
                drawBufferStr += "layout(location = " + i + ") out vec4 outColor" + i + ";" + nl;
                count++;
            }
        }

        fs = fs.replace("{{DRAWBUFFER}}", drawBufferStr);
        // //////

        if (!this._program)
        {
            this._program = this._createProgram(vs, fs);
        }
        else
        {
            // this.vshader=createShader(vs, gl.VERTEX_SHADER, this.vshader );
            // this.fshader=createShader(fs, gl.FRAGMENT_SHADER, this.fshader );
            // linkProgram(program);
            this._program = this._createProgram(vs, fs);

            this._projMatrixUniform = null;

            for (let i = 0; i < this._uniforms.length; i++) this._uniforms[i].resetLoc();
        }

        this.finalShaderFrag = fs;
        this.finalShaderVert = vs;

        MESH.lastMesh = null;
        MESH.lastShader = null;

        this._countMissingUniforms = 0;
        this._needsRecompile = false;
        this.lastCompile = (0,external_CABLES_namespaceObject.now)();

        this._cgl.profileData.shaderCompileTime += performance.now() - startTime;
    }

    bind()
    {
        if (!this._isValid || this._cgl.aborted) return;

        MESH.lastShader = this;

        if (!this._program || this.needsRecompile()) this.compile();
        if (!this._isValid) return;

        if (!this._projMatrixUniform && !this.ignoreMissingUniforms)
        {
            this._countMissingUniforms++;
            // if (this._countMissingUniforms == 10)this._log.log("stopping getlocation of missing uniforms...", this._name);
            if (this._countMissingUniforms < 10)
            {
                this._projMatrixUniform = this._cgl.gl.getUniformLocation(this._program, CONSTANTS.SHADER.SHADERVAR_UNI_PROJMAT);
                this._attrVertexPos = this._cgl.glGetAttribLocation(this._program, CONSTANTS.SHADER.SHADERVAR_VERTEX_POSITION);
                this._mvMatrixUniform = this._cgl.gl.getUniformLocation(this._program, "mvMatrix");
                this._vMatrixUniform = this._cgl.gl.getUniformLocation(this._program, CONSTANTS.SHADER.SHADERVAR_UNI_VIEWMAT);
                this._mMatrixUniform = this._cgl.gl.getUniformLocation(this._program, CONSTANTS.SHADER.SHADERVAR_UNI_MODELMAT);
                this._camPosUniform = this._cgl.gl.getUniformLocation(this._program, CONSTANTS.SHADER.SHADERVAR_UNI_VIEWPOS);
                this._normalMatrixUniform = this._cgl.gl.getUniformLocation(this._program, CONSTANTS.SHADER.SHADERVAR_UNI_NORMALMAT);
                this._inverseViewMatrixUniform = this._cgl.gl.getUniformLocation(this._program, CONSTANTS.SHADER.SHADERVAR_UNI_INVVIEWMAT);
                this._inverseProjMatrixUniform = this._cgl.gl.getUniformLocation(this._program, CONSTANTS.SHADER.SHADERVAR_UNI_INVPROJMAT);
                this._materialIdUniform = this._cgl.gl.getUniformLocation(this._program, CONSTANTS.SHADER.SHADERVAR_UNI_MATERIALID);
                this._objectIdUniform = this._cgl.gl.getUniformLocation(this._program, CONSTANTS.SHADER.SHADERVAR_UNI_OBJECTID);

                for (let i = 0; i < this._uniforms.length; i++) this._uniforms[i].needsUpdate = true;
            }
        }

        if (this._cgl.currentProgram != this._program)
        {
            this._cgl.profileData.profileShaderBinds++;
            this._cgl.gl.useProgram(this._program);
            this._cgl.currentProgram = this._program;
        }

        for (let i = 0; i < this._uniforms.length; i++)
            if (this._uniforms[i].needsUpdate) this._uniforms[i].updateValue();

        if (this._pMatrixState != this._cgl.getProjectionMatrixStateCount())
        {
            this._pMatrixState = this._cgl.getProjectionMatrixStateCount();
            this._cgl.gl.uniformMatrix4fv(this._projMatrixUniform, false, this._cgl.pMatrix);
            this._cgl.profileData.profileMVPMatrixCount++;
        }

        if (this._objectIdUniform)
            this._cgl.gl.uniform1f(this._objectIdUniform, ++this._cgl.tempData.objectIdCounter);

        if (this._materialIdUniform)
            this._cgl.gl.uniform1f(this._materialIdUniform, this._materialId);

        if (this._vMatrixUniform)
        {
            if (this._vMatrixState != this._cgl.getViewMatrixStateCount())
            {
                this._cgl.gl.uniformMatrix4fv(this._vMatrixUniform, false, this._cgl.vMatrix);
                this._cgl.profileData.profileMVPMatrixCount++;
                this._vMatrixState = this._cgl.getViewMatrixStateCount();

                if (this._inverseViewMatrixUniform)
                {
                    external_CABLES_GLMatrix_namespaceObject.mat4.invert(this._tempInverseViewMatrix, this._cgl.vMatrix);
                    this._cgl.gl.uniformMatrix4fv(this._inverseViewMatrixUniform, false, this._tempInverseViewMatrix);
                    this._cgl.profileData.profileMVPMatrixCount++;
                }
                if (this._inverseProjMatrixUniform)
                {
                    external_CABLES_GLMatrix_namespaceObject.mat4.invert(this._tempInverseProjMatrix, this._cgl.pMatrix);
                    this._cgl.gl.uniformMatrix4fv(this._inverseProjMatrixUniform, false, this._tempInverseProjMatrix);
                    this._cgl.profileData.profileMVPMatrixCount++;
                }
            }
            this._cgl.gl.uniformMatrix4fv(this._mMatrixUniform, false, this._cgl.mMatrix);
            this._cgl.profileData.profileMVPMatrixCount++;

            if (this._camPosUniform)
            {
                external_CABLES_GLMatrix_namespaceObject.mat4.invert(this._tempCamPosMatrix, this._cgl.vMatrix);
                this._cgl.gl.uniform3f(this._camPosUniform, this._tempCamPosMatrix[12], this._tempCamPosMatrix[13], this._tempCamPosMatrix[14]);
                this._cgl.profileData.profileMVPMatrixCount++;
            }
        }
        else
        {
            // mvmatrix deprecated....
            const tempmv = external_CABLES_GLMatrix_namespaceObject.mat4.create();

            external_CABLES_GLMatrix_namespaceObject.mat4.mul(tempmv, this._cgl.vMatrix, this._cgl.mMatrix);
            this._cgl.gl.uniformMatrix4fv(this._mvMatrixUniform, false, tempmv);
            this._cgl.profileData.profileMVPMatrixCount++;
        }

        if (this._normalMatrixUniform)
        {
            // mat4.mul(this._tempNormalMatrix, this._cgl.vMatrix, this._cgl.mMatrix);
            external_CABLES_GLMatrix_namespaceObject.mat4.invert(this._tempNormalMatrix, this._cgl.mMatrix);
            external_CABLES_GLMatrix_namespaceObject.mat4.transpose(this._tempNormalMatrix, this._tempNormalMatrix);

            this._cgl.gl.uniformMatrix4fv(this._normalMatrixUniform, false, this._tempNormalMatrix);
            this._cgl.profileData.profileMVPMatrixCount++;
        }

        for (let i = 0; i < this._libs.length; i++)
        {
            if (this._libs[i].onBind) this._libs[i].onBind.bind(this._libs[i])(this._cgl, this);
        }

        this._bindTextures();

        return this._isValid;
    }

    unBind()
    {
    }

    dispose()
    {

        if (this._program && this._cgl && this._cgl.gl) this._cgl.gl.deleteProgram(this._program);
        this._program = null;
    }

    setDrawBuffers(arr)
    {
        this._log.warn("useless drawbuffers...?!");
    }

    getUniforms()
    {
        return this._uniforms;
    }

    getUniform(name)
    {
        for (let i = 0; i < this._uniforms.length; i++)
            if (this._uniforms[i].getName() == name)
                return this._uniforms[i];
        return null;
    }

    removeAllUniforms()
    {
        this._uniforms = [];
        // for (let i = 0; i < this._uniforms.length; i++)
        //     this.removeUniform(this._uniforms[i].name);
    }

    _addUniform(uni)
    {
        this._uniforms.push(uni);
        this.setWhyCompile("add uniform " + name);
    }

    /**
     * add a uniform to the fragment shader
     * @param {String} type ['f','t', etc]
     * @param {String} name
     * @param {any} valueOrPort value or port
     * @param p2
     * @param p3
     * @param p4
     * @returns {Uniform}
     */
    addUniformFrag(type, name, valueOrPort, p2, p3, p4)
    {
        const uni = new Uniform(this, type, name, valueOrPort, p2, p3, p4);
        uni.shaderType = "frag";
        return uni;
    }

    /**
     * add a uniform to the vertex shader
     * @param {String} type ['f','t', etc]
     * @param {String} name
     * @param {any} valueOrPort value or port
     * @param p2
     * @param p3
     * @param p4
     * @returns {Uniform}
     */
    addUniformVert(type, name, valueOrPort, p2, p3, p4)
    {
        const uni = new Uniform(this, type, name, valueOrPort, p2, p3, p4);
        uni.shaderType = "vert";
        return uni;
    }

    /**
     * add a uniform to both shaders
     * @param {String} type ['f','t', etc]
     * @param {String} name
     * @param {any} valueOrPort value or port
     * @param p2
     * @param p3
     * @param p4
     * @returns {Uniform}
     */
    addUniformBoth(type, name, valueOrPort, p2, p3, p4)
    {
        const uni = new Uniform(this, type, name, valueOrPort, p2, p3, p4);
        uni.shaderType = "both";
        return uni;
    }

    /**
     * add a struct & its uniforms to the fragment shader
     * @param {String} structName name of the struct, i.e.: LightStruct
     * @param {String} uniformName name of the struct uniform in the shader, i.e.: lightUni
     * @param {Array} members array of objects containing the struct members. see example for structure

     * @returns {Object}
     * @example
     * const shader = new CGL.Shader(cgl, 'MinimalMaterial');
     * shader.setSource(attachments.shader_vert, attachments.shader_frag);
     * shader.addUniformStructFrag("Light", "uniformLight", [
     * { "type": "3f", "name": "position", "v1": null },
     * { "type": "4f", "name": "color", "v1": inR, v2: inG, v3: inB, v4: inAlpha }
     * ]);
     */
    addUniformStructFrag(structName, uniformName, members)
    {
        const uniforms = {};

        if (!members) return uniforms;

        for (let i = 0; i < members.length; i += 1)
        {
            const member = members[i];
            if (!this.hasUniform(uniformName + "." + member.name))
            {
                const uni = new Uniform(this, member.type, uniformName + "." + member.name, member.v1, member.v2, member.v3, member.v4, uniformName, structName, member.name);
                uni.shaderType = "frag";
                uniforms[uniformName + "." + member.name] = uni;
            }
        }

        return uniforms;
    }

    /**
     * add a struct & its uniforms to the vertex shader
     * @param {String} structName name of the struct, i.e.: LightStruct
     * @param {String} uniformName name of the struct uniform in the shader, i.e.: lightUni
     * @param {Array} members array of objects containing the struct members. see example for structure
     * @returns {object}
     * @example
     * const shader = new CGL.Shader(cgl, 'MinimalMaterial');
     * shader.setSource(attachments.shader_vert, attachments.shader_frag);
     * shader.addUniformStructVert("Light", "uniformLight", [
     * { "type": "3f", "name": "position", "v1": null },
     * { "type": "4f", "name": "color", "v1": inR, v2: inG, v3: inB, v4: inAlpha }
     * ]);
     */
    addUniformStructVert(structName, uniformName, members)
    {
        const uniforms = {};

        if (!members) return uniforms;

        for (let i = 0; i < members.length; i += 1)
        {
            const member = members[i];
            if (!this.hasUniform(uniformName + "." + member.name))
            {
                const uni = new Uniform(this, member.type, uniformName + "." + member.name, member.v1, member.v2, member.v3, member.v4, uniformName, structName, member.name);
                uni.shaderType = "vert";
                uniforms[uniformName + "." + member.name] = uni;
            }
        }

        return uniforms;
    }

    /**
     * add a struct & its uniforms to the both shaders. PLEASE NOTE: it is not possible to add the same struct to both shaders when it contains ANY integer members.
     * @param {String} structName name of the struct, i.e.: LightStruct
     * @param {String} uniformName name of the struct uniform in the shader, i.e.: lightUni
     * @param {Array} members array of objects containing the struct members. see example for structure

     * @returns {Object}
     * @example
     * const shader = new CGL.Shader(cgl, 'MinimalMaterial');
     * shader.setSource(attachments.shader_vert, attachments.shader_frag);
     * shader.addUniformStructBoth("Light", "uniformLight", [
     * { "type": "3f", "name": "position", "v1": null },
     * { "type": "4f", "name": "color", "v1": inR, v2: inG, v3: inB, v4: inAlpha }
     * ]);
     */
    addUniformStructBoth(structName, uniformName, members)
    {
        const uniforms = {};

        if (!members) return uniforms;

        for (let i = 0; i < members.length; i += 1)
        {
            const member = members[i];
            if ((member.type === "2i" || member.type === "i" || member.type === "3i"))
                this._log.error("Adding an integer struct member to both shaders can potentially error. Please use different structs for each shader. Error occured in struct:", structName, " with member:", member.name, " of type:", member.type, ".");
            if (!this.hasUniform(uniformName + "." + member.name))
            {
                const uni = new Uniform(this, member.type, uniformName + "." + member.name, member.v1, member.v2, member.v3, member.v4, uniformName, structName, member.name);
                uni.shaderType = "both";
                uniforms[uniformName + "." + member.name] = uni;
            }
        }

        return uniforms;
    }

    /**
     * @param {String} vstr
     * @param {String} fstr
     */
    _createProgram(vstr, fstr)
    {
        this._cgl.printError("before _createprogram");

        const program = this._cgl.gl.createProgram();

        this.vshader = CglShader.createShader(this._cgl, vstr, this._cgl.gl.VERTEX_SHADER, this);
        this.fshader = CglShader.createShader(this._cgl, fstr, this._cgl.gl.FRAGMENT_SHADER, this);

        if (this.vshader && this.fshader)
        {
            this._cgl.gl.attachShader(program, this.vshader);
            this._cgl.gl.attachShader(program, this.fshader);

            this._linkProgram(program, vstr, fstr);
        }
        else
        {
            this._isValid = false;
            this._cgl.printError("shader _createProgram");
            this._log.error("could not link shaderprogram");
            return null;
        }

        this._cgl.printError("shader _createProgram");
        return program;
    }

    hasErrors()
    {
        return this._hasErrors;
    }

    /**
     * @param {any} program
     * @param {string} vstr
     * @param {string} fstr
     */
    _linkProgram(program, vstr, fstr)
    {
        this._cgl.printError("before _linkprogram");

        if (this._feedBackNames.length > 0)
        {
            this._cgl.gl.transformFeedbackVaryings(program, this._feedBackNames, this._cgl.gl.SEPARATE_ATTRIBS);
            // INTERLEAVED_ATTRIBS
            // SEPARATE_ATTRIBS
        }

        this._cgl.gl.linkProgram(program);
        this._cgl.printError("gl.linkprogram");
        this._isValid = true;
        this._hasErrors = false;

        if (this._cgl.patch.config.glValidateShader !== false)
        {
            this._cgl.gl.validateProgram(program);

            if (!this._cgl.gl.getProgramParameter(program, this._cgl.gl.VALIDATE_STATUS))
            {
                // validation failed
                this._log.log("shaderprogram validation failed...");

                this._cgl.gl.getProgramInfoLog(program);
            }

            if (!this._cgl.gl.getProgramParameter(program, this._cgl.gl.LINK_STATUS))
            {
                this._hasErrors = true;

                const infoLogFrag = this._cgl.gl.getShaderInfoLog(this.fshader);
                const infoLogVert = this._cgl.gl.getShaderInfoLog(this.vshader);

                if (this.logError)
                    this._log.error(this._name + " shader linking fail...");
                else
                    this._log.warn(this._name + " shader linking fail...");

                if (infoLogFrag) this._log.warn(this._cgl.gl.getShaderInfoLog(this.fshader));
                if (infoLogVert) this._log.warn(this._cgl.gl.getShaderInfoLog(this.vshader));

                this._cgl.gl.getProgramInfoLog(program);
                if (!CABLES.UI) this._log.log(this);
                this._isValid = false;

                this._cgl.printError("shader link err");
            }
        }
    }

    getProgram()
    {
        return this._program;
    }

    /**
     * @param {any[]} names
     */
    setFeedbackNames(names)
    {
        this.setWhyCompile("setFeedbackNames");
        this._feedBackNames = names;
    }

    /**
      * adds attribute definition to shader header without colliding with other shader modules...
     * when attrFrag is defined, vertex shader will output this attribute to the fragment shader
     * @param {Object} attr {type:x,name:x,[nameFrag:x]}
     * @return {Object}
     */
    addAttribute(attr)
    {
        for (let i = 0; i < this._attributes.length; i++)
        {
            if (this._attributes[i].name == attr.name && this._attributes[i].nameFrag == attr.nameFrag) return;
        }
        this._attributes.push(attr);

        this.setWhyCompile("addAttribute");
    }

    bindTextures()
    {
        this._bindTextures();
    }

    _bindTextures()
    {
        if (this._textureStackTex.length > this._cgl.maxTextureUnits)
        {
            this._log.warn("[shader._bindTextures] too many textures bound", this._textureStackTex.length + "/" + this._cgl.maxTextureUnits);
        }

        // for (let i = this._textureStackTex.length + 1; i < this._cgl.maxTextureUnits; i++) this._cgl.setTexture(i, null);

        for (let i = 0; i < this._textureStackTex.length; i++)
        {
            // this._log.log(this._textureStackTex.length, i);
            if (!this._textureStackTex[i] && !this._textureStackTexCgl[i])
            {
                this._log.warn("no texture for pushtexture", this._name);
            }
            else
            {
                let t = this._textureStackTex[i];
                if (this._textureStackTexCgl[i])
                {
                    t = this._textureStackTexCgl[i].tex || CGL.Texture.getEmptyTexture(this._cgl).tex;
                }

                let bindOk = true;

                if (!this._textureStackUni[i])
                {
                    // throw(new Error('no uniform given to texturestack'));
                    this._log.warn("no uniform for pushtexture", this._name);
                    bindOk = this._cgl.setTexture(i, t, this._textureStackType[i]);
                }
                else
                {
                    this._textureStackUni[i].setValue(i);
                    bindOk = this._cgl.setTexture(i, t, this._textureStackType[i]);

                    // this._log.log(bindOk, i, t, this._textureStackType[i]);
                }
                if (!bindOk) this._log.warn("tex bind failed", this.getName(), this._textureStackUni[i]);
            }
        }
    }

    /**
     * @param {Uniform} uni
     * @param {Texture} tex
     */
    setUniformTexture(uni, tex)
    {
        tex = tex || Texture.getTempTexture(this._cgl);
        for (let i = 0; i < this._textureStackUni.length; i++)
            if (this._textureStackUni[i] == uni)
            {
                const old = this._textureStackTex[i] || this._textureStackTexCgl[i];
                if (tex.hasOwnProperty("tex"))
                {
                    this._textureStackTexCgl[i] = tex;
                    this._textureStackTex[i] = null;
                }
                else
                {
                    this._textureStackTexCgl[i] = null;
                    this._textureStackTex[i] = tex;
                }

                // this._textureStackTex[i] = tex;
                // this._cgl.setTexture(i, tex, this._textureStackType[i]);
                return old;
            }
        return null;
    }

    /**
     * push a texture on the stack. those textures will be bound when binding the shader. texture slots are automatically set
     * @param {Uniform} uniform texture uniform
     * @param {Texture} t texture
     * @param {number} type texture type, can be ignored when TEXTURE_2D
     */
    pushTexture(uniform, t, type)
    {
        if (!uniform)
        {
            // this._log.log("pushtexture: no uniform given to texturestack", "shader:"+this._name,uniform,t,type);
            return;
        }
        if (!t)
        {
            // if(uniform)this._log.warn("pushtexture: no tex","shader:"+this._name," uniform:"+uniform.name);
            return;
        }
        if (!t.hasOwnProperty("tex") && !(t instanceof WebGLTexture))
        {
            this._log.warn(new Error("invalid texture").stack);

            this._log.warn("[cgl_shader] invalid texture...", t);
            return;
        }

        this._textureStackUni.push(uniform);

        if (t.hasOwnProperty("tex"))
        {
            this._textureStackTexCgl.push(t);
            this._textureStackTex.push(null);
        }
        else
        {
            this._textureStackTexCgl.push(null);
            this._textureStackTex.push(t);
        }

        this._textureStackType.push(type);
    }

    /**
     * pop last texture
     */
    popTexture()
    {
        this._textureStackUni.pop();
        this._textureStackTex.pop();
        this._textureStackTexCgl.pop();
        this._textureStackType.pop();
    }

    /**
     * pop all textures
     */
    popTextures()
    {
        this._textureStackTex.length =
        this._textureStackTexCgl.length =
        this._textureStackType.length =
        this._textureStackUni.length = 0;
    }

    getMaterialId()
    {
        return this._materialId;
    }

    getInfo()
    {
        const info = {};
        info.name = this._name;
        // info.modules = JSON.parse(JSON.stringify(this._modules));
        // info.defines = JSON.parse(JSON.stringify(this._defines));
        info.defines = this.getDefines();
        info.hasErrors = this.hasErrors();

        return info;
    }

    getDefaultFragmentShader(r, g, b, a)
    {
        return getDefaultFragmentShader(r, g, b, a);
    }

    getDefaultVertexShader()
    {
        return getDefaultVertexShader();
    }
}

// --------------------------

CglShader.getDefaultVertexShader = getDefaultVertexShader;
CglShader.getDefaultFragmentShader = getDefaultFragmentShader;

CglShader.getErrorFragmentShader = function ()
{
    return ""
        + nl + "void main()"
        + nl + "{"
        + nl + "   float g=mod((gl_FragCoord.y+gl_FragCoord.x),50.0)/50.0;"
        + nl + "   g= step(0.1,g);"
        + nl + "   outColor = vec4( g+0.5, 0.0, 0.0, 1.0);"
        + nl + "}";
};

/**
 * @param {CglContext} cgl
 * @param {String} str
 * @param {number} type
 * @param {CglShader} cglShader
 * @returns {CglShader}
 */
CglShader.createShader = function (cgl, str, type, cglShader)
{
    if (cgl.aborted) return;

    const shader = cgl.gl.createShader(type);
    cgl.gl.shaderSource(shader, str);
    cgl.gl.compileShader(shader);

    if (!cgl.gl.getShaderParameter(shader, cgl.gl.COMPILE_STATUS))
    {
        cglShader.error = { "str": str, "infoLog": cgl.gl.getShaderInfoLog(shader) };

        if (CABLES.UI) gui.emitEvent("ShaderError", cglShader);

        if (!cglShader.error.infoLog)
        {
            cglShader._log.warn("empty shader info log", this._name);
            return;
        }
        cglShader.setSource(CglShader.getDefaultVertexShader(), CglShader.getErrorFragmentShader());
    }
    return shader;
};



;// CONCATENATED MODULE: ./src/corelibs/cgl/cgl_utils.js
/**
 * @namespace CGL
 */

/**
 * multiply to get radians from degree, e.g. `360 * CGL.DEG2RAD`
 * @const {Number}
 * @memberof CGL
 * @static
 */
const cgl_utils_DEG2RAD = Math.PI / 180.0;

/**
 * to get degrees from radians, e.g. `3.14 * CGL.RAD2DEG`
 * @const {number}
 * @memberof CGL
 */
const cgl_utils_RAD2DEG = 180.0 / Math.PI;

const onLoadingAssetsFinished = null; // deprecated / remove later

/**
 * get normalized mouse wheel delta (including browser specific adjustment)
 * @function getWheelDelta
 * @static
 * @memberof CGL
 * @param {MouseEvent} event
 * @return {Number} normalized delta
 */
const isWindows = window.navigator.userAgent.includes("Windows");
const getWheelDelta_ = function (event)
{
    let normalized;
    if (event.wheelDelta)
    {
        // chrome
        normalized = (event.wheelDelta % 120) - 0 == -0 ? event.wheelDelta / 120 : event.wheelDelta / 30;
        normalized *= -1.5;
        if (isWindows) normalized *= 2;
    }
    else
    {
        // firefox
        let d = event.deltaY;
        if (event.shiftKey) d = event.deltaX;
        const rawAmmount = d || event.detail;
        normalized = -(rawAmmount % 3 ? rawAmmount * 10 : rawAmmount / 3);
        normalized *= -3;
    }

    if (normalized > 20) normalized = 20;
    if (normalized < -20) normalized = -20;

    return normalized;
};

const getWheelSpeed = getWheelDelta_;
const getWheelDelta = getWheelDelta_;

;// CONCATENATED MODULE: ./src/corelibs/cgl/cgl_profiledata.js
class ProfileData
{
    constructor(cgl)
    {
        this._cgl = cgl;
        this._lastTime = 0;
        this.pause = false;
        this.profileUniformCount = 0;
        this.profileShaderBinds = 0;
        this.profileUniformCount = 0;
        this.profileShaderCompiles = 0;
        this.profileVideosPlaying = 0;
        this.profileMVPMatrixCount = 0;
        this.profileEffectBuffercreate = 0;
        this.profileShaderGetUniform = 0;
        this.profileFrameBuffercreate = 0;
        this.profileMeshSetGeom = 0;
        this.profileTextureNew = 0;
        this.profileGenMipMap = 0;
        this.profileOnAnimFrameOps = 0;

        this.profileFencedPixelRead = 0;
        this.profileMainloopMs = 0;
        this.profileMeshDraw = 0;
        this.profileTextureEffect = 0;
        this.profileTexPreviews = 0;
        this.shaderCompileTime = 0;
        this.profileMeshNumElements = 0;
        this.profileMeshAttributes = 0;
        this.profileSingleMeshAttribute = [];
        this.heavyEvents = [];

        this.doProfileGlQuery = false;
        this.glQueryData = {};
        this.counts = {};
    }

    clear()
    {
        this.counts = {};
        this.profileSingleMeshAttribute = {};
        this.profileMeshAttributes = 0;
        this.profileUniformCount = 0;
        this.profileShaderGetUniform = 0;
        this.profileShaderCompiles = 0;
        this.profileShaderBinds = 0;
        this.profileTextureResize = 0;
        this.profileFrameBuffercreate = 0;
        this.profileEffectBuffercreate = 0;
        this.profileTextureDelete = 0;
        this.profileMeshSetGeom = 0;
        this.profileVideosPlaying = 0;
        this.profileMVPMatrixCount = 0;
        this.profileNonTypedAttrib = 0;
        this.profileNonTypedAttribNames = "";
        this.profileTextureNew = 0;
        this.profileGenMipMap = 0;
        this.profileFramebuffer = 0;
        this.profileMeshDraw = 0;
        this.profileTextureEffect = 0;
        this.profileTexPreviews = 0;
        this.profileMeshNumElements = 0;
        this.profileFencedPixelRead = 0;
    }

    clearGlQuery()
    {
        for (let i in this.glQueryData)
        {
            if (!this.glQueryData[i].lastClear || performance.now() - this.glQueryData[i].lastClear > 1000)
            {
                this.glQueryData[i].time = this.glQueryData[i]._times / this.glQueryData[i]._numcount;
                this.glQueryData[i].num = this.glQueryData[i]._numcount;

                this.glQueryData[i]._times = 0;
                this.glQueryData[i]._numcount = 0;
                this.glQueryData[i].lastClear = performance.now();
            }
        }
    }

    /**
     * @param {string} event
     * @param {string} name
     */
    count(event, name)
    {
        this.counts[event] = this.counts[event] || [];
        this.counts[event].push(name);
    }

    /**
     * @param {string} event
     * @param {string} name
     * @param {string} [info]
     */
    addHeavyEvent(event, name, info)
    {
        const e = { "event": event, "name": name, "info": info, "date": performance.now() };
        this.heavyEvents.push(e);
        this._cgl.emitEvent("heavyEvent", e);
    }
}

;// CONCATENATED MODULE: ./src/corelibs/cg/cg_matrixstack.js


class MatrixStack
{
    constructor()
    {
        this._arr = [external_CABLES_GLMatrix_namespaceObject.mat4.create()];
        this._index = 0;
        this.stateCounter = 0;
    }

    /**
     * @param {mat4} m
     */
    push(m)
    {
        this._index++;
        this.stateCounter++;

        if (this._index == this._arr.length)
        {
            const copy = external_CABLES_GLMatrix_namespaceObject.mat4.create();
            this._arr.push(copy);
        }

        external_CABLES_GLMatrix_namespaceObject.mat4.copy(this._arr[this._index], m || this._arr[this._index - 1]);

        return this._arr[this._index];
    }

    pop()
    {
        this.stateCounter++;

        this._index--;
        if (this._index < 0) this._index = 0;

        return this._arr[this._index];
    }

    length()
    {
        return this._index;
    }
}

;// CONCATENATED MODULE: ./src/corelibs/cg/cg_canvas.js


class CgCanvas
{
    hasFocus = false;

    forceAspect = 0;
    pixelDensity = 1;
    _oldWidthRp = -1;
    _oldHeightRp = -1;

    /**
     * @param {{ canvasEle: any; cg: any; }} options
     */
    constructor(options)
    {
        this._log = new external_CABLES_SHARED_namespaceObject.Logger("CgCanvas");
        if (!options)
        {
            this._log.error("CgCanvas no options");
        }
        else
        {
            this._canvasEle = options.canvasEle;
        }

        if (!options.cg) this._log.error("CgCanvas options has no cg");
        // if (!options.canvasEle) this._log.error("CgCanvas options has no canvasEle");

        this._cg = options.cg;
        if (this.canvasEle)
        {
            this.canvasWidth = this.canvasEle.clientWidth;
            this.canvasHeight = this.canvasEle.clientHeight;

            this.setSize(this.canvasWidth, this.canvasHeight);
            this.canvasEle.addEventListener("focus", () => { this.hasFocus = true; });
            this.canvasEle.addEventListener("blur", () => { this.hasFocus = false; });
        }
    }

    /**
     * @returns {HTMLElement}
     */
    get canvasEle() { return this._canvasEle; }

    /**
     * @param {Number} w
     * @param {Number} h
     * @param {any} ignorestyle
     * @returns {any}
     */
    setSize(w, h, ignorestyle = false)
    {
        let offY = 0;
        if (this.forceAspect)
        {
            let nh = w / this.forceAspect;
            if (nh < h)offY = (h - nh) / 2;
            h = nh;
        }

        if (this._oldWidthRp != w * this.pixelDensity || this._oldHeightRp != h * this.pixelDensity)
        {
            this._oldWidthRp = this.canvasEle.width = w * this.pixelDensity;
            this._oldHeightRp = this.canvasEle.height = h * this.pixelDensity;

            if (!ignorestyle)
            {
                this.canvasEle.style.width = w + "px";
                this.canvasEle.style.height = h + "px";
                this.canvasEle.style.marginTop = offY + "px";
            }

            this.updateSize();

            this._cg.emitEvent("resize");
        }
    }

    updateSize()
    {
        this.canvasEle.width = this.canvasWidth = Math.ceil(this.canvasEle.clientWidth * this.pixelDensity);
        this.canvasEle.height = this.canvasHeight = Math.ceil(this.canvasEle.clientHeight * this.pixelDensity);
        // console.log("text", this.canvasEle.width, this.canvasEle.clientWidth, this.canvasEle.getBoundingClientRect().width);
    }

    dispose()
    {
        if (this._canvasEle) this._canvasEle.remove();
        this._canvasEle = null;
    }
}

;// CONCATENATED MODULE: ./src/corelibs/cg/cg_fpscounter.js



class FpsCounter extends external_CABLES_SHARED_namespaceObject.Events
{
    #timeStartFrame = 0;
    #timeStartSecond = 0;
    #fpsCounter = 0;
    #msCounter = 0;
    #frameCount = 0;
    logFps = false;

    constructor()
    {
        super();

        this.stats = { "ms": 0, "fps": 0 };
    }

    get frameCount()
    {
        return this.#frameCount;
    }

    startFrame()
    {
        this.#timeStartFrame = (0,external_CABLES_namespaceObject.now)();
    }

    endFrame()
    {
        this.#frameCount++;
        this.#fpsCounter++;

        const timeFrame = (0,external_CABLES_namespaceObject.now)() - this.#timeStartFrame;
        this.#msCounter += timeFrame;

        if ((0,external_CABLES_namespaceObject.now)() - this.#timeStartSecond > 1000) this.endSecond();
    }

    endSecond()
    {
        this.stats.fps = this.#fpsCounter;
        this.stats.ms = Math.round(this.#msCounter / this.#fpsCounter * 100) / 100;

        this.emitEvent("performance", this.stats);
        if (this.logFps)console.log(this.stats);

        // reset
        this.#fpsCounter = 0;
        this.#msCounter = 0;
        this.#timeStartSecond = (0,external_CABLES_namespaceObject.now)();
    }
}

;// CONCATENATED MODULE: ./src/corelibs/cg/cg_context.js








class CgContext extends external_CABLES_SHARED_namespaceObject.Events
{

    static API_UNKNOWN = 0;
    static API_WEBGL = 1;
    static API_WEBGPU = 2;

    static EVENT_RESIZE = "resize";

    gApi = 0;

    _textureslots = [];
    _pMatrixStack = new MatrixStack();
    _mMatrixStack = new MatrixStack();
    _vMatrixStack = new MatrixStack();
    canvasScale = 1; // this is not pixeldensity, this is only for command "scale canvas"

    /**
     * Description
     * @param {Patch} _patch
     */
    constructor(_patch)
    {
        super();

        this._log = new external_CABLES_SHARED_namespaceObject.Logger("cg_context", { "onError": _patch.config.onError });

        /** @type {object} */
        this.tempData = this.frameStore = this.frameStore || {};
        this.fpsCounter = new FpsCounter();
        this._identView = external_CABLES_GLMatrix_namespaceObject.vec3.create();
        this._ident = external_CABLES_GLMatrix_namespaceObject.vec3.create();
        external_CABLES_GLMatrix_namespaceObject.vec3.set(this._identView, 0, 0, -2);
        external_CABLES_GLMatrix_namespaceObject.vec3.set(this._ident, 0, 0, 0);
        this._onetimeCallbacks = [];
        this.maxTexSize = 2048;
        this._viewPort = [0, 0, 1, 1];
        this._viewPortStack = [];
        this.patch = _patch;
        this.autoReSize = true;

        this.DEPTH_COMPARE_FUNC_NEVER = 0;
        this.DEPTH_COMPARE_FUNC_LESS = 1;
        this.DEPTH_COMPARE_FUNC_EQUAL = 2;
        this.DEPTH_COMPARE_FUNC_LESSEQUAL = 3;
        this.DEPTH_COMPARE_FUNC_GREATER = 4;
        this.DEPTH_COMPARE_FUNC_NOTEQUAL = 5;
        this.DEPTH_COMPARE_FUNC_GREATEREQUAL = 6;
        this.DEPTH_COMPARE_FUNC_ALWAYS = 7;

        this.profileData = new ProfileData(this);

        /**
         * Current projection matrix
         * @memberof Context
         * @instance
         * @type {mat4}
         */
        this.pMatrix = external_CABLES_GLMatrix_namespaceObject.mat4.create();

        /**
         * Current model matrix
         * @memberof Context
         * @instance
         * @type {mat4}
         */
        this.mMatrix = external_CABLES_GLMatrix_namespaceObject.mat4.create();

        /**
         * Current view matrix
         * @memberof Context
         * @instance
         * @type {mat4}
         */
        this.vMatrix = external_CABLES_GLMatrix_namespaceObject.mat4.create();

        external_CABLES_GLMatrix_namespaceObject.mat4.identity(this.mMatrix);
        external_CABLES_GLMatrix_namespaceObject.mat4.identity(this.vMatrix);

        window.matchMedia("screen and (min-resolution: 2dppx)").addEventListener("change", () =>
        {
            this.emitEvent("resize");
        });

    }

    get canvasWidth()
    {
        return this.width;
    }

    get canvasHeight()
    {
        return this.height;
    }

    get width()
    {
        return this.cgCanvas.canvasWidth;
    }

    get height()
    {
        return this.cgCanvas.canvasHeight;
    }

    get widthCss()
    {
        return this.cgCanvas.canvasWidth / this.pixelDensity;
    }

    get heightCss()
    {
        return this.cgCanvas.canvasHeight / this.pixelDensity;
    }

    set pixelDensity(p)
    {
        if (this.cgCanvas.pixelDensity != p)
        {
            this.cgCanvas.pixelDensity = p;
            this.cgCanvas.updateSize();
            this.emitEvent("resize");
        }
    }

    get pixelDensity()
    {
        return this.cgCanvas.pixelDensity;
    }

    getGApiName()
    {
        return ["unknown", "WebGL", "WebGPU"][this.gApi];
    }

    get canvas()
    {
        return this.cgCanvas.canvasEle;
    }

    get viewPort()
    {
        // TODO: add stack...
        return [0, 0, this.canvasWidth, this.canvasHeight];
    }

    /**
     * @param {HTMLElement} canvEle
     */
    setCanvas(canvEle)
    {
        if (this.cgCanvas && canvEle == this.cgCanvas.canvasEle) return;
        if (typeof canvEle === "string") canvEle = document.getElementById(canvEle);

        this.cgCanvas = new CgCanvas({ "canvasEle": canvEle, "cg": this });
        if (!canvEle) return;

        canvEle.parentElement.classList.add("cablesContainer");
        if (this._setCanvas) this._setCanvas(canvEle);

        this.updateSize();
    }

    /**
     * @param {HTMLElement} _canvEle
     */
    _setCanvas(_canvEle)
    {
    }

    updateSize()
    {
        this.cgCanvas.updateSize();
    }

    /**
     * @param {number} w
     * @param {number} h
     * @param {boolean} ignorestyle
     */
    setSize(w, h, ignorestyle = false)
    {
        this.cgCanvas.setSize(w, h, ignorestyle);
    }

    _resizeToWindowSize()
    {
        if (this.autoReSize)
        {
            this.setSize(window.innerWidth, window.innerHeight);
            this.updateSize();
        }
    }

    _resizeToParentSize()
    {
        if (this.autoReSize)
        {
            const p = this.canvas.parentElement;
            if (!p)
            {
                this._log.error("cables: can not resize to container element");
                return;
            }

            this.setSize(p.clientWidth, p.clientHeight);
            this.updateSize();
        }
    }

    setAutoResize(parent)
    {
        window.removeEventListener("resize", this._resizeToWindowSize.bind(this));
        window.removeEventListener("resize", this._resizeToParentSize.bind(this));

        if (parent == "window")
        {
            window.addEventListener("resize", this._resizeToWindowSize.bind(this));
            window.addEventListener("orientationchange", this._resizeToWindowSize.bind(this));
            this._resizeToWindowSize();
        }
        if (parent == "parent")
        {
            window.addEventListener("resize", this._resizeToParentSize.bind(this));
            this._resizeToParentSize();
        }
    }

    /**
     * push a matrix to the projection matrix stack
     * @function pushPMatrix
     * @memberof Context
     * @instance
     */
    pushPMatrix()
    {
        this.pMatrix = this._pMatrixStack.push(this.pMatrix);
    }

    /**
      * pop projection matrix stack
      * @function popPMatrix
      * @memberof Context
      * @instance
      * @returns {mat4} current projectionmatrix
      */
    popPMatrix()
    {
        this.pMatrix = this._pMatrixStack.pop();
        return this.pMatrix;
    }

    getProjectionMatrixStateCount()
    {
        return this._pMatrixStack.stateCounter;
    }

    /**
      * push a matrix to the model matrix stack
      * @function pushModelMatrix
      * @memberof Context
      * @instance
      * @example
      * // see source code of translate op:
      * cgl.pushModelMatrix();
      * mat4.translate(cgl.mMatrix,cgl.mMatrix, vec);
      * trigger.trigger();
      * cgl.popModelMatrix();
      */
    pushModelMatrix()
    {
        this.mMatrix = this._mMatrixStack.push(this.mMatrix);
    }

    /**
      * pop model matrix stack
      * @function popModelMatrix
      * @memberof Context
      * @instance
      * @returns {mat4} current modelmatrix
      */
    popModelMatrix()
    {
        // todo: DEPRECATE
        // if (this._mMatrixStack.length === 0) throw "Invalid modelview popMatrix!";
        this.mMatrix = this._mMatrixStack.pop();
        return this.mMatrix;
    }

    /**
      * get model matrix
      * @function modelMatrix
      * @memberof Context
      * @instance
      * @returns {mat4} current modelmatrix
      */
    modelMatrix()
    {
        return this.mMatrix;
    }

    /**
     * push a matrix to the view matrix stack
     * @function pushviewMatrix
     * @memberof Context
     * @instance
     */
    pushViewMatrix()
    {
        this.vMatrix = this._vMatrixStack.push(this.vMatrix);
    }

    /**
      * pop view matrix stack
      * @function popViewMatrix
      * @memberof Context
      * @instance
      * @returns {mat4} current viewmatrix
      * @function
      */
    popViewMatrix()
    {
        this.vMatrix = this._vMatrixStack.pop();
    }

    getViewMatrixStateCount()
    {
        return this._vMatrixStack.stateCounter;
    }

    /**
     * @param {vec3} identTranslate
     * @param {vec3} identTranslateView
     */
    _startMatrixStacks(identTranslate, identTranslateView)
    {
        identTranslate = identTranslate || this._ident;
        identTranslateView = identTranslateView || this._identView;

        external_CABLES_GLMatrix_namespaceObject.mat4.perspective(this.pMatrix, 45, this.canvasWidth / this.canvasHeight, 0.1, 1000.0);

        external_CABLES_GLMatrix_namespaceObject.mat4.identity(this.mMatrix);
        external_CABLES_GLMatrix_namespaceObject.mat4.identity(this.vMatrix);
        external_CABLES_GLMatrix_namespaceObject.mat4.translate(this.mMatrix, this.mMatrix, identTranslate);
        external_CABLES_GLMatrix_namespaceObject.mat4.translate(this.vMatrix, this.vMatrix, identTranslateView);

        this.pushPMatrix();
        this.pushModelMatrix();
        this.pushViewMatrix();
    }

    _endMatrixStacks()
    {
        this.popViewMatrix();
        this.popModelMatrix();
        this.popPMatrix();
    }

    dispose()
    {
        this.aborted = true;
        if (this.cgCanvas) this.cgCanvas.dispose();
        if (this._dispose) this._dispose();
    }

    _dispose()
    {
    }

    /**
     * @param {any} _op
     */
    shouldDrawHelpers(_op)
    {
        return false;
    }

    /**
     * execute the callback next frame, once
     * @param {function} cb
     */
    addNextFrameOnceCallback(cb)
    {
        if (cb && this._onetimeCallbacks.indexOf(cb) == -1) this._onetimeCallbacks.push(cb);
    }

    _execOneTimeCallbacks()
    {
        if (this._onetimeCallbacks.length > 0)
        {
            for (let i = 0; i < this._onetimeCallbacks.length; i++) this._onetimeCallbacks[i]();
            this._onetimeCallbacks.length = 0;
        }
    }

    /**
     * @param {number} x
     */
    checkTextureSize(x)
    {
        x = x || 1;
        x = Math.floor(x);
        x = Math.min(x, this.maxTexSize);
        x = Math.max(x, 1);
        return x;
    }

    // should be overwritten...
    screenShot(cb, doScreenshotClearAlpha, mimeType, quality)
    {
        console.log("no screenshot function implemented");
    }

    /**
     * @param {string} [filename]
     * @param {function} [cb]
     * @param {number} [pw]
     * @param {number} [ph]
     * @param {boolean} [_noclearalpha]
     */
    saveScreenshot(filename, cb, pw, ph, _noclearalpha)
    {
        this.patch.renderOneFrame();

        let w = this.canvas.clientWidth * this.pixelDensity;
        let h = this.canvas.clientHeight * this.pixelDensity;

        if (pw)
        {
            this.canvas.width = pw;
            w = pw;
        }
        if (ph)
        {
            this.canvas.height = ph;
            h = ph;
        }

        function padLeft(nr, n, str)
        {
            return Array(n - String(nr).length + 1).join(str || "0") + nr;
        }

        const d = new Date();
        const dateStr = "".concat(String(d.getFullYear()) + String(d.getMonth() + 1) + String(d.getDate()), "_").concat(padLeft(d.getHours(), 2)).concat(padLeft(d.getMinutes(), 2)).concat(padLeft(d.getSeconds(), 2));

        if (!filename) filename = "cables_" + dateStr + ".png";
        else filename += ".png";

        this.screenShot((blob) =>
        {
            this.canvas.width = w;
            this.canvas.height = h;

            if (blob)
            {
                const anchor = document.createElement("a");

                anchor.download = filename;
                anchor.href = URL.createObjectURL(blob);

                console.log("scrrenshot");
                setTimeout(function ()
                {
                    anchor.click();
                    if (cb) cb(blob);
                }, 100);
            }
            else
            {
                this._log.log("screenshot: no blob");
            }
        });
    }

    hasFocus()
    {
        return this.cgCanvas.hasFocus;

    }

}

;// CONCATENATED MODULE: ./src/corelibs/cgl/cgl_state.js










const BLENDS = {
    "BLEND_NONE": 0,
    "BLEND_NORMAL": 1,
    "BLEND_ADD": 2,
    "BLEND_SUB": 3,
    "BLEND_MUL": 4,
};

/**
 * cables gl context/state manager
 * @class
 * @namespace external:CGL
 * @hideconstructor
 */
class CglContext extends CgContext
{
    #cursor = "auto";

    /**
     * @param {Patch} _patch
     */
    constructor(_patch)
    {
        super(_patch);

        this.gApi = CgContext.API_WEBGL;
        this.aborted = false;

        /** @deprecated */
        this.pushMvMatrix = this.pushModelMatrix; // deprecated and wrong... still used??
        /** @deprecated */
        this.popMvMatrix = this.popmMatrix = this.popModelMatrix;// deprecated and wrong... still used??

        this._log = new external_CABLES_SHARED_namespaceObject.Logger("cgl_context", { "onError": _patch.config.onError });

        this.glVersion = 0;
        this.glUseHalfFloatTex = false;
        this.clearCanvasTransparent = true;
        this.clearCanvasDepth = true;
        this.debugOneFrame = false;
        this.checkGlErrors = false; // true is slow // false should be default...
        this.maxTextureUnits = 0;
        this.maxVaryingVectors = 0;
        this.currentProgram = null;
        this._hadStackError = false;
        this.glSlowRendere = false;
        this._isSafariCrap = false;

        this.temporaryTexture = null;

        /** @type {WebGL2RenderingContext} */
        this.gl = null;

        this.#cursor = "auto";
        this._currentCursor = "";

        this._viewPortStack = [];
        this._glFrameBufferStack = [];
        this._frameBufferStack = [];
        this._shaderStack = [];
        this._stackDepthTest = [];
        this.mainloopOp = null;
        this._stackBlendMode = [];
        this._stackBlendModePremul = [];
        this._stackBlend = [];
        this._stackDepthFunc = [];
        this._stackCullFaceFacing = [];
        this._stackCullFace = [];
        this._stackDepthWrite = [];
        this._stackDepthTest = [];
        this._stackStencil = [];

        this._simpleShader = new CglShader(this, "simpleshader");
        this._simpleShader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG", "MODULE_VERTEX_MODELVIEW"]);
        this._simpleShader.setSource(CglShader.getDefaultVertexShader(), CglShader.getDefaultFragmentShader());

        this._currentShader = this._simpleShader;

        this._oldCanvasWidth = -1;
        this._oldCanvasHeight = -1;
        this._enabledExtensions = {};

        this.errorShader = null;
    }

    // set pixelDensity(p)
    // {
    //     this._pixelDensity = p;
    // }

    // get pixelDensity()
    // {
    //     return this._pixelDensity;
    // }

    get viewPort()
    {
        if (this._viewPortStack.length > 3)
        {
            const l = this._viewPortStack.length;

            return [
                this._viewPortStack[l - 4],
                this._viewPortStack[l - 3],
                this._viewPortStack[l - 2],
                this._viewPortStack[l - 1]
            ];
        }
        else
        {
            // workaround pre viewport stack times / or+and initial value...

            return this._viewPort;
        }
    }

    get mvMatrix() // deprecate
    {
        return this.mMatrix;
    }

    set mvMatrix(m) // deprecate
    {
        this.mMatrix = m;
    }

    /**
     * @param {HTMLCanvasElement} canv
     */
    _setCanvas(canv)
    {
        if (!canv) this._log.stack("_setCanvas undef");

        if (!this.patch.config.canvas) this.patch.config.canvas = {};
        if (!this.patch.config.canvas.hasOwnProperty("preserveDrawingBuffer")) this.patch.config.canvas.preserveDrawingBuffer = true;
        if (!this.patch.config.canvas.hasOwnProperty("premultipliedAlpha")) this.patch.config.canvas.premultipliedAlpha = false;
        if (!this.patch.config.canvas.hasOwnProperty("alpha")) this.patch.config.canvas.alpha = false;

        this.patch.config.canvas.stencil = true;

        if (this.patch.config.hasOwnProperty("clearCanvasColor")) this.clearCanvasTransparent = this.patch.config.clearCanvasColor;
        if (this.patch.config.hasOwnProperty("clearCanvasDepth")) this.clearCanvasDepth = this.patch.config.clearCanvasDepth;

        // safari stuff.......... ipad is not detectable,just do it for any safari
        if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent))// && ((navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i))))
        {
            this._isSafariCrap = true;
            this.glUseHalfFloatTex = true;
        }

        if (!this.patch.config.canvas.forceWebGl1) this.gl = canv.getContext("webgl2", this.patch.config.canvas);

        if (!this.gl || this.gl.isContextLost())
        {
            this.aborted = true;
            this._log.error("NO_WEBGL", "sorry, could not initialize WebGL. Please check if your Browser supports WebGL or try to restart your browser.");
            return;
        }

        if (this.gl.getParameter(this.gl.VERSION) != "WebGL 1.0")
        {
            this.glVersion = 2;
        }
        else
        {
            this.gl = canv.getContext("webgl", this.patch.config.canvas) || canv.getContext("experimental-webgl", this.patch.config.canvas);
            this.glVersion = 1;

            // safari
            // if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent) && (navigator.userAgent.match(/iPhone/i)))
            // {
            //     this.glUseHalfFloatTex = true;
            // }

            // ios
            // @ts-ignore
            if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream)
            {
                if (!this.patch.config.canvas.hasOwnProperty("powerPreference")) this.patch.config.canvas.powerPreference = "high-performance";
            }

            this.enableExtension("OES_standard_derivatives");
            // this.enableExtension("GL_OES_standard_derivatives");
            const instancingExt = this.enableExtension("ANGLE_instanced_arrays") || this.gl;
            if (instancingExt.vertexAttribDivisorANGLE)
            {
                this.gl.vertexAttribDivisor = instancingExt.vertexAttribDivisorANGLE.bind(instancingExt);
                this.gl.drawElementsInstanced = instancingExt.drawElementsInstancedANGLE.bind(instancingExt);
            }
        }

        const dbgRenderInfo = this.enableExtension("WEBGL_debug_renderer_info");
        if (dbgRenderInfo)
        {
            this.glRenderer = this.gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
            if (this.glRenderer === "Google SwiftShader") this.glSlowRenderer = true;
        }

        this.canvas.addEventListener("webglcontextlost", (event) =>
        {
            if (this.aborted) return this._log.warn("[cgl_state] aborted context lost... can be ignored...");
            this._log.error("canvas lost...", event);
            this.emitEvent("webglcontextlost");
            this.aborted = true;
        });

        this.maxAnisotropic = 0;
        if (this.enableExtension("EXT_texture_filter_anisotropic"))
            this.maxAnisotropic = this.gl.getParameter(this.enableExtension("EXT_texture_filter_anisotropic").MAX_TEXTURE_MAX_ANISOTROPY_EXT);

        this.maxVaryingVectors = this.gl.getParameter(this.gl.MAX_VARYING_VECTORS);
        this.maxTextureUnits = this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
        this.maxTexSize = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
        this.maxUniformsFrag = this.gl.getParameter(this.gl.MAX_FRAGMENT_UNIFORM_VECTORS);
        this.maxUniformsVert = this.gl.getParameter(this.gl.MAX_VERTEX_UNIFORM_VECTORS);
        this.maxSamples = 0;
        if (this.gl.MAX_SAMPLES) this.maxSamples = this.gl.getParameter(this.gl.MAX_SAMPLES);

        if (this.glVersion == 1)
        {
            this.enableExtension("OES_standard_derivatives");
            const instancingExt = this.enableExtension("ANGLE_instanced_arrays") || this.gl;

            if (instancingExt.vertexAttribDivisorANGLE)
            {
                this.gl.vertexAttribDivisor = instancingExt.vertexAttribDivisorANGLE.bind(instancingExt);
                this.gl.drawElementsInstanced = instancingExt.drawElementsInstancedANGLE.bind(instancingExt);
            }
        }

        this.DEPTH_FUNCS = [
            this.gl.NEVER,
            this.gl.ALWAYS,
            this.gl.LESS,
            this.gl.LEQUAL,
            this.gl.GREATER,
            this.gl.GEQUAL,
            this.gl.EQUAL,
            this.gl.NOTEQUAL
        ];
        this.CULL_MODES = [
            null,
            this.gl.BACK,
            this.gl.FRONT,
            this.gl.FRONT_AND_BACK
        ];
    }

    getInfo()
    {
        return {
            "glVersion": this.glVersion,
            "glRenderer": this.glRenderer,
            "glUseHalfFloatTex": this.glUseHalfFloatTex,
            "maxVaryingVectors": this.maxVaryingVectors,
            "maxTextureUnits": this.maxTextureUnits,
            "maxTexSize": this.maxTexSize,
            "maxUniformsFrag": this.maxUniformsFrag,
            "maxUniformsVert": this.maxUniformsVert,
            "maxSamples": this.maxSamples
        };
    }

    /**
     * @function popViewPort
     * @memberof Context
     * @instance
     * @description pop viewPort stack
     */
    popViewPort()
    {
        this._viewPortStack.pop();
        this._viewPortStack.pop();
        this._viewPortStack.pop();
        this._viewPortStack.pop();

        if (this._viewPortStack.length == 0)
            this.setViewPort(0, 0, this.canvasWidth, this.canvasHeight);
        else
            this.setViewPort(this._viewPortStack[this._viewPort.length - 4], this._viewPortStack[this._viewPort.length - 3], this._viewPortStack[this._viewPort.length - 2], this._viewPortStack[this._viewPort.length - 1]);
    }

    /**
     * @function pushViewPort
     * @memberof Context
     * @instance
     * @description push a new viewport onto stack
     * @param {Number} x
     * @param {Number} y
     * @param {Number} w
     * @param {Number} h
     */

    pushViewPort(x, y, w, h)
    {
        this._viewPortStack.push(x, y, w, h);
        this.setViewPort(x, y, w, h);
    }

    // old
    getViewPort()
    {
        return this._viewPort;
    }

    // old
    resetViewPort()
    {
        this.gl.viewport(this._viewPort[0], this._viewPort[1], this._viewPort[2], this._viewPort[3]);
    }

    // old
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     */
    setViewPort(x, y, w, h)
    {
        this._viewPort[0] = Math.round(x);
        this._viewPort[1] = Math.round(y);
        this._viewPort[2] = Math.round(w);
        this._viewPort[3] = Math.round(h);
        this.gl.viewport(this._viewPort[0], this._viewPort[1], this._viewPort[2], this._viewPort[3]);
    }

    /**
     * @param {function} cb
     * @param {boolean} doScreenshotClearAlpha
     * @param {string} mimeType
     * @param {number} quality
     */
    screenShot(cb, doScreenshotClearAlpha, mimeType, quality)
    {
        if (doScreenshotClearAlpha)
        {
            this.gl.clearColor(1, 1, 1, 1);
            this.gl.colorMask(false, false, false, true);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            this.gl.colorMask(true, true, true, true);
        }

        if (this.canvas && this.canvas.toBlob)
        {
            this.canvas.toBlob(
                (blob) =>
                {
                    if (cb) cb(blob);
                    else this._log.log("no screenshot callback...");
                }, mimeType, quality);
        }
    }

    endFrame()
    {
        if (this.patch.isEditorMode()) CABLES.GL_MARKER.drawMarkerLayer(this);

        this.setPreviousShader();

        if (this._vMatrixStack.length() > 0) this.logStackError("view matrix stack length !=0 at end of rendering...");
        if (this._mMatrixStack.length() > 0) this.logStackError("mvmatrix stack length !=0 at end of rendering...");
        if (this._pMatrixStack.length() > 0) this.logStackError("pmatrix stack length !=0 at end of rendering...");
        if (this._glFrameBufferStack.length > 0) this.logStackError("glFrameBuffer stack length !=0 at end of rendering...");
        if (this._stackDepthTest.length > 0) this.logStackError("depthtest stack length !=0 at end of rendering...");
        if (this._stackDepthWrite.length > 0) this.logStackError("depthwrite stack length !=0 at end of rendering...");
        if (this._stackDepthFunc.length > 0) this.logStackError("depthfunc stack length !=0 at end of rendering...");
        if (this._stackBlend.length > 0) this.logStackError("blend stack length !=0 at end of rendering...");
        if (this._stackBlendMode.length > 0) this.logStackError("blendMode stack length !=0 at end of rendering...");
        if (this._shaderStack.length > 0) this.logStackError("this._shaderStack length !=0 at end of rendering...");
        if (this._stackCullFace.length > 0) this.logStackError("this._stackCullFace length !=0 at end of rendering...");
        if (this._stackCullFaceFacing.length > 0) this.logStackError("this._stackCullFaceFacing length !=0 at end of rendering...");
        if (this._viewPortStack.length > 0) this.logStackError("viewport stack length !=0 at end of rendering...");

        this._frameStarted = false;

        if (this._oldCanvasWidth != this.canvasWidth || this._oldCanvasHeight != this.canvasHeight)
        {
            this._oldCanvasWidth = this.canvasWidth;
            this._oldCanvasHeight = this.canvasHeight;
            this.emitEvent(CgContext.EVENT_RESIZE);
        }

        if (this.#cursor != this._currentCursor)
        {
            this._currentCursor = this.canvas.style.cursor = this.#cursor;
        }

        this.emitEvent("endframe");

        this.fpsCounter.endFrame();
    }

    logStackError(str)
    {
        if (!this._hadStackError)
        {
            this._hadStackError = true;
            this._log.warn("[" + this.canvas.id + "]: ", str);
        }
    }

    // shader stack
    getShader()
    {
        if (this._currentShader) if (!this.tempData || ((this.tempData.renderOffscreen === true) == this._currentShader.offScreenPass) === true) return this._currentShader;

        for (let i = this._shaderStack.length - 1; i >= 0; i--) if (this._shaderStack[i]) if (this.tempData.renderOffscreen == this._shaderStack[i].offScreenPass) return this._shaderStack[i];
    }

    getDefaultShader()
    {
        return this._simpleShader;
    }

    /**
     * @deprecated
     * @param {Shader} s
     */
    setShader(s)
    {
        this.pushShader(s);
    }

    /**
     * push a shader to the shader stack
     * @function pushShader
     * @memberof Context
     * @instance
     * @param {Shader} shader
     * @function
     */
    pushShader(shader)
    {
        if (this.tempData.forceShaderMods)
        {
            for (let i = 0; i < this.tempData.forceShaderMods.length; i++)
            {
                // if (!currentShader.forcedMod && currentShader != this.tempData.forceShaderMods[i])
                // {
                //     currentShader.forcedMod = this.tempData.forceShaderMods[i];
                shader = this.tempData.forceShaderMods[i].bind(shader, false);
                // }
                // return currentShader;
                // if (this.tempData.forceShaderMods[i].currentShader() && shader != this.tempData.forceShaderMods[i].currentShader().shader)
            }
        }

        this._shaderStack.push(shader);
        this._currentShader = shader;
    }

    popShader()
    {
        this.setPreviousShader();
    }

    /**
     * pop current used shader from shader stack
     * @function popShader
     * @memberof Context
     * @instance
     * @function
     */
    setPreviousShader()
    {
        if (this.tempData.forceShaderMods)
        {
            for (let i = 0; i < this.tempData.forceShaderMods.length; i++)
            {
                // const a =
                this.tempData.forceShaderMods[i].unbind(false);
                // if (a) return;
                // this.popShader();
            }
        }

        if (this._shaderStack.length === 0) throw new Error("Invalid shader stack pop!");
        this._shaderStack.pop();
        this._currentShader = this._shaderStack[this._shaderStack.length - 1];
    }

    /**
     * push a framebuffer to the framebuffer stack
     * @function pushGlFrameBuffer
     * @memberof Context
     * @instance
     * @param {Object} fb framebuffer
     * @function
     */
    pushGlFrameBuffer(fb)
    {
        this._glFrameBufferStack.push(fb);
    }

    /**
     * pop framebuffer stack
     * @function popGlFrameBuffer
     * @memberof Context
     * @instance
     * @returns {Object} current framebuffer or null
     */
    popGlFrameBuffer()
    {
        if (this._glFrameBufferStack.length == 0) return null;
        this._glFrameBufferStack.pop();
        return this._glFrameBufferStack[this._glFrameBufferStack.length - 1];
    }

    /**
     * get current framebuffer
     * @function getCurrentFrameBuffer
     * @memberof Context
     * @instance
     * @returns {Object} current framebuffer or null
     */
    getCurrentGlFrameBuffer()
    {
        if (this._glFrameBufferStack.length === 0) return null;
        return this._glFrameBufferStack[this._glFrameBufferStack.length - 1];
    }

    /**
     * push a framebuffer to the framebuffer stack
     * @function pushGlFrameBuffer
     * @memberof Context
     * @instance
     * @param {Framebuffer2} fb framebuffer
     */
    pushFrameBuffer(fb)
    {
        this._frameBufferStack.push(fb);
    }

    /**
     * pop framebuffer stack
     * @function popFrameBuffer
     * @memberof Context
     * @instance
     * @returns {Framebuffer2} current framebuffer or null
     */
    popFrameBuffer()
    {
        if (this._frameBufferStack.length == 0) return null;
        this._frameBufferStack.pop();
        return this._frameBufferStack[this._frameBufferStack.length - 1];
    }

    /**
     * get current framebuffer
     * @function getCurrentFrameBuffer
     * @memberof Context
     * @instance
     * @returns {Framebuffer2} current framebuffer or null
     */
    getCurrentFrameBuffer()
    {
        if (this._frameBufferStack.length === 0) return null;
        return this._frameBufferStack[this._frameBufferStack.length - 1];
    }

    renderStart(cgl, identTranslate, identTranslateView)
    {
        this.fpsCounter.startFrame();
        this.pushDepthTest(true);
        this.pushDepthWrite(true);
        this.pushDepthFunc(cgl.gl.LEQUAL);
        this.pushCullFaceFacing(cgl.gl.BACK);
        this.pushCullFace(false);

        // if (this.clearCanvasTransparent)
        // {
        //     cgl.gl.clearColor(0, 0, 0, 0);
        //     cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT);
        // }
        // if (this.clearCanvasDepth) cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);

        cgl.setViewPort(0, 0, cgl.canvasWidth, cgl.canvasHeight);

        this._startMatrixStacks(identTranslate, identTranslateView);

        cgl.pushBlendMode(CONSTANTS.BLEND_MODES.BLEND_NORMAL, false);

        for (let i = 0; i < this._textureslots.length; i++) this._textureslots[i] = null;

        this.pushShader(this._simpleShader);

        this._frameStarted = true;

        this._execOneTimeCallbacks();

        for (let i = 0; i < this._textureslots.length; i++)
        {
            this.gl.activeTexture(this.gl.TEXTURE0 + i);
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
            this._textureslots[i] = null;
        }

        this.emitEvent("beginFrame");
    }

    /**
     * @param {CglContext} cgl
     */
    renderEnd(cgl)
    {
        this._endMatrixStacks();

        this.popDepthTest();
        this.popDepthWrite();
        this.popDepthFunc();
        this.popCullFaceFacing();
        this.popCullFace();
        this.popBlend();
        this.popBlendMode();

        cgl.endFrame();

        this.emitEvent("endFrame");
    }

    /**
     * @param {number} slot
     */
    getTexture(slot)
    {
        return this._textureslots[slot];
    }

    hasFrameStarted()
    {
        return this._frameStarted;
    }

    /**
     * log warning to console if the rendering of one frame has not been started / handy to check for async problems
     * @function checkFrameStarted
     * @memberof Context
     * @param {string} string
     * @instance
     */
    checkFrameStarted(string)
    {
        if (!this._frameStarted)
        {
            this._log.warn("frame not started " + string);

            Error.stackTraceLimit = 25;
            external_CABLES_namespaceObject.utils.logStack();
            this.patch.printTriggerStack();
        }
    }

    /**
     * @param {number} slot
     * @param {WebGLTexture} t
     * @param {undefined} [type]
     */
    setTexture(slot, t, type)
    {
        this.checkFrameStarted("cgl setTexture");

        if (t === null) t = Texture.getEmptyTexture(this).tex;

        if (this._textureslots[slot] != t)
        {
            this.gl.activeTexture(this.gl.TEXTURE0 + slot);
            this.gl.bindTexture(type || this.gl.TEXTURE_2D, t);
            this._textureslots[slot] = t;
        }

        return true;
    }

    fullScreen()
    {
        if (this.canvas.requestFullscreen) this.canvas.requestFullscreen();
        else if (this.canvas.mozRequestFullScreen) this.canvas.mozRequestFullScreen();
        else if (this.canvas.webkitRequestFullscreen) this.canvas.webkitRequestFullscreen();
        else if (this.canvas.msRequestFullscreen) this.canvas.msRequestFullscreen();
    }

    /**
     * @param {string} [str]
     */
    printError(str)
    {
        if (!this.checkGlErrors) return;
        let found = false;
        let error = this.gl.getError();

        if (error != this.gl.NO_ERROR)
        {
            let errStr = "";
            if (error == this.gl.OUT_OF_MEMORY) errStr = "OUT_OF_MEMORY";
            if (error == this.gl.INVALID_ENUM) errStr = "INVALID_ENUM";
            if (error == this.gl.INVALID_OPERATION) errStr = "INVALID_OPERATION";
            if (error == this.gl.INVALID_FRAMEBUFFER_OPERATION) errStr = "INVALID_FRAMEBUFFER_OPERATION";
            if (error == this.gl.INVALID_VALUE) errStr = "INVALID_VALUE";
            if (error == this.gl.CONTEXT_LOST_WEBGL)
            {
                this.aborted = true;
                errStr = "CONTEXT_LOST_WEBGL";
            }
            if (error == this.gl.NO_ERROR) errStr = "NO_ERROR";

            found = true;

            this._log.warn("gl error [" + this.canvas.id + "]: ", str, error, errStr);

            if (this.canvas.id.includes("glGuiCanvas"))
                if (!this._loggedGlError)
                {
                    this.patch.printTriggerStack();
                    this._log.stack("glerror");
                    this._loggedGlError = true;
                }
        }
        error = this.gl.getError();

        return found;
    }

    _dispose()
    {
        this._simpleShader.dispose();
        this.gl = null;
    }

    // state depthtest

    /**
     * push depth testing enabled state
     * @function pushDepthTest
     * @param {Boolean} enabled
     * @memberof Context
     * @instance
     */

    pushDepthTest(enabled)
    {
        this._stackDepthTest.push(enabled);
        if (!enabled) this.gl.disable(this.gl.DEPTH_TEST);
        else this.gl.enable(this.gl.DEPTH_TEST);
    }

    /**
     * current state of depth testing
     * @function stateCullFace
     * @returns {Boolean} enabled
     * @memberof Context
     * @instance
     */
    stateDepthTest()
    {
        return this._stackDepthTest[this._stackDepthTest.length - 1];
    }

    /**
     * pop depth testing state
     * @function popCullFace
     * @memberof Context
     * @instance
     */
    popDepthTest()
    {
        this._stackDepthTest.pop();

        if (!this._stackDepthTest[this._stackDepthTest.length - 1]) this.gl.disable(this.gl.DEPTH_TEST);
        else this.gl.enable(this.gl.DEPTH_TEST);
    }

    // --------------------------------------
    // state depthwrite

    /**
     * push depth write enabled state
     * @function pushDepthTest
     * @param {Boolean} enabled
     * @memberof Context
     * @instance
     */
    pushDepthWrite(enabled)
    {
        enabled = enabled || false;
        this._stackDepthWrite.push(enabled);
        this.gl.depthMask(enabled);
    }

    /**
     * current state of depth writing
     * @function stateDepthWrite
     * @returns {Boolean} enabled
     * @memberof Context
     * @instance
     */
    stateDepthWrite()
    {
        return this._stackDepthWrite[this._stackDepthWrite.length - 1];
    }

    /**
     * pop depth writing state
     * @function popDepthWrite
     * @memberof Context
     * @instance
     */
    popDepthWrite()
    {
        this._stackDepthWrite.pop();
        this.gl.depthMask(this._stackDepthWrite[this._stackDepthWrite.length - 1] || false);
    }

    // --------------------------------------
    // state CullFace

    /**
     * push face culling face enabled state
     * @function pushCullFace
     * @param {Boolean} enabled
     * @memberof Context
     * @instance
     */
    pushCullFace(enabled)
    {
        this._stackCullFace.push(enabled);

        if (enabled) this.gl.enable(this.gl.CULL_FACE);
        else this.gl.disable(this.gl.CULL_FACE);
    }

    /**
     * current state of face culling
     * @function stateCullFace
     * @returns {Boolean} enabled
     * @memberof Context
     * @instance
     */
    stateCullFace()
    {
        return this._stackCullFace[this._stackCullFace.length - 1];
    }

    /**
     * pop face culling enabled state
     * @function popCullFace
     * @memberof Context
     * @instance
     */
    popCullFace()
    {
        this._stackCullFace.pop();

        if (this._stackCullFace[this._stackCullFace.length - 1]) this.gl.enable(this.gl.CULL_FACE);
        else this.gl.disable(this.gl.CULL_FACE);
    }

    // --------------------------------------
    // state CullFace Facing

    /**
     * push face culling face side
     * @function pushCullFaceFacing
     * @param {Number} face - cgl.gl.FRONT_AND_BACK, cgl.gl.BACK or cgl.gl.FRONT
     * @memberof Context
     * @instance
     */

    pushCullFaceFacing(face)
    {
        this._stackCullFaceFacing.push(face);
        this.gl.cullFace(this._stackCullFaceFacing[this._stackCullFaceFacing.length - 1]);
    }

    /**
     * current state of face culling side
     * @function stateCullFaceFacing
     * @returns {Boolean} enabled
     * @memberof Context
     * @instance
     */
    stateCullFaceFacing()
    {
        return this._stackCullFaceFacing[this._stackCullFaceFacing.length - 1];
    }

    /**
     * pop face culling face side
     * @function popCullFaceFacing
     * @memberof Context
     * @instance
     */
    popCullFaceFacing()
    {
        this._stackCullFaceFacing.pop();
        if (this._stackCullFaceFacing.length > 0) this.gl.cullFace(this._stackCullFaceFacing[this._stackCullFaceFacing.length - 1]);
    }

    // --------------------------------------
    // state depthfunc

    /**
     * enable / disable depth testing
     * like `gl.depthFunc(boolean);`
     * @function pushDepthFunc
     * @memberof Context
     * @instance
     * @param {Boolean} f depthtesting
     */
    pushDepthFunc(f)
    {
        this._stackDepthFunc.push(f);
        this.gl.depthFunc(f);
    }

    /**
     * current state of blend
     * @function stateDepthFunc
     * @memberof Context
     * @instance
     * @returns {Boolean} depth testing enabled/disabled
     */
    stateDepthFunc()
    {
        if (this._stackDepthFunc.length > 0) return this._stackDepthFunc[this._stackDepthFunc.length - 1];
        return false;
    }

    /**
     * pop depth testing and set the previous state
     * @function popDepthFunc
     * @memberof Context
     * @instance
     */
    popDepthFunc()
    {
        this._stackDepthFunc.pop();
        if (this._stackDepthFunc.length > 0) this.gl.depthFunc(this._stackDepthFunc[this._stackDepthFunc.length - 1]);
    }

    // --------------------------------------
    // state blending

    /**
     * enable / disable blend
     * like gl.enable(gl.BLEND); / gl.disable(gl.BLEND);
     * @function pushBlend
     * @memberof Context
     * @instance
     * @param {boolean} b blending
     */
    pushBlend(b)
    {
        this._stackBlend.push(b);
        if (!b) this.gl.disable(this.gl.BLEND);
        else this.gl.enable(this.gl.BLEND);
    }

    /**
     * pop blend state and set the previous state
     * @function popBlend
     * @memberof Context
     * @instance
     */
    popBlend()
    {
        this._stackBlend.pop();

        if (!this._stackBlend[this._stackBlend.length - 1]) this.gl.disable(this.gl.BLEND);
        else this.gl.enable(this.gl.BLEND);
    }

    /**
     * current state of blend
     * @function stateBlend
     * @returns {boolean} blending enabled/disabled
     * @memberof Context
     * @instance
     */
    stateBlend()
    {
        return this._stackBlend[this._stackBlend.length - 1];
    }

    /**
     * push and switch to predefined blendmode (CONSTANTS.BLEND_MODES.BLEND_NONE,CONSTANTS.BLEND_MODES.BLEND_NORMAL,CONSTANTS.BLEND_MODES.BLEND_ADD,CONSTANTS.BLEND_MODES.BLEND_SUB,CONSTANTS.BLEND_MODES.BLEND_MUL)
     * @function pushBlendMode
     * @memberof Context
     * @instance
     * @param {Number} blendMode
     * @param {Boolean} premul premultiplied mode
     */
    pushBlendMode(blendMode, premul)
    {
        this._stackBlendMode.push(blendMode);
        this._stackBlendModePremul.push(premul);

        const n = this._stackBlendMode.length - 1;

        this.pushBlend(this._stackBlendMode[n] !== CONSTANTS.BLEND_MODES.BLEND_NONE);
        this._setBlendMode(this._stackBlendMode[n], this._stackBlendModePremul[n]);
    }

    /**
     * pop predefined blendmode / switch back to previous blendmode
     * @function popBlendMode
     * @memberof Context
     * @instance
     */
    popBlendMode()
    {
        this._stackBlendMode.pop();
        this._stackBlendModePremul.pop();

        const n = this._stackBlendMode.length - 1;

        this.popBlend();

        if (n >= 0) this._setBlendMode(this._stackBlendMode[n], this._stackBlendModePremul[n]);
    }

    // --------------------------------------
    // state stencil

    /**
     * enable / disable stencil testing

    * @function pushStencil
    * @memberof Context
    * @instance
    * @param {Boolean} b enable
    */
    pushStencil(b)
    {
        this._stackStencil.push(b);
        if (!b) this.gl.disable(this.gl.STENCIL_TEST);
        else this.gl.enable(this.gl.STENCIL_TEST);
    }

    /**
     * pop stencil test state and set the previous state
     * @function popStencil
     * @memberof Context
     * @instance
     */
    popStencil()
    {
        this._stackStencil.pop();

        if (!this._stackStencil[this._stackStencil.length - 1]) this.gl.disable(this.gl.STENCIL_TEST);
        else this.gl.enable(this.gl.STENCIL_TEST);
    }

    // --------------------------------------

    glGetAttribLocation(prog, name)
    {
        const l = this.gl.getAttribLocation(prog, name);
        // if (l == -1)
        // {
        //     this._log.warn("get attr loc -1 ", name);
        // }
        return l;
    }

    /**
     * should an op now draw helpermeshes
     * @param {Op} op
     */
    shouldDrawHelpers(op)
    {
        if (this.tempData.shadowPass) return false;
        if (!op.patch.isEditorMode()) return false;
        return gui.shouldDrawOverlay;
    }

    _setBlendMode(blendMode, premul)
    {
        const gl = this.gl;

        if (blendMode == CONSTANTS.BLEND_MODES.BLEND_NONE)
        {
            // this.gl.disable(this.gl.BLEND);
        }
        else if (blendMode == CONSTANTS.BLEND_MODES.BLEND_ADD)
        {
            if (premul)
            {
                gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
                gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ONE);
            }
            else
            {
                gl.blendEquation(gl.FUNC_ADD);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            }
        }
        else if (blendMode == CONSTANTS.BLEND_MODES.BLEND_SUB)
        {
            if (premul)
            {
                gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
                gl.blendFuncSeparate(gl.ZERO, gl.ZERO, gl.ONE_MINUS_SRC_COLOR, gl.ONE_MINUS_SRC_ALPHA);
            }
            else
            {
                gl.blendEquation(gl.FUNC_ADD);
                gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
            }
        }
        else if (blendMode == CONSTANTS.BLEND_MODES.BLEND_MUL)
        {
            if (premul)
            {
                gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
                gl.blendFuncSeparate(gl.ZERO, gl.SRC_COLOR, gl.ZERO, gl.SRC_ALPHA);
            }
            else
            {
                gl.blendEquation(gl.FUNC_ADD);
                gl.blendFunc(gl.ZERO, gl.SRC_COLOR);
            }
        }
        else if (blendMode == CONSTANTS.BLEND_MODES.BLEND_NORMAL)
        {
            if (premul)
            {
                gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
                gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            }
            else
            {
                gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
                gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            }
        }
        else
        {
            this._log.log("setblendmode: unknown blendmode");
        }
    }

    /**
     * @param {Geometry} geom
     * @param {import("./cgl_mesh.js").CglMeshOptions} options
     */
    createMesh(geom, options)
    {
        if (external_CABLES_namespaceObject.utils.isNumeric(options))options = { "glPrimitive": options }; // old constructor fallback...
        return new Mesh(this, geom, options);
    }

    /**
     * set cursor
     * @function setCursor
     * @memberof Context
     * @instance
     * @param {String} str css cursor string
     */
    setCursor(str)
    {
        this.#cursor = str;
    }

    /**
     * enable a webgl extension
     * @function enableExtension
     * @memberof Context
     * @instance
     * @param {String} name extension name
     * @returns {Object} extension object or null
     */
    enableExtension(name)
    {
        if (!this.gl) return null;

        if (this._enabledExtensions.hasOwnProperty(name))
            return this._enabledExtensions[name];

        const o = this.gl.getExtension(name);
        this._enabledExtensions[name] = o;

        if (!o) this._log.warn("[cgl_state] extension not available " + name);

        return o;
    }

    getErrorShader()
    {
        if (this.errorShader) return this.errorShader;

        this.errorShader = new CglShader(this, "errormaterial");
        this.errorShader.setSource(CglShader.getDefaultVertexShader(), CglShader.getErrorFragmentShader());
        return this.errorShader;
    }

}

;// CONCATENATED MODULE: ./src/corelibs/cgl/index.js

















const cgl_CGL = {
    "Framebuffer2": Framebuffer2,
    "Geometry": Geometry,
    "BoundingBox": BoundingBox,
    "Marker": Marker,
    "WirePoint": WirePoint,
    "WireCube": WireCube,
    "MatrixStack": MatrixStack,
    "Mesh": Mesh,
    "MESH": MESH,
    "ShaderLibMods": ShaderLibMods,
    "Shader": CglShader,
    "Uniform": Uniform,
    "MESHES": MESHES,
    "getWheelSpeed": getWheelSpeed,
    "getWheelDelta": getWheelDelta,
    "Context": CglContext,
    "Texture": Texture,
    "TextureEffect": TextureEffect,
    "onLoadingAssetsFinished": onLoadingAssetsFinished,
    "ProfileData": ProfileData,
    "UniColorShader": UniColorShader,
    ...CONSTANTS.BLEND_MODES,
    ...CONSTANTS.SHADER,
    ...CONSTANTS.MATH,
    ...CONSTANTS.BLEND_MODES,
};

window.CABLES = window.CABLES || {};
window.CABLES.CGL = window.CABLES.CGL || cgl_CGL;
window.CGL = window.CGL || cgl_CGL;

/**
 * @param {number} time
 * @param {quat} q
 * @param {Anim} animx
 * @param {Anim} animy
 * @param {Anim} animz
 * @param {Anim} animw
 */
external_CABLES_namespaceObject.Anim.slerpQuaternion = function (time, q, animx, animy, animz, animw)
{
    if (!external_CABLES_namespaceObject.Anim.slerpQuaternion.q1)
    {
        external_CABLES_namespaceObject.Anim.slerpQuaternion.q1 = quat.create();
        external_CABLES_namespaceObject.Anim.slerpQuaternion.q2 = quat.create();
    }

    const i1 = animx.getKeyIndex(time);
    let i2 = i1 + 1;
    if (i2 >= animx.keys.length) i2 = animx.keys.length - 1;

    if (i1 == i2)
    {
        quat.set(q, animx.keys[i1].value, animy.keys[i1].value, animz.keys[i1].value, animw.keys[i1].value);
    }
    else
    {
        const key1Time = animx.keys[i1].time;
        const key2Time = animx.keys[i2].time;
        const perc = (time - key1Time) / (key2Time - key1Time);

        quat.set(external_CABLES_namespaceObject.Anim.slerpQuaternion.q1, animx.keys[i1].value, animy.keys[i1].value, animz.keys[i1].value, animw.keys[i1].value);

        quat.set(external_CABLES_namespaceObject.Anim.slerpQuaternion.q2, animx.keys[i2].value, animy.keys[i2].value, animz.keys[i2].value, animw.keys[i2].value);

        quat.slerp(q, external_CABLES_namespaceObject.Anim.slerpQuaternion.q1, external_CABLES_namespaceObject.Anim.slerpQuaternion.q2, perc);
    }
    return q;
};



;// CONCATENATED MODULE: ./src/corelibs/cgl_copytexture/cgl_copytexture.js


class CopyTexture
{
    constructor(cgl, name, options)
    {
        this.cgl = cgl;

        this._options = options;
        this.fb = null;

        let shader = options.shader;

        this._useDefaultShader = true;
        if (options.shader) this._useDefaultShader = false;

        options.numRenderBuffers = options.numRenderBuffers || 1;

        if (!shader)
        {
            shader = ""
                .endl() + "IN vec2 texCoord;";

            for (let i = 0; i < options.numRenderBuffers; i++)
            {
                shader = shader.endl() + "UNI sampler2D tex" + i + ";".endl();
            }

            shader = shader
                .endl() + "void main()"
                .endl() + "{";

            if (options.numRenderBuffers == 1)
            {
                shader = shader.endl() + "    outColor= texture(tex0,texCoord);".endl();
            }

            else
                for (let i = 0; i < options.numRenderBuffers; i++)
                {
                    shader = shader.endl() + "outColor" + i + " = texture(tex" + i + ",texCoord);".endl();
                }

            shader = shader.endl() + "}";
        }

        const verts = options.vertexShader || ""
            .endl() + "IN vec3 vPosition;"
            .endl() + "IN vec2 attrTexCoord;"

            .endl() + "OUT vec2 texCoord;"

            .endl() + "void main()"
            .endl() + "{"
            .endl() + "   texCoord=attrTexCoord;"
            .endl() + "   gl_Position = vec4(vPosition,  1.0);"
            .endl() + "}";

        this.bgShader = new cgl_CGL.Shader(cgl, "corelib copytexture " + name);
        this.bgShader.setSource(verts, shader);

        if (!options.vertexShader)
            this.bgShader.ignoreMissingUniforms = true;

        new cgl_CGL.Uniform(this.bgShader, "t", "tex", 0);
        new cgl_CGL.Uniform(this.bgShader, "t", "tex1", 1);
        new cgl_CGL.Uniform(this.bgShader, "t", "tex2", 2);
        new cgl_CGL.Uniform(this.bgShader, "t", "tex3", 3);

        this.mesh = cgl_CGL.MESHES.getSimpleRect(this.cgl, "texEffectRect");
    }

    setSize(w, h)
    {
        this._options.width = w;
        this._options.height = h;
    }

    copy(tex, tex1, tex2, tex3, tex4)
    {
        const cgl = this.cgl;
        if (!tex) tex = cgl_CGL.Texture.getEmptyTexture(this.cgl);
        let
            w = this._options.width || tex.width,
            h = this._options.height || tex.height;

        if (this.fb)
        {
            if (w <= 0)w = 8;
            if (h <= 0)h = 8;
            if (this.fb.getWidth() != w || this.fb.getHeight() != h) this.fb.setSize(w, h);
        }
        else
        {
            let filter = cgl_CGL.Texture.FILTER_LINEAR;
            let wrap = cgl_CGL.Texture.WRAP_CLAMP_TO_EDGE;

            if (this._options.isFloatingPointTexture)filter = cgl_CGL.Texture.FILTER_NEAREST;

            if (this._options.hasOwnProperty("filter"))filter = this._options.filter;
            if (this._options.hasOwnProperty("wrap"))wrap = this._options.wrap;

            const options =
                {
                    "isFloatingPointTexture": this._options.isFloatingPointTexture,
                    "pixelFormat": this._options.pixelFormat,
                    "numRenderBuffers": this._options.numRenderBuffers || 1,
                    "filter": filter,
                    "wrap": wrap,
                };

            if (cgl.glVersion == 1) this.fb = new cgl_CGL.Framebuffer(cgl, w, h, options);
            else this.fb = new cgl_CGL.Framebuffer2(cgl, w, h, options);
        }

        cgl.tempData.renderOffscreen = true;
        this.fb.renderStart(cgl);

        cgl.setTexture(0, tex.tex);
        if (tex1) cgl.setTexture(1, tex1.tex);
        if (tex2) cgl.setTexture(2, tex2.tex);
        if (tex3) cgl.setTexture(3, tex3.tex);
        if (tex4) cgl.setTexture(4, tex4.tex);

        cgl.pushShader(this.bgShader);
        this.mesh.render(this.bgShader);
        cgl.popShader();

        this.fb.renderEnd();
        cgl.tempData.renderOffscreen = false;

        return this.fb.getTextureColor();
    }

    dispose()
    {
        if (this.fb) this.fb.dispose();
        if (this.bgShader) this.bgShader.dispose();
        if (this.mesh) this.mesh.dispose();
    }
}

})();

var __webpack_export_target__ = (CGL = typeof CGL === "undefined" ? {} : CGL);
for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;