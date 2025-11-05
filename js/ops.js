"use strict";

var CABLES=CABLES||{};
CABLES.OPS=CABLES.OPS||{};

var Ops=Ops || {};
Ops.Gl=Ops.Gl || {};
Ops.Anim=Ops.Anim || {};
Ops.Math=Ops.Math || {};
Ops.Boolean=Ops.Boolean || {};
Ops.Devices=Ops.Devices || {};
Ops.Sidebar=Ops.Sidebar || {};
Ops.Trigger=Ops.Trigger || {};
Ops.Graphics=Ops.Graphics || {};
Ops.Extension=Ops.Extension || {};
Ops.Gl.Matrix=Ops.Gl.Matrix || {};
Ops.Gl.Meshes=Ops.Gl.Meshes || {};
Ops.Gl.Shader=Ops.Gl.Shader || {};
Ops.Gl.Textures=Ops.Gl.Textures || {};
Ops.Devices.Mouse=Ops.Devices.Mouse || {};
Ops.Gl.ImageCompose=Ops.Gl.ImageCompose || {};
Ops.Graphics.Meshes=Ops.Graphics.Meshes || {};
Ops.Extension.Deprecated=Ops.Extension.Deprecated || {};



// **************************************************************
// 
// Ops.Gl.RenderToTexture
// 
// **************************************************************

Ops.Gl.RenderToTexture= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const cgl = op.patch.cgl;

const
    render = op.inTrigger("render"),
    useVPSize = op.inValueBool("use viewport size", true),
    width = op.inValueInt("texture width", 512),
    height = op.inValueInt("texture height", 512),
    aspect = op.inBool("Auto Aspect", false),
    tfilter = op.inSwitch("filter", ["nearest", "linear", "mipmap"], "linear"),
    twrap = op.inSwitch("Wrap", ["Clamp", "Repeat", "Mirror"], "Repeat"),
    msaa = op.inSwitch("MSAA", ["none", "2x", "4x", "8x"], "none"),
    trigger = op.outTrigger("trigger"),
    tex = op.outTexture("texture"),
    texDepth = op.outTexture("textureDepth"),
    fpTexture = op.inValueBool("HDR"),
    depth = op.inValueBool("Depth", true),
    clear = op.inValueBool("Clear", true);

let fb = null;
let reInitFb = true;
tex.set(CGL.Texture.getEmptyTexture(cgl));

op.setPortGroup("Size", [useVPSize, width, height, aspect]);

const prevViewPort = [0, 0, 0, 0];

fpTexture.setUiAttribs({ "title": "Pixelformat Float 32bit" });

fpTexture.onChange =
    depth.onChange =
    clear.onChange =
    tfilter.onChange =
    twrap.onChange =
    msaa.onChange = initFbLater;

useVPSize.onChange = updateVpSize;

render.onTriggered =
    op.preRender = doRender;

updateVpSize();

function updateVpSize()
{
    width.setUiAttribs({ "greyout": useVPSize.get() });
    height.setUiAttribs({ "greyout": useVPSize.get() });
    aspect.setUiAttribs({ "greyout": useVPSize.get() });
}

function initFbLater()
{
    reInitFb = true;
}

function doRender()
{
    const vp = cgl.getViewPort();
    prevViewPort[0] = vp[0];
    prevViewPort[1] = vp[1];
    prevViewPort[2] = vp[2];
    prevViewPort[3] = vp[3];

    if (!fb || reInitFb)
    {
        if (fb) fb.delete();

        let selectedWrap = CGL.Texture.WRAP_REPEAT;
        if (twrap.get() == "Clamp") selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;
        else if (twrap.get() == "Mirror") selectedWrap = CGL.Texture.WRAP_MIRRORED_REPEAT;

        let selectFilter = CGL.Texture.FILTER_NEAREST;
        if (tfilter.get() == "nearest") selectFilter = CGL.Texture.FILTER_NEAREST;
        else if (tfilter.get() == "linear") selectFilter = CGL.Texture.FILTER_LINEAR;
        else if (tfilter.get() == "mipmap") selectFilter = CGL.Texture.FILTER_MIPMAP;

        if (fpTexture.get() && tfilter.get() == "mipmap") op.setUiError("fpmipmap", "Don't use mipmap and HDR at the same time, many systems do not support this.");
        else op.setUiError("fpmipmap", null);

        if (cgl.glVersion >= 2)
        {
            let ms = true;
            let msSamples = 4;

            if (msaa.get() == "none")
            {
                msSamples = 0;
                ms = false;
            }
            if (msaa.get() == "2x") msSamples = 2;
            if (msaa.get() == "4x") msSamples = 4;
            if (msaa.get() == "8x") msSamples = 8;

            fb = new CGL.Framebuffer2(cgl, 8, 8,
                {
                    "name": "render2texture " + op.id,
                    "isFloatingPointTexture": fpTexture.get(),
                    "multisampling": ms,
                    "wrap": selectedWrap,
                    "filter": selectFilter,
                    "depth": depth.get(),
                    "multisamplingSamples": msSamples,
                    "clear": clear.get()
                });
        }
        else
        {
            fb = new CGL.Framebuffer(cgl, 8, 8, { "isFloatingPointTexture": fpTexture.get(), "clear": clear.get() });
            console.log("WEBGL1!!!", fb, fb.valid);
        }

        if (fb && fb.valid)
        {
            texDepth.set(fb.getTextureDepth());
            reInitFb = false;
        }
        else
        {
            fb = null;
            reInitFb = true;
        }
    }

    if (useVPSize.get())
    {
        width.set(cgl.getViewPort()[2]);
        height.set(cgl.getViewPort()[3]);
    }

    if (fb.getWidth() != Math.ceil(width.get()) || fb.getHeight() != Math.ceil(height.get()))
    {
        fb.setSize(
            Math.max(1, Math.ceil(width.get())),
            Math.max(1, Math.ceil(height.get())));
    }

    fb.renderStart(cgl);

    if (aspect.get()) mat4.perspective(cgl.pMatrix, 45, width.get() / height.get(), 0.1, 1000.0);

    trigger.trigger();
    fb.renderEnd(cgl);

    // cgl.resetViewPort();
    cgl.setViewPort(prevViewPort[0], prevViewPort[1], prevViewPort[2], prevViewPort[3]);

    // texDepth.set(CGL.Texture.getEmptyTexture(op.patch.cgl));
    texDepth.setRef(fb.getTextureDepth());

    // tex.set(CGL.Texture.getEmptyTexture(op.patch.cgl));
    tex.setRef(fb.getTextureColor());
}

}
};

CABLES.OPS["d01fa820-396c-4cb5-9d78-6b14762852af"]={f:Ops.Gl.RenderToTexture,objName:"Ops.Gl.RenderToTexture"};




// **************************************************************
// 
// Ops.Trigger.Sequence
// 
// **************************************************************

Ops.Trigger.Sequence= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const
    exe = op.inTrigger("exe"),
    cleanup = op.inTriggerButton("Clean up connections");

op.setUiAttrib({ "resizable": true, "resizableY": false, "stretchPorts": true });
const
    exes = [],
    triggers = [],
    num = 16;

let
    updateTimeout = null,
    connectedOuts = [];

exe.onTriggered = triggerAll;
cleanup.onTriggered = clean;
cleanup.setUiAttribs({ "hideParam": true, "hidePort": true });

for (let i = 0; i < num; i++)
{
    const p = op.outTrigger("trigger " + i);
    triggers.push(p);
    p.onLinkChanged = updateButton;

    if (i < num - 1)
    {
        let newExe = op.inTrigger("exe " + i);
        newExe.onTriggered = triggerAll;
        exes.push(newExe);
    }
}

updateConnected();

function updateConnected()
{
    connectedOuts.length = 0;
    for (let i = 0; i < triggers.length; i++)
        if (triggers[i].links.length > 0) connectedOuts.push(triggers[i]);
}

function updateButton()
{
    updateConnected();
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() =>
    {
        let show = false;
        for (let i = 0; i < triggers.length; i++)
            if (triggers[i].links.length > 1) show = true;

        cleanup.setUiAttribs({ "hideParam": !show });

        if (op.isCurrentUiOp()) op.refreshParams();
    }, 60);
}

function triggerAll()
{
    // for (let i = 0; i < triggers.length; i++) triggers[i].trigger();
    for (let i = 0; i < connectedOuts.length; i++) connectedOuts[i].trigger();
}

function clean()
{
    let count = 0;
    for (let i = 0; i < triggers.length; i++)
    {
        let removeLinks = [];

        if (triggers[i].links.length > 1)
            for (let j = 1; j < triggers[i].links.length; j++)
            {
                while (triggers[count].links.length > 0) count++;

                removeLinks.push(triggers[i].links[j]);
                const otherPort = triggers[i].links[j].getOtherPort(triggers[i]);
                op.patch.link(op, "trigger " + count, otherPort.op, otherPort.name);
                count++;
            }

        for (let j = 0; j < removeLinks.length; j++) removeLinks[j].remove();
    }
    updateButton();
    updateConnected();
}

}
};

CABLES.OPS["a466bc1f-06e9-4595-8849-bffb9fe22f99"]={f:Ops.Trigger.Sequence,objName:"Ops.Trigger.Sequence"};




// **************************************************************
// 
// Ops.Gl.MainLoop
// 
// **************************************************************

Ops.Gl.MainLoop= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const
    fpsLimit = op.inValue("FPS Limit", 0),
    trigger = op.outTrigger("trigger"),
    width = op.outNumber("width"),
    height = op.outNumber("height"),
    reduceFocusFPS = op.inValueBool("Reduce FPS not focussed", false),
    reduceLoadingFPS = op.inValueBool("Reduce FPS loading"),
    clear = op.inValueBool("Clear", true),
    clearAlpha = op.inValueBool("ClearAlpha", true),
    fullscreen = op.inValueBool("Fullscreen Button", false),
    active = op.inValueBool("Active", true),
    hdpi = op.inValueBool("Hires Displays", false),
    inUnit = op.inSwitch("Pixel Unit", ["Display", "CSS"], "Display");

op.onAnimFrame = render;
hdpi.onChange = function ()
{
    if (hdpi.get()) op.patch.cgl.pixelDensity = window.devicePixelRatio;
    else op.patch.cgl.pixelDensity = 1;

    op.patch.cgl.updateSize();
    if (CABLES.UI) gui.setLayout();
};

active.onChange = function ()
{
    op.patch.removeOnAnimFrame(op);

    if (active.get())
    {
        op.setUiAttrib({ "extendTitle": "" });
        op.onAnimFrame = render;
        op.patch.addOnAnimFrame(op);
        op.log("adding again!");
    }
    else
    {
        op.setUiAttrib({ "extendTitle": "Inactive" });
    }
};

const cgl = op.patch.cgl;
let rframes = 0;
let rframeStart = 0;
let timeOutTest = null;
let addedListener = false;

if (!op.patch.cgl) op.uiAttr({ "error": "No webgl cgl context" });

const identTranslate = vec3.create();
vec3.set(identTranslate, 0, 0, 0);
const identTranslateView = vec3.create();
vec3.set(identTranslateView, 0, 0, -2);

fullscreen.onChange = updateFullscreenButton;
setTimeout(updateFullscreenButton, 100);
let fsElement = null;

let winhasFocus = true;
let winVisible = true;

window.addEventListener("blur", () => { winhasFocus = false; });
window.addEventListener("focus", () => { winhasFocus = true; });
document.addEventListener("visibilitychange", () => { winVisible = !document.hidden; });
testMultiMainloop();

op.patch.tempData.mainloopOp = this;

inUnit.onChange = () =>
{
    width.set(0);
    height.set(0);
};

function getFpsLimit()
{
    if (reduceLoadingFPS.get() && op.patch.loading.getProgress() < 1.0) return 5;

    if (reduceFocusFPS.get())
    {
        if (!winVisible) return 10;
        if (!winhasFocus) return 30;
    }

    return fpsLimit.get();
}

function updateFullscreenButton()
{
    function onMouseEnter()
    {
        if (fsElement)fsElement.style.display = "block";
    }

    function onMouseLeave()
    {
        if (fsElement)fsElement.style.display = "none";
    }

    op.patch.cgl.canvas.addEventListener("mouseleave", onMouseLeave);
    op.patch.cgl.canvas.addEventListener("mouseenter", onMouseEnter);

    if (fullscreen.get())
    {
        if (!fsElement)
        {
            fsElement = document.createElement("div");

            const container = op.patch.cgl.canvas.parentElement;
            if (container)container.appendChild(fsElement);

            fsElement.addEventListener("mouseenter", onMouseEnter);
            fsElement.addEventListener("click", function (e)
            {
                if (CABLES.UI && !e.shiftKey) gui.toggleMaximizeCanvas();
                else cgl.fullScreen();
            });
        }

        fsElement.style.padding = "10px";
        fsElement.style.position = "absolute";
        fsElement.style.right = "5px";
        fsElement.style.top = "5px";
        fsElement.style.width = "20px";
        fsElement.style.height = "20px";
        fsElement.style.cursor = "pointer";
        fsElement.style["border-radius"] = "40px";
        fsElement.style.background = "#444";
        fsElement.style["z-index"] = "9999";
        fsElement.style.display = "none";
        fsElement.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" id=\"Capa_1\" x=\"0px\" y=\"0px\" viewBox=\"0 0 490 490\" style=\"width:20px;height:20px;\" xml:space=\"preserve\" width=\"512px\" height=\"512px\"><g><path d=\"M173.792,301.792L21.333,454.251v-80.917c0-5.891-4.776-10.667-10.667-10.667C4.776,362.667,0,367.442,0,373.333V480     c0,5.891,4.776,10.667,10.667,10.667h106.667c5.891,0,10.667-4.776,10.667-10.667s-4.776-10.667-10.667-10.667H36.416     l152.459-152.459c4.093-4.237,3.975-10.99-0.262-15.083C184.479,297.799,177.926,297.799,173.792,301.792z\" fill=\"#FFFFFF\"/><path d=\"M480,0H373.333c-5.891,0-10.667,4.776-10.667,10.667c0,5.891,4.776,10.667,10.667,10.667h80.917L301.792,173.792     c-4.237,4.093-4.354,10.845-0.262,15.083c4.093,4.237,10.845,4.354,15.083,0.262c0.089-0.086,0.176-0.173,0.262-0.262     L469.333,36.416v80.917c0,5.891,4.776,10.667,10.667,10.667s10.667-4.776,10.667-10.667V10.667C490.667,4.776,485.891,0,480,0z\" fill=\"#FFFFFF\"/><path d=\"M36.416,21.333h80.917c5.891,0,10.667-4.776,10.667-10.667C128,4.776,123.224,0,117.333,0H10.667     C4.776,0,0,4.776,0,10.667v106.667C0,123.224,4.776,128,10.667,128c5.891,0,10.667-4.776,10.667-10.667V36.416l152.459,152.459     c4.237,4.093,10.99,3.975,15.083-0.262c3.992-4.134,3.992-10.687,0-14.82L36.416,21.333z\" fill=\"#FFFFFF\"/><path d=\"M480,362.667c-5.891,0-10.667,4.776-10.667,10.667v80.917L316.875,301.792c-4.237-4.093-10.99-3.976-15.083,0.261     c-3.993,4.134-3.993,10.688,0,14.821l152.459,152.459h-80.917c-5.891,0-10.667,4.776-10.667,10.667s4.776,10.667,10.667,10.667     H480c5.891,0,10.667-4.776,10.667-10.667V373.333C490.667,367.442,485.891,362.667,480,362.667z\" fill=\"#FFFFFF\"/></g></svg>";
    }
    else
    {
        if (fsElement)
        {
            fsElement.style.display = "none";
            fsElement.remove();
            fsElement = null;
        }
    }
}

op.onDelete = function ()
{
    cgl.gl.clearColor(0, 0, 0, 0);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
};

function render(time)
{
    if (!active.get()) return;
    if (cgl.aborted || cgl.canvas.clientWidth === 0 || cgl.canvas.clientHeight === 0) return;

    op.patch.cg = cgl;

    if (hdpi.get())op.patch.cgl.pixelDensity = window.devicePixelRatio;

    const startTime = performance.now();

    op.patch.config.fpsLimit = getFpsLimit();

    if (cgl.canvasWidth == -1)
    {
        cgl.setCanvas(op.patch.config.glCanvasId);
        return;
    }

    if (cgl.canvasWidth != width.get() || cgl.canvasHeight != height.get())
    {
        let div = 1;
        if (inUnit.get() == "CSS")div = op.patch.cgl.pixelDensity;

        width.set(cgl.canvasWidth / div);
        height.set(cgl.canvasHeight / div);
    }

    if (CABLES.now() - rframeStart > 1000)
    {
        CGL.fpsReport = CGL.fpsReport || [];
        if (op.patch.loading.getProgress() >= 1.0 && rframeStart !== 0)CGL.fpsReport.push(rframes);
        rframes = 0;
        rframeStart = CABLES.now();
    }
    CGL.MESH.lastShader = null;
    CGL.MESH.lastMesh = null;

    cgl.renderStart(cgl, identTranslate, identTranslateView);

    if (clear.get())
    {
        cgl.gl.clearColor(0, 0, 0, 1);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    }

    trigger.trigger();

    if (CGL.MESH.lastMesh)CGL.MESH.lastMesh.unBind();

    if (CGL.Texture.previewTexture)
    {
        if (!CGL.Texture.texturePreviewer) CGL.Texture.texturePreviewer = new CGL.Texture.texturePreview(cgl);
        CGL.Texture.texturePreviewer.render(CGL.Texture.previewTexture);
    }
    cgl.renderEnd(cgl);

    op.patch.cg = null;

    if (clearAlpha.get())
    {
        cgl.gl.clearColor(1, 1, 1, 1);
        cgl.gl.colorMask(false, false, false, true);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT);
        cgl.gl.colorMask(true, true, true, true);
    }

    if (!cgl.tempData.phong)cgl.tempData.phong = {};
    rframes++;

    op.patch.cgl.profileData.profileMainloopMs = performance.now() - startTime;
}

function testMultiMainloop()
{
    clearTimeout(timeOutTest);
    timeOutTest = setTimeout(
        () =>
        {
            if (op.patch.getOpsByObjName(op.name).length > 1)
            {
                op.setUiError("multimainloop", "there should only be one mainloop op!");
                if (!addedListener)addedListener = op.patch.addEventListener("onOpDelete", testMultiMainloop);
            }
            else op.setUiError("multimainloop", null, 1);
        }, 500);
}

}
};

CABLES.OPS["b0472a1d-db16-4ba6-8787-f300fbdc77bb"]={f:Ops.Gl.MainLoop,objName:"Ops.Gl.MainLoop"};




// **************************************************************
// 
// Ops.Graphics.Meshes.Circle
// 
// **************************************************************

Ops.Graphics.Meshes.Circle= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    radius = op.inValue("radius", 0.5),
    innerRadius = op.inValueSlider("innerRadius", 0),
    segments = op.inValueInt("segments", 40),
    percent = op.inValueSlider("percent", 1),
    steps = op.inValue("steps", 0),
    invertSteps = op.inValueBool("invertSteps", false),
    mapping = op.inSwitch("mapping", ["flat", "round"]),
    drawSpline = op.inValueBool("Spline", false),
    inDraw = op.inValueBool("Draw", true),
    trigger = op.outTrigger("trigger"),
    geomOut = op.outObject("geometry", null, "geometry");

op.setPortGroup("Size", [radius, innerRadius]);
op.setPortGroup("Display", [percent, steps, invertSteps]);

mapping.set("flat");

mapping.onChange =
    segments.onChange =
    radius.onChange =
    innerRadius.onChange =
    percent.onChange =
    steps.onChange =
    invertSteps.onChange =
    drawSpline.onChange = calcLater;

geomOut.ignoreValueSerialize = true;
const cgl = op.patch.cgl;

let geom = new CGL.Geometry("circle");
let mesh = null;
const lastSegs = -1;

let oldPrim = 0;
let shader = null;
let needsCalc = true;

render.onTriggered = renderMesh;

op.preRender = () =>
{
    renderMesh();
};

function renderMesh()
{
    if (!CGL.TextureEffect.checkOpNotInTextureEffect(op)) return;

    if (needsCalc)calc();
    shader = cgl.getShader();
    if (!shader) return;
    oldPrim = shader.glPrimitive;

    if (drawSpline.get()) shader.glPrimitive = cgl.gl.LINE_STRIP;

    if (inDraw.get())mesh.render(shader);
    trigger.trigger();

    shader.glPrimitive = oldPrim;
}

