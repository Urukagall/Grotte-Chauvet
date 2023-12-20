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
var audioList = [];
var stepAudio = 0;
var currentCharacter;
var rootCurrentCharacter;
SDK3DVerse.notifier.on('onAssetsLoadedChanged', (areAssetsLoaded) =>
{
  console.log('areAssetsLoaded', areAssetsLoaded);
  if (areAssetsLoaded) {
      console.log('areAssetsLoaded', areAssetsLoaded);
      
      const element = document.getElementById("id1");
      element.innerHTML="<canvas id='display-canvas' class='display-canvas' tabindex='1' oncontextmenu='event.preventDefault()'></canvas>";

      document.getElementById("display-canvas").style.display = "block";
      document.getElementById("caveTitle").style.display = "none";
      document.getElementById("loadingText").style.display = "none";
      
    }
    else{
      document.getElementById("display-canvas").style.display = "none";
    }
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
  
  document.getElementById("loadingIcon").style.display = "none";


  audioList.push("lion");
  audioList.push("rhino");
  audioList.push("Lyon");
  audioList.push("bisons");

  // const allFresques = await SDK3DVerse.engineAPI.findEntitiesByEUID('992b1cf7-6443-495a-8a0a-e44efe88bd89');
  const allFresques = await SDK3DVerse.engineAPI.findEntitiesByEUID('854046a4-430c-4425-a777-d08d7d235046');

  const scientist = await SDK3DVerse.engineAPI.findEntitiesByEUID('bf3ff1b0-2b96-4482-839f-0e376ed76eed');
  
  const rootScientist = await SDK3DVerse.engineAPI.findEntitiesByEUID('94202d5a-c9f9-4f05-bcab-2fc64ef560b0');
  // const scientist = await SDK3DVerse.engineAPI.findEntitiesByEUID('954ad3dd-ab61-4ee5-98c8-a352c2f63c8c');
  currentCharacter = scientist;
  rootCurrentCharacter = rootScientist;
  ResetAnime(rootCurrentCharacter);

  const fresques = await allFresques[0].getChildren();
  InitFresque(fresques);
  InitVector();

  await InitFirstPersonController(characterControllerSceneUUID);
  
  window.addEventListener("keydown", (event) => checkKeyPressed(event, fresques, currentCharacter));
  canvas.addEventListener('mousedown', () => setFPSCameraController(canvas));
  SDK3DVerse.notifier.on('onFramePostRender', () => update(rootCurrentCharacter));
}

async function ResetAnime(rootScientist){
  var scientistAnime = rootScientist[0].getComponent('animation_controller').dataJSON;

  scientistAnime.Standing = true;
  scientistAnime.Walking = false;
  scientistAnime.Talking = false;

  rootScientist[0].setComponent("animation_controller", scientistAnime);
}

async function InitFresque(fresques){
  fresques.forEach(async function(fresque) {
    const childrenFresque = await fresque.getChildren();

      // for (let i = 0; i < 2; i++) {
      //   if (fresque.children[1] == childrenFresque[i].rtid) {
      //     childrenFresque[i].setVisibility(false);
      //   }
      // }
      childrenFresque[0].setVisibility(false);
    console.log(childrenFresque);
  });
}

async function InitVector(){
  // const pointList = await SDK3DVerse.engineAPI.findEntitiesByEUID('ea10f940-5832-4b01-a167-00ef00bfefe1');
  const pointList = await SDK3DVerse.engineAPI.findEntitiesByEUID('eb4d7ab6-113d-4148-b2d1-43ddbc056291');
  const childrenList = await pointList[0].getChildren();
  const sizeChildrenList = childrenList.length;

  for (let i = 0; i < sizeChildrenList - 1; i++) {

    var pointA = [0,0,0]
    var pointB = [0,0,0]

    // pointA = childrenList[i].getGlobalTransform().position;
    // pointB = childrenList[i + 1].getGlobalTransform().position;
    for (let j = 0; j < sizeChildrenList; j++) {

      if (pointList[0].children[i] == childrenList[j].rtid) {
        pointA = childrenList[j].getGlobalTransform().position;
      }

      else if (pointList[0].children[i + 1] == childrenList[j].rtid) {
        
        pointB = childrenList[j].getGlobalTransform().position;
      }

    }
    await Vector(pointA, pointB);
  }
  for (let i = 0; i < sizeChildrenList ; i++) {

    // const pos = childrenList[i].getGlobalTransform().position;
    // pointPosition.push(pos);

    for (let j = 0; j < sizeChildrenList; j++) {

      if (pointList[0].children[i] == childrenList[j].rtid) {
        const pos = childrenList[j].getGlobalTransform().position;
        pointPosition.push(pos);
      }

    }

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
    console.log(fresqueFront[0]);
    
    if(fresqueFront[0].components.euid.value == scientist[0].getEUID()){
      if(stepScientist ==-1 || stepScientist ==3 || stepScientist ==7 || stepScientist ==14 || stepScientist ==15){
        console.log("go");
        const scientistPosition = scientist[0].getGlobalTransform().position;
        const scientistTransform = scientist[0].getGlobalTransform();
        const dist = Math.sqrt( ((scientistPosition[0] - posUser[0]) **2 ) + ((scientistPosition[1] - posUser[1]) **2) + ((scientistPosition[2] - posUser[2]) **2));
        if(dist<7){
          if(!scientistTalk && stepScientist>=0){
            document.getElementById(audioList[stepAudio]).play();
            console.log("speak");
            scientistTalk = true;
            
          }else{
            if(stepScientist!=0 && scientistTalk){
              document.getElementById(audioList[stepAudio]).pause();
              document.getElementById(audioList[stepAudio]).currentTime = 0;
            }            
            console.log("no Lyon");
            stepScientist += 1 ;
            stepAudio += 1;
            scientistTalk = false;
            scientistTransform.eulerOrientation[1] = await rotation(pointPosition[stepScientist], pointPosition[stepScientist + 1]);
            scientist[0].setGlobalTransform({ eulerOrientation : scientistTransform.eulerOrientation});
  
          }
        }
      }
    }else{
      fresques.forEach(async function(fresque) {
        const childrenFresque = await fresque.getChildren();
        const posFresque = await childrenFresque[1].getGlobalTransform().position;
        const dist = Math.sqrt( ((posFresque[0] - posUser[0]) **2 ) + ((posFresque[1] - posUser[1]) **2) + ((posFresque[2] - posUser[2]) **2));

        var trueFresque = 0;
        var truePanneau = 0;

        if(fresque.getEUID() == fresqueFront[0].components.euid.value && dist < 10 ){
          
          for (let i = 0; i < 2; i++) {
            if (childrenFresque[i].components.debug_name.value == "fresque") {
              trueFresque = childrenFresque[i];
            }
            else if (childrenFresque[i].components.debug_name.value == "Panneau.glb") {
              truePanneau = childrenFresque[i];
            }
          }
  
          truePanneau.setVisibility(!truePanneau.isVisible());
  
        }  else if (fresque.getEUID() == fresqueFront[0].components.euid.value && dist >= 10){
          
          truePanneau.setVisibility(false);
          
        }
      });
    }

  }
}

async function rotation(pointA, pointB)
{
  const deltaX = pointB[0] - pointA[0];
  const deltaZ = pointB[2] - pointA[2];

  const angleRad = Math.atan2(deltaZ, deltaX);

  var angleDeg = ((angleRad * 180) / Math.PI) - 90;

  return angleDeg;
}

var lastTime = performance.now();
async function update(scientist)
{
  const deltaTime = performance.now() - lastTime;
  lastTime = performance.now();
  const scientistTransform = scientist[0].getGlobalTransform();
  var scientistAnime = scientist[0].getComponent('animation_controller').dataJSON;
  if (listVector.length > stepScientist) {

    const dist = Math.sqrt( ((pointPosition[stepScientist + 1][0] - scientistTransform.position[0]) **2 ) + ((pointPosition[stepScientist + 1][1] - scientistTransform.position[1]) **2) + ((pointPosition[stepScientist + 1][2] - scientistTransform.position[2]) **2));
    
    //console.log(dist);
    if(dist >= 0.1 && stepScientist >=0 ){
      if(scientistAnime.Walking == false && (scientistAnime.Standing == true || scientistAnime.Talking == true)){
        scientistAnime.Standing = false;
        scientistAnime.Talking = false;
        scientistAnime.Walking = true;
        scientist[0].setComponent("animation_controller", scientistAnime);
      }
      
      scientistTransform.position[0] += 0.0005 * deltaTime * listVector[stepScientist][0]; 
      scientistTransform.position[1] += 0.0005 * deltaTime * listVector[stepScientist][1]; 
      scientistTransform.position[2] += 0.0005 * deltaTime * listVector[stepScientist][2]; 
    }else if(stepScientist !=-1 && stepScientist !=3 && stepScientist !=7 && stepScientist !=14 && stepScientist !=15){
      stepScientist += 1;
      const rot = await rotation(pointPosition[stepScientist], pointPosition[stepScientist + 1]);
      scientistTransform.eulerOrientation[1] = rot;
    }else {
      if (scientistTalk == true) {
        const rot = await rotation(pointPosition[stepScientist + 1], SDK3DVerse.engineAPI.cameraAPI.getActiveViewports()[0].getTransform().position);
        scientistTransform.eulerOrientation[1] = rot;
      }
      if(scientistTalk == true && scientistAnime.Talking == false){
        scientistAnime.Standing = false;
        scientistAnime.Talking = true;
        scientist[0].setComponent("animation_controller", scientistAnime);
      

      }else if(scientistAnime.Walking == true){
        scientistAnime.Standing = true;
        scientistAnime.Walking = false;
        scientist[0].setComponent("animation_controller", scientistAnime);
      }
    }
  }
  scientist[0].setGlobalTransform({
    position : scientistTransform.position,
    eulerOrientation : scientistTransform.eulerOrientation
  });
  // console.log(scientist[0]);
  
  // console.log(scientistTransform.eulerOrientation);
  // console.log(scientist[0].components.local_transform.eulerOrientation);
  // console.log(scientist[0].getGlobalTransform().eulerOrientation);
  // console.log(scientist[0].getGlobalTransform().scale);
}

;