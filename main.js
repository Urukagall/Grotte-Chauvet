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

//------------------------------------------------------------------------------
async function InitApp(canvas) {
  await SDK3DVerse.joinOrStartSession({
    userToken: publicToken,
    sceneUUID: mainSceneUUID,
    canvas: canvas,
    createDefaultCamera: false,
    startSimulation: "on-assets-loaded",
  });
  
  await InitFirstPersonController(characterControllerSceneUUID);
  window.addEventListener("keydown", checkKeyPressed);
  //canvas.addEventListener('mousedown', () => setFPSCameraController(canvas));
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

async function checkKeyPressed(event){
  if(event.key== "r"){
    detection();
  }
  if(event.key== "f"){
    changeStateTorch();
  }
}

async function changeStateTorch(){
  const torch = await SDK3DVerse.engineAPI.findEntitiesByEUID('bcc769ca-6cec-4c89-a8d7-bd408a3f4142');
  if(torch[0].components.point_light.intensity == 5) {
    torch[0].setComponent('point_light', { intensity: 0 });
  }
  
  else {
    torch[0].setComponent('point_light', { intensity: 5 });
  }
  
}

async function detection(){
  const canvas = document.getElementById("display-canvas");
  const rect   = canvas.getClientRects()[0];
  var { entity, pickedPosition, pickedNormal } = await SDK3DVerse.engineAPI.castScreenSpaceRay(rect.x + rect.width / 2, rect.y + rect.height / 2, true, false);
  const fresque = await SDK3DVerse.engineAPI.findEntitiesByEUID('3326febf-4b07-4e96-be3e-cf5e80b368fa');
  const user = await SDK3DVerse.engineAPI.cameraAPI.getActiveViewports();

  const childrenFresque = await fresque[0].getChildren();
  const posFresque = await childrenFresque[0].getGlobalTransform().position;
  const posUser = await user[0].getTransform().position;
  const dist = Math.sqrt( ((posFresque[0] - posUser[0]) **2 ) + ((posFresque[1] - posUser[1]) **2) + ((posFresque[2] - posUser[2]) **2));
  console.log(posFresque);
  console.log(posUser);
  console.log(dist);
  if(entity && dist<7){
    const fresqueFront = entity.getAncestors();
  
    if(fresque[0].getEUID() == fresqueFront[0].components.euid.value){

      childrenFresque[1].setVisibility(!childrenFresque[1].isVisible());

    }
  }
  else if (dist >= 7){
    childrenFresque[1].setVisibility(false);
  }

  // const {entity, pickedPosition, pickedNormal} = await SDK3DVerse.engineAPI.castScreenSpaceRay(e.clientX, e.clientY, selectEntity, keepOldSelection);
  // entity ? console.log('Selected entity', entity.getName()) : console.log('No entity selected');
}
;