function calc()
{
    const segs = Math.max(3, Math.floor(segments.get()));

    geom.clear();

    const faces = [];
    const texCoords = [];
    const vertexNormals = [];
    const tangents = [];
    const biTangents = [];

    let i = 0, degInRad = 0;
    let oldPosX = 0, oldPosY = 0;
    let oldPosXTexCoord = 0, oldPosYTexCoord = 0;

    let oldPosXIn = 0, oldPosYIn = 0;
    let oldPosXTexCoordIn = 0, oldPosYTexCoordIn = 0;

    let posxTexCoordIn = 0, posyTexCoordIn = 0;
    let posxTexCoord = 0, posyTexCoord = 0;
    let posx = 0, posy = 0;

    const perc = Math.max(0.0, percent.get());
    const verts = [];

    if (drawSpline.get())
    {
        let lastX = 0;
        let lastY = 0;
        const tc = [];
        for (i = 0; i <= segs * perc; i++)
        {
            degInRad = (360 / segs) * i * CGL.DEG2RAD;
            posx = Math.cos(degInRad) * radius.get();
            posy = Math.sin(degInRad) * radius.get();

            posyTexCoord = 0.5;

            if (i > 0)
            {
                verts.push(lastX);
                verts.push(lastY);
                verts.push(0);
                posxTexCoord = 1.0 - (i - 1) / segs;

                tc.push(posxTexCoord, posyTexCoord);
            }
            verts.push(posx);
            verts.push(posy);
            verts.push(0);

            lastX = posx;
            lastY = posy;
        }
        geom.setPointVertices(verts);
    }
    else
    if (innerRadius.get() <= 0)
    {
        for (i = 0; i <= segs * perc; i++)
        {
            degInRad = (360 / segs) * i * CGL.DEG2RAD;
            posx = Math.cos(degInRad) * radius.get();
            posy = Math.sin(degInRad) * radius.get();

            if (mapping.get() == "flat")
            {
                posxTexCoord = (Math.cos(degInRad) + 1.0) / 2;
                posyTexCoord = 1.0 - (Math.sin(degInRad) + 1.0) / 2;
                posxTexCoordIn = 0.5;
                posyTexCoordIn = 0.5;
            }
            else if (mapping.get() == "round")
            {
                posxTexCoord = 1.0 - i / segs;
                posyTexCoord = 0;
                posxTexCoordIn = posxTexCoord;
                posyTexCoordIn = 1;
            }

            faces.push(
                [posx, posy, 0],
                [oldPosX, oldPosY, 0],
                [0, 0, 0]
            );

            texCoords.push(posxTexCoord, posyTexCoord, oldPosXTexCoord, oldPosYTexCoord, posxTexCoordIn, posyTexCoordIn);
            vertexNormals.push(0, 0, 1, 0, 0, 1, 0, 0, 1);
            tangents.push(1, 0, 0, 1, 0, 0, 1, 0, 0);
            biTangents.push(0, 1, 0, 0, 1, 0, 0, 1, 0);

            oldPosXTexCoord = posxTexCoord;
            oldPosYTexCoord = posyTexCoord;

            oldPosX = posx;
            oldPosY = posy;
        }

        geom = CGL.Geometry.buildFromFaces(faces, "circle");
        geom.vertexNormals = vertexNormals;
        geom.tangents = tangents;
        geom.biTangents = biTangents;
        geom.texCoords = texCoords;
    }
    else
    {
        let count = 0;
        const numSteps = segs * perc;
        const pos = 0;

        for (i = 0; i <= numSteps; i++)
        {
            count++;

            degInRad = (360 / segs) * i * CGL.DEG2RAD;
            posx = Math.cos(degInRad) * radius.get();
            posy = Math.sin(degInRad) * radius.get();

            const posxIn = Math.cos(degInRad) * innerRadius.get() * radius.get();
            const posyIn = Math.sin(degInRad) * innerRadius.get() * radius.get();

            if (mapping.get() == "round")
            {
                posxTexCoord = 1.0 - i / segs;
                posyTexCoord = 0;
                posxTexCoordIn = posxTexCoord;
                posyTexCoordIn = 1;
            }

            if (steps.get() === 0.0 ||
                (count % parseInt(steps.get(), 10) === 0 && !invertSteps.get()) ||
                (count % parseInt(steps.get(), 10) !== 0 && invertSteps.get()))
            {
                faces.push(
                    [posx, posy, 0],
                    [oldPosX, oldPosY, 0],
                    [posxIn, posyIn, 0]
                );

                faces.push(
                    [posxIn, posyIn, 0],
                    [oldPosX, oldPosY, 0],
                    [oldPosXIn, oldPosYIn, 0]
                );

                texCoords.push(
                    posxTexCoord, 0,
                    oldPosXTexCoord, 0,
                    posxTexCoordIn, 1,

                    posxTexCoord, 1,
                    oldPosXTexCoord, 0,
                    oldPosXTexCoordIn, 1);

                vertexNormals.push(
                    0, 0, 1, 0, 0, 1, 0, 0, 1,
                    0, 0, 1, 0, 0, 1, 0, 0, 1
                );
                tangents.push(
                    1, 0, 0, 1, 0, 0, 1, 0, 0,
                    1, 0, 0, 1, 0, 0, 1, 0, 0
                );
                biTangents.push(
                    0, 1, 0, 0, 1, 0, 0, 1, 0,
                    0, 1, 0, 0, 1, 0, 0, 1, 0
                );
            }

            oldPosXTexCoordIn = posxTexCoordIn;
            oldPosYTexCoordIn = posyTexCoordIn;

            oldPosXTexCoord = posxTexCoord;
            oldPosYTexCoord = posyTexCoord;

            oldPosX = posx;
            oldPosY = posy;

            oldPosXIn = posxIn;
            oldPosYIn = posyIn;
        }

        geom = CGL.Geometry.buildFromFaces(faces, "circle");
        geom.vertexNormals = vertexNormals;
        geom.tangents = tangents;
        geom.biTangents = biTangents;

        if (mapping.get() == "flat") geom.mapTexCoords2d();
        else geom.texCoords = texCoords;
    }

    geomOut.set(null);
    geomOut.set(geom);

    if (geom.vertices.length == 0) return;
    if (mesh) mesh.dispose();
    mesh = null;
    mesh = new CGL.Mesh(cgl, geom);
    needsCalc = false;
}

function calcLater()
{
    needsCalc = true;
}

op.onDelete = function ()
{
    if (mesh)mesh.dispose();
};

}
};

CABLES.OPS["4db917cc-2cef-43f4-83d5-38c4572fe943"]={f:Ops.Graphics.Meshes.Circle,objName:"Ops.Graphics.Meshes.Circle"};




// **************************************************************
// 
// Ops.Devices.Mouse.Mouse_v2
// 
// **************************************************************

Ops.Devices.Mouse.Mouse_v2= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
// when doing a new version: remove smoothing

const
    active = op.inValueBool("Active", true),
    relative = op.inValueBool("relative"),
    normalize = op.inValueBool("normalize"),
    flipY = op.inValueBool("flip y", true),
    area = op.inValueSelect("Area", ["Canvas", "Document", "Parent Element"], "Canvas"),
    rightClickPrevDef = op.inBool("right click prevent default", true),
    touchscreen = op.inValueBool("Touch support", true),
    smooth = op.inValueBool("smooth"),
    smoothSpeed = op.inValueFloat("smoothSpeed", 20),
    multiply = op.inValueFloat("multiply", 1),
    outMouseX = op.outNumber("x", 0),
    outMouseY = op.outNumber("y", 0),
    mouseDown = op.outBoolNum("button down"),
    mouseClick = op.outTrigger("click"),
    mouseUp = op.outTrigger("Button Up"),
    mouseClickRight = op.outTrigger("click right"),
    mouseOver = op.outBoolNum("mouseOver"),
    outButton = op.outNumber("button");

op.setPortGroup("Behavior", [relative, normalize, flipY, area, rightClickPrevDef, touchscreen]);
op.setPortGroup("Smoothing", [smooth, smoothSpeed, multiply]);

let smoothTimer = 0;
const cgl = op.patch.cgl;
let listenerElement = null;

function setValue(x, y)
{
    if (normalize.get())
    {
        let w = cgl.canvas.width / cgl.pixelDensity;
        let h = cgl.canvas.height / cgl.pixelDensity;
        if (listenerElement == document.body)
        {
            w = listenerElement.clientWidth / cgl.pixelDensity;
            h = listenerElement.clientHeight / cgl.pixelDensity;
        }
        outMouseX.set(((x || 0) / w * 2.0 - 1.0) * multiply.get());
        outMouseY.set(((y || 0) / h * 2.0 - 1.0) * multiply.get());
    }
    else
    {
        outMouseX.set((x || 0) * multiply.get());
        outMouseY.set((y || 0) * multiply.get());
    }
}

smooth.onChange = function ()
{
    if (smooth.get()) smoothTimer = setInterval(updateSmooth, 5);
    else if (smoothTimer)clearTimeout(smoothTimer);
};

let smoothX, smoothY;
let lineX = 0, lineY = 0;

normalize.onChange = function ()
{
    mouseX = 0;
    mouseY = 0;
    setValue(mouseX, mouseY);
};

let mouseX = cgl.canvas.width / 2;
let mouseY = cgl.canvas.height / 2;

lineX = mouseX;
lineY = mouseY;

outMouseX.set(mouseX);
outMouseY.set(mouseY);

let relLastX = 0;
let relLastY = 0;
let offsetX = 0;
let offsetY = 0;
addListeners();

area.onChange = addListeners;

let speed = 0;

function updateSmooth()
{
    speed = smoothSpeed.get();
    if (speed <= 0)speed = 0.01;
    const distanceX = Math.abs(mouseX - lineX);
    const speedX = Math.round(distanceX / speed, 0);
    lineX = (lineX < mouseX) ? lineX + speedX : lineX - speedX;

    const distanceY = Math.abs(mouseY - lineY);
    const speedY = Math.round(distanceY / speed, 0);
    lineY = (lineY < mouseY) ? lineY + speedY : lineY - speedY;

    setValue(lineX, lineY);
}

function onMouseEnter(e)
{
    mouseDown.set(false);
    mouseOver.set(true);
    speed = smoothSpeed.get();
}

function onMouseDown(e)
{
    outButton.set(e.which);
    mouseDown.set(true);
}

function onMouseUp(e)
{
    outButton.set(0);
    mouseDown.set(false);
    mouseUp.trigger();
}

function onClickRight(e)
{
    mouseClickRight.trigger();
    if (rightClickPrevDef.get()) e.preventDefault();
}

function onmouseclick(e)
{
    mouseClick.trigger();
}

function onMouseLeave(e)
{
    relLastX = 0;
    relLastY = 0;

    speed = 100;

    // disabled for now as it makes no sense that the mouse bounces back to the center
    // if(area.get()!='Document')
    // {
    //     // leave anim
    //     if(smooth.get())
    //     {
    //         mouseX=cgl.canvas.width/2;
    //         mouseY=cgl.canvas.height/2;
    //     }

    // }
    mouseOver.set(false);
    mouseDown.set(false);
}

relative.onChange = function ()
{
    offsetX = 0;
    offsetY = 0;
};

function setCoords(e)
{
    if (!relative.get())
    {
        if (area.get() != "Document")
        {
            offsetX = e.offsetX;
            offsetY = e.offsetY;
        }
        else
        {
            offsetX = e.clientX;
            offsetY = e.clientY;
        }

        if (smooth.get())
        {
            mouseX = offsetX;

            if (flipY.get()) mouseY = listenerElement.clientHeight - offsetY;
            else mouseY = offsetY;
        }
        else
        {
            if (flipY.get()) setValue(offsetX, listenerElement.clientHeight - offsetY);
            else setValue(offsetX, offsetY);
        }
    }
    else
    {
        if (relLastX != 0 && relLastY != 0)
        {
            offsetX = e.offsetX - relLastX;
            offsetY = e.offsetY - relLastY;
        }
        else
        {

        }

        relLastX = e.offsetX;
        relLastY = e.offsetY;

        mouseX += offsetX;
        mouseY += offsetY;

        if (mouseY > 460)mouseY = 460;
    }
}

function onmousemove(e)
{
    mouseOver.set(true);
    setCoords(e);
}

function ontouchmove(e)
{
    if (event.touches && event.touches.length > 0) setCoords(e.touches[0]);
}

function ontouchstart(event)
{
    mouseDown.set(true);

    if (event.touches && event.touches.length > 0) onMouseDown(event.touches[0]);
}

function ontouchend(event)
{
    mouseDown.set(false);
    onMouseUp();
}

touchscreen.onChange = function ()
{
    removeListeners();
    addListeners();
};

function removeListeners()
{
    if (!listenerElement) return;
    listenerElement.removeEventListener("touchend", ontouchend);
    listenerElement.removeEventListener("touchstart", ontouchstart);
    listenerElement.removeEventListener("touchmove", ontouchmove);

    listenerElement.removeEventListener("click", onmouseclick);
    listenerElement.removeEventListener("mousemove", onmousemove);
    listenerElement.removeEventListener("mouseleave", onMouseLeave);
    listenerElement.removeEventListener("mousedown", onMouseDown);
    listenerElement.removeEventListener("mouseup", onMouseUp);
    listenerElement.removeEventListener("mouseenter", onMouseEnter);
    listenerElement.removeEventListener("contextmenu", onClickRight);
    listenerElement = null;
}

function addListeners()
{
    if (listenerElement || !active.get())removeListeners();
    if (!active.get()) return;

    listenerElement = cgl.canvas;
    if (area.get() == "Document") listenerElement = document.body;
    if (area.get() == "Parent Element") listenerElement = cgl.canvas.parentElement;

    if (touchscreen.get())
    {
        listenerElement.addEventListener("touchend", ontouchend);
        listenerElement.addEventListener("touchstart", ontouchstart);
        listenerElement.addEventListener("touchmove", ontouchmove);
    }

    listenerElement.addEventListener("mousemove", onmousemove);
    listenerElement.addEventListener("mouseleave", onMouseLeave);
    listenerElement.addEventListener("mousedown", onMouseDown);
    listenerElement.addEventListener("mouseup", onMouseUp);
    listenerElement.addEventListener("mouseenter", onMouseEnter);
    listenerElement.addEventListener("contextmenu", onClickRight);
    listenerElement.addEventListener("click", onmouseclick);
}

active.onChange = function ()
{
    if (listenerElement)removeListeners();
    if (active.get())addListeners();
};

op.onDelete = function ()
{
    removeListeners();
};

addListeners();

}
};

CABLES.OPS["9fa3fc46-3147-4e3a-8ee8-a93ea9e8786e"]={f:Ops.Devices.Mouse.Mouse_v2,objName:"Ops.Devices.Mouse.Mouse_v2"};




// **************************************************************
// 
// Ops.Extension.Deprecated.CircleMovement_v2
// 
// **************************************************************

Ops.Extension.Deprecated.CircleMovement_v2= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    duration = op.inFloat("Duration ", 10),
    offset = op.inValueFloat("offset"),
    inTime = op.inValue("Time", 0),
    segments = op.inValueInt("segments", 40),
    radius = op.inValueFloat("radius", 1),
    mulX = op.inValueFloat("mulX", 1),
    mulY = op.inValueFloat("mulY", 1),
    // percent=op.inValueSlider("percent"),
    trigger = op.outTrigger("trigger"),
    index = op.outValue("index"),
    outX = op.outValue("X"),
    outY = op.outValue("Y");

op.setPortGroup("Time", [duration, offset, inTime]);

const cgl = op.patch.cgl;
const animX = new CABLES.Anim();
const animY = new CABLES.Anim();
const pos = [];
animX.loop = true;
animY.loop = true;

segments.onChange = calc;

calc();

render.onTriggered = function ()
{
    cgl.pushModelMatrix();

    let time = inTime.get() / duration.get();// +Math.round(segments.get())*0.1*percent.get();

    time += offset.get();

    let x = animX.getValue(time) * mulX.get() * radius.get();
    let y = animY.getValue(time) * mulY.get() * radius.get();

    outX.set(x);
    outY.set(y);

    mat4.translate(cgl.mMatrix, cgl.mMatrix, [x, y, 0]);

    trigger.trigger();

    cgl.popModelMatrix();
};

function calc()
{
    pos.length = 0;
    let i = 0, degInRad = 0;
    animX.clear();
    animY.clear();

    for (i = 0; i <= Math.round(segments.get()); i++)
    {
        index.set(i);
        degInRad = (360 / Math.round(segments.get())) * i * CGL.DEG2RAD;
        animX.setValue(i / segments.get(), Math.cos(degInRad));
        animY.setValue(i / segments.get(), Math.sin(degInRad));
    }
}

}
};

CABLES.OPS["2101aee7-e890-4efb-b891-e180c382e560"]={f:Ops.Extension.Deprecated.CircleMovement_v2,objName:"Ops.Extension.Deprecated.CircleMovement_v2"};




// **************************************************************
// 
// Ops.Anim.Timer_v2
// 
// **************************************************************

Ops.Anim.Timer_v2= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const
    inSpeed = op.inValue("Speed", 1),
    playPause = op.inValueBool("Play", true),
    reset = op.inTriggerButton("Reset"),
    inSyncTimeline = op.inValueBool("Sync to timeline", false),
    outTime = op.outNumber("Time");

op.setPortGroup("Controls", [playPause, reset, inSpeed]);

const timer = new CABLES.Timer();
let lastTime = null;
let time = 0;
let syncTimeline = false;

playPause.onChange = setState;
setState();

function setState()
{
    if (playPause.get())
    {
        timer.play();
        op.patch.addOnAnimFrame(op);
    }
    else
    {
        timer.pause();
        op.patch.removeOnAnimFrame(op);
    }
}

reset.onTriggered = doReset;

function doReset()
{
    time = 0;
    lastTime = null;
    timer.setTime(0);
    outTime.set(0);
}

inSyncTimeline.onChange = function ()
{
    syncTimeline = inSyncTimeline.get();
    playPause.setUiAttribs({ "greyout": syncTimeline });
    reset.setUiAttribs({ "greyout": syncTimeline });
};

op.onAnimFrame = function (tt, frameNum, deltaMs)
{
    if (timer.isPlaying())
    {
        if (CABLES.overwriteTime !== undefined)
        {
            outTime.set(CABLES.overwriteTime * inSpeed.get());
        }
        else

        if (syncTimeline)
        {
            outTime.set(tt * inSpeed.get());
        }
        else
        {
            timer.update();

            const timerVal = timer.get();

            if (lastTime === null)
            {
                lastTime = timerVal;
                return;
            }

            const t = Math.abs(timerVal - lastTime);
            lastTime = timerVal;

            time += t * inSpeed.get();
            if (time != time)time = 0;
            outTime.set(time);
        }
    }
};

}
};

CABLES.OPS["aac7f721-208f-411a-adb3-79adae2e471a"]={f:Ops.Anim.Timer_v2,objName:"Ops.Anim.Timer_v2"};




// **************************************************************
// 
// Ops.Math.Multiply
// 
// **************************************************************

Ops.Math.Multiply= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const
    number1 = op.inValueFloat("number1", 1),
    number2 = op.inValueFloat("number2", 1),
    result = op.outNumber("result");

op.setUiAttribs({ "mathTitle": true });

number1.onChange = number2.onChange = update;
update();

function update()
{
    const n1 = number1.get();
    const n2 = number2.get();

    result.set(n1 * n2);
}

}
};

CABLES.OPS["1bbdae06-fbb2-489b-9bcc-36c9d65bd441"]={f:Ops.Math.Multiply,objName:"Ops.Math.Multiply"};




// **************************************************************
// 
// Ops.Gl.Meshes.FullscreenRectangle
// 
// **************************************************************

Ops.Gl.Meshes.FullscreenRectangle= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={"shader_frag":"UNI sampler2D tex;\nIN vec2 texCoord;\n\nvoid main()\n{\n    outColor= texture(tex,texCoord);\n}\n\n","shader_vert":"{{MODULES_HEAD}}\n\nIN vec3 vPosition;\nUNI mat4 projMatrix;\nUNI mat4 mvMatrix;\n\nOUT vec2 texCoord;\nIN vec2 attrTexCoord;\n\nvoid main()\n{\n   vec4 pos=vec4(vPosition,  1.0);\n\n   texCoord=vec2(attrTexCoord.x,(1.0-attrTexCoord.y));\n\n   gl_Position = projMatrix * mvMatrix * pos;\n}\n",};
const
    render = op.inTrigger("render"),
    inScale = op.inSwitch("Scale", ["Stretch", "Fit"], "Fit"),
    flipY = op.inValueBool("Flip Y"),
    flipX = op.inValueBool("Flip X"),
    inTexture = op.inTexture("Texture"),
    trigger = op.outTrigger("trigger");

