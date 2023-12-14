///------------------------------------------------------------------------------
import {
  publicToken,
  mainSceneUUID,
  characterControllerSceneUUID,
} from "./config.js";

//------------------------------------------------------------------------------
window.addEventListener("load", () => {
  const canvas = document.getElementById("display-canvas");
  InitApp(canvas);
});


var fresqueNumber = -1;
const allAnimation = ["10d14021-0d21-4192-85ed-1f09c73212e9", "f77941a7-21ac-44d5-a518-b6daeede3783"];
//<audio src="jupiter.mp3" id="jupiter"></audio>


//------------------------------------------------------------------------------
async function InitApp(canvas) {
  await SDK3DVerse.joinOrStartSession({
    userToken: publicToken,
    sceneUUID: mainSceneUUID,
    canvas: canvas,
    createDefaultCamera: false,
    startSimulation: "on-assets-loaded",
  });
  const allFresques = await SDK3DVerse.engineAPI.findEntitiesByEUID('992b1cf7-6443-495a-8a0a-e44efe88bd89');
  const fresques = await allFresques[0].getChildren();
  InitFresque(fresques);
  StopAnimationScientist();
  await InitFirstPersonController(characterControllerSceneUUID);

  const scientist = await SDK3DVerse.engineAPI.findEntitiesByEUID('954ad3dd-ab61-4ee5-98c8-a352c2f63c8c');
  window.addEventListener("keydown", (event) => checkKeyPressed(event, fresques));
  canvas.addEventListener('mousedown', () => setFPSCameraController(canvas));
  SDK3DVerse.notifier.on('onFramePostRender', () => update(scientist));
}

async function InitFresque(fresques){
  fresques.forEach(async function(fresque) {
    const childrenFresque = await fresque.getChildren();

      for (let i = 0; i < 2; i++) {
        if (fresque.children[1] == childrenFresque[i].rtid) {
          childrenFresque[i].setVisibility(false);
        }
      }
  });
}
async function InitVector(){

}

async function Vector(a , b){
  
}

//------------------------------------------------------------------------------
async function InitFirstPersonController(charCtlSceneUUID) {
  // To spawn an entity we need to create an EntityTempllate and specify the
  // components we want to attach to it. In this case we only want a scene_ref
  // that points to the character controller scene.
  const playerTemplate = new SDK3DVerse.EntityTemplate();
  playerTemplate.attachComponent("scene_ref", { value: charCtlSceneUUID });

  // Passing null as parent entity will instantiate our new entity at the root
  // of the main scene.
  const parentEntity = null;
  // Setting this option to true will ensure that our entity will be destroyed
  // when the client is disconnected from the session, making sure we don't
  // leave our 'dead' player body behind.
  const deleteOnClientDisconnection = true;
  // We don't want the player to be saved forever in the scene, so we
  // instantiate a transient entity.
  // Note that an entity template can be instantiated multiple times.
  // Each instantiation results in a new entity.
  const playerSceneEntity = await playerTemplate.instantiateTransientEntity(
    "Player",
    parentEntity,
    deleteOnClientDisconnection
  );

  // The character controller scene is setup as having a single entity at its
  // root which is the first person controller itself.
  const firstPersonController = (await playerSceneEntity.getChildren())[0];
  // Look for the first person camera in the children of the controller.
  const children = await firstPersonController.getChildren();
  const firstPersonCamera = children.find((child) =>
    child.isAttached("camera")
  );

  // We need to assign the current client to the first person controller
  // script which is attached to the firstPersonController entity.
  // This allows the script to know which client inputs it should read.
  SDK3DVerse.engineAPI.assignClientToScripts(firstPersonController);

  // Finally set the first person camera as the main camera.
  SDK3DVerse.setMainCamera(firstPersonCamera);
}

//------------------------------------------------------------------------------
async function deleteFPSCameraController(){
  // Remove the required click for the LOOK_LEFT, LOOK_RIGHT, LOOK_UP, and 
  // LOOK_DOWN actions.
  SDK3DVerse.actionMap.values["LOOK_LEFT"][0] = ['MOUSE_BTN_LEFT', 'MOUSE_AXIS_X_POS'];
  SDK3DVerse.actionMap.values["LOOK_RIGHT"][0] = ['MOUSE_BTN_LEFT', "MOUSE_AXIS_X_NEG"];
  SDK3DVerse.actionMap.values["LOOK_DOWN"][0] = ['MOUSE_BTN_LEFT', "MOUSE_AXIS_Y_NEG"];
  SDK3DVerse.actionMap.values["LOOK_UP"][0] = ['MOUSE_BTN_LEFT', "MOUSE_AXIS_Y_POS"];
  SDK3DVerse.actionMap.propagate();

};

