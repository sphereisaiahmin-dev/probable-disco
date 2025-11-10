import { createCablesScene } from "./cablesScene.js";

export const createHelloWorldScene = createCablesScene({
    patchId: "LTY302",
    scriptUrl: "js/art/scenes/helloWorld/patch.js",
    assetPath: "js/art/scenes/helloWorld/assets/",
    jsPath: "js/art/scenes/helloWorld/",
    sceneId: "hello-world"
});