const cgl = op.patch.cgl;
let mesh = null;
let geom = new CGL.Geometry("fullscreen rectangle");
let x = 0, y = 0, z = 0, w = 0, h = 0;

op.toWorkShouldNotBeChild("Ops.Gl.TextureEffects.ImageCompose", CABLES.OP_PORT_TYPE_FUNCTION);
op.toWorkPortsNeedToBeLinked(render);

flipX.onChange = rebuildFlip;
flipY.onChange = rebuildFlip;
render.onTriggered = doRender;
inTexture.onLinkChanged = updateUi;
inScale.onChange = updateScale;

const shader = new CGL.Shader(cgl, "fullscreenrectangle", this);
shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG"]);

shader.setSource(attachments.shader_vert, attachments.shader_frag);
shader.fullscreenRectUniform = new CGL.Uniform(shader, "t", "tex", 0);
shader.aspectUni = new CGL.Uniform(shader, "f", "aspectTex", 0);

let useShader = false;
let updateShaderLater = true;
let fitImageAspect = false;
let oldVp = [];

updateUi();
updateScale();

op.onDelete = function () { if (mesh)mesh.dispose(); };

inTexture.onChange = function ()
{
    updateShaderLater = true;
};

function updateUi()
{
    if (!CABLES.UI) return;
    flipY.setUiAttribs({ "greyout": !inTexture.isLinked() });
    flipX.setUiAttribs({ "greyout": !inTexture.isLinked() });
    inScale.setUiAttribs({ "greyout": !inTexture.isLinked() });
}

function updateShader()
{
    let tex = inTexture.get();
    if (tex) useShader = true;
    else useShader = false;
}

op.preRender = function ()
{
    updateShader();
    shader.bind();
    if (mesh)mesh.render(shader);
    doRender();
};

function updateScale()
{
    fitImageAspect = inScale.get() == "Fit";
}

function doRender()
{
    if (cgl.getViewPort()[2] != w || cgl.getViewPort()[3] != h || !mesh) rebuild();

    if (updateShaderLater) updateShader();

    cgl.pushPMatrix();
    mat4.identity(cgl.pMatrix);
    mat4.ortho(cgl.pMatrix, 0, w, h, 0, -10.0, 1000);

    cgl.pushModelMatrix();
    mat4.identity(cgl.mMatrix);

    cgl.pushViewMatrix();
    mat4.identity(cgl.vMatrix);

    if (fitImageAspect && inTexture.get())
    {
        const rat = inTexture.get().width / inTexture.get().height;

        let _h = h;
        let _w = h * rat;

        if (_w > w)
        {
            _h = w * 1 / rat;
            _w = w;
        }

        oldVp[0] = cgl.getViewPort()[0];
        oldVp[1] = cgl.getViewPort()[1];
        oldVp[2] = cgl.getViewPort()[2];
        oldVp[3] = cgl.getViewPort()[3];

        cgl.setViewPort((w - _w) / 2, (h - _h) / 2, _w, _h);
    }

    if (useShader)
    {
        if (inTexture.get())
            cgl.setTexture(0, inTexture.get().tex);

        mesh.render(shader);
    }
    else
    {
        mesh.render(cgl.getShader());
    }

    // if (trigger.isLinked())
    cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);

    cgl.popPMatrix();
    cgl.popModelMatrix();
    cgl.popViewMatrix();

    if (fitImageAspect && inTexture.get())
        cgl.setViewPort(oldVp[0], oldVp[1], oldVp[2], oldVp[3]);

    trigger.trigger();
}

function rebuildFlip()
{
    mesh = null;
}

function rebuild()
{
    const currentViewPort = cgl.getViewPort();

    if (currentViewPort[2] == w && currentViewPort[3] == h && mesh) return;

    let xx = 0, xy = 0;

    w = currentViewPort[2];
    h = currentViewPort[3];

    geom.vertices = new Float32Array([
        xx + w, xy + h, 0.0,
        xx, xy + h, 0.0,
        xx + w, xy, 0.0,
        xx, xy, 0.0
    ]);

    let tc = null;

    if (flipY.get())
        tc = new Float32Array([
            1.0, 0.0,
            0.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ]);
    else
        tc = new Float32Array([
            1.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ]);

    if (flipX.get())
    {
        tc[0] = 0.0;
        tc[2] = 1.0;
        tc[4] = 0.0;
        tc[6] = 1.0;
    }

    geom.setTexCoords(tc);

    geom.verticesIndices = new Uint16Array([
        2, 1, 0,
        3, 1, 2
    ]);

    geom.vertexNormals = new Float32Array([
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
    ]);
    geom.tangents = new Float32Array([
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0]);
    geom.biTangents == new Float32Array([
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0]);

    if (!mesh) mesh = new CGL.Mesh(cgl, geom);
    else mesh.setGeom(geom);
}

}
};

CABLES.OPS["255bd15b-cc91-4a12-9b4e-53c710cbb282"]={f:Ops.Gl.Meshes.FullscreenRectangle,objName:"Ops.Gl.Meshes.FullscreenRectangle"};




// **************************************************************
// 
// Ops.Gl.Matrix.ScreenPosTo3d_v3
// 
// **************************************************************

Ops.Gl.Matrix.ScreenPosTo3d_v3= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const
    exec = op.inTrigger("Exec"),
    inX = op.inValue("X"),
    inY = op.inValue("Y"),
    inputType = op.inSwitch("Input Type", ["Pixel", "-1 to 1"], "Pixel"),
    outTrigger = op.outTrigger("Trigger out"),
    outX = op.outNumber("Result X"),
    outY = op.outNumber("Result Y");

const mat = mat4.create();
const cgl = op.patch.cgl;

exec.onTriggered = calc;

let inp = 0;
inputType.onChange = () =>
{
    if (inputType.get() == "Pixel")inp = 0;
    else if (inputType.get() == "-1 to 1")inp = 1;
};

function calc()
{
    let x = 0;
    let y = 0;

    let aspect = cgl.canvas.clientWidth / cgl.canvas.clientHeight;

    if (inp === 0) // pixel
    {
        x = 2.0 * inX.get() / cgl.canvas.clientWidth - 1;
        y = -2.0 * inY.get() / cgl.canvas.clientHeight + 1;
    }
    else if (inp === 1) // -1 to 1
    {
        x = inX.get();
        y = inY.get();
    }

    let point3d = vec3.fromValues(x, y, 0);

    mat4.mul(mat, cgl.pMatrix, cgl.vMatrix);

    mat4.invert(mat, mat);

    vec3.transformMat4(point3d, point3d, mat);

    outX.set(point3d[0] * 10);
    outY.set(point3d[1] * 10);
    outTrigger.trigger();
}

}
};

CABLES.OPS["48d72532-afa6-40c9-a895-00a43635a94b"]={f:Ops.Gl.Matrix.ScreenPosTo3d_v3,objName:"Ops.Gl.Matrix.ScreenPosTo3d_v3"};




// **************************************************************
// 
// Ops.Graphics.Transform
// 
// **************************************************************

Ops.Graphics.Transform= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const
    render = op.inTrigger("render"),
    posX = op.inValue("posX", 0),
    posY = op.inValue("posY", 0),
    posZ = op.inValue("posZ", 0),
    scale = op.inValue("scale", 1),
    rotX = op.inValue("rotX", 0),
    rotY = op.inValue("rotY", 0),
    rotZ = op.inValue("rotZ", 0),
    trigger = op.outTrigger("trigger");

op.setPortGroup("Rotation", [rotX, rotY, rotZ]);
op.setPortGroup("Position", [posX, posY, posZ]);
op.setPortGroup("Scale", [scale]);
op.setUiAxisPorts(posX, posY, posZ);

op.toWorkPortsNeedToBeLinked(render, trigger);

const vPos = vec3.create();
const vScale = vec3.create();
const transMatrix = mat4.create();
mat4.identity(transMatrix);

let
    doScale = false,
    doTranslate = false,
    translationChanged = true,
    scaleChanged = true,
    rotChanged = true;

rotX.onChange = rotY.onChange = rotZ.onChange = setRotChanged;
posX.onChange = posY.onChange = posZ.onChange = setTranslateChanged;
scale.onChange = setScaleChanged;

render.onTriggered = function ()
{
    // if(!CGL.TextureEffect.checkOpNotInTextureEffect(op)) return;

    let updateMatrix = false;
    if (translationChanged)
    {
        updateTranslation();
        updateMatrix = true;
    }
    if (scaleChanged)
    {
        updateScale();
        updateMatrix = true;
    }
    if (rotChanged) updateMatrix = true;

    if (updateMatrix) doUpdateMatrix();

    const cg = op.patch.cg || op.patch.cgl;
    cg.pushModelMatrix();
    mat4.multiply(cg.mMatrix, cg.mMatrix, transMatrix);

    trigger.trigger();
    cg.popModelMatrix();

    if (CABLES.UI)
    {
        if (!posX.isLinked() && !posY.isLinked() && !posZ.isLinked())
        {
            gui.setTransform(op.id, posX.get(), posY.get(), posZ.get());

            if (op.isCurrentUiOp())
                gui.setTransformGizmo(
                    {
                        "posX": posX,
                        "posY": posY,
                        "posZ": posZ,
                    });
        }
    }
};

// op.transform3d = function ()
// {
//     return { "pos": [posX, posY, posZ] };
// };

function doUpdateMatrix()
{
    mat4.identity(transMatrix);
    if (doTranslate)mat4.translate(transMatrix, transMatrix, vPos);

    if (rotX.get() !== 0)mat4.rotateX(transMatrix, transMatrix, rotX.get() * CGL.DEG2RAD);
    if (rotY.get() !== 0)mat4.rotateY(transMatrix, transMatrix, rotY.get() * CGL.DEG2RAD);
    if (rotZ.get() !== 0)mat4.rotateZ(transMatrix, transMatrix, rotZ.get() * CGL.DEG2RAD);

    if (doScale)mat4.scale(transMatrix, transMatrix, vScale);
    rotChanged = false;
}

function updateTranslation()
{
    doTranslate = false;
    if (posX.get() !== 0.0 || posY.get() !== 0.0 || posZ.get() !== 0.0) doTranslate = true;
    vec3.set(vPos, posX.get(), posY.get(), posZ.get());
    translationChanged = false;
}

function updateScale()
{
    // doScale=false;
    // if(scale.get()!==0.0)
    doScale = true;
    vec3.set(vScale, scale.get(), scale.get(), scale.get());
    scaleChanged = false;
}

function setTranslateChanged()
{
    translationChanged = true;
}

function setScaleChanged()
{
    scaleChanged = true;
}

function setRotChanged()
{
    rotChanged = true;
}

doUpdateMatrix();

}
};

CABLES.OPS["650baeb1-db2d-4781-9af6-ab4e9d4277be"]={f:Ops.Graphics.Transform,objName:"Ops.Graphics.Transform"};




// **************************************************************
// 
// Ops.Gl.Shader.BasicMaterial_v3
// 
// **************************************************************

Ops.Gl.Shader.BasicMaterial_v3= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={"basicmaterial_frag":"{{MODULES_HEAD}}\n\nIN vec2 texCoord;\n\n#ifdef VERTEX_COLORS\nIN vec4 vertCol;\n#endif\n\n#ifdef HAS_TEXTURES\n    IN vec2 texCoordOrig;\n    #ifdef HAS_TEXTURE_DIFFUSE\n        UNI sampler2D tex;\n    #endif\n    #ifdef HAS_TEXTURE_OPACITY\n        UNI sampler2D texOpacity;\n   #endif\n#endif\n\n\n\nvoid main()\n{\n    {{MODULE_BEGIN_FRAG}}\n    vec4 col=color;\n\n\n    #ifdef HAS_TEXTURES\n        vec2 uv=texCoord;\n\n        #ifdef CROP_TEXCOORDS\n            if(uv.x<0.0 || uv.x>1.0 || uv.y<0.0 || uv.y>1.0) discard;\n        #endif\n\n        #ifdef HAS_TEXTURE_DIFFUSE\n            col=texture(tex,uv);\n\n            #ifdef COLORIZE_TEXTURE\n                col.r*=color.r;\n                col.g*=color.g;\n                col.b*=color.b;\n            #endif\n        #endif\n        col.a*=color.a;\n        #ifdef HAS_TEXTURE_OPACITY\n            #ifdef TRANSFORMALPHATEXCOORDS\n                uv=texCoordOrig;\n            #endif\n            #ifdef ALPHA_MASK_IR\n                col.a*=1.0-texture(texOpacity,uv).r;\n            #endif\n            #ifdef ALPHA_MASK_IALPHA\n                col.a*=1.0-texture(texOpacity,uv).a;\n            #endif\n            #ifdef ALPHA_MASK_ALPHA\n                col.a*=texture(texOpacity,uv).a;\n            #endif\n            #ifdef ALPHA_MASK_LUMI\n                col.a*=dot(vec3(0.2126,0.7152,0.0722), texture(texOpacity,uv).rgb);\n            #endif\n            #ifdef ALPHA_MASK_R\n                col.a*=texture(texOpacity,uv).r;\n            #endif\n            #ifdef ALPHA_MASK_G\n                col.a*=texture(texOpacity,uv).g;\n            #endif\n            #ifdef ALPHA_MASK_B\n                col.a*=texture(texOpacity,uv).b;\n            #endif\n            // #endif\n        #endif\n    #endif\n\n    {{MODULE_COLOR}}\n\n    #ifdef DISCARDTRANS\n        if(col.a<0.2) discard;\n    #endif\n\n    #ifdef VERTEX_COLORS\n        col*=vertCol;\n    #endif\n\n    outColor = col;\n}\n","basicmaterial_vert":"\n{{MODULES_HEAD}}\n\nOUT vec2 texCoord;\nOUT vec2 texCoordOrig;\n\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\n#ifdef HAS_TEXTURES\n    UNI float diffuseRepeatX;\n    UNI float diffuseRepeatY;\n    UNI float texOffsetX;\n    UNI float texOffsetY;\n#endif\n\n#ifdef VERTEX_COLORS\n    in vec4 attrVertColor;\n    out vec4 vertCol;\n\n#endif\n\n\nvoid main()\n{\n    mat4 mMatrix=modelMatrix;\n    mat4 modelViewMatrix;\n\n    norm=attrVertNormal;\n    texCoordOrig=attrTexCoord;\n    texCoord=attrTexCoord;\n    #ifdef HAS_TEXTURES\n        texCoord.x=texCoord.x*diffuseRepeatX+texOffsetX;\n        texCoord.y=(1.0-texCoord.y)*diffuseRepeatY+texOffsetY;\n    #endif\n\n    #ifdef VERTEX_COLORS\n        vertCol=attrVertColor;\n    #endif\n\n    vec4 pos = vec4(vPosition, 1.0);\n\n    #ifdef BILLBOARD\n       vec3 position=vPosition;\n       modelViewMatrix=viewMatrix*modelMatrix;\n\n       gl_Position = projMatrix * modelViewMatrix * vec4((\n           position.x * vec3(\n               modelViewMatrix[0][0],\n               modelViewMatrix[1][0],\n               modelViewMatrix[2][0] ) +\n           position.y * vec3(\n               modelViewMatrix[0][1],\n               modelViewMatrix[1][1],\n               modelViewMatrix[2][1]) ), 1.0);\n    #endif\n\n    {{MODULE_VERTEX_POSITION}}\n\n    #ifndef BILLBOARD\n        modelViewMatrix=viewMatrix * mMatrix;\n\n        {{MODULE_VERTEX_MODELVIEW}}\n\n    #endif\n\n    // mat4 modelViewMatrix=viewMatrix*mMatrix;\n\n    #ifndef BILLBOARD\n        // gl_Position = projMatrix * viewMatrix * modelMatrix * pos;\n        gl_Position = projMatrix * modelViewMatrix * pos;\n    #endif\n}\n",};
const render = op.inTrigger("render");
const trigger = op.outTrigger("trigger");
const shaderOut = op.outObject("shader", null, "shader");

shaderOut.ignoreValueSerialize = true;

op.toWorkPortsNeedToBeLinked(render);
op.toWorkShouldNotBeChild("Ops.Gl.TextureEffects.ImageCompose", CABLES.OP_PORT_TYPE_FUNCTION);

const cgl = op.patch.cgl;

const shader = new CGL.Shader(cgl, "basicmaterial", this);
shader.addAttribute({ "type": "vec3", "name": "vPosition" });
shader.addAttribute({ "type": "vec2", "name": "attrTexCoord" });
shader.addAttribute({ "type": "vec3", "name": "attrVertNormal", "nameFrag": "norm" });
shader.addAttribute({ "type": "float", "name": "attrVertIndex" });

shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG", "MODULE_VERTEX_MODELVIEW"]);

shader.setSource(attachments.basicmaterial_vert, attachments.basicmaterial_frag);

shaderOut.setRef(shader);

render.onTriggered = doRender;

// rgba colors
const r = op.inValueSlider("r", Math.random());
const g = op.inValueSlider("g", Math.random());
const b = op.inValueSlider("b", Math.random());
const a = op.inValueSlider("a", 1);
r.setUiAttribs({ "colorPick": true });

// const uniColor=new CGL.Uniform(shader,'4f','color',r,g,b,a);
const colUni = shader.addUniformFrag("4f", "color", r, g, b, a);

shader.uniformColorDiffuse = colUni;

// diffuse outTexture

const diffuseTexture = op.inTexture("texture");
let diffuseTextureUniform = null;
diffuseTexture.onChange = updateDiffuseTexture;

const colorizeTexture = op.inValueBool("colorizeTexture", false);
const vertexColors = op.inValueBool("Vertex Colors", false);

// opacity texture
const textureOpacity = op.inTexture("textureOpacity");
let textureOpacityUniform = null;

const alphaMaskSource = op.inSwitch("Alpha Mask Source", ["Luminance", "R", "G", "B", "A", "1-A", "1-R"], "Luminance");
alphaMaskSource.setUiAttribs({ "greyout": true });
textureOpacity.onChange = updateOpacity;

const texCoordAlpha = op.inValueBool("Opacity TexCoords Transform", false);
const discardTransPxl = op.inValueBool("Discard Transparent Pixels");

// texture coords
const
    diffuseRepeatX = op.inValue("diffuseRepeatX", 1),
    diffuseRepeatY = op.inValue("diffuseRepeatY", 1),
    diffuseOffsetX = op.inValue("Tex Offset X", 0),
    diffuseOffsetY = op.inValue("Tex Offset Y", 0),
    cropRepeat = op.inBool("Crop TexCoords", false);

shader.addUniformFrag("f", "diffuseRepeatX", diffuseRepeatX);
shader.addUniformFrag("f", "diffuseRepeatY", diffuseRepeatY);
shader.addUniformFrag("f", "texOffsetX", diffuseOffsetX);
shader.addUniformFrag("f", "texOffsetY", diffuseOffsetY);

const doBillboard = op.inValueBool("billboard", false);

alphaMaskSource.onChange =
    doBillboard.onChange =
    discardTransPxl.onChange =
    texCoordAlpha.onChange =
    cropRepeat.onChange =
    vertexColors.onChange =
    colorizeTexture.onChange = updateDefines;

op.setPortGroup("Color", [r, g, b, a]);
op.setPortGroup("Color Texture", [diffuseTexture, vertexColors, colorizeTexture]);
op.setPortGroup("Opacity", [textureOpacity, alphaMaskSource, discardTransPxl, texCoordAlpha]);
op.setPortGroup("Texture Transform", [diffuseRepeatX, diffuseRepeatY, diffuseOffsetX, diffuseOffsetY, cropRepeat]);

updateOpacity();
updateDiffuseTexture();

op.preRender = function ()
{
    shader.bind();
    doRender();
    if (!shader) return;
};

function doRender()
{
    op.checkGraphicsApi();
    cgl.pushShader(shader);
    shader.popTextures();

    if (diffuseTextureUniform && diffuseTexture.get()) shader.pushTexture(diffuseTextureUniform, diffuseTexture.get());
    if (textureOpacityUniform && textureOpacity.get()) shader.pushTexture(textureOpacityUniform, textureOpacity.get());

    trigger.trigger();

    cgl.popShader();
}

function updateOpacity()
{
    if (textureOpacity.get())
    {
        if (textureOpacityUniform !== null) return;
        shader.removeUniform("texOpacity");
        shader.define("HAS_TEXTURE_OPACITY");
        if (!textureOpacityUniform)textureOpacityUniform = new CGL.Uniform(shader, "t", "texOpacity");
    }
    else
    {
        shader.removeUniform("texOpacity");
        shader.removeDefine("HAS_TEXTURE_OPACITY");
        textureOpacityUniform = null;
    }

    updateDefines();
}

function updateDiffuseTexture()
{
    if (diffuseTexture.get())
    {
        if (!shader.hasDefine("HAS_TEXTURE_DIFFUSE"))shader.define("HAS_TEXTURE_DIFFUSE");
        if (!diffuseTextureUniform)diffuseTextureUniform = new CGL.Uniform(shader, "t", "texDiffuse");
    }
    else
    {
        shader.removeUniform("texDiffuse");
        shader.removeDefine("HAS_TEXTURE_DIFFUSE");
        diffuseTextureUniform = null;
    }
    updateUi();
}

function updateUi()
{
    const hasTexture = diffuseTexture.isLinked() || textureOpacity.isLinked();
    diffuseRepeatX.setUiAttribs({ "greyout": !hasTexture });
    diffuseRepeatY.setUiAttribs({ "greyout": !hasTexture });
    diffuseOffsetX.setUiAttribs({ "greyout": !hasTexture });
    diffuseOffsetY.setUiAttribs({ "greyout": !hasTexture });
    colorizeTexture.setUiAttribs({ "greyout": !hasTexture });

    alphaMaskSource.setUiAttribs({ "greyout": !textureOpacity.get() });
    texCoordAlpha.setUiAttribs({ "greyout": !textureOpacity.get() });

    let notUsingColor = true;
    notUsingColor = diffuseTexture.get() && !colorizeTexture.get();
    r.setUiAttribs({ "greyout": notUsingColor });
    g.setUiAttribs({ "greyout": notUsingColor });
    b.setUiAttribs({ "greyout": notUsingColor });
}

function updateDefines()
{
    shader.toggleDefine("VERTEX_COLORS", vertexColors.get());
    shader.toggleDefine("CROP_TEXCOORDS", cropRepeat.get());
    shader.toggleDefine("COLORIZE_TEXTURE", colorizeTexture.get());
    shader.toggleDefine("TRANSFORMALPHATEXCOORDS", texCoordAlpha.get());
    shader.toggleDefine("DISCARDTRANS", discardTransPxl.get());
    shader.toggleDefine("BILLBOARD", doBillboard.get());

    shader.toggleDefine("ALPHA_MASK_ALPHA", alphaMaskSource.get() == "A");
    shader.toggleDefine("ALPHA_MASK_IALPHA", alphaMaskSource.get() == "1-A");
    shader.toggleDefine("ALPHA_MASK_IR", alphaMaskSource.get() == "1-R");
    shader.toggleDefine("ALPHA_MASK_LUMI", alphaMaskSource.get() == "Luminance");
    shader.toggleDefine("ALPHA_MASK_R", alphaMaskSource.get() == "R");
    shader.toggleDefine("ALPHA_MASK_G", alphaMaskSource.get() == "G");
    shader.toggleDefine("ALPHA_MASK_B", alphaMaskSource.get() == "B");
    updateUi();
}

}
};

CABLES.OPS["ec55d252-3843-41b1-b731-0482dbd9e72b"]={f:Ops.Gl.Shader.BasicMaterial_v3,objName:"Ops.Gl.Shader.BasicMaterial_v3"};




// **************************************************************
// 
// Ops.Math.Math
// 
// **************************************************************

Ops.Math.Math= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const num0 = op.inFloat("number 0", 0),
    num1 = op.inFloat("number 1", 0),
    mathDropDown = op.inSwitch("math mode", ["+", "-", "*", "/", "%", "min", "max"], "+"),
    result = op.outNumber("result");

let mathFunc;

num0.onChange = num1.onChange = update;
mathDropDown.onChange = onFilterChange;

let n0 = 0;
let n1 = 0;

const mathFuncAdd = function (a, b) { return a + b; };
const mathFuncSub = function (a, b) { return a - b; };
const mathFuncMul = function (a, b) { return a * b; };
const mathFuncDiv = function (a, b) { return a / b; };
const mathFuncMod = function (a, b) { return a % b; };
const mathFuncMin = function (a, b) { return Math.min(a, b); };
const mathFuncMax = function (a, b) { return Math.max(a, b); };

function onFilterChange()
{
    let mathSelectValue = mathDropDown.get();

    if (mathSelectValue == "+") mathFunc = mathFuncAdd;
    else if (mathSelectValue == "-") mathFunc = mathFuncSub;
    else if (mathSelectValue == "*") mathFunc = mathFuncMul;
    else if (mathSelectValue == "/") mathFunc = mathFuncDiv;
    else if (mathSelectValue == "%") mathFunc = mathFuncMod;
    else if (mathSelectValue == "min") mathFunc = mathFuncMin;
    else if (mathSelectValue == "max") mathFunc = mathFuncMax;
    update();
    op.setUiAttrib({ "extendTitle": mathSelectValue });
}

function update()
{
    n0 = num0.get();
    n1 = num1.get();

    result.set(mathFunc(n0, n1));
}

onFilterChange();

}
};

CABLES.OPS["e9fdcaca-a007-4563-8a4d-e94e08506e0f"]={f:Ops.Math.Math,objName:"Ops.Math.Math"};




// **************************************************************
// 
// Ops.Math.Speed
// 
// **************************************************************

Ops.Math.Speed= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const
    inExe = op.inTrigger("Update"),
    inVal = op.inValue("Value"),
    result = op.outNumber("Speed");

inVal.alwaysChange = true;

let lastVal = 0;
let lastTime = CABLES.now();
inExe.onTriggered = update;

function update()
{
    let diff = Math.abs(inVal.get() - lastVal);
    let diffTime = CABLES.now() - lastTime;

    let speed = diff * (1000 / diffTime);

    result.set(speed);

    lastVal = inVal.get();
    lastTime = CABLES.now();
}

}
};

CABLES.OPS["ff6b8c7b-00c6-48f2-9b43-d059e52143fe"]={f:Ops.Math.Speed,objName:"Ops.Math.Speed"};




// **************************************************************
// 
// Ops.Math.Sum
// 
// **************************************************************

Ops.Math.Sum= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const
    number1 = op.inValueFloat("number1", 0),
    number2 = op.inValueFloat("number2", 0),
    result = op.outNumber("result");

op.setUiAttribs({ "mathTitle": true });

number1.onChange =
number2.onChange = exec;
exec();

function exec()
{
    const v = number1.get() + number2.get();
    if (!isNaN(v))
        result.set(v);
}

}
};

CABLES.OPS["c8fb181e-0b03-4b41-9e55-06b6267bc634"]={f:Ops.Math.Sum,objName:"Ops.Math.Sum"};




// **************************************************************
// 
// Ops.Math.DeltaSum
// 
// **************************************************************

Ops.Math.DeltaSum= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const
    inVal = op.inValue("Delta Value"),
    defVal = op.inValue("Default Value", 0),
    inMul = op.inValue("Multiply", 1),
    inReset = op.inTriggerButton("Reset"),
    inLimit = op.inValueBool("Limit", false),
    inMin = op.inValue("Min", 0),
    inMax = op.inValue("Max", 100),
    inRubber = op.inValue("Rubberband", 0),
    outVal = op.outNumber("Absolute Value");

inVal.changeAlways = true;

op.setPortGroup("Limit", [inLimit, inMin, inMax, inRubber]);

let value = 0;
let lastEvent = CABLES.now();
let rubTimeout = null;

inLimit.onChange = updateLimit;
defVal.onChange =
    inReset.onTriggered = resetValue;

inMax.onChange =
    inMin.onChange = updateValue;

updateLimit();

function resetValue()
{
    let v = defVal.get();

    if (inLimit.get())
    {
        v = Math.max(inMin.get(), v);
        v = Math.min(inMax.get(), v);
    }

    value = v;
    outVal.set(value);
}

function updateLimit()
{
    inMin.setUiAttribs({ "greyout": !inLimit.get() });
    inMax.setUiAttribs({ "greyout": !inLimit.get() });
    inRubber.setUiAttribs({ "greyout": !inLimit.get() });

    updateValue();
}

function releaseRubberband()
{
    const min = inMin.get();
    const max = inMax.get();

    if (value < min) value = min;
    if (value > max) value = max;

    outVal.set(value);
}

function updateValue()
{
    if (inLimit.get())
    {
        const min = inMin.get();
        const max = inMax.get();
        const rubber = inRubber.get();
        const minr = inMin.get() - rubber;
        const maxr = inMax.get() + rubber;

        if (value < minr) value = minr;
        if (value > maxr) value = maxr;

        if (rubber !== 0.0)
        {
            clearTimeout(rubTimeout);
            rubTimeout = setTimeout(releaseRubberband.bind(this), 300);
        }
    }

    outVal.set(value);
}

inVal.onChange = function ()
{
    let v = inVal.get();

    const rubber = inRubber.get();

    if (rubber !== 0.0)
    {
        const min = inMin.get();
        const max = inMax.get();
        const minr = inMin.get() - rubber;
        const maxr = inMax.get() + rubber;

        if (value < min)
        {
            const aa = Math.abs(value - minr) / rubber;
            v *= (aa * aa);
        }
        if (value > max)
        {
            const aa = Math.abs(maxr - value) / rubber;
            v *= (aa * aa);
        }
    }

    lastEvent = CABLES.now();
    value += v * inMul.get();
    updateValue();
};

}
};

CABLES.OPS["d9d4b3db-c24b-48da-b798-9e6230d861f7"]={f:Ops.Math.DeltaSum,objName:"Ops.Math.DeltaSum"};




// **************************************************************
// 
// Ops.Math.Ease
// 
// **************************************************************

Ops.Math.Ease= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const
    inVal = op.inValue("Value"),
    inMin = op.inValue("Min", 0),
    inMax = op.inValue("Max", 1),
    result = op.outNumber("Result"),
    anim = new CABLES.Anim();

anim.createPort(op, "Easing", updateAnimEasing);
anim.setValue(0, 0);
anim.setValue(1, 1);

op.onLoaded = inMin.onChange = inMax.onChange = updateMinMax;

function updateMinMax()
{
    anim.keys[0].time = anim.keys[0].value = Math.min(inMin.get(), inMax.get());
    anim.keys[1].time = anim.keys[1].value = Math.max(inMin.get(), inMax.get());
}

function updateAnimEasing()
{
    anim.keys[0].setEasing(anim.defaultEasing);
}

inVal.onChange = function ()
{
    const r = anim.getValue(inVal.get());
    result.set(r);
};

}
};

CABLES.OPS["8f6e4a08-33e6-408f-ac4a-198bd03b417b"]={f:Ops.Math.Ease,objName:"Ops.Math.Ease"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.DrawImage_v3
// 
// **************************************************************

Ops.Gl.ImageCompose.DrawImage_v3= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={"drawimage_frag":"#ifdef HAS_TEXTURES\n    IN vec2 texCoord;\n    UNI sampler2D tex;\n    UNI sampler2D image;\n#endif\n\n#ifdef TEX_TRANSFORM\n    IN mat3 transform;\n#endif\n// UNI float rotate;\n\n{{CGL.BLENDMODES}}\n\n#ifdef HAS_TEXTUREALPHA\n   UNI sampler2D imageAlpha;\n#endif\n\nUNI float amount;\n\n#ifdef ASPECT_RATIO\n    UNI float aspectTex;\n    UNI float aspectPos;\n#endif\n\nvoid main()\n{\n    vec4 blendRGBA=vec4(0.0,0.0,0.0,1.0);\n\n    #ifdef HAS_TEXTURES\n        vec2 tc=texCoord;\n\n        #ifdef TEX_FLIP_X\n            tc.x=1.0-tc.x;\n        #endif\n        #ifdef TEX_FLIP_Y\n            tc.y=1.0-tc.y;\n        #endif\n\n        #ifdef ASPECT_RATIO\n            #ifdef ASPECT_AXIS_X\n                tc.y=(1.0-aspectPos)-(((1.0-aspectPos)-tc.y)*aspectTex);\n            #endif\n            #ifdef ASPECT_AXIS_Y\n                tc.x=(1.0-aspectPos)-(((1.0-aspectPos)-tc.x)/aspectTex);\n            #endif\n        #endif\n\n        #ifdef TEX_TRANSFORM\n            vec3 coordinates=vec3(tc.x, tc.y,1.0);\n            tc=(transform * coordinates ).xy;\n        #endif\n\n        blendRGBA=texture(image,tc);\n\n        vec3 blend=blendRGBA.rgb;\n        vec4 baseRGBA=texture(tex,texCoord);\n        vec3 base=baseRGBA.rgb;\n\n\n        #ifdef PREMUL\n            blend.rgb = (blend.rgb) + (base.rgb * (1.0 - blendRGBA.a));\n        #endif\n\n        vec3 colNew=_blend(base,blend);\n\n\n\n\n        #ifdef REMOVE_ALPHA_SRC\n            blendRGBA.a=1.0;\n        #endif\n\n        #ifdef HAS_TEXTUREALPHA\n            vec4 colImgAlpha=texture(imageAlpha,tc);\n            float colImgAlphaAlpha=colImgAlpha.a;\n\n            #ifdef ALPHA_FROM_LUMINANCE\n                vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));\n                colImgAlphaAlpha=(gray.r+gray.g+gray.b)/3.0;\n            #endif\n\n            #ifdef ALPHA_FROM_INV_UMINANCE\n                vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));\n                colImgAlphaAlpha=1.0-(gray.r+gray.g+gray.b)/3.0;\n            #endif\n\n            #ifdef INVERT_ALPHA\n                colImgAlphaAlpha=clamp(colImgAlphaAlpha,0.0,1.0);\n                colImgAlphaAlpha=1.0-colImgAlphaAlpha;\n            #endif\n\n            blendRGBA.a=colImgAlphaAlpha*blendRGBA.a;\n        #endif\n    #endif\n\n    float am=amount;\n\n    #ifdef CLIP_REPEAT\n        if(tc.y>1.0 || tc.y<0.0 || tc.x>1.0 || tc.x<0.0)\n        {\n            // colNew.rgb=vec3(0.0);\n            am=0.0;\n        }\n    #endif\n\n    #ifdef ASPECT_RATIO\n        #ifdef ASPECT_CROP\n            if(tc.y>1.0 || tc.y<0.0 || tc.x>1.0 || tc.x<0.0)\n            {\n                colNew.rgb=base.rgb;\n                am=0.0;\n            }\n\n        #endif\n    #endif\n\n\n\n    #ifndef PREMUL\n        blendRGBA.rgb=mix(colNew,base,1.0-(am*blendRGBA.a));\n        blendRGBA.a=clamp(baseRGBA.a+(blendRGBA.a*am),0.,1.);\n    #endif\n\n    #ifdef PREMUL\n        // premultiply\n        // blendRGBA.rgb = (blendRGBA.rgb) + (baseRGBA.rgb * (1.0 - blendRGBA.a));\n        blendRGBA=vec4(\n            mix(colNew.rgb,base,1.0-(am*blendRGBA.a)),\n            blendRGBA.a*am+baseRGBA.a\n            );\n    #endif\n\n    #ifdef ALPHA_MASK\n    blendRGBA.a=baseRGBA.a;\n    #endif\n\n    outColor=blendRGBA;\n}\n\n\n\n\n\n\n\n","drawimage_vert":"IN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\n\nUNI mat4 projMatrix;\nUNI mat4 mvMatrix;\n\nOUT vec2 texCoord;\n// OUT vec3 norm;\n\n#ifdef TEX_TRANSFORM\n    UNI float posX;\n    UNI float posY;\n    UNI float scaleX;\n    UNI float scaleY;\n    UNI float rotate;\n    OUT mat3 transform;\n#endif\n\nvoid main()\n{\n   texCoord=attrTexCoord;\n//   norm=attrVertNormal;\n\n   #ifdef TEX_TRANSFORM\n        vec3 coordinates=vec3(attrTexCoord.x, attrTexCoord.y,1.0);\n        float angle = radians( rotate );\n        vec2 scale= vec2(scaleX,scaleY);\n        vec2 translate= vec2(posX,posY);\n\n        transform = mat3(   scale.x * cos( angle ), scale.x * sin( angle ), 0.0,\n            - scale.y * sin( angle ), scale.y * cos( angle ), 0.0,\n            - 0.5 * scale.x * cos( angle ) + 0.5 * scale.y * sin( angle ) - 0.5 * translate.x*2.0 + 0.5,  - 0.5 * scale.x * sin( angle ) - 0.5 * scale.y * cos( angle ) - 0.5 * translate.y*2.0 + 0.5, 1.0);\n   #endif\n\n   gl_Position = projMatrix * mvMatrix * vec4(vPosition,  1.0);\n}\n",};
const
    render = op.inTrigger("render"),
    blendMode = CGL.TextureEffect.AddBlendSelect(op, "blendMode"),
    amount = op.inValueSlider("amount", 1),

    image = op.inTexture("Image"),
    inAlphaPremul = op.inValueBool("Premultiplied", false),
    inAlphaMask = op.inValueBool("Alpha Mask", false),
    removeAlphaSrc = op.inValueBool("removeAlphaSrc", false),

    imageAlpha = op.inTexture("Mask"),
    alphaSrc = op.inValueSelect("Mask Src", ["alpha channel", "luminance", "luminance inv"], "luminance"),
    invAlphaChannel = op.inBool("Invert alpha channel"),

    inAspect = op.inValueBool("Aspect Ratio", false),
    inAspectAxis = op.inValueSelect("Stretch Axis", ["X", "Y"], "X"),
    inAspectPos = op.inValueSlider("Position", 0.0),
    inAspectCrop = op.inValueBool("Crop", false),

    trigger = op.outTrigger("trigger");

blendMode.set("normal");
const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "drawimage");

imageAlpha.onLinkChanged = updateAlphaPorts;

op.setPortGroup("Aspect Ratio", [inAspect, inAspectPos, inAspectCrop, inAspectAxis]);
op.setPortGroup("Mask", [imageAlpha, alphaSrc, invAlphaChannel]);

function updateAlphaPorts()
{
    if (imageAlpha.isLinked())
    {
        removeAlphaSrc.setUiAttribs({ "greyout": true });
        alphaSrc.setUiAttribs({ "greyout": false });
        invAlphaChannel.setUiAttribs({ "greyout": false });
    }
    else
    {
        removeAlphaSrc.setUiAttribs({ "greyout": false });
        alphaSrc.setUiAttribs({ "greyout": true });
        invAlphaChannel.setUiAttribs({ "greyout": true });
    }
}

op.toWorkPortsNeedToBeLinked(image);

shader.setSource(attachments.drawimage_vert, attachments.drawimage_frag);

const
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    textureImaghe = new CGL.Uniform(shader, "t", "image", 1),
    textureAlpha = new CGL.Uniform(shader, "t", "imageAlpha", 2),
    uniTexAspect = new CGL.Uniform(shader, "f", "aspectTex", 1),
    uniAspectPos = new CGL.Uniform(shader, "f", "aspectPos", inAspectPos);

inAspect.onChange =
    inAspectCrop.onChange =
    inAspectAxis.onChange = updateAspectRatio;

function updateAspectRatio()
{
    shader.removeDefine("ASPECT_AXIS_X");
    shader.removeDefine("ASPECT_AXIS_Y");
    shader.removeDefine("ASPECT_CROP");

    inAspectPos.setUiAttribs({ "greyout": !inAspect.get() });
    inAspectCrop.setUiAttribs({ "greyout": !inAspect.get() });
    inAspectAxis.setUiAttribs({ "greyout": !inAspect.get() });

    if (inAspect.get())
    {
        shader.define("ASPECT_RATIO");

        if (inAspectCrop.get()) shader.define("ASPECT_CROP");

        if (inAspectAxis.get() == "X") shader.define("ASPECT_AXIS_X");
        if (inAspectAxis.get() == "Y") shader.define("ASPECT_AXIS_Y");
    }
    else
    {
        shader.removeDefine("ASPECT_RATIO");
        if (inAspectCrop.get()) shader.define("ASPECT_CROP");

        if (inAspectAxis.get() == "X") shader.define("ASPECT_AXIS_X");
        if (inAspectAxis.get() == "Y") shader.define("ASPECT_AXIS_Y");
    }
}

//
// texture flip
//
const flipX = op.inValueBool("flip x");
const flipY = op.inValueBool("flip y");

//
// texture transform
//

let doTransform = op.inValueBool("Transform");

let scaleX = op.inValueSlider("Scale X", 1);
let scaleY = op.inValueSlider("Scale Y", 1);

let posX = op.inValue("Position X", 0);
let posY = op.inValue("Position Y", 0);

let rotate = op.inValue("Rotation", 0);

const inClipRepeat = op.inValueBool("Clip Repeat", false);

const uniScaleX = new CGL.Uniform(shader, "f", "scaleX", scaleX);
const uniScaleY = new CGL.Uniform(shader, "f", "scaleY", scaleY);
const uniPosX = new CGL.Uniform(shader, "f", "posX", posX);
const uniPosY = new CGL.Uniform(shader, "f", "posY", posY);
const uniRotate = new CGL.Uniform(shader, "f", "rotate", rotate);

doTransform.onChange = updateTransformPorts;

function updateTransformPorts()
{
    shader.toggleDefine("TEX_TRANSFORM", doTransform.get());

    scaleX.setUiAttribs({ "greyout": !doTransform.get() });
    scaleY.setUiAttribs({ "greyout": !doTransform.get() });
    posX.setUiAttribs({ "greyout": !doTransform.get() });
    posY.setUiAttribs({ "greyout": !doTransform.get() });
    rotate.setUiAttribs({ "greyout": !doTransform.get() });
}

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount);

const amountUniform = new CGL.Uniform(shader, "f", "amount", amount);

render.onTriggered = doRender;

inClipRepeat.onChange =
    imageAlpha.onChange =
    inAlphaPremul.onChange =
    inAlphaMask.onChange =
    invAlphaChannel.onChange =
    flipY.onChange =
    flipX.onChange =
    removeAlphaSrc.onChange =
    alphaSrc.onChange = updateDefines;

updateTransformPorts();
updateAlphaPorts();
updateAspectRatio();
updateDefines();

function updateDefines()
{
    shader.toggleDefine("REMOVE_ALPHA_SRC", removeAlphaSrc.get());
    shader.toggleDefine("ALPHA_MASK", inAlphaMask.get());

    shader.toggleDefine("CLIP_REPEAT", inClipRepeat.get());

    shader.toggleDefine("HAS_TEXTUREALPHA", imageAlpha.get() && imageAlpha.get().tex);

    shader.toggleDefine("TEX_FLIP_X", flipX.get());
    shader.toggleDefine("TEX_FLIP_Y", flipY.get());

    shader.toggleDefine("INVERT_ALPHA", invAlphaChannel.get());

    shader.toggleDefine("ALPHA_FROM_LUMINANCE", alphaSrc.get() == "luminance");
    shader.toggleDefine("ALPHA_FROM_INV_UMINANCE", alphaSrc.get() == "luminance_inv");
    shader.toggleDefine("PREMUL", inAlphaPremul.get());
}

function doRender()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    const tex = image.get();
    if (tex && tex.tex && amount.get() > 0.0)
    {
        cgl.pushShader(shader);
        cgl.currentTextureEffect.bind();

        const imgTex = cgl.currentTextureEffect.getCurrentSourceTexture();
        cgl.setTexture(0, imgTex.tex);

        // if (imgTex && tex)
        // {
        //     if (tex.textureType != imgTex.textureType && (tex.textureType == CGL.Texture.TYPE_FLOAT))
        //         op.setUiError("textypediff", "Drawing 32bit texture into an 8 bit can result in data/precision loss", 1);
        //     else
        //         op.setUiError("textypediff", null);
        // }

        const asp = 1 / (cgl.currentTextureEffect.getWidth() / cgl.currentTextureEffect.getHeight()) * (tex.width / tex.height);
        // uniTexAspect.setValue(1 / (tex.height / tex.width * imgTex.width / imgTex.height));

        uniTexAspect.setValue(asp);

        cgl.setTexture(1, tex.tex);
        // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, image.get().tex );

        if (imageAlpha.get() && imageAlpha.get().tex)
        {
            cgl.setTexture(2, imageAlpha.get().tex);
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, imageAlpha.get().tex );
        }

        // cgl.pushBlend(false);

        cgl.pushBlendMode(CGL.BLEND_NONE, true);

        cgl.currentTextureEffect.finish();
        cgl.popBlendMode();

        // cgl.popBlend();

        cgl.popShader();
    }

    trigger.trigger();
}

}
};

CABLES.OPS["8f6b2f15-fcb0-4597-90c0-e5173f2969fe"]={f:Ops.Gl.ImageCompose.DrawImage_v3,objName:"Ops.Gl.ImageCompose.DrawImage_v3"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.ImageCompose_v2
// 
// **************************************************************

Ops.Gl.ImageCompose.ImageCompose_v2= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={"imgcomp_frag":"UNI float a;\nvoid main()\n{\n   outColor= vec4(0.0,0.0,0.0,a);\n}\n",};
const
    render = op.inTrigger("Render"),
    useVPSize = op.inBool("Use viewport size", true),
    width = op.inValueInt("Width", 640),
    height = op.inValueInt("Height", 480),
    tfilter = op.inSwitch("Filter", ["nearest", "linear", "mipmap"], "linear"),
    twrap = op.inValueSelect("Wrap", ["clamp to edge", "repeat", "mirrored repeat"], "repeat"),
    fpTexture = op.inValueBool("HDR"),
    inTransp = op.inValueBool("Transparent", false),

    trigger = op.outTrigger("Next"),
    texOut = op.outTexture("texture_out"),
    outRatio = op.outValue("Aspect Ratio");

const cgl = op.patch.cgl;
op.setPortGroup("Texture Size", [useVPSize, width, height]);
op.setPortGroup("Texture Settings", [twrap, tfilter, fpTexture, inTransp]);

texOut.set(CGL.Texture.getEmptyTexture(cgl, fpTexture.get()));
let effect = null;
let tex = null;
let w = 8, h = 8;

const prevViewPort = [0, 0, 0, 0];
let reInitEffect = true;

// const bgShader = new CGL.Shader(cgl, "imgcompose bg");
// bgShader.setSource(bgShader.getDefaultVertexShader(), attachments.imgcomp_frag);

// const uniAlpha = new CGL.Uniform(bgShader, "f", "a", !inTransp.get());

let selectedFilter = CGL.Texture.FILTER_LINEAR;
let selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

const fps = 0;
const fpsStart = 0;

twrap.onChange = onWrapChange;
tfilter.onChange = onFilterChange;

render.onTriggered = op.preRender = doRender;

onFilterChange();
onWrapChange();
updateSizePorts();

// inTransp.onChange = () =>
// {
//     uniAlpha.setValue(!inTransp.get());
// };

function initEffect()
{
    if (effect)effect.delete();
    if (tex)tex.delete();

    if (fpTexture.get() && tfilter.get() == "mipmap") op.setUiError("fpmipmap", "Don't use mipmap and HDR at the same time, many systems do not support this.");
    else op.setUiError("fpmipmap", null);

    effect = new CGL.TextureEffect(cgl, { "isFloatingPointTexture": fpTexture.get() });

    tex = new CGL.Texture(cgl,
        {
            "name": "image_compose_v2_" + op.id,
            "isFloatingPointTexture": fpTexture.get(),
            "filter": selectedFilter,
            "wrap": selectedWrap,
            "width": Math.ceil(width.get()),
            "height": Math.ceil(height.get()),
        });

    effect.setSourceTexture(tex);
    texOut.set(CGL.Texture.getEmptyTexture(cgl, fpTexture.get()));

    reInitEffect = false;
}

fpTexture.onChange = function ()
{
    reInitEffect = true;
};

function updateResolution()
{
    if (!effect)initEffect();

    if (useVPSize.get())
    {
        w = cgl.getViewPort()[2];
        h = cgl.getViewPort()[3];
    }
    else
    {
        w = Math.ceil(width.get());
        h = Math.ceil(height.get());
    }

    outRatio.set(w / h);

    if ((w != tex.width || h != tex.height) && (w !== 0 && h !== 0))
    {
        // height.set(h);
        // width.set(w);
        tex.setSize(w, h);

        effect.setSourceTexture(tex);
        texOut.set(CGL.Texture.getEmptyTexture(cgl, fpTexture.get()));
        texOut.set(tex);
    }

    // if (texOut.get() && selectedFilter != CGL.Texture.FILTER_NEAREST)
    // {
    //     if (!texOut.get().isPowerOfTwo()) op.setUiError("hintnpot", "texture dimensions not power of two! - texture filtering when scaling will not work on ios devices.", 0);
    //     else op.setUiError("hintnpot", null, 0);
    // }
    // else op.setUiError("hintnpot", null, 0);
}

function updateSizePorts()
{
    width.setUiAttribs({ "greyout": useVPSize.get() });
    height.setUiAttribs({ "greyout": useVPSize.get() });
}

useVPSize.onChange = function ()
{
    updateSizePorts();
};

op.preRender = function ()
{
    doRender();
    // bgShader.bind();
};

function doRender()
{
    if (!effect || reInitEffect) initEffect();

    const vp = cgl.getViewPort();
    prevViewPort[0] = vp[0];
    prevViewPort[1] = vp[1];
    prevViewPort[2] = vp[2];
    prevViewPort[3] = vp[3];

    cgl.pushBlend(false);

    updateResolution();

    const oldEffect = cgl.currentTextureEffect;
    cgl.currentTextureEffect = effect;
    cgl.currentTextureEffect.width = width.get();
    cgl.currentTextureEffect.height = height.get();
    effect.setSourceTexture(tex);

    let bgTex = CGL.Texture.getBlackTexture(cgl);
    if (inTransp.get())bgTex = CGL.Texture.getEmptyTexture(cgl, fpTexture.get());

    effect.startEffect(bgTex);

    // cgl.pushShader(bgShader);
    // cgl.currentTextureEffect.bind();
    // cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);
    // cgl.currentTextureEffect.finish();
    // cgl.popShader();

    trigger.trigger();

    texOut.set(effect.getCurrentSourceTexture());

    effect.endEffect();

    cgl.setViewPort(prevViewPort[0], prevViewPort[1], prevViewPort[2], prevViewPort[3]);

    cgl.popBlend(false);
    cgl.currentTextureEffect = oldEffect;
}

function onWrapChange()
{
    if (twrap.get() == "repeat") selectedWrap = CGL.Texture.WRAP_REPEAT;
    if (twrap.get() == "mirrored repeat") selectedWrap = CGL.Texture.WRAP_MIRRORED_REPEAT;
    if (twrap.get() == "clamp to edge") selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reInitEffect = true;
    // updateResolution();
}

function onFilterChange()
{
    if (tfilter.get() == "nearest") selectedFilter = CGL.Texture.FILTER_NEAREST;
    if (tfilter.get() == "linear") selectedFilter = CGL.Texture.FILTER_LINEAR;
    if (tfilter.get() == "mipmap") selectedFilter = CGL.Texture.FILTER_MIPMAP;

    reInitEffect = true;
    // updateResolution();
}

}
};

CABLES.OPS["a5b43d4c-a9ea-4eaf-9ed0-f257d222659d"]={f:Ops.Gl.ImageCompose.ImageCompose_v2,objName:"Ops.Gl.ImageCompose.ImageCompose_v2"};




// **************************************************************
// 
// Ops.Gl.Textures.CopyTexture
// 
// **************************************************************

Ops.Gl.Textures.CopyTexture= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={"copytexture_frag":"UNI float a;\nUNI sampler2D tex;\n\n#ifdef TEX_MASK\nUNI sampler2D texMask;\n#endif\n\nIN vec2 texCoord;\n\nvoid main()\n{\n    vec4 col=texture(tex,texCoord);\n\n    #ifdef TEX_MASK\n        col.a=texture(texMask,texCoord).r;\n    #endif\n\n\n    #ifdef GREY_R\n        col.rgb=vec3(col.r);\n    #endif\n\n    #ifdef GREY_G\n        col.rgb=vec3(col.g);\n    #endif\n\n    #ifdef GREY_B\n        col.rgb=vec3(col.b);\n    #endif\n\n    #ifdef GREY_A\n        col.rgb=vec3(col.a);\n    #endif\n\n    #ifdef GREY_LUMI\n        col.rgb=vec3( dot(vec3(0.2126,0.7152,0.0722), col.rgb) );\n    #endif\n\n\n    #ifdef INVERT_A\n        col.a=1.0-col.a;\n    #endif\n\n    #ifdef INVERT_R\n        col.r=1.0-col.r;\n    #endif\n\n    #ifdef INVERT_G\n        col.g=1.0-col.g;\n    #endif\n\n    #ifdef INVERT_B\n        col.b=1.0-col.b;\n    #endif\n\n    #ifdef ALPHA_1\n        col.a=1.0;\n    #endif\n\n\n\n\n    outColor= col;\n}",};
const
    render = op.inTriggerButton("render"),
    inTexture = op.inTexture("Texture"),
    inTextureMask = op.inTexture("Alpha Mask"),
    useVPSize = op.inValueBool("use original size", true),
    width = op.inValueInt("width", 640),
    height = op.inValueInt("height", 360),
    tfilter = op.inSwitch("filter", ["nearest", "linear", "mipmap"], "linear"),
    twrap = op.inValueSelect("wrap", ["clamp to edge", "repeat", "mirrored repeat"], "clamp to edge"),
    fpTexture = op.inValueBool("HDR"),
    alphaMaskMethod = op.inSwitch("Alpha Mask Source", ["A", "1"], "A"),
    greyscale = op.inSwitch("Convert Greyscale", ["Off", "R", "G", "B", "A", "Luminance"], "Off"),
    invertR = op.inBool("Invert R", false),
    invertG = op.inBool("Invert G", false),
    invertB = op.inBool("Invert B", false),
    invertA = op.inBool("Invert A", false),

    trigger = op.outTrigger("trigger"),
    texOut = op.outTexture("texture_out", null),
    outRatio = op.outNumber("Aspect Ratio");

alphaMaskMethod.setUiAttribs({ "hidePort": true });
greyscale.setUiAttribs({ "hidePort": true });
invertR.setUiAttribs({ "hidePort": true });
invertG.setUiAttribs({ "hidePort": true });
invertB.setUiAttribs({ "hidePort": true });

let autoRefreshTimeout = null;
const cgl = op.patch.cgl;
let lastTex = null;
let effect = null;
let tex = null;
let needsResUpdate = true;

let w = 2, h = 2;
const prevViewPort = [0, 0, 0, 0];
let reInitEffect = true;

op.setPortGroup("Size", [useVPSize, width, height]);

const bgShader = new CGL.Shader(cgl, "copytexture", this);
bgShader.setSource(bgShader.getDefaultVertexShader(), attachments.copytexture_frag);
const textureUniform = new CGL.Uniform(bgShader, "t", "tex", 0);
let textureMaskUniform = new CGL.Uniform(bgShader, "t", "texMask", 1);

let selectedFilter = CGL.Texture.FILTER_LINEAR;
let selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

alphaMaskMethod.onChange =
    greyscale.onChange =
    invertR.onChange =
    invertG.onChange =
    invertB.onChange =
    twrap.onChange =
    tfilter.onChange =
    fpTexture.onChange =
    inTextureMask.onChange = updateSoon;

render.onLinkChanged =
inTexture.onLinkChanged =
inTexture.onChange = () =>
{
    // if (!inTexture.get() || inTexture.get() == CGL.Texture.getEmptyTexture(cgl)) texOut.set(CGL.Texture.getEmptyTexture(cgl));
    updateSoon();
};

render.onTriggered = doRender;
updateSizePorts();

function initEffect()
{
    if (effect)effect.delete();
    if (tex)
    {
        tex.delete();
        tex = null;
    }

    effect = new CGL.TextureEffect(cgl, { "isFloatingPointTexture": fpTexture.get(), "clear": false });

    if (!tex ||
        tex.width != Math.floor(width.get()) ||
        tex.height != Math.floor(height.get()) ||
        tex.wrap != selectedWrap ||
        tex.isFloatingPoint() != fpTexture.get()
    )
    {
        if (tex) tex.delete();
        tex = new CGL.Texture(cgl,
            {
                "name": "copytexture_" + op.id,
                "isFloatingPointTexture": fpTexture.get(),
                "filter": selectedFilter,
                "wrap": selectedWrap,
                "width": Math.floor(width.get()),
                "height": Math.floor(height.get()),
            });
    }

    effect.setSourceTexture(tex);
    texOut.set(null);
    reInitEffect = false;
}

function updateSoon()
{
    updateParams();
    if (render.links.length === 0)
    {
        reInitEffect = true;

        // clearTimeout(autoRefreshTimeout);
        // autoRefreshTimeout = setTimeout(() => { doRender(); }, 100);
        op.patch.cgl.off(autoRefreshTimeout);
        autoRefreshTimeout = op.patch.cgl.on("beginFrame", () =>
        {
            op.patch.cgl.off(autoRefreshTimeout);

            if (needsResUpdate)updateResolution();
            if (!effect)op.log("has no effect");
            if (!inTexture.get()) op.log("has no intexture");

            doRender();
        });
    }
}

function updateResolution()
{
    if (!inTexture.get() || inTexture.get() == CGL.Texture.getEmptyTexture(cgl)) return;
    if (!effect)initEffect();

    if (useVPSize.get())
    {
        w = inTexture.get().width;
        h = inTexture.get().height;
    }
    else
    {
        w = Math.floor(width.get());
        h = Math.floor(height.get());
    }

    if ((w != tex.width || h != tex.height) && (w !== 0 && h !== 0))
    {
        height.set(h);
        width.set(w);
        tex.filter = selectedFilter;
        tex.setSize(w, h);
        outRatio.set(w / h);
        effect.setSourceTexture(tex);
    }

    if (texOut.get() && selectedFilter != CGL.Texture.FILTER_NEAREST)
    {
        if (!texOut.get().isPowerOfTwo()) op.setUiError("hintnpot", "texture dimensions not power of two! - texture filtering when scaling will not work on ios devices.", 0);
        else op.setUiError("hintnpot", null, 0);
    }
    else op.setUiError("hintnpot", null, 0);

    needsResUpdate = false;
}

function updateSizePorts()
{
    width.setUiAttribs({ "greyout": useVPSize.get() });
    height.setUiAttribs({ "greyout": useVPSize.get() });
}

function updateResolutionLater()
{
    needsResUpdate = true;
    updateSoon();
}

useVPSize.onChange = function ()
{
    updateSizePorts();
    if (useVPSize.get())
    {
        width.onChange = null;
        height.onChange = null;
    }
    else
    {
        width.onChange = updateResolutionLater;
        height.onChange = updateResolutionLater;
    }
    updateResolution();
};

function doRender()
{
    // op.patch.removeOnAnimCallback(doRender);
    // if (!inTexture.get())

    if (!inTexture.get() || inTexture.get() == CGL.Texture.getEmptyTexture(cgl)) texOut.set(CGL.Texture.getEmptyTexture(cgl));

    if (!inTexture.get() || inTexture.get() == CGL.Texture.getEmptyTexture(cgl))
    {
        lastTex = null;// CGL.Texture.getEmptyTexture(cgl);
        trigger.trigger();
        return;
    }
    else
    if (!effect || reInitEffect || lastTex != inTexture.get())
    {
        initEffect();
    }
    const vp = cgl.getViewPort();
    prevViewPort[0] = vp[0];
    prevViewPort[1] = vp[1];
    prevViewPort[2] = vp[2];
    prevViewPort[3] = vp[3];

    updateResolution();

    lastTex = inTexture.get();
    const oldEffect = cgl.currentTextureEffect;
    cgl.currentTextureEffect = effect;
    effect.setSourceTexture(tex);

    effect.startEffect();

    // render background color...
    cgl.pushShader(bgShader);
    cgl.currentTextureEffect.bind();
    cgl.setTexture(0, inTexture.get().tex);
    if (inTextureMask.get())cgl.setTexture(1, inTextureMask.get().tex);

    cgl.pushBlend(false);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    cgl.popBlend();

    texOut.set(effect.getCurrentSourceTexture());

    effect.endEffect();

    cgl.setViewPort(prevViewPort[0], prevViewPort[1], prevViewPort[2], prevViewPort[3]);

    cgl.currentTextureEffect = oldEffect;

    cgl.setTexture(0, CGL.Texture.getEmptyTexture(cgl).tex);

    trigger.trigger();
}