//------------------------------------------------------------------------------
async function setFPSCameraController(canvas){
  // Remove the required click for the LOOK_LEFT, LOOK_RIGHT, LOOK_UP, and 
  // LOOK_DOWN actions.
  SDK3DVerse.actionMap.values["LOOK_LEFT"][0] = ["MOUSE_AXIS_X_POS"];
  SDK3DVerse.actionMap.values["LOOK_RIGHT"][0] = ["MOUSE_AXIS_X_NEG"];
  SDK3DVerse.actionMap.values["LOOK_DOWN"][0] = ["MOUSE_AXIS_Y_NEG"];
  SDK3DVerse.actionMap.values["LOOK_UP"][0] = ["MOUSE_AXIS_Y_POS"];
  SDK3DVerse.actionMap.propagate();

  // Lock the mouse pointer.
  canvas.requestPointerLock = (
    canvas.requestPointerLock 
    || canvas.mozRequestPointerLock 
    || canvas.webkitPointerLockElement
  );
  canvas.requestPointerLock();
};

async function onClick(event) {
  const target = await SDK3DVerse.engineAPI.castScreenSpaceRay(
    event.clientX,
    event.clientY
  );
  if (!target.pickedPosition) return;
  const clickedEntity = target.entity;
}

async function checkKeyPressed(event, fresques){
  if(event.key== "r"){
    detection(fresques);
  }
  if(event.key== "p"){
    fresqueNumber += 1;
    PlayAnimationScientist();
  }
  if(event.key== "f"){
    changeStateTorch();
  }
  if(event.key== "Escape"){
    deleteFPSCameraController();
  }
}

async function changeStateTorch(){
  const torch = await SDK3DVerse.engineAPI.findEntitiesByEUID('bcc769ca-6cec-4c89-a8d7-bd408a3f4142');
  if(torch[0].components.point_light.intensity == 10) {
    torch[0].setComponent('point_light', { intensity: 0 });
  }
  
  else {
    torch[0].setComponent('point_light', { intensity: 10 });
  }
  
}

async function detection(fresques){
  const canvas = document.getElementById("display-canvas");
  const rect   = canvas.getClientRects()[0];
  var { entity, pickedPosition, pickedNormal } = await SDK3DVerse.engineAPI.castScreenSpaceRay(rect.x + rect.width / 2, rect.y + rect.height / 2, true, false);
  const user = await SDK3DVerse.engineAPI.cameraAPI.getActiveViewports();



  const posUser = await user[0].getTransform().position;
 

  if(entity){
    const fresqueFront = entity.getAncestors();
    fresques.forEach(async function(fresque) {
      const childrenFresque = await fresque.getChildren();
      const posFresque = await childrenFresque[0].getGlobalTransform().position;
      const dist = Math.sqrt( ((posFresque[0] - posUser[0]) **2 ) + ((posFresque[1] - posUser[1]) **2) + ((posFresque[2] - posUser[2]) **2));

      if(fresque.getEUID() == fresqueFront[0].components.euid.value &&  dist<7 ){
        
        for (let i = 0; i < 2; i++) {
          if (fresque.children[1] == childrenFresque[i].rtid) {
            childrenFresque[i].setVisibility(!childrenFresque[i].isVisible());
          }
        }

      }  else if (dist >= 7){
        
        for (let i = 0; i < 2; i++) {
          if (fresque.children[1] == childrenFresque[i].rtid) {
            childrenFresque[i].setVisibility(false);
          }
        }
        
      }
    });
  }
}

async function PlayAnimationScientist(){
  const settings = { playbackSpeed : 1.0 };
  if (fresqueNumber < allAnimation.length) {
    SDK3DVerse.engineAPI.stopAnimationSequence(allAnimation[fresqueNumber]);
    SDK3DVerse.engineAPI.playAnimationSequence(allAnimation[fresqueNumber], settings);
  }
}

async function StopAnimationScientist(){
  console.log("stop");
  SDK3DVerse.engineAPI.stopAnimationSequence(allAnimation[0]);
}

let lastTime = performance.now();

async function update(scientist)
{
  const deltaTime = performance.now() - lastTime;
  lastTime = performance.now();
  const scientistPosition = scientist[0].getGlobalTransform();
  console.log("1",scientistPosition.position);
  scientistPosition.position[0] += 0.0001 * deltaTime;
  console.log(scientistPosition.position);
  scientist[0].setGlobalTransform(scientistPosition);
  
  //document.getElementById('jupiter').play();
}

;