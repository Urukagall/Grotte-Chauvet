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

var listVector = [];
var stepScientist = -1;
var scientistTalk = false;
var pointPosition = [];

//------------------------------------------------------------------------------
async function InitApp(canvas) {
  await SDK3DVerse.joinOrStartSession({
    userToken: publicToken,
    sceneUUID: mainSceneUUID,
    canvas: canvas,
    createDefaultCamera: false,
    startSimulation: "on-assets-loaded",
  });
  // const allFresques = await SDK3DVerse.engineAPI.findEntitiesByEUID('992b1cf7-6443-495a-8a0a-e44efe88bd89');
  const allFresques = await SDK3DVerse.engineAPI.findEntitiesByEUID('854046a4-430c-4425-a777-d08d7d235046');

  const scientist = await SDK3DVerse.engineAPI.findEntitiesByEUID('0e2ee174-f680-42b1-9f81-2122beea911a');
  // const scientist = await SDK3DVerse.engineAPI.findEntitiesByEUID('954ad3dd-ab61-4ee5-98c8-a352c2f63c8c');

  const fresques = await allFresques[0].getChildren();
  InitFresque(fresques);
  InitVector();

  await InitFirstPersonController(characterControllerSceneUUID);
  
  window.addEventListener("keydown", (event) => checkKeyPressed(event, fresques, scientist));
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
  // const pointList = await SDK3DVerse.engineAPI.findEntitiesByEUID('ea10f940-5832-4b01-a167-00ef00bfefe1');
  const pointList = await SDK3DVerse.engineAPI.findEntitiesByEUID('dfef5092-40f5-48a2-9ced-27cb368a03b0');
  const childrenList = await pointList[0].getChildren();
  const sizeChildrenList = childrenList.length;

  for (let i = 0; i < sizeChildrenList - 1; i++) {

    var pointA = [0,0,0]
    var pointB = [0,0,0]

    pointA = childrenList[i].getGlobalTransform().position;
    pointB = childrenList[i + 1].getGlobalTransform().position;
    // for (let j = 0; j < sizeChildrenList; j++) {

    //   if (pointList[0].children[i] == childrenList[j].rtid) {
    //     pointA = childrenList[j].getGlobalTransform().position;
    //   }

    //   else if (pointList[0].children[i + 1] == childrenList[j].rtid) {
        
    //     pointB = childrenList[j].getGlobalTransform().position;
    //   }

    // }
    await Vector(pointA, pointB);
  }
  for (let i = 0; i < sizeChildrenList ; i++) {

    const pos = childrenList[i].getGlobalTransform().position;
    pointPosition.push(pos);

    // for (let j = 0; j < sizeChildrenList; j++) {

    //   if (pointList[0].children[i] == childrenList[j].rtid) {
    //     const pos = childrenList[j].getGlobalTransform().position;
    //     pointPosition.push(pos);
    //   }

    // }

  }
}

async function Vector(a , b){
  var vect = [0,0,0];
  var norm = Math.sqrt( ((b[0]-a[0])**2) + ((b[1]-a[1])**2) + ((b[2]-a[2])**2))
  vect[0] = (b[0] - a[0]) / norm; 
  vect[1] = (b[1] - a[1]) / norm; 
  vect[2] = (b[2] - a[2]) / norm; 
  listVector.push(vect);
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
  // Remove the camera controls set by the setFPSCameraController function, and
  //reverse to the default 3Dverse camera controls
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

async function checkKeyPressed(event, fresques, scientist){
  if(event.key== "r"){
    detection(fresques, scientist);
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

async function detection(fresques, scientist){
  const canvas = document.getElementById("display-canvas");
  const rect   = canvas.getClientRects()[0];
  var { entity, pickedPosition, pickedNormal } = await SDK3DVerse.engineAPI.castScreenSpaceRay(rect.x + rect.width / 2, rect.y + rect.height / 2, true, false);
  const user = await SDK3DVerse.engineAPI.cameraAPI.getActiveViewports();



  const posUser = await user[0].getTransform().position;
 

  if(entity){
    const fresqueFront = entity.getAncestors();
    if(fresqueFront[0].components.euid.value == scientist[0].getEUID()){
      console.log("go");
      const scientistPosition = scientist[0].getGlobalTransform().position;
      const dist = Math.sqrt( ((scientistPosition[0] - posUser[0]) **2 ) + ((scientistPosition[1] - posUser[1]) **2) + ((scientistPosition[2] - posUser[2]) **2));
      if(dist<7){
        if(!scientistTalk && stepScientist>=0){
          document.getElementById('Dany').play();
          console.log("speak");
          scientistTalk = true
        }else{
          if(stepScientist!=0){
            document.getElementById('Dany').pause();
            document.getElementById('Dany').currentTime = 0;
          }            
          console.log("tg Dany");
          stepScientist += 1 ;
          scientistTalk = false;
        }
      }
    }else{
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
}

var lastTime = performance.now();

async function update(scientist)
{
  const deltaTime = performance.now() - lastTime;
  lastTime = performance.now();
  const scientistPosition = scientist[0].getGlobalTransform();
  const dist = Math.sqrt( ((pointPosition[stepScientist + 1][0] - scientistPosition.position[0]) **2 ) + ((pointPosition[stepScientist + 1][1] - scientistPosition.position[1]) **2) + ((pointPosition[stepScientist + 1][2] - scientistPosition.position[2]) **2));
  
  if(dist >= 0.1 && stepScientist >=0 && listVector.length > stepScientist ){
    scientistPosition.position[0] += 0.001 * deltaTime * listVector[stepScientist][0]; 
    scientistPosition.position[1] += 0.001 * deltaTime * listVector[stepScientist][1]; 
    scientistPosition.position[2] += 0.001 * deltaTime * listVector[stepScientist][2]; 
  }else if(stepScientist !=-1 && stepScientist !=1){
    stepScientist += 1;
  }

  scientist[0].setGlobalTransform(scientistPosition);
}

;