function updateParams()
{
    bgShader.toggleDefine("TEX_MASK", inTextureMask.get());

    bgShader.toggleDefine("GREY_R", greyscale.get() === "R");
    bgShader.toggleDefine("GREY_G", greyscale.get() === "G");
    bgShader.toggleDefine("GREY_B", greyscale.get() === "B");
    bgShader.toggleDefine("GREY_A", greyscale.get() === "A");
    bgShader.toggleDefine("GREY_LUMI", greyscale.get() === "Luminance");

    bgShader.toggleDefine("ALPHA_1", alphaMaskMethod.get() === "1");
    bgShader.toggleDefine("ALPHA_A", alphaMaskMethod.get() === "A");

    bgShader.toggleDefine("INVERT_R", invertR.get());
    bgShader.toggleDefine("INVERT_G", invertG.get());
    bgShader.toggleDefine("INVERT_B", invertB.get());
    bgShader.toggleDefine("INVERT_A", invertA.get());

    if (twrap.get() == "repeat") selectedWrap = CGL.Texture.WRAP_REPEAT;
    else if (twrap.get() == "mirrored repeat") selectedWrap = CGL.Texture.WRAP_MIRRORED_REPEAT;
    else if (twrap.get() == "clamp to edge") selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

    if (tfilter.get() == "nearest") selectedFilter = CGL.Texture.FILTER_NEAREST;
    else if (tfilter.get() == "linear") selectedFilter = CGL.Texture.FILTER_LINEAR;
    else if (tfilter.get() == "mipmap") selectedFilter = CGL.Texture.FILTER_MIPMAP;

    if (bgShader.needsRecompile())
    {
        reInitEffect = true;
    }
    if (tex && (
        tex.width != Math.floor(width.get()) ||
        tex.height != Math.floor(height.get()) ||
        tex.wrap != selectedWrap ||
        tex.isFloatingPoint() != fpTexture.get()
    ))
    {
        reInitEffect = true;
    }
}

}
};

CABLES.OPS["18a6d1f4-a7f8-4a3e-ab1d-0c2d2efe3861"]={f:Ops.Gl.Textures.CopyTexture,objName:"Ops.Gl.Textures.CopyTexture"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.Color
// 
// **************************************************************

Ops.Gl.ImageCompose.Color= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={"color_frag":"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float r;\nUNI float g;\nUNI float b;\nUNI float amount;\n\n#ifdef MASK\n    UNI sampler2D mask;\n#endif\n\n{{CGL.BLENDMODES}}\n\nvoid main()\n{\n    vec4 col=vec4(r,g,b,1.0);\n    vec4 base=texture(tex,texCoord);\n\n    float am=amount;\n    #ifdef MASK\n        float msk=texture(mask,texCoord).r;\n        #ifdef INVERTMASK\n            msk=1.0-msk;\n        #endif\n        am*=1.0-msk;\n    #endif\n\n    outColor= cgl_blend(base,col,am);\n    outColor.a*=base.a;\n}\n",};
const
    render = op.inTrigger("render"),
    blendMode = CGL.TextureEffect.AddBlendSelect(op),
    amount = op.inValueSlider("Amount", 1),

    inMask = op.inTexture("Mask"),
    inMaskInvert = op.inValueBool("Mask Invert"),
    r = op.inValueSlider("r", Math.random()),
    g = op.inValueSlider("g", Math.random()),
    b = op.inValueSlider("b", Math.random()),
    trigger = op.outTrigger("trigger");

r.setUiAttribs({ "colorPick": true });
op.setPortGroup("Color", [r, g, b]);

const TEX_SLOT = 0;
const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "textureeffect color");
const srcFrag = attachments.color_frag || "";
shader.setSource(shader.getDefaultVertexShader(), srcFrag);
CGL.TextureEffect.setupBlending(op, shader, blendMode, amount);

const
    textureUniform = new CGL.Uniform(shader, "t", "tex", TEX_SLOT),
    makstextureUniform = new CGL.Uniform(shader, "t", "mask", 1),
    uniformR = new CGL.Uniform(shader, "f", "r", r),
    uniformG = new CGL.Uniform(shader, "f", "g", g),
    uniformB = new CGL.Uniform(shader, "f", "b", b),
    uniformAmount = new CGL.Uniform(shader, "f", "amount", amount);

inMask.onChange = function ()
{
    if (inMask.get())shader.define("MASK");
    else shader.removeDefine("MASK");
};

inMaskInvert.onChange = function ()
{
    if (inMaskInvert.get())shader.define("INVERTMASK");
    else shader.removeDefine("INVERTMASK");
};

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(TEX_SLOT, cgl.currentTextureEffect.getCurrentSourceTexture().tex);
    if (inMask.get()) cgl.setTexture(1, inMask.get().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};

}
};

CABLES.OPS["c0acfc80-16f9-4f17-978d-bad650f3ed1c"]={f:Ops.Gl.ImageCompose.Color,objName:"Ops.Gl.ImageCompose.Color"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.Blur
// 
// **************************************************************

Ops.Gl.ImageCompose.Blur= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={"blur_frag":"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float dirX;\nUNI float dirY;\nUNI float amount;\n\n#ifdef HAS_MASK\n    UNI sampler2D imageMask;\n#endif\n\nfloat random(vec3 scale, float seed)\n{\n    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);\n}\n\nvoid main()\n{\n    vec4 color = vec4(0.0);\n    float total = 0.0;\n\n    float am=amount;\n    #ifdef HAS_MASK\n        am=amount*texture(imageMask,texCoord).r;\n        if(am<=0.02)\n        {\n            outColor=texture(tex, texCoord);\n            return;\n        }\n    #endif\n\n    vec2 delta=vec2(dirX*am*0.01,dirY*am*0.01);\n\n\n    float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);\n\n    #ifdef MOBILE\n        offset = 0.1;\n    #endif\n\n    #if defined(FASTBLUR) && !defined(MOBILE)\n        const float range=5.0;\n    #else\n        const float range=20.0;\n    #endif\n\n    for (float t = -range; t <= range; t+=1.0)\n    {\n        float percent = (t + offset - 0.5) / range;\n        float weight = 1.0 - abs(percent);\n        vec4 smpl = texture(tex, texCoord + delta * percent);\n\n        smpl.rgb *= smpl.a;\n\n        color += smpl * weight;\n        total += weight;\n    }\n\n    outColor= color / total;\n\n    outColor.rgb /= outColor.a + 0.00001;\n\n\n\n}\n",};
const render = op.inTrigger("render");
const trigger = op.outTrigger("trigger");
const amount = op.inValueFloat("amount");
const direction = op.inSwitch("direction", ["both", "vertical", "horizontal"], "both");
const fast = op.inValueBool("Fast", true);
const cgl = op.patch.cgl;

amount.set(10);

let shader = new CGL.Shader(cgl, "blur");

shader.define("FASTBLUR");

fast.onChange = function ()
{
    if (fast.get()) shader.define("FASTBLUR");
    else shader.removeDefine("FASTBLUR");
};

shader.setSource(shader.getDefaultVertexShader(), attachments.blur_frag);
let textureUniform = new CGL.Uniform(shader, "t", "tex", 0);

let uniDirX = new CGL.Uniform(shader, "f", "dirX", 0);
let uniDirY = new CGL.Uniform(shader, "f", "dirY", 0);

let uniWidth = new CGL.Uniform(shader, "f", "width", 0);
let uniHeight = new CGL.Uniform(shader, "f", "height", 0);

let uniAmount = new CGL.Uniform(shader, "f", "amount", amount.get());
amount.onChange = function () { uniAmount.setValue(amount.get()); };

let textureAlpha = new CGL.Uniform(shader, "t", "imageMask", 1);

let showingError = false;

function fullScreenBlurWarning()
{
    if (cgl.currentTextureEffect.getCurrentSourceTexture().width == cgl.canvasWidth &&
        cgl.currentTextureEffect.getCurrentSourceTexture().height == cgl.canvasHeight)
    {
        op.setUiError("warning", "Full screen blurs are slow! Try reducing the resolution to 1/2 or a 1/4", 0);
    }
    else
    {
        op.setUiError("warning", null);
    }
}

let dir = 0;
direction.onChange = function ()
{
    if (direction.get() == "both")dir = 0;
    if (direction.get() == "horizontal")dir = 1;
    if (direction.get() == "vertical")dir = 2;
};

let mask = op.inTexture("mask");

mask.onChange = function ()
{
    if (mask.get() && mask.get().tex) shader.define("HAS_MASK");
    else shader.removeDefine("HAS_MASK");
};

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);

    uniWidth.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().width);
    uniHeight.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().height);

    fullScreenBlurWarning();

    // first pass
    if (dir === 0 || dir == 2)
    {
        cgl.currentTextureEffect.bind();
        cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

        if (mask.get() && mask.get().tex)
        {
            cgl.setTexture(1, mask.get().tex);
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, mask.get().tex );
        }

        uniDirX.setValue(0.0);
        uniDirY.setValue(1.0);

        cgl.currentTextureEffect.finish();
    }

    // second pass
    if (dir === 0 || dir == 1)
    {
        cgl.currentTextureEffect.bind();
        cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

        if (mask.get() && mask.get().tex)
        {
            cgl.setTexture(1, mask.get().tex);
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, mask.get().tex );
        }

        uniDirX.setValue(1.0);
        uniDirY.setValue(0.0);

        cgl.currentTextureEffect.finish();
    }

    cgl.popShader();
    trigger.trigger();
};

}
};

CABLES.OPS["54f26f53-f637-44c1-9bfb-a2f2b722e998"]={f:Ops.Gl.ImageCompose.Blur,objName:"Ops.Gl.ImageCompose.Blur"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.Hue
// 
// **************************************************************

Ops.Gl.ImageCompose.Hue= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={"hue_frag":"UNI float hue;\n\n#ifdef HAS_TEXTURES\n  IN vec2 texCoord;\n  UNI sampler2D tex;\n#endif\n\n#ifdef TEX_MASK\n    UNI sampler2D texMask;\n#endif\n#ifdef TEX_OFFSET\n    UNI sampler2D texOffset;\n#endif\n\nvec3 rgb2hsv(vec3 c)\n{\n    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\n    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\n    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\n\n    float d = q.x - min(q.w, q.y);\n    float e = 1.0e-10;\n    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);\n}\n\nvec3 hsv2rgb(vec3 c)\n{\n    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\n    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\n    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\n}\n\nvoid main()\n{\n   vec4 col=vec4(1.0,0.0,0.0,1.0);\n    #ifdef HAS_TEXTURES\n        col=texture(tex,texCoord);\n        float h=hue;\n\n        #ifdef TEX_OFFSET\n            h += texture(texOffset,texCoord).r;\n        #endif\n\n\n        vec3 hsv = rgb2hsv(col.rgb);\n        hsv.x=hsv.x+h;\n\n        #ifndef TEX_MASK\n            col.rgb = hsv2rgb(hsv);\n        #endif\n\n        #ifdef TEX_MASK\n            col.rgb = mix(col.rgb,hsv2rgb(hsv),texture(texMask,texCoord).r);\n        #endif\n\n   #endif\n   outColor= col;\n}",};
const
    render = op.inTrigger("render"),
    hue = op.inValueSlider("hue", 1),
    texMask = op.inTexture("Mask"),
    texOffset = op.inTexture("Offset"),
    trigger = op.outTrigger("trigger");

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, op.name, op);

shader.setSource(shader.getDefaultVertexShader(), attachments.hue_frag);
const textureUniform = new CGL.Uniform(shader, "t", "tex", 0);

const textureMaskUniform = new CGL.Uniform(shader, "t", "texMask", 1);
const textureOffsetUniform = new CGL.Uniform(shader, "t", "texOffset", 2);

const uniformHue = new CGL.Uniform(shader, "f", "hue", 1.0);

hue.onChange = function () { uniformHue.setValue(hue.get()); };

texMask.onChange =
texOffset.onChange = () =>
{
    shader.toggleDefine("TEX_MASK", texMask.get());
    shader.toggleDefine("TEX_OFFSET", texOffset.get());
};

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    if (texMask.get()) cgl.setTexture(1, texMask.get().tex);
    if (texOffset.get()) cgl.setTexture(2, texOffset.get().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};

}
};

CABLES.OPS["94ef0da0-c920-415c-81b0-fecbd437991d"]={f:Ops.Gl.ImageCompose.Hue,objName:"Ops.Gl.ImageCompose.Hue"};




// **************************************************************
// 
// Ops.Boolean.BoolToString
// 
// **************************************************************

Ops.Boolean.BoolToString= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const
    inBool = op.inBool("Boolean", false),
    inFalse = op.inString("False", "false"),
    inTrue = op.inString("True", "true"),
    result = op.outString("String", "false");

inTrue.onChange =
    inFalse.onChange =
    inBool.onChange = update;

function update()
{
    if (inBool.get()) result.set(inTrue.get());
    else result.set(inFalse.get());
}

}
};

CABLES.OPS["22a734aa-8b08-4db7-929b-393d4704e1d6"]={f:Ops.Boolean.BoolToString,objName:"Ops.Boolean.BoolToString"};




// **************************************************************
// 
// Ops.Extension.Deprecated.VizString
// 
// **************************************************************

Ops.Extension.Deprecated.VizString= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const inStr = op.inString("String", "");
const outNum = op.outString("Result");

op.setUiAttrib({ "widthOnlyGrow": true });
op.checkMainloopExists();

inStr.onChange = () =>
{
    let str = inStr.get();
    if (op.patch.isEditorMode())
    {
        if (str === null)str = "null";
        else if (str === undefined)str = "undefined";
        else str = "\"" + (String(str) || "") + "\"";
        op.setTitle(str);
    }

    outNum.set(inStr.get());
};

}
};

CABLES.OPS["b04ff547-f557-4a54-a3ad-8a668fe1303d"]={f:Ops.Extension.Deprecated.VizString,objName:"Ops.Extension.Deprecated.VizString"};




// **************************************************************
// 
// Ops.Anim.BoolAnim
// 
// **************************************************************

Ops.Anim.BoolAnim= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const anim = new CABLES.Anim();

const
    exe = op.inTrigger("exe"),
    bool = op.inValueBool("bool"),
    pease = anim.createPort(op, "easing"),
    duration = op.inValue("duration", 0.25),
    dir = op.inValueSelect("Direction", ["Both", "Only True", "Only False"], "Both"),
    valueFalse = op.inValue("value false", 0),
    valueTrue = op.inValue("value true", 1),
    next = op.outTrigger("trigger"),
    value = op.outNumber("value"),
    finished = op.outBoolNum("finished"),
    finishedTrigger = op.outTrigger("Finished Trigger");

const startTime = CABLES.now();
op.toWorkPortsNeedToBeLinked(exe);
op.setPortGroup("Animation", [duration, pease]);
op.setPortGroup("Values", [valueFalse, valueTrue]);

dir.onChange = bool.onChange = valueFalse.onChange = valueTrue.onChange = duration.onChange = setAnim;
setAnim();

function setAnim()
{
    if (dir.get() == "Animate Both")dir.set("Both");
    finished.set(false);
    const now = (CABLES.now() - startTime) / 1000;
    const oldValue = anim.getValue(now);
    anim.clear();

    anim.setValue(now, oldValue);

    if (!bool.get())
    {
        if (dir.get() != "Only True") anim.setValue(now + duration.get(), valueFalse.get());
        else anim.setValue(now, valueFalse.get());
    }
    else
    {
        if (dir.get() != "Only False") anim.setValue(now + duration.get(), valueTrue.get());
        else anim.setValue(now, valueTrue.get());
    }
}

exe.onTriggered = function ()
{
    const t = (CABLES.now() - startTime) / 1000;
    value.set(anim.getValue(t));

    if (anim.hasEnded(t))
    {
        if (!finished.get()) finishedTrigger.trigger();
        finished.set(true);
    }

    next.trigger();
};

}
};

CABLES.OPS["06ad9d35-ccf5-4d31-889c-e23fa062588a"]={f:Ops.Anim.BoolAnim,objName:"Ops.Anim.BoolAnim"};




// **************************************************************
// 
// Ops.Sidebar.Toggle_v3
// 
// **************************************************************

Ops.Sidebar.Toggle_v3= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const DEFAULT_VALUE_DEFAULT = true;

// inputs
const parentPort = op.inObject("link");
const labelPort = op.inString("Text", "Toggle");
const inputValuePort = op.inValueBool("Input", DEFAULT_VALUE_DEFAULT);
const setDefaultValueButtonPort = op.inTriggerButton("Set Default");
const defaultValuePort = op.inValueBool("Default", DEFAULT_VALUE_DEFAULT);
defaultValuePort.setUiAttribs({ "hidePort": true, "greyout": true });
const inGreyOut = op.inBool("Grey Out", false);
const inVisible = op.inBool("Visible", true);

// outputs
const siblingsPort = op.outObject("childs");
const valuePort = op.outBoolNum("Value", defaultValuePort.get());
const outToggled = op.outTrigger("Toggled");

// vars
const el = document.createElement("div");
el.dataset.op = op.id;
el.classList.add("cablesEle");
el.classList.add("sidebar__item");
el.classList.add("sidebar__toggle");
el.classList.add("sidebar__reloadable");

if (DEFAULT_VALUE_DEFAULT) el.classList.add("sidebar__toggle--active");

el.addEventListener("dblclick", function ()
{
    valuePort.set(defaultValuePort.get());
    inputValuePort.set(defaultValuePort.get());
    outToggled.trigger();
});

const label = document.createElement("div");
label.classList.add("sidebar__item-label");
const labelText = document.createTextNode(labelPort.get());
label.appendChild(labelText);
el.appendChild(label);

const icon = document.createElement("div");
icon.classList.add("icon_toggle");
icon.addEventListener("click", onInputClick);
el.appendChild(icon);

const greyOut = document.createElement("div");
greyOut.classList.add("sidebar__greyout");
el.appendChild(greyOut);
greyOut.style.display = "none";

// events
parentPort.onChange = onParentChanged;
labelPort.onChange = onLabelTextChanged;
inputValuePort.onChange = onInputValuePortChanged;
op.onDelete = onDelete;
setDefaultValueButtonPort.onTriggered = setDefaultValue;

function setDefaultValue()
{
    const defaultValue = inputValuePort.get();

    defaultValuePort.set(defaultValue);
    valuePort.set(defaultValue);
    outToggled.trigger();
    op.refreshParams();
}

function onInputClick()
{
    el.classList.toggle("sidebar__toggle--active");
    if (el.classList.contains("sidebar__toggle--active"))
    {
        valuePort.set(true);
        inputValuePort.set(true);
        icon.classList.add("icon_toggle_true");
        icon.classList.remove("icon_toggle_false");
        outToggled.trigger();
    }
    else
    {
        icon.classList.remove("icon_toggle_true");
        icon.classList.add("icon_toggle_false");

        valuePort.set(false);
        inputValuePort.set(false);
        outToggled.trigger();
    }
    op.refreshParams();
}

function onInputValuePortChanged()
{
    const inputValue = inputValuePort.get();
    if (inputValue)
    {
        el.classList.add("sidebar__toggle--active");
        valuePort.set(true);
    }
    else
    {
        el.classList.remove("sidebar__toggle--active");
        valuePort.set(false);
    }
    outToggled.trigger();
}

function onLabelTextChanged()
{
    const text = labelPort.get();
    label.textContent = text;
    if (CABLES.UI) op.setUiAttrib({ "extendTitle": text });
}

function onParentChanged()
{
    siblingsPort.set(null);
    const parent = parentPort.get();
    if (parent && parent.parentElement)
    {
        parent.parentElement.appendChild(el);
        siblingsPort.set(parent);
    }
    else if (el.parentElement) el.parentElement.removeChild(el);
}

function showElement(element)
{
    if (element) element.style.display = "block";
}

function hideElement(element)
{
    if (element) element.style.display = "none";
}

function onDelete()
{
    removeElementFromDOM(el);
}

function removeElementFromDOM(element)
{
    if (element && element.parentNode && element.parentNode.removeChild) element.parentNode.removeChild(el);
}

inGreyOut.onChange = function ()
{
    greyOut.style.display = inGreyOut.get() ? "block" : "none";
};

inVisible.onChange = function ()
{
    el.style.display = inVisible.get() ? "block" : "none";
};

}
};

CABLES.OPS["fb60ab7d-f2f2-4fc5-bcd0-88c6ed481908"]={f:Ops.Sidebar.Toggle_v3,objName:"Ops.Sidebar.Toggle_v3"};




// **************************************************************
// 
// Ops.Sidebar.SideBarStyle
// 
// **************************************************************

Ops.Sidebar.SideBarStyle= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const parentPort = op.inObject("link"),
    inWidth = op.inInt("Width", 220),
    inBorderRadius = op.inFloat("Round Corners", 10),
    inColorSpecial = op.inString("Special Color", "#07f78c"),

    siblingsPort = op.outObject("childs");

inColorSpecial.onChange =
inBorderRadius.onChange =
inWidth.onChange = setStyle;

parentPort.onChange = onParentChanged;
op.onDelete = onDelete;

op.toWorkNeedsParent("Ops.Sidebar.Sidebar");

let sideBarEle = null;

