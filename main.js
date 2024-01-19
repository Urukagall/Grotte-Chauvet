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
var audioScientist = ["Lion","Rhino","Lyon","Bison"];
var audioCaveman = ["Lion-2","Rhino-2","Lyon-2","Bison-2"];
var stepAudio = 0;
var currentCharacter;
var rootCurrentCharacter;
var numberFire = 0;

SDK3DVerse.notifier.on('onAssetsLoadedChanged', (areAssetsLoaded) =>
{
  console.log('areAssetsLoaded', areAssetsLoaded);
  if (areAssetsLoaded) {
    console.log('areAssetsLoaded', areAssetsLoaded);
    
    const element = document.getElementById("id1");
    element.innerHTML="<canvas id='display-canvas' class='display-canvas' tabindex='1' oncontextmenu='event.preventDefault()'></canvas>";

    document.getElementById("display-canvas").style.display = "none";
    document.getElementById("home").style.display = "block";

    
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

  document.getElementById("home").style.display = "block";


  //document.getElementById("Grotte").play();


  const scientist = await SDK3DVerse.engineAPI.findEntitiesByEUID('bf3ff1b0-2b96-4482-839f-0e376ed76eed');
  const rootScientist = await SDK3DVerse.engineAPI.findEntitiesByEUID('94202d5a-c9f9-4f05-bcab-2fc64ef560b0');

  const caveman = await SDK3DVerse.engineAPI.findEntitiesByEUID('f2b4eac4-30a1-4cfa-8e07-6fad79d87f60');
  const rootCaveman = await SDK3DVerse.engineAPI.findEntitiesByEUID('52f2ffda-aeff-4652-abc5-0e2a5b32b8b9');

  const allFresques = await SDK3DVerse.engineAPI.findEntitiesByEUID('854046a4-430c-4425-a777-d08d7d235046');


  rootCaveman[0].setVisibility(false);
  rootScientist[0].setVisibility(false);

  currentCharacter = scientist;
  rootCurrentCharacter = rootScientist;
  ResetAnime(rootCurrentCharacter);

  const fresques = await allFresques[0].getChildren();
  InitFresque(fresques);
  InitCol();
  // SetFire();
  await InitFirstPersonController(characterControllerSceneUUID);
  
  window.addEventListener("keydown", (event) => checkKeyPressed(event, fresques, currentCharacter, rootCurrentCharacter, canvas));
  canvas.addEventListener('mousedown', () => setFPSCameraController(canvas));
  SDK3DVerse.notifier.on('onFramePostRender', () => update(rootCurrentCharacter, canvas));
}

async function ResetAnime(rootScientist){
  var scientistAnime = rootScientist[0].getComponent('animation_controller').dataJSON;

  scientistAnime.Standing = true;
  scientistAnime.Walking = false;
  scientistAnime.Talking = false;

  rootScientist[0].setComponent("animation_controller", scientistAnime);
}

async function ChangeCharacter(character){
  const rootScientist = await SDK3DVerse.engineAPI.findEntitiesByEUID('94202d5a-c9f9-4f05-bcab-2fc64ef560b0');
  const scientist = await SDK3DVerse.engineAPI.findEntitiesByEUID('bf3ff1b0-2b96-4482-839f-0e376ed76eed');

  const rootCaveMan = await SDK3DVerse.engineAPI.findEntitiesByEUID('52f2ffda-aeff-4652-abc5-0e2a5b32b8b9');
  const caveMan = await SDK3DVerse.engineAPI.findEntitiesByEUID('f2b4eac4-30a1-4cfa-8e07-6fad79d87f60');
  
  const externCollision = await SDK3DVerse.engineAPI.findEntitiesByEUID('1d5657f0-9e9c-4364-b33e-28f1e448e351');
  const internCollision = await SDK3DVerse.engineAPI.findEntitiesByEUID('7654171b-06da-4365-98b6-8b0c924f1945');

  const panneau1 = await SDK3DVerse.engineAPI.findEntitiesByEUID('238add87-5d43-482b-8554-6e9d776064d6');
  const panneau2 = await SDK3DVerse.engineAPI.findEntitiesByEUID('95c473b0-f684-48ab-96bd-7c4f2ee7ec87');
  const panneau3 = await SDK3DVerse.engineAPI.findEntitiesByEUID('97ef8d38-a950-4bec-bc70-a2a62bfb536d');
  const panneau4 = await SDK3DVerse.engineAPI.findEntitiesByEUID('ee0be6e1-2ab0-4e63-93e2-bb364d3611ab');

  const pointListCaveMan = await SDK3DVerse.engineAPI.findEntitiesByEUID('06e8ba40-27d4-4018-8bcd-ef1a122ee407');
  const pointListScientist = await SDK3DVerse.engineAPI.findEntitiesByEUID('eb4d7ab6-113d-4148-b2d1-43ddbc056291');
  const listFire = await SDK3DVerse.engineAPI.findEntitiesByEUID('db89ed9c-eb11-4974-8aae-d062753269ae');
  const listLed = await SDK3DVerse.engineAPI.findEntitiesByEUID('67abe046-cf07-4f66-9a22-7c671702571c');
  
  if(character == "caveman"){
    InitVector(pointListCaveMan);

    listFire[0].setVisibility(true);
    listLed[0].setVisibility(false);
    rootCurrentCharacter = rootCaveMan;
    currentCharacter = caveMan;
    rootCaveMan[0].setVisibility(true);
    audioList = audioCaveman;
    
    panneau1[0].setVisibility(false);
    panneau2[0].setVisibility(false);
    panneau3[0].setVisibility(false);
    panneau4[0].setVisibility(false);

    internCollision[0].setGlobalTransform({
      position : [0, 100, 0]
    });

    externCollision[0].setGlobalTransform({
      position : [0, 0, 0]
    });
  }else{
    InitVector(pointListScientist);

    listFire[0].setVisibility(false);
    listLed[0].setVisibility(true);

    rootCurrentCharacter = rootScientist;
    currentCharacter = scientist;
    rootScientist[0].setVisibility(true);
    audioList = audioScientist;

    panneau1[0].setVisibility(true);
    panneau2[0].setVisibility(true);
    panneau3[0].setVisibility(true);
    panneau4[0].setVisibility(true);

    externCollision[0].setGlobalTransform({
      position : [0, 100, 0]
    });

    internCollision[0].setGlobalTransform({
      position : [0, 0, 0]
    });
  }
  ResetAnime(rootCurrentCharacter);
}

// async function SetFire(){
//   if(numberFire == 0){
//     const fire1 = await SDK3DVerse.engineAPI.findEntitiesByEUID('906964f1-52d3-4b63-8af6-7ebf245d4468');
//     const aura1 = await fire1[0].getChildren();
//     const fire2 = await SDK3DVerse.engineAPI.findEntitiesByEUID('39957872-174c-43e1-b219-96521c3bd652');
//     const aura2 = await fire2[0].getChildren();
//     const fire3 = await SDK3DVerse.engineAPI.findEntitiesByEUID('f201999b-5a5e-4e77-bef6-0e578e37abf3');
//     const aura3 = await fire3[0].getChildren();
//     const fire4 = await SDK3DVerse.engineAPI.findEntitiesByEUID('af14e22d-17fc-4b39-848f-380dca5bb757');
//     const aura4 = await fire4[0].getChildren();


//     for (let i = 0; i < 2; i++) {
//       if (aura1[i].components.debug_name.value == "Aura") {
        
//         aura1[i].setComponent('point_light', { intensity: 0 });
//       }

//       if (aura2[i].components.debug_name.value == "Aura") {
        
//         aura2[i].setComponent('point_light', { intensity: 0 });
//       }

//       if (aura3[i].components.debug_name.value == "Aura") {
        
//         aura3[i].setComponent('point_light', { intensity: 0 });
//       }

//       if (aura4[i].components.debug_name.value == "Aura") {
        
//         aura4[i].setComponent('point_light', { intensity: 0 });
//       }
//     }
//   }else if(numberFire == 1){
//     console.log("a");
//     const fire1 = await SDK3DVerse.engineAPI.findEntitiesByEUID('906964f1-52d3-4b63-8af6-7ebf245d4468');
//     const aura1 = await fire1[0].getChildren();
//     for (let i = 0; i < 2; i++) {
//       if (aura1[i].components.debug_name.value == "Aura") {
        
//         aura1[i].setComponent('point_light', { intensity: 0.2 });
//       }
//     }
//   }else if(numberFire == 2){
//     console.log("b");
//     const fire2 = await SDK3DVerse.engineAPI.findEntitiesByEUID('39957872-174c-43e1-b219-96521c3bd652');
//     const aura2 = await fire2[0].getChildren();
//     for (let i = 0; i < 2; i++) {
//       if (aura2[i].components.debug_name.value == "Aura") {
        
//         aura2[i].setComponent('point_light', { intensity: 0.2 });
//       }
//     }
//   }

//   numberFire += 1;
// }


// Fonction pour gérer le clic sur les images et les faire disparaître
function handleImageClick(imageId) {
  var image = document.getElementById(imageId);
  if (image) {
    image.style.display = "none";
  }
}

// Ajout d'un gestionnaire d'événements pour chaque image
document.getElementById("image1").addEventListener("click", function() {
  handleImageClick("image1");
  document.getElementById("home").style.display = "none";
  ChangeCharacter("scientist");
});

document.getElementById("image2").addEventListener("click", function() {
  handleImageClick("image2");
  document.getElementById("home").style.display = "none";
  ChangeCharacter("caveman");
});

async function InitCol(){
  const debug = await SDK3DVerse.engineAPI.findEntitiesByEUID('618978eb-18b5-47dd-821e-067326e33fd6');
  const externCollision = await SDK3DVerse.engineAPI.findEntitiesByEUID('1d5657f0-9e9c-4364-b33e-28f1e448e351');
  const internCollision = await SDK3DVerse.engineAPI.findEntitiesByEUID('7654171b-06da-4365-98b6-8b0c924f1945');
  debug[0].setVisibility(false);
  internCollision[0].setVisibility(false);
  externCollision[0].setVisibility(false);
}

async function InitFresque(fresques){
  fresques.forEach(async function(fresque) {
    const childrenFresque = await fresque.getChildren();

      // for (let i = 0; i < 2; i++) {
      //   if (fresque.children[1] == childrenFresque[i].rtid) {
      //     childrenFresque[i].setVisibility(false);
      //   }
      // }
      childrenFresque[0].setVisibility(true);
      childrenFresque[1].setVisibility(true);
  });
}

async function InitVector(pointList){
  const childrenList = await pointList[0].getChildren();
  const sizeChildrenList = childrenList.length;

  var trueChildrenList = [];

  for (let i = 0; i < sizeChildrenList; i++) {
    for (let j = 0; j < sizeChildrenList; j++) {
      if (childrenList[j].components.debug_name.value == (i+1).toString()) {
        trueChildrenList.push(childrenList[j])
        pointPosition.push(childrenList[j].getGlobalTransform().position)
      }
    }
    
  }

  for (let i = 0; i < sizeChildrenList - 1; i++) {

    var pointA = [0,0,0]
    var pointB = [0,0,0]

    pointA = trueChildrenList[i].getGlobalTransform().position;
    pointB = trueChildrenList[i+1].getGlobalTransform().position;
    await Vector(pointA, pointB);
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
  
  if (document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement) {
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
    document.exitPointerLock();
  }
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

async function checkKeyPressed(event, fresques, currentCharacter, rootCurrentCharacter, canvas){
  if(event.key== "e"){
    detectionFresque(fresques, currentCharacter, canvas);
  }

  if(event.key== "r"){
    detectionGuide(currentCharacter, rootCurrentCharacter);
  }
  if(event.key== "f"){
    changeStateTorch();
  }

  if(event.key== "Escape"){
    document.getElementById("text-fresque").style.display = "none";
  }

}




async function changeStateTorch(){
  const torch = await SDK3DVerse.engineAPI.findEntitiesByEUID('bcc769ca-6cec-4c89-a8d7-bd408a3f4142');
  if(torch[0].components.point_light.intensity == 1) {
    torch[0].setComponent('point_light', { intensity: 0 });
  }
  
  else {
    torch[0].setComponent('point_light', { intensity: 1 });
  }
  
}

var trueFresque = 0;
var distFresque = 4;
async function detectionFresque(fresques, scientist, canvas){
  
  const user = await SDK3DVerse.engineAPI.cameraAPI.getActiveViewports();
  const posUser = await user[0].getTransform().position;
  var posFresque;

  if(document.getElementById("text-fresque").style.display == "block"){
    document.getElementById("text-fresque").style.display = "none";
    console.log("a");
  }else{

    trueFresque = 0;
    distFresque = 4;
    await fresques.forEach(async function(fresque) {
      const childrenFresque = await fresque.getChildren();
      if(scientist[0].components.debug_name.value == "caveman"){
        if(childrenFresque[1].components.debug_name.value == "fresque"){
          posFresque = await childrenFresque[1].getGlobalTransform().position;
        }else{
          posFresque = await childrenFresque[0].getGlobalTransform().position;
        }
      }else{
        if(childrenFresque[1].components.debug_name.value == "fresque"){
          posFresque = await childrenFresque[0].getGlobalTransform().position;
        }else{
          posFresque = await childrenFresque[1].getGlobalTransform().position;
        }
      }

      const dist = Math.sqrt( ((posFresque[0] - posUser[0]) **2 ) + ((posFresque[1] - posUser[1]) **2) + ((posFresque[2] - posUser[2]) **2));
      
      console.log(dist);

      if( dist < 4 && dist < distFresque){
        distFresque = dist;
        trueFresque = fresque;
        
        TextFresque(trueFresque);
      }
    });


  }
}

async function TextFresque(fresque){

  console.log(fresque.components.debug_name.value);

  const name = fresque.components.debug_name.value;
  console.log(name);

  var titleElement = document.querySelector('#text-fresque h2');
  var linkElement = document.querySelector('.text p');

  if(name =="Bison"){
    titleElement.innerText = 'Bison';
    linkElement.innerText = 'Nouveau Texte du lien';
  }else if(name =="Rhino"){
    titleElement.innerText = 'Rhino';
    linkElement.innerText = 'Nouveau Texte du lien';
  }else if(name =="Lion"){
    titleElement.innerText = 'Lion';
    linkElement.innerText = 'Nouveau Texte du lien';
  }else if(name =="Fresque"){
    titleElement.innerText = 'Fresque';
    linkElement.innerText = 'Nouveau Texte du lien';
  }
  
  document.getElementById("text-fresque").style.display = "block";

}

async function detectionGuide(scientist, rootScientist){
  const user = await SDK3DVerse.engineAPI.cameraAPI.getActiveViewports();
  const posUser = await user[0].getTransform().position;
 
  if(stepScientist ==-1 || stepScientist ==3 || stepScientist ==7 || stepScientist ==14 || stepScientist ==15){
    const scientistPosition = scientist[0].getGlobalTransform().position;
    const scientistTransform = rootScientist[0].getGlobalTransform();
    const dist = Math.sqrt( ((scientistPosition[0] - posUser[0]) **2 ) + ((scientistPosition[1] - posUser[1]) **2) + ((scientistPosition[2] - posUser[2]) **2));
    if(dist<2){
      if(!scientistTalk && stepScientist>=0){
        const audio = audioList[stepAudio];
        document.getElementById(audio).play();
        scientistTalk = true;

        
      }else{
        if(stepScientist!=0 && scientistTalk){
          document.getElementById(audioList[stepAudio]).pause();
          document.getElementById(audioList[stepAudio]).currentTime = 0;
          stepAudio += 1;
        }            
        stepScientist += 1 ;

        scientistTalk = false;
        scientistTransform.eulerOrientation[1] = await rotation(pointPosition[stepScientist], pointPosition[stepScientist + 1]);
        rootScientist[0].setGlobalTransform({ eulerOrientation : scientistTransform.eulerOrientation});

      }
    }
  }
}

// async function detection(fresques, scientist, rootScientist){
//   const canvas = document.getElementById("display-canvas");
//   const rect   = canvas.getClientRects()[0];
//   var { entity, pickedPosition, pickedNormal } = await SDK3DVerse.engineAPI.castScreenSpaceRay(rect.x + rect.width / 2, rect.y + rect.height / 2, true, false);
//   const user = await SDK3DVerse.engineAPI.cameraAPI.getActiveViewports();



//   const posUser = await user[0].getTransform().position;
 

//   if(entity){
//     const fresqueFront = entity.getAncestors();
    
//     if(fresqueFront[0].components.euid.value == scientist[0].getEUID()){
//       if(stepScientist ==-1 || stepScientist ==3 || stepScientist ==7 || stepScientist ==14 || stepScientist ==15){
//         const scientistPosition = scientist[0].getGlobalTransform().position;
//         const scientistTransform = rootScientist[0].getGlobalTransform();
//         const dist = Math.sqrt( ((scientistPosition[0] - posUser[0]) **2 ) + ((scientistPosition[1] - posUser[1]) **2) + ((scientistPosition[2] - posUser[2]) **2));
//         if(dist<7){
//           if(!scientistTalk && stepScientist>=0){
//             const audio = audioList[stepAudio];
//             document.getElementById(audio).play();
//             scientistTalk = true;
            
//           }else{
//             if(stepScientist!=0 && scientistTalk){
//               document.getElementById(audioList[stepAudio]).pause();
//               document.getElementById(audioList[stepAudio]).currentTime = 0;
//               stepAudio += 1;
//             }            
//             stepScientist += 1 ;

//             scientistTalk = false;
//             scientistTransform.eulerOrientation[1] = await rotation(pointPosition[stepScientist], pointPosition[stepScientist + 1]);
//             rootScientist[0].setGlobalTransform({ eulerOrientation : scientistTransform.eulerOrientation});
  
//           }
//         }
//       }
//     }else{
//       fresques.forEach(async function(fresque) {
//         const childrenFresque = await fresque.getChildren();
//         const posFresque = await childrenFresque[1].getGlobalTransform().position;
//         const dist = Math.sqrt( ((posFresque[0] - posUser[0]) **2 ) + ((posFresque[1] - posUser[1]) **2) + ((posFresque[2] - posUser[2]) **2));

//         var trueFresque = 0;
//         var truePanneau = 0;

//         if(fresque.getEUID() == fresqueFront[0].components.euid.value && dist < 10 ){
          
//           for (let i = 0; i < 2; i++) {
//             if (childrenFresque[i].components.debug_name.value == "fresque") {
//               trueFresque = childrenFresque[i];
//             }
//             else if (childrenFresque[i].components.debug_name.value == "Panneau.glb") {
//               truePanneau = childrenFresque[i];

//             }
//           }

//           var titleElement = document.querySelector('#text-fresque h2');
//           titleElement.innerText = 'Nouveau Titre';
//           var linkElement = document.querySelector('.text p');
//           linkElement.innerText = 'Nouveau Texte du lien';
          
//           truePanneau.setVisibility(!truePanneau.isVisible());
//           document.getElementById("text-fresque").style.display = "block";
//           deleteFPSCameraController();
  
//         }  else if (fresque.getEUID() == fresqueFront[0].components.euid.value && dist >= 10){
          
//           truePanneau.setVisibility(false);
          
//         }
//       });
//     }

//   }
// }

async function rotation(pointA, pointB)
{
  const deltaX = pointB[0] - pointA[0];
  const deltaZ = pointB[2] - pointA[2];

  const angleRad = Math.atan2(deltaZ, deltaX);

  var angleDeg = -(((angleRad * 180) / Math.PI) - 90);

  return angleDeg;
}

var lastTime = performance.now();
async function update(scientist, canvas)
{
  //verification si la souris est lock pour désactiver le suivi de la caméra avec le curseur
  if (document.pointerLockElement == null) {
    deleteFPSCameraController();
  }


  const deltaTime = performance.now() - lastTime;
  lastTime = performance.now();
  const scientistTransform = scientist[0].getGlobalTransform();
  var scientistAnime = scientist[0].getComponent('animation_controller').dataJSON; 
  if (listVector.length > stepScientist && listVector.length != 0) {

    const dist = Math.sqrt( ((pointPosition[stepScientist + 1][0] - scientistTransform.position[0]) **2 ) + ((pointPosition[stepScientist + 1][1] - scientistTransform.position[1]) **2) + ((pointPosition[stepScientist + 1][2] - scientistTransform.position[2]) **2));
    
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
};