function setStyle()
{
    if (!sideBarEle) return;

    sideBarEle.style.setProperty("--sidebar-width", inWidth.get() + "px");

    sideBarEle.style.setProperty("--sidebar-color", inColorSpecial.get());

    sideBarEle.style.setProperty("--sidebar-border-radius", Math.round(inBorderRadius.get()) + "px");

    op.patch.emitEvent("sidebarStylesChanged");
}

function onParentChanged()
{
    siblingsPort.set(null);
    const parent = parentPort.get();
    if (parent && parent.parentElement)
    {
        siblingsPort.set(parent);
        sideBarEle = parent.parentElement.parentElement;
        setStyle();
    }
    else
    {
        sideBarEle = null;
    }
}

function showElement(el)
{
    if (!el) return;
    el.style.display = "block";
}

function hideElement(el)
{
    if (!el) return;
    el.style.display = "none";
}

function onDelete()
{
}

}
};

CABLES.OPS["87d78a59-c8d4-4269-a3f8-af273741aae4"]={f:Ops.Sidebar.SideBarStyle,objName:"Ops.Sidebar.SideBarStyle"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.ChromaticAberration
// 
// **************************************************************

Ops.Gl.ImageCompose.ChromaticAberration= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={"chromatic_frag":"\nIN vec2 texCoord;\nUNI sampler2D tex;\nUNI float pixel;\nUNI float onePixel;\nUNI float amount;\nUNI float lensDistort;\n\n#ifdef MASK\nUNI sampler2D texMask;\n#endif\n\n{{CGL.BLENDMODES}}\n\nvoid main()\n{\n   vec4 base=texture(tex,texCoord);\n   vec4 col=texture(tex,texCoord);\n\n   vec2 tc=texCoord;;\n   float pix = pixel;\n   if(lensDistort>0.0)\n   {\n       float dist = distance(texCoord, vec2(0.5,0.5));\n       tc-=0.5;\n       tc *=smoothstep(-0.9,1.0*lensDistort,1.0-dist);\n       tc+=0.5;\n   }\n\n    #ifdef MASK\n        vec4 m=texture(texMask,texCoord);\n        pix*=m.r*m.a;\n    #endif\n\n    #ifdef SMOOTH\n    #ifdef WEBGL2\n        float numSamples=round(pix/onePixel/4.0+1.0);\n        col.r=0.0;\n        col.b=0.0;\n\n        for(float off=0.0;off<numSamples;off++)\n        {\n            float diff=(pix/numSamples)*off;\n            col.r+=texture(tex,vec2(tc.x+diff,tc.y)).r/numSamples;\n            col.b+=texture(tex,vec2(tc.x-diff,tc.y)).b/numSamples;\n        }\n    #endif\n    #endif\n\n    #ifndef SMOOTH\n        col.r=texture(tex,vec2(tc.x+pix,tc.y)).r;\n        col.b=texture(tex,vec2(tc.x-pix,tc.y)).b;\n    #endif\n\n//   outColor = col;\n   outColor= cgl_blend(base,col,amount);\n\n}\n",};
const
    render = op.inTrigger("render"),
    blendMode = CGL.TextureEffect.AddBlendSelect(op, "Blend Mode", "normal"),
    amount = op.inValueSlider("Amount", 1),
    pixel = op.inValue("Pixel", 5),
    lensDistort = op.inValueSlider("Lens Distort", 0),
    doSmooth = op.inValueBool("Smooth", false),
    textureMask = op.inTexture("Mask"),
    trigger = op.outTrigger("trigger");

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "chromatic");

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount);

shader.setSource(shader.getDefaultVertexShader(), attachments.chromatic_frag);
const textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    uniPixel = new CGL.Uniform(shader, "f", "pixel", 0),
    uniOnePixel = new CGL.Uniform(shader, "f", "onePixel", 0),
    unitexMask = new CGL.Uniform(shader, "t", "texMask", 1),
    uniAmount = new CGL.Uniform(shader, "f", "amount", amount),
    unilensDistort = new CGL.Uniform(shader, "f", "lensDistort", lensDistort);

doSmooth.onChange = function ()
{
    if (doSmooth.get())shader.define("SMOOTH");
    else shader.removeDefine("SMOOTH");
};

textureMask.onChange = function ()
{
    if (textureMask.get())shader.define("MASK");
    else shader.removeDefine("MASK");
};

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    let texture = cgl.currentTextureEffect.getCurrentSourceTexture();

    uniPixel.setValue(pixel.get() * (1 / texture.width));
    uniOnePixel.setValue(1 / texture.width);

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, texture.tex);

    if (textureMask.get()) cgl.setTexture(1, textureMask.get().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};

}
};

CABLES.OPS["38ac43a1-1757-48f4-9450-29f07ac0d376"]={f:Ops.Gl.ImageCompose.ChromaticAberration,objName:"Ops.Gl.ImageCompose.ChromaticAberration"};




// **************************************************************
// 
// Ops.Gl.Performance
// 
// **************************************************************

Ops.Gl.Performance= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const
    exe = op.inTrigger("exe"),
    inActive = op.inValueBool("Active", true),
    inShow = op.inValueBool("Visible", true),
    inDoGpu = op.inValueBool("Measure GPU", true),
    next = op.outTrigger("childs"),
    position = op.inSwitch("Position", ["top", "bottom"], "top"),
    openDefault = op.inBool("Open", false),
    smoothGraph = op.inBool("Smooth Graph", true),
    inScaleGraph = op.inFloat("Scale", 3),
    inSizeGraph = op.inFloat("Size", 128),
    outCanv = op.outObject("Canvas"),
    outFPS = op.outNumber("FPS");

const cgl = op.patch.cgl;
const element = document.createElement("div");

let elementMeasures = null;
let ctx = null;
let opened = false;
let frameCount = 0;
let fps = 0;
let fpsStartTime = 0;
let childsTime = 0;
let avgMsChilds = 0;
const queue = [];
const timesMainloop = [];
const timesOnFrame = [];
const timesGPU = [];
let avgMs = 0;
let selfTime = 0;
let canvas = null;
let lastTime = 0;
let loadingCounter = 0;
const loadingChars = ["|", "/", "-", "\\"];
let initMeasures = true;

const colorRAFSlow = "#007f9c";
const colorRAFVeruSlow = "#aaaaaa";

const colorBg = "#222222";
const colorRAF = "#003f5c"; // color: https://learnui.design/tools/data-color-picker.html
const colorMainloop = "#7a5195";
const colorOnFrame = "#ef5675";
const colorGPU = "#ffa600";

let startedQuery = false;

let currentTimeGPU = 0;
let currentTimeMainloop = 0;
let currentTimeOnFrame = 0;

op.toWorkPortsNeedToBeLinked(exe, next);

const gl = op.patch.cgl.gl;
const glQueryExt = gl.getExtension("EXT_disjoint_timer_query_webgl2");

inActive.onChange =
exe.onLinkChanged =
    inShow.onChange = () =>
    {
        updateOpened();
        updateVisibility();
    };

position.onChange = updatePos;
inSizeGraph.onChange = updateSize;

element.id = "performance";
element.style.position = "absolute";
element.style.left = "0px";
element.style.opacity = "0.8";
element.style.padding = "10px";
element.style.cursor = "pointer";
element.style.background = "#222";
element.style.color = "white";
element.style["font-family"] = "monospace";
element.style["font-size"] = "12px";
element.style["z-index"] = "99999";

element.innerHTML = "&nbsp;";
element.addEventListener("click", toggleOpened);

const container = op.patch.cgl.canvas.parentElement;
container.appendChild(element);

updateSize();
updateOpened();
updatePos();
updateVisibility();

op.onDelete = function ()
{
    if (canvas)canvas.remove();
    if (element)element.remove();
};

function updatePos()
{
    canvas.style["pointer-events"] = "none";
    if (position.get() == "top")
    {
        canvas.style.top = element.style.top = "0px";
        canvas.style.bottom = element.style.bottom = "initial";
    }
    else
    {
        canvas.style.bottom = element.style.bottom = "0px";
        canvas.style.top = element.style.top = "initial";
    }
}

function updateVisibility()
{
    if (!inShow.get() || !exe.isLinked() || !inActive.get())
    {
        element.style.display = "none";
        element.style.opacity = 0;
        canvas.style.display = "none";
    }
    else
    {
        element.style.display = "block";
        element.style.opacity = 1;
        canvas.style.display = "block";
    }
}

function updateSize()
{
    if (!canvas) return;

    const num = Math.max(0, parseInt(inSizeGraph.get()));

    canvas.width = num;
    canvas.height = num;
    element.style.left = num + "px";

    queue.length = 0;
    timesMainloop.length = 0;
    timesOnFrame.length = 0;
    timesGPU.length = 0;

    for (let i = 0; i < num; i++)
    {
        queue[i] = -1;
        timesMainloop[i] = -1;
        timesOnFrame[i] = -1;
        timesGPU[i] = -1;
    }
}

openDefault.onChange = function ()
{
    opened = openDefault.get();
    updateOpened();
};

function toggleOpened()
{
    if (!inShow.get()) return;
    element.style.opacity = 1;
    opened = !opened;
    updateOpened();
}

function updateOpened()
{
    updateText();
    if (!canvas)createCanvas();
    if (opened)
    {
        canvas.style.display = "block";
        element.style.left = inSizeGraph.get() + "px";
        element.style["min-height"] = "56px";
    }
    else
    {
        canvas.style.display = "none";
        element.style.left = "0px";
        element.style["min-height"] = "auto";
    }
}

function updateCanvas()
{
    const height = canvas.height;
    const hmul = inScaleGraph.get();

    ctx.fillStyle = colorBg;
    ctx.fillRect(0, 0, canvas.width, height);

    ctx.fillStyle = colorRAF;

    let k = 0;
    const numBars = Math.max(0, parseInt(inSizeGraph.get()));

    for (k = numBars; k >= 0; k--)
    {
        if (queue[k] > 30) ctx.fillStyle = colorRAFSlow;
        if (queue[k] > 60) ctx.fillStyle = colorRAFVeruSlow;

        ctx.fillRect(numBars - k, height - queue[k] * hmul, 1, queue[k] * hmul);
        if (queue[k] > 30)ctx.fillStyle = colorRAF;
    }

    for (k = numBars; k >= 0; k--)
    {
        let sum = 0;
        ctx.fillStyle = colorMainloop;
        sum = timesMainloop[k];
        ctx.fillRect(numBars - k, height - sum * hmul, 1, timesMainloop[k] * hmul);

        ctx.fillStyle = colorOnFrame;
        sum += timesOnFrame[k];
        ctx.fillRect(numBars - k, height - sum * hmul, 1, timesOnFrame[k] * hmul);

        ctx.fillStyle = colorGPU;
        sum += timesGPU[k];
        ctx.fillRect(numBars - k, height - sum * hmul, 1, timesGPU[k] * hmul);
    }

    for (let i = 10; i < height; i += 10)
    {
        ctx.fillStyle = "#888";
        const y = height - (i * hmul);
        ctx.fillRect(canvas.width - 5, y, 5, 1);
        ctx.font = "8px arial";

        ctx.fillText(i + "ms", canvas.width - 27, y + 3);
    }

    ctx.fillStyle = "#fff";
    ctx.fillRect(canvas.width - 5, height - (1000 / fps * hmul), 5, 1);
    ctx.fillText(Math.round(1000 / fps) + "ms", canvas.width - 27, height - (1000 / fps * hmul));
}

function createCanvas()
{
    canvas = document.createElement("canvas");
    canvas.id = "performance_" + op.patch.config.glCanvasId;
    canvas.width = inSizeGraph.get();
    canvas.height = inSizeGraph.get();
    canvas.style.display = "block";
    canvas.style.opacity = 0.9;
    canvas.style.position = "absolute";
    canvas.style.left = "0px";
    canvas.style.cursor = "pointer";
    canvas.style.top = "-64px";
    canvas.style["z-index"] = "99998";
    container.appendChild(canvas);
    ctx = canvas.getContext("2d");

    canvas.addEventListener("click", toggleOpened);

    updateSize();
}

function updateText()
{
    if (!inShow.get()) return;
    let warn = "";

    if (op.patch.cgl.profileData.profileShaderCompiles > 0)warn += "Shader compile (" + op.patch.cgl.profileData.profileShaderCompileName + ") ";
    if (op.patch.cgl.profileData.profileShaderGetUniform > 0)warn += "Shader get uni loc! (" + op.patch.cgl.profileData.profileShaderGetUniformName + ")";
    if (op.patch.cgl.profileData.profileTextureResize > 0)warn += "Texture resize! ";
    if (op.patch.cgl.profileData.profileFrameBuffercreate > 0)warn += "Framebuffer create! ";
    if (op.patch.cgl.profileData.profileEffectBuffercreate > 0)warn += "Effectbuffer create! ";
    if (op.patch.cgl.profileData.profileTextureDelete > 0)warn += "Texture delete! ";
    if (op.patch.cgl.profileData.profileNonTypedAttrib > 0)warn += "Not-Typed Buffer Attrib! " + op.patch.cgl.profileData.profileNonTypedAttribNames;
    if (op.patch.cgl.profileData.profileTextureNew > 0)warn += "new texture created! ";
    if (op.patch.cgl.profileData.profileGenMipMap > 0)warn += "generating mip maps!";

    if (warn.length > 0)
    {
        warn = "| <span style=\"color:#f80;\">WARNING: " + warn + "<span>";
    }

    let html = "";

    if (opened)
    {
        html += "<span style=\"color:" + colorRAF + "\">■</span> " + fps + " fps ";
        html += "<span style=\"color:" + colorMainloop + "\">■</span> " + Math.round(currentTimeMainloop * 100) / 100 + "ms mainloop ";
        html += "<span style=\"color:" + colorOnFrame + "\">■</span> " + Math.round((currentTimeOnFrame) * 100) / 100 + "ms onframe ";
        if (currentTimeGPU) html += "<span style=\"color:" + colorGPU + "\">■</span> " + Math.round(currentTimeGPU * 100) / 100 + "ms GPU";
        html += warn;
        element.innerHTML = html;
    }
    else
    {
        html += fps + " fps / ";
        html += "CPU: " + Math.round((op.patch.cgl.profileData.profileOnAnimFrameOps) * 100) / 100 + "ms / ";
        if (currentTimeGPU)html += "GPU: " + Math.round(currentTimeGPU * 100) / 100 + "ms  ";
        element.innerHTML = html;
    }

    if (op.patch.loading.getProgress() != 1.0)
    {
        element.innerHTML += "<br/>loading " + Math.round(op.patch.loading.getProgress() * 100) + "% " + loadingChars[(++loadingCounter) % loadingChars.length];
    }

    if (opened)
    {
        let count = 0;
        avgMs = 0;
        avgMsChilds = 0;
        for (let i = queue.length; i > queue.length - queue.length / 3; i--)
        {
            if (queue[i] > -1)
            {
                avgMs += queue[i];
                count++;
            }

            if (timesMainloop[i] > -1) avgMsChilds += timesMainloop[i];
        }

        avgMs /= count;
        avgMsChilds /= count;

        element.innerHTML += "<br/> " + cgl.canvasWidth + " x " + cgl.canvasHeight + " (x" + cgl.pixelDensity + ") ";
        element.innerHTML += "<br/>frame avg: " + Math.round(avgMsChilds * 100) / 100 + " ms (" + Math.round(avgMsChilds / avgMs * 100) + "%) / " + Math.round(avgMs * 100) / 100 + " ms";
        element.innerHTML += " (self: " + Math.round((selfTime) * 100) / 100 + " ms) ";

        element.innerHTML += "<br/>shader binds: " + Math.ceil(op.patch.cgl.profileData.profileShaderBinds / fps) +
            " uniforms: " + Math.ceil(op.patch.cgl.profileData.profileUniformCount / fps) +
            " mvp_uni_mat4: " + Math.ceil(op.patch.cgl.profileData.profileMVPMatrixCount / fps) +
            " num glPrimitives: " + Math.ceil(op.patch.cgl.profileData.profileMeshNumElements / (fps)) +

            " fenced pixelread: " + Math.ceil(op.patch.cgl.profileData.profileFencedPixelRead) +

            " mesh.setGeom: " + op.patch.cgl.profileData.profileMeshSetGeom +
            " videos: " + op.patch.cgl.profileData.profileVideosPlaying +
            " tex preview: " + op.patch.cgl.profileData.profileTexPreviews;

        element.innerHTML +=
        " draw meshes: " + Math.ceil(op.patch.cgl.profileData.profileMeshDraw / fps) +
        " framebuffer blit: " + Math.ceil(op.patch.cgl.profileData.profileFramebuffer / fps) +
        " texeffect blit: " + Math.ceil(op.patch.cgl.profileData.profileTextureEffect / fps);

        element.innerHTML += " all shader compiletime: " + Math.round(op.patch.cgl.profileData.shaderCompileTime * 100) / 100;
    }

    op.patch.cgl.profileData.clear();
}

function styleMeasureEle(ele)
{
    ele.style.padding = "0px";
    ele.style.margin = "0px";
}

function addMeasureChild(m, parentEle, timeSum, level)
{
    const height = 20;
    m.usedAvg = (m.usedAvg || m.used);

    if (!m.ele || initMeasures)
    {
        const newEle = document.createElement("div");
        m.ele = newEle;

        if (m.childs && m.childs.length > 0) newEle.style.height = "500px";
        else newEle.style.height = height + "px";

        newEle.style.overflow = "hidden";
        newEle.style.display = "inline-block";

        if (!m.isRoot)
        {
            newEle.innerHTML = "<div style=\"min-height:" + height + "px;width:100%;overflow:hidden;color:black;position:relative\">&nbsp;" + m.name + "</div>";
            newEle.style["background-color"] = "rgb(" + m.colR + "," + m.colG + "," + m.colB + ")";
            newEle.style["border-left"] = "1px solid black";
        }

        parentEle.appendChild(newEle);
    }

    if (!m.isRoot)
    {
        if (performance.now() - m.lastTime > 200)
        {
            m.ele.style.display = "none";
            m.hidden = true;
        }
        else
        {
            if (m.hidden)
            {
                m.ele.style.display = "inline-block";
                m.hidden = false;
            }
        }

        m.ele.style.float = "left";
        m.ele.style.width = Math.floor((m.usedAvg / timeSum) * 98.0) + "%";
    }
    else
    {
        m.ele.style.width = "100%";
        m.ele.style.clear = "both";
        m.ele.style.float = "none";
    }

    if (m && m.childs && m.childs.length > 0)
    {
        let thisTimeSum = 0;
        for (var i = 0; i < m.childs.length; i++)
        {
            m.childs[i].usedAvg = (m.childs[i].usedAvg || m.childs[i].used) * 0.95 + m.childs[i].used * 0.05;
            thisTimeSum += m.childs[i].usedAvg;
        }
        for (var i = 0; i < m.childs.length; i++)
        {
            addMeasureChild(m.childs[i], m.ele, thisTimeSum, level + 1);
        }
    }
}

function clearMeasures(p)
{
    for (let i = 0; i < p.childs.length; i++) clearMeasures(p.childs[i]);
    p.childs.length = 0;
}

function measures()
{
    if (!CGL.performanceMeasures) return;

    if (!elementMeasures)
    {
        op.log("create measure ele");
        elementMeasures = document.createElement("div");
        elementMeasures.style.width = "100%";
        elementMeasures.style["background-color"] = "#444";
        elementMeasures.style.bottom = "10px";
        elementMeasures.style.height = "100px";
        elementMeasures.style.opacity = "1";
        elementMeasures.style.position = "absolute";
        elementMeasures.style["z-index"] = "99999";
        elementMeasures.innerHTML = "";
        container.appendChild(elementMeasures);
    }

    let timeSum = 0;
    const root = CGL.performanceMeasures[0];

    for (let i = 0; i < root.childs.length; i++) timeSum += root.childs[i].used;

    addMeasureChild(CGL.performanceMeasures[0], elementMeasures, timeSum, 0);

    root.childs.length = 0;

    clearMeasures(CGL.performanceMeasures[0]);

    CGL.performanceMeasures.length = 0;
    initMeasures = false;
}

exe.onTriggered = render;

function render()
{
    const selfTimeStart = performance.now();

    if (inActive.get())
    {
        frameCount++;

        if (glQueryExt && inDoGpu.get() && inShow.get())op.patch.cgl.profileData.doProfileGlQuery = true;
        else op.patch.cgl.profileData.doProfileGlQuery = false;

        if (fpsStartTime === 0)fpsStartTime = Date.now();
        if (Date.now() - fpsStartTime >= 1000)
        {
        // query=null;
            fps = frameCount;
            frameCount = 0;
            // frames = 0;
            outFPS.set(fps);
            if (inShow.get())updateText();

            fpsStartTime = Date.now();
        }

        const glQueryData = op.patch.cgl.profileData.glQueryData;
        currentTimeGPU = 0;
        if (glQueryData)
        {
            let count = 0;
            for (let i in glQueryData)
            {
                count++;
                if (glQueryData[i].time)
                    currentTimeGPU += glQueryData[i].time;
            }
        }

        if (inShow.get())
        {
            measures();

            if (opened && !op.patch.cgl.profileData.pause)
            {
            // const timeUsed = performance.now() - lastTime;
                queue.push(op.patch.cgl.profileData.profileFrameDelta);
                queue.shift();

                timesMainloop.push(childsTime);
                timesMainloop.shift();

                timesOnFrame.push(op.patch.cgl.profileData.profileOnAnimFrameOps - op.patch.cgl.profileData.profileMainloopMs);
                timesOnFrame.shift();

                timesGPU.push(currentTimeGPU);
                timesGPU.shift();

                updateCanvas();
            }
        }

        lastTime = performance.now();
        selfTime = performance.now() - selfTimeStart;

        outCanv.setRef(canvas);
    }
    const startTimeChilds = performance.now();

    next.trigger();

    if (inActive.get())
    {
        const nChildsTime = performance.now() - startTimeChilds;
        const nCurrentTimeMainloop = op.patch.cgl.profileData.profileMainloopMs;
        const nCurrentTimeOnFrame = op.patch.cgl.profileData.profileOnAnimFrameOps - op.patch.cgl.profileData.profileMainloopMs;

        if (smoothGraph.get())
        {
            childsTime = childsTime * 0.9 + nChildsTime * 0.1;
            currentTimeMainloop = currentTimeMainloop * 0.5 + nCurrentTimeMainloop * 0.5;
            currentTimeOnFrame = currentTimeOnFrame * 0.5 + nCurrentTimeOnFrame * 0.5;
        }
        else
        {
            childsTime = nChildsTime;
            currentTimeMainloop = nCurrentTimeMainloop;
            currentTimeOnFrame = nCurrentTimeOnFrame;
        }

        op.patch.cgl.profileData.clearGlQuery();
    }
}

}
};

CABLES.OPS["9cd2d9de-000f-4a14-bd13-e7d5f057583c"]={f:Ops.Gl.Performance,objName:"Ops.Gl.Performance"};




// **************************************************************
// 
// Ops.Anim.Smooth
// 
// **************************************************************

Ops.Anim.Smooth= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={};
const
    exec = op.inTrigger("Update"),
    inMode = op.inBool("Separate inc/dec", false),
    inVal = op.inValue("Value"),
    next = op.outTrigger("Next"),
    inDivisorUp = op.inValue("Inc factor", 4),
    inDivisorDown = op.inValue("Dec factor", 4),
    result = op.outNumber("Result", 0);

let val = 0;
let goal = 0;
let oldVal = 0;
let lastTrigger = 0;

op.toWorkPortsNeedToBeLinked(exec);

let divisorUp;
let divisorDown;
let divisor = 4;
let finished = true;

let selectIndex = 0;
const MODE_SINGLE = 0;
const MODE_UP_DOWN = 1;

onFilterChange();
getDivisors();

inMode.setUiAttribs({ "hidePort": true });

inDivisorUp.onChange = inDivisorDown.onChange = getDivisors;
inMode.onChange = onFilterChange;
update();

function onFilterChange()
{
    const selectedMode = inMode.get();
    if (!selectedMode) selectIndex = MODE_SINGLE;
    else selectIndex = MODE_UP_DOWN;

    if (selectIndex == MODE_SINGLE)
    {
        inDivisorDown.setUiAttribs({ "greyout": true });
        inDivisorUp.setUiAttribs({ "title": "Inc/Dec factor" });
    }
    else if (selectIndex == MODE_UP_DOWN)
    {
        inDivisorDown.setUiAttribs({ "greyout": false });
        inDivisorUp.setUiAttribs({ "title": "Inc factor" });
    }

    getDivisors();
    update();
}

function getDivisors()
{
    if (selectIndex == MODE_SINGLE)
    {
        divisorUp = inDivisorUp.get();
        divisorDown = inDivisorUp.get();
    }
    else if (selectIndex == MODE_UP_DOWN)
    {
        divisorUp = inDivisorUp.get();
        divisorDown = inDivisorDown.get();
    }

    if (divisorUp <= 0.2 || divisorUp != divisorUp)divisorUp = 0.2;
    if (divisorDown <= 0.2 || divisorDown != divisorDown)divisorDown = 0.2;
}

inVal.onChange = function ()
{
    finished = false;
    let oldGoal = goal;
    goal = inVal.get();
};

inDivisorUp.onChange = function ()
{
    getDivisors();
};

function update()
{
    let tm = 1;
    if (performance.now() - lastTrigger > 500 || lastTrigger === 0) val = inVal.get() || 0;
    else tm = (performance.now() - lastTrigger) / (performance.now() - lastTrigger);
    lastTrigger = performance.now();

    if (val != val)val = 0;

    if (divisor <= 0)divisor = 0.0001;

    const diff = goal - val;

    if (diff >= 0) val += (diff) / (divisorDown * tm);
    else val += (diff) / (divisorUp * tm);

    if (Math.abs(diff) < 0.00001)val = goal;

    if (divisor != divisor)val = 0;
    if (val != val || val == -Infinity || val == Infinity)val = inVal.get();

    if (oldVal != val)
    {
        result.set(val);
        oldVal = val;
    }

    if (val == goal && !finished)
    {
        finished = true;
        result.set(val);
    }
}

exec.onTriggered = function ()
{
    update();
    next.trigger();
};

}
};

CABLES.OPS["5677b5b5-753a-4fbf-9e91-64c81ec68a2f"]={f:Ops.Anim.Smooth,objName:"Ops.Anim.Smooth"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.EdgeDetection_v4
// 
// **************************************************************

Ops.Gl.ImageCompose.EdgeDetection_v4= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={"edgedetect_frag":"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float amount;\nUNI float width;\nUNI float strength;\nUNI float texWidth;\nUNI float texHeight;\nUNI float mulColor;\n\nconst vec4 lumcoeff = vec4(0.299,0.587,0.114, 0.);\n\nvec3 desaturate(vec3 color)\n{\n    return vec3(dot(vec3(0.2126,0.7152,0.0722), color));\n}\n\n{{CGL.BLENDMODES3}}\n\nvoid main()\n{\n    // vec4 col=vec4(1.0,0.0,0.0,1.0);\n\n    // float pixelX=0.27/texWidth;\n    // float pixelY=0.27/texHeight;\n    float pixelX=(width+0.01)*4.0/texWidth;\n    float pixelY=(width+0.01)*4.0/texHeight;\n\nvec2 tc=texCoord;\n// #ifdef OFFSETPIXEL\n    tc.x+=1.0/texWidth*0.5;\n    tc.y+=1.0/texHeight*0.5;\n// #endif\n    // col=texture(tex,texCoord);\n\n    float count=1.0;\n    vec4 base=texture(tex,texCoord);\n\n\tvec4 horizEdge = vec4( 0.0 );\n\thorizEdge -= texture( tex, vec2( tc.x - pixelX, tc.y - pixelY ) ) * 1.0;\n\thorizEdge -= texture( tex, vec2( tc.x - pixelX, tc.y     ) ) * 2.0;\n\thorizEdge -= texture( tex, vec2( tc.x - pixelX, tc.y + pixelY ) ) * 1.0;\n\thorizEdge += texture( tex, vec2( tc.x + pixelX, tc.y - pixelY ) ) * 1.0;\n\thorizEdge += texture( tex, vec2( tc.x + pixelX, tc.y     ) ) * 2.0;\n\thorizEdge += texture( tex, vec2( tc.x + pixelX, tc.y + pixelY ) ) * 1.0;\n\tvec4 vertEdge = vec4( 0.0 );\n\tvertEdge -= texture( tex, vec2( tc.x - pixelX, tc.y - pixelY ) ) * 1.0;\n\tvertEdge -= texture( tex, vec2( tc.x    , tc.y - pixelY ) ) * 2.0;\n\tvertEdge -= texture( tex, vec2( tc.x + pixelX, tc.y - pixelY ) ) * 1.0;\n\tvertEdge += texture( tex, vec2( tc.x - pixelX, tc.y + pixelY ) ) * 1.0;\n\tvertEdge += texture( tex, vec2( tc.x    , tc.y + pixelY ) ) * 2.0;\n\tvertEdge += texture( tex, vec2( tc.x + pixelX, tc.y + pixelY ) ) * 1.0;\n\n\thorizEdge*=base.a;\n\tvertEdge*=base.a;\n\n\n\tvec3 edge = sqrt((horizEdge.rgb/count * horizEdge.rgb/count) + (vertEdge.rgb/count * vertEdge.rgb/count));\n\n    edge=desaturate(edge);\n    edge*=strength;\n\n    if(mulColor>0.0) edge*=texture( tex, texCoord ).rgb*mulColor*4.0;\n    edge=max(min(edge,1.0),0.0);\n\n    //blend section\n    vec4 col=vec4(edge,base.a);\n\n    outColor=cgl_blendPixel(base,col,amount*base.a);\n}\n\n",};
const
    render = op.inTrigger("Render"),
    blendMode = CGL.TextureEffect.AddBlendSelect(op, "Blend Mode", "normal"),
    amount = op.inValueSlider("Amount", 1),
    strength = op.inFloat("Strength", 4.0),
    width = op.inValueSlider("Width", 0.1),
    mulColor = op.inValueSlider("Mul Color", 0),
    trigger = op.outTrigger("Trigger");

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, op.name, op);

shader.setSource(shader.getDefaultVertexShader(), attachments.edgedetect_frag);

const
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    amountUniform = new CGL.Uniform(shader, "f", "amount", amount),
    strengthUniform = new CGL.Uniform(shader, "f", "strength", strength),
    widthUniform = new CGL.Uniform(shader, "f", "width", width),
    uniWidth = new CGL.Uniform(shader, "f", "texWidth", 128),
    uniHeight = new CGL.Uniform(shader, "f", "texHeight", 128),
    uniMulColor = new CGL.Uniform(shader, "f", "mulColor", mulColor);

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount);

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op, 3)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    uniWidth.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().width);
    uniHeight.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().height);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};

}
};

CABLES.OPS["0240e26e-b86d-43b2-8c72-6795bb86dc76"]={f:Ops.Gl.ImageCompose.EdgeDetection_v4,objName:"Ops.Gl.ImageCompose.EdgeDetection_v4"};




// **************************************************************
// 
// Ops.Gl.ImageCompose.ImageCompose_v3
// 
// **************************************************************

Ops.Gl.ImageCompose.ImageCompose_v3= class extends CABLES.Op 
{
constructor()
{
super(...arguments);
const op=this;
const attachments=op.attachments={"imgcomp_frag":"IN vec2 texCoord;\nUNI vec4 bgColor;\nUNI sampler2D tex;\n#ifdef USE_UVTEX\nUNI sampler2D UVTex;\n#endif\n\nvoid main()\n{\n\n    #ifndef USE_TEX\n        outColor=bgColor;\n    #endif\n    #ifdef USE_TEX\n        #ifndef USE_UVTEX\n        outColor=texture(tex,texCoord);\n        #else\n        outColor=texture(tex,texture(UVTex,texCoord).xy);\n        #endif\n    #endif\n\n\n\n}\n",};
const
    cgl = op.patch.cgl,
    render = op.inTrigger("Render"),
    inTex = op.inTexture("Base Texture"),
    inUVTex = op.inTexture("UV Texture"),
    inSize = op.inSwitch("Size", ["Auto", "Manual"], "Auto"),
    width = op.inValueInt("Width", 640),
    height = op.inValueInt("Height", 480),
    inFilter = op.inSwitch("Filter", ["nearest", "linear", "mipmap"], "linear"),
    inWrap = op.inValueSelect("Wrap", ["clamp to edge", "repeat", "mirrored repeat"], "repeat"),
    inPixel = op.inDropDown("Pixel Format", CGL.Texture.PIXELFORMATS, CGL.Texture.PFORMATSTR_RGBA8UB),

    r = op.inValueSlider("R", 0),
    g = op.inValueSlider("G", 0),
    b = op.inValueSlider("B", 0),
    a = op.inValueSlider("A", 0),

    trigger = op.outTrigger("Next"),
    texOut = op.outTexture("texture_out", CGL.Texture.getEmptyTexture(cgl)),
    outRatio = op.outNumber("Aspect Ratio"),
    outWidth = op.outNumber("Texture Width"),
    outHeight = op.outNumber("Texture Height");

op.setPortGroup("Texture Size", [inSize, width, height]);
op.setPortGroup("Texture Parameters", [inWrap, inFilter, inPixel]);

r.setUiAttribs({ "colorPick": true });
op.setPortGroup("Color", [r, g, b, a]);

op.toWorkPortsNeedToBeLinked(render);

const prevViewPort = [0, 0, 0, 0];
let effect = null;
let tex = null;
let reInitEffect = true;
let isFloatTex = false;
let copyShader = null;
let copyShaderTexUni = null;
let copyShaderUVTexUni = null;
let copyShaderRGBAUni = null;

inWrap.onChange =
    inFilter.onChange =
    inPixel.onChange = reInitLater;

inTex.onLinkChanged =
inSize.onChange =
inUVTex.onChange = updateUi;

render.onTriggered =
    op.preRender = doRender;

updateUi();

function initEffect()
{
    if (effect)effect.delete();
    if (tex)tex.delete();

    effect = new CGL.TextureEffect(cgl, { "isFloatingPointTexture": CGL.Texture.isPixelFormatFloat(inPixel.get()) });

    tex = new CGL.Texture(cgl,
        {
            "name": "image_compose_v2_" + op.id,
            "isFloatingPointTexture": CGL.Texture.isPixelFormatFloat(inPixel.get()),
            "pixelFormat": inPixel.get(),
            "filter": getFilter(),
            "wrap": getWrap(),
            "width": getWidth(),
            "height": getHeight()
        });

    effect.setSourceTexture(tex);

    outWidth.set(getWidth());
    outHeight.set(getHeight());
    outRatio.set(getWidth() / getHeight());

    texOut.set(CGL.Texture.getEmptyTexture(cgl));

    reInitEffect = false;
    updateUi();
}

function getFilter()
{
    if (inFilter.get() == "nearest") return CGL.Texture.FILTER_NEAREST;
    else if (inFilter.get() == "linear") return CGL.Texture.FILTER_LINEAR;
    else if (inFilter.get() == "mipmap") return CGL.Texture.FILTER_MIPMAP;
}

function getWrap()
{
    if (inWrap.get() == "repeat") return CGL.Texture.WRAP_REPEAT;
    else if (inWrap.get() == "mirrored repeat") return CGL.Texture.WRAP_MIRRORED_REPEAT;
    else if (inWrap.get() == "clamp to edge") return CGL.Texture.WRAP_CLAMP_TO_EDGE;
}

function getWidth()
{
    if (inTex.get() && inSize.get() == "Auto") return inTex.get().width;
    if (inSize.get() == "Auto") return cgl.getViewPort()[2];
    return Math.ceil(width.get());
}

function getHeight()
{
    if (inTex.get() && inSize.get() == "Auto") return inTex.get().height;
    else if (inSize.get() == "Auto") return cgl.getViewPort()[3];
    else return Math.ceil(height.get());
}

function reInitLater()
{
    reInitEffect = true;
}

function updateResolution()
{
    if ((
        getWidth() != tex.width ||
        getHeight() != tex.height ||
        // tex.isFloatingPoint() != CGL.Texture.isPixelFormatFloat(inPixel.get()) ||
        tex.pixelFormat != inPixel.get() ||
        tex.filter != getFilter() ||
        tex.wrap != getWrap()
    ) && (getWidth() !== 0 && getHeight() !== 0))
    {
        initEffect();
        effect.setSourceTexture(tex);
        texOut.set(CGL.Texture.getEmptyTexture(cgl));
        texOut.set(tex);
        updateResolutionInfo();
        checkTypes();
    }
}

function updateResolutionInfo()
{
    let info = null;

    if (inSize.get() == "Manual")
    {
        info = null;
    }
    else if (inSize.get() == "Auto")
    {
        if (inTex.get()) info = "Input Texture";
        else info = "Canvas Size";

        info += ": " + getWidth() + " x " + getHeight();
    }

    let changed = false;
    changed = inSize.uiAttribs.info != info;
    inSize.setUiAttribs({ "info": info });
    if (changed)op.refreshParams();
}

function updateDefines()
{
    if (copyShader)copyShader.toggleDefine("USE_TEX", inTex.isLinked());
    if (copyShader)copyShader.toggleDefine("USE_UVTEX", inUVTex.isLinked());
}

function updateUi()
{
    r.setUiAttribs({ "greyout": inTex.isLinked() });
    b.setUiAttribs({ "greyout": inTex.isLinked() });
    g.setUiAttribs({ "greyout": inTex.isLinked() });
    a.setUiAttribs({ "greyout": inTex.isLinked() });

    width.setUiAttribs({ "greyout": inSize.get() == "Auto" });
    height.setUiAttribs({ "greyout": inSize.get() == "Auto" });

    width.setUiAttribs({ "hideParam": inSize.get() != "Manual" });
    height.setUiAttribs({ "hideParam": inSize.get() != "Manual" });

    if (tex)
        if (CGL.Texture.isPixelFormatFloat(inPixel.get()) && getFilter() == CGL.Texture.FILTER_MIPMAP) op.setUiError("fpmipmap", "Don't use mipmap and 32bit at the same time, many systems do not support this.");
        else op.setUiError("fpmipmap", null);

    updateResolutionInfo();
    updateDefines();
    checkTypes();
}

function checkTypes()
{
    if (tex)
        if (inTex.isLinked() && inTex.get() && tex.textureType != inTex.get().textureType && (tex.textureType != CGL.Texture.TYPE_FLOAT || inTex.get().textureType == CGL.Texture.TYPE_FLOAT))
            op.setUiError("textypediff", "Drawing 32bit texture into an 8 bit can result in data/precision loss", 1);
        else
            op.setUiError("textypediff", null);
}

op.preRender = () =>
{
    doRender();
};

function copyTexture()
{
    if (!copyShader)
    {
        copyShader = new CGL.Shader(cgl, "copytextureshader");
        copyShader.setSource(copyShader.getDefaultVertexShader(), attachments.imgcomp_frag);
        copyShaderTexUni = new CGL.Uniform(copyShader, "t", "tex", 0);
        copyShaderUVTexUni = new CGL.Uniform(copyShader, "t", "UVTex", 1);
        copyShaderRGBAUni = new CGL.Uniform(copyShader, "4f", "bgColor", r, g, b, a);
        updateDefines();
    }

    cgl.pushShader(copyShader);
    cgl.currentTextureEffect.bind();

    if (inTex.get()) cgl.setTexture(0, inTex.get().tex);
    if (inUVTex.get()) cgl.setTexture(1, inUVTex.get().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();
}

function doRender()
{
    if (!effect || reInitEffect) initEffect();

    const vp = cgl.getViewPort();
    prevViewPort[0] = vp[0];
    prevViewPort[1] = vp[1];
    prevViewPort[2] = vp[2];
    prevViewPort[3] = vp[3];

    cgl.pushBlend(false);

    updateResolution();

    const oldEffect = cgl.currentTextureEffect;
    cgl.currentTextureEffect = effect;
    cgl.currentTextureEffect.imgCompVer = 3;
    cgl.currentTextureEffect.width = width.get();
    cgl.currentTextureEffect.height = height.get();
    effect.setSourceTexture(tex);

    effect.startEffect(inTex.get() || CGL.Texture.getEmptyTexture(cgl, isFloatTex), true);
    copyTexture();

    trigger.trigger();

    // texOut.set(CGL.Texture.getEmptyTexture(cgl));

    texOut.setRef(effect.getCurrentSourceTexture());

    effect.endEffect();
    // console.log(prevViewPort);

    cgl.setViewPort(prevViewPort[0], prevViewPort[1], prevViewPort[2], prevViewPort[3]);

    cgl.popBlend(false);
    cgl.currentTextureEffect = oldEffect;
}

}
};

CABLES.OPS["e890a050-11b7-456e-b09b-d08cd9c1ee41"]={f:Ops.Gl.ImageCompose.ImageCompose_v3,objName:"Ops.Gl.ImageCompose.ImageCompose_v3"};



window.addEventListener('load', function(event) {
CABLES.jsLoaded=new Event('CABLES.jsLoaded');
document.dispatchEvent(CABLES.jsLoaded);
});
