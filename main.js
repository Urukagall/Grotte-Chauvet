///------------------------------------------------------------------------------
import {
  publicToken,
  mainSceneUUID,
  caveSceneUUID,
  caveLinkerEntityName,
  characterControllerSceneUUID,
} from "./config.js";

//------------------------------------------------------------------------------
window.addEventListener("load", () => {
  const canvas = document.getElementById("display-canvas");
  InitApp(canvas);
});

//------------------------------------------------------------------------------
let listVector = [];
let stepScientist = -1;
let scientistTalk = false;
let pointPosition = [];
let audioList = [];
let audioScientist = ["Lion","Rhino","Lyon","Bison"];
let audioCaveman = ["Lion-2","Rhino-2","Lyon-2","Bison-2"];
let stepAudio = 0;
let currentCharacter;
let rootCurrentCharacter;
let caveSceneEntity;
let fresques;
let numberFire = 0;
let mainSceneLoadedResolve;
let mainSceneLoadedPromise = new Promise(resolve => { mainSceneLoadedResolve = resolve; });

//------------------------------------------------------------------------------
// SEB: No idea why you did that but the listener is actually never called because all listeners
//      are removed from SDK3DVerse.notifier once you call SDK3DVerse.joinOrStartSession.
//      Also this listener seems very weird!
/*
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
*/

//------------------------------------------------------------------------------
async function InitApp(canvas) {
  // hide canvas until main assets are loaded
  canvas.style.display = "none";

  const isSessionCreator = await SDK3DVerse.joinOrStartSession({
    userToken: publicToken,
    sceneUUID: mainSceneUUID,
    canvas: canvas,
    // We need a camera for the engine to start loading assets, otherwise it consider nothing
    // has to be rendered so nothing loads
    createDefaultCamera: true,
    isTransient : true
    // Using this will await all assets to be loaded before resolving the joinOrStartSession
    // promise, which means non creator user will have to wait all the cave assets to be loaded
    // before being able to go furher and isntantiate their avatar. We do not want that.
    //startSimulation: "on-assets-loaded",
  });

  if(isSessionCreator) {
    console.log("Session created => wait for main scene loading");
    // Since we are the session creator, we can wait for the main scene to be loaded before popping our avatar.
    SDK3DVerse.notifier.on('onAssetsLoadedChanged', onMainSceneLoaded);
    await mainSceneLoadedPromise;
  }
  else {
    console.log("Session joined => wait a few seconds before popping our avatar");
    // Since we're not the session creator we cannot know if the main scene is fully loaded or not.
    // So we'll just wait a few seconds to be sure the floor assets have been loaded before popping our avatar.
    // Just in case we are joining while the floor is still loading.
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Start the simulation anyway: we created the session, we did not create the session...
  await attachCaveScene();
  SDK3DVerse.engineAPI.startSimulation();

  document.getElementById("loadingIcon").style.display = "none";
  document.getElementById("home").style.display = "block";
  //document.getElementById("Grotte").play();

  // Ajout d'un gestionnaire d'événements pour chaque image
  document.getElementById("choice1").addEventListener("click", function() {
    document.getElementById("home").style.display = "none";
    ChangeCharacter("scientist");
    document.getElementById("chrono").style.display = "block";
    // startChronometer(2 * 60 + 30);
    startChronometer(2);
  });

  document.getElementById("choice2").addEventListener("click", function() {
    document.getElementById("home").style.display = "none";
    ChangeCharacter("caveman");
    document.getElementById("chrono").style.display = "block";
    startChronometer(2 * 60 + 30);
  });

  await InitFirstPersonController(characterControllerSceneUUID);

  // hide NPC and player
  // SEB watch out: if you are multi players then you have to sync the game state among all the players
  // e.g the selection of the guide NPC character
  await initGameState();

  canvas.style.display = "block";

  window.addEventListener("keydown", (event) => checkKeyPressed(event, fresques, currentCharacter, rootCurrentCharacter));
  canvas.addEventListener('mousedown', () => setFPSCameraController(canvas));
  SDK3DVerse.notifier.on('onFramePostRender', () => update(rootCurrentCharacter, canvas));
}

//------------------------------------------------------------------------------
async function initGameState() {
  const scientist = await SDK3DVerse.engineAPI.findEntitiesByEUID('bf3ff1b0-2b96-4482-839f-0e376ed76eed');
  const rootScientist = await SDK3DVerse.engineAPI.findEntitiesByEUID('94202d5a-c9f9-4f05-bcab-2fc64ef560b0');

  //const caveman = await SDK3DVerse.engineAPI.findEntitiesByEUID('f2b4eac4-30a1-4cfa-8e07-6fad79d87f60');
  const rootCaveman = await SDK3DVerse.engineAPI.findEntitiesByEUID('52f2ffda-aeff-4652-abc5-0e2a5b32b8b9');

  const allFresques = await SDK3DVerse.engineAPI.findEntitiesByEUID('854046a4-430c-4425-a777-d08d7d235046');

  currentCharacter = scientist;
  rootCurrentCharacter = rootScientist;
  // SEB watch out: for some reason rese the anim controller makes the character visible again
  // while its visible state in the scene graph remains hidden.
  // So one should set the visibility after ResetAnim.
  ResetAnime(rootCurrentCharacter);
  rootCaveman[0].setVisibility(true);
  rootScientist[0].setVisibility(true);
  rootCaveman[0].setVisibility(false);
  rootScientist[0].setVisibility(false);

  fresques = await allFresques[0].getChildren();
  InitFresque(fresques);
  InitCol();
  // SetFire();

  const user = await SDK3DVerse.engineAPI.findEntitiesByEUID('fd8101ca-42e5-48c6-aed2-2aa0e8a97cb1');
  user[0].setVisibility(true);
  user[0].setVisibility(false);
}

//------------------------------------------------------------------------------
function onMainSceneLoaded(areAssetsLoaded) {
  if(!areAssetsLoaded) {
    return;
  }
  SDK3DVerse.notifier.off('onAssetsLoadedChanged', onMainSceneLoaded);
  console.log("Main scene is fully loaded");
  mainSceneLoadedResolve();
}

//------------------------------------------------------------------------------
async function attachCaveScene() {
  // Attach the cave scene
  const entities = await SDK3DVerse.engineAPI.findEntitiesByNames(caveLinkerEntityName);
  caveSceneEntity = entities[0];
  if(!caveSceneEntity) {
    console.error("Could not find cave linker entity");
    return;
  }

  if(caveSceneEntity.getComponent('scene_ref').value === caveSceneUUID) {
    console.error("Cave scene already attached");
    return;
  }

  caveSceneEntity.setComponent("scene_ref", { value: caveSceneUUID });
  SDK3DVerse.notifier.on('onAssetsLoadedChanged', onCaveSceneLoaded);
  caveSceneEntity.save();
}

//------------------------------------------------------------------------------
async function onCaveSceneLoaded(areAssetsLoaded) {
  if(!areAssetsLoaded) {
    return;
  }
  SDK3DVerse.notifier.off('onAssetsLoadedChanged', onCaveSceneLoaded);
  console.log("Cave scene is fully loaded");
}

//------------------------------------------------------------------------------
async function ResetAnime(rootScientist) {
  const scientistAnime = rootScientist[0].getComponent('animation_controller').dataJSON;

  scientistAnime.Standing = true;
  scientistAnime.Walking = false;
  scientistAnime.Talking = false;

  rootScientist[0].setComponent("animation_controller", scientistAnime);
}

//------------------------------------------------------------------------------
async function ChangeCharacter(character) {
  const rootScientist = await SDK3DVerse.engineAPI.findEntitiesByEUID('94202d5a-c9f9-4f05-bcab-2fc64ef560b0');
  const scientist = await SDK3DVerse.engineAPI.findEntitiesByEUID('bf3ff1b0-2b96-4482-839f-0e376ed76eed');

  const rootCaveMan = await SDK3DVerse.engineAPI.findEntitiesByEUID('52f2ffda-aeff-4652-abc5-0e2a5b32b8b9');
  const caveMan = await SDK3DVerse.engineAPI.findEntitiesByEUID('f2b4eac4-30a1-4cfa-8e07-6fad79d87f60');

  const externCollision = await SDK3DVerse.engineAPI.findEntitiesByEUID('1d5657f0-9e9c-4364-b33e-28f1e448e351');
  const internCollision = await SDK3DVerse.engineAPI.findEntitiesByEUID('7654171b-06da-4365-98b6-8b0c924f1945');
  
  const midCollision = await SDK3DVerse.engineAPI.findEntitiesByEUID('ddabc7d2-e6ac-402f-b6e8-b4fdc50ed719');

  const panneau1 = await SDK3DVerse.engineAPI.findEntitiesByEUID('238add87-5d43-482b-8554-6e9d776064d6');
  const panneau2 = await SDK3DVerse.engineAPI.findEntitiesByEUID('95c473b0-f684-48ab-96bd-7c4f2ee7ec87');
  const panneau3 = await SDK3DVerse.engineAPI.findEntitiesByEUID('97ef8d38-a950-4bec-bc70-a2a62bfb536d');
  const panneau4 = await SDK3DVerse.engineAPI.findEntitiesByEUID('ee0be6e1-2ab0-4e63-93e2-bb364d3611ab');

  const pointListCaveMan = await SDK3DVerse.engineAPI.findEntitiesByEUID('06e8ba40-27d4-4018-8bcd-ef1a122ee407');
  const pointListScientist = await SDK3DVerse.engineAPI.findEntitiesByEUID('eb4d7ab6-113d-4148-b2d1-43ddbc056291');
  const listFire = await SDK3DVerse.engineAPI.findEntitiesByEUID('db89ed9c-eb11-4974-8aae-d062753269ae');
  const listLed = await SDK3DVerse.engineAPI.findEntitiesByEUID('67abe046-cf07-4f66-9a22-7c671702571c');
  const player = await SDK3DVerse.engineAPI.findEntitiesByEUID('2252d8f2-d48f-4210-99f9-069968904a45');
  if(character == "caveman"){
    InitVector(pointListCaveMan);

    listFire[0].setGlobalTransform({
      position : [0, 0, 0]
    });

    listLed[0].setGlobalTransform({
      position : [0, 100, 0]
    });

    rootCurrentCharacter = rootCaveMan;
    currentCharacter = caveMan;
    rootCaveMan[0].setVisibility(true);

    rootCaveMan[0].setGlobalTransform({
      position : [-1.321874, -0.803166, 0.084539]
    });

    player[0].setGlobalTransform({
      position : [-1, 0, -1]
    })

    rootScientist[0].setGlobalTransform({
      position : [0, 100, 0]
    });

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
    midCollision[0].setGlobalTransform({
      position : [0, 0, 0]
    });
  }
  else {
    InitVector(pointListScientist);

    listFire[0].setGlobalTransform({
      position : [0, 100, 0]
    });

    listLed[0].setGlobalTransform({
      position : [0, 0, 0]
    });

    rootCurrentCharacter = rootScientist;
    currentCharacter = scientist;
    rootScientist[0].setVisibility(true);
    
    rootCaveMan[0].setGlobalTransform({
      position : [0, 100, 0]
    });

    rootScientist[0].setGlobalTransform({
      position : [-0.141683, -0.284934, 0.362731]
    });
    
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
    midCollision[0].setGlobalTransform({
      position : [0, 100, 0]
    });
  }
  ResetAnime(rootCurrentCharacter);
}

//------------------------------------------------------------------------------
function startChronometer(duration) {
  let timer = duration, minutes, seconds;
  const chronometerElement = document.getElementById('chrono');
  setInterval(function () {
      minutes = parseInt(timer / 60, 10);
      seconds = parseInt(timer % 60, 10);

      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;
      chronometerElement.textContent = minutes + ":" + seconds;
      console.log(minutes + ":" + seconds);

      if (--timer < 0) {
          console.log("Temps écoulé!");
          chronometerElement.textContent = "Temps écoulé!";
          document.getElementById("finish").style.display = "block";
          document.getElementById("chrono").style.display = "none";
          const canvas = document.getElementById("display-canvas");
          deleteFPSCameraController(canvas);
          clearInterval();
      }
  }, 1000);
}

//------------------------------------------------------------------------------
async function InitCol() {
  const debug = await SDK3DVerse.engineAPI.findEntitiesByEUID('618978eb-18b5-47dd-821e-067326e33fd6');
  const externCollision = await SDK3DVerse.engineAPI.findEntitiesByEUID('1d5657f0-9e9c-4364-b33e-28f1e448e351');
  const internCollision = await SDK3DVerse.engineAPI.findEntitiesByEUID('7654171b-06da-4365-98b6-8b0c924f1945');
  debug[0].setVisibility(false);
  internCollision[0].setVisibility(false);
  externCollision[0].setVisibility(false);
}

//------------------------------------------------------------------------------
async function InitFresque(fresques) {
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

//------------------------------------------------------------------------------
async function InitVector(pointList) {
  const childrenList = await pointList[0].getChildren();
  const sizeChildrenList = childrenList.length;

  const trueChildrenList = [];

  for (let i = 0; i < sizeChildrenList; i++) {
    for (let j = 0; j < sizeChildrenList; j++) {
      if (childrenList[j].components.debug_name.value == (i+1).toString()) {
        trueChildrenList.push(childrenList[j])
        pointPosition.push(childrenList[j].getGlobalTransform().position)
      }
    }
  }

  for (let i = 0; i < sizeChildrenList - 1; i++) {
    let pointA = [0,0,0]
    let pointB = [0,0,0]

    pointA = trueChildrenList[i].getGlobalTransform().position;
    pointB = trueChildrenList[i+1].getGlobalTransform().position;
    await Vector(pointA, pointB);
  }
}

//------------------------------------------------------------------------------
async function Vector(a , b) {
  const vect = [0,0,0];
  const norm = Math.sqrt( ((b[0]-a[0])**2) + ((b[1]-a[1])**2) + ((b[2]-a[2])**2))
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
  playerTemplate.attachComponent("local_transform", {
    position: [0,0,-1]
   });

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
async function deleteFPSCameraController() {
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
async function setFPSCameraController(canvas) {
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

//------------------------------------------------------------------------------
async function onClick(event) {
  const target = await SDK3DVerse.engineAPI.castScreenSpaceRay(
    event.clientX,
    event.clientY
  );
  if (!target.pickedPosition) return;
  const clickedEntity = target.entity;
}

//------------------------------------------------------------------------------
async function checkKeyPressed(event, fresques, currentCharacter, rootCurrentCharacter) {
  switch(event.key) {
    case 'e':
      detectionFresque(fresques, currentCharacter);
      break;
    case 'r':
      detectionGuide(currentCharacter, rootCurrentCharacter);
      break;
    case 'f':
      changeStateTorch();
      break;
    case 'Escape':
      document.getElementById("text-fresque").style.display = "none";
      break;
    default:
      break;
  }
}

//------------------------------------------------------------------------------
async function changeStateTorch() {
  const torch = await SDK3DVerse.engineAPI.findEntitiesByEUID('bcc769ca-6cec-4c89-a8d7-bd408a3f4142');
  if(torch[0].components.point_light.intensity == 1) {
    torch[0].setComponent('point_light', { intensity: 0 });
  }
  else {
    torch[0].setComponent('point_light', { intensity: 1 });
  }
}

//------------------------------------------------------------------------------
let trueFresque = 0;
let distFresque = 4;
async function detectionFresque(fresques, scientist) {
  const user = await SDK3DVerse.engineAPI.cameraAPI.getActiveViewports();
  const posUser = await user[0].getTransform().position;
  let posFresque;

  if(document.getElementById("text-fresque").style.display == "block") {
    document.getElementById("text-fresque").style.display = "none";
    console.log("a");
  }
  else {
    trueFresque = 0;
    distFresque = 4;
    await fresques.forEach(async function(fresque) {
      const childrenFresque = await fresque.getChildren();
      if(scientist[0].components.debug_name.value == "caveman") {
        if(childrenFresque[1].components.debug_name.value == "fresque") {
          posFresque = await childrenFresque[1].getGlobalTransform().position;
        }
        else {
          posFresque = await childrenFresque[0].getGlobalTransform().position;
        }
      }
      else {
        if(childrenFresque[1].components.debug_name.value == "fresque") {
          posFresque = await childrenFresque[0].getGlobalTransform().position;
        }
        else {
          posFresque = await childrenFresque[1].getGlobalTransform().position;
        }
      }

      const dist = Math.sqrt( ((posFresque[0] - posUser[0]) **2 ) + ((posFresque[1] - posUser[1]) **2) + ((posFresque[2] - posUser[2]) **2));
      console.log(dist);

      if( dist < 4 && dist < distFresque) {
        distFresque = dist;
        trueFresque = fresque;
        TextFresque(trueFresque);
      }
    });
  }
}

//------------------------------------------------------------------------------
async function TextFresque(fresque) {
  console.log(fresque.components.debug_name.value);

  const name = fresque.components.debug_name.value;
  console.log(name);

  const titleElement = document.querySelector('#text-fresque h2');
  const linkElement = document.querySelector('.text p');
  var image1 = document.getElementById("img1");
  var image2 = document.getElementById("img2");

  if(name =="Bison"){
    titleElement.innerText = 'Les Bisons du Pilier';
    linkElement.innerText = 'La partie la plus profonde de la salle du Fond est marquée par la présence d’un grand pilier rocheux détaché des parois. Ce support remarquable est occupé par deux bisons croisés, dessinés en noir et rehaussés de gravure. Sur le bison supérieur, on note deux versions du corps, la plus longue paraissant démesurée. Le bison du bas, moins détaillé, est partiellement effacé par le passage des ours des cavernes. Sur le panneau, on note aussi des gravures en tirets alignés formant un signe de type original et l’esquisse d’une tête de mammouth en gravure.';
    image1.src="img/fresque4/fresque41.png";
    image2.src="img/fresque4/fresque42.png";
  }else if(name =="Rhino"){
    titleElement.innerText = 'Le Rhinocéros et les félins';
    linkElement.innerText = 'La première partie de la paroi gauche de la salle du Fond s’achève sur un long panneau regroupant trois félins imbriqués et deux rhinocéros. Les félins reprennent le même jeu de couleurs et de composition que le panneau des Trois Lions qui les précèdent. Des deux rhinocéros, un est complet et l’autre évoqué d’une simple gravure de cornes démesurées. Le premier rappelle celui de l’entrée de la salle, associant dessin, estompe  et détourage à la gravure. La paroi est abondamment lacérée de griffades d’ours.';
    image1.src="img/fresque2/fresque21.png";
    image2.src="img/fresque2/fresque22.png";
  }else if(name =="Lion"){
    titleElement.innerText = 'Les trois Lions';
    linkElement.innerText = 'Sur le premier palier de la salle du Fond, sur la paroi gauche, la surface irrégulière du calcaire n’a pas empêché la mise en place de trois profils droits de lions des cavernes  imbriqués, dont deux mâles (scrotum). Deux sont tracés au fusain et un, limité à la ligne de dos, est dessiné en rouge. On constate que les mâles n’arboraient pas de crinière. De nombreuses griffades d’ours précèdent ou se superposent aux dessins. Les gravures de deux mammouths se lisent plus haut et recoupent les dos des félins.';
    image1.src="img/fresque1/fresque11.png";
    image2.src="img/fresque1/fresque12.png";
  }else if(name =="Fresque"){
    titleElement.innerText = 'Panneau des Rhinocéros';
    linkElement.innerText = 'À hauteur du dernier palier de la salle du Fond, paroi gauche, le premier volet en forme de dièdre de la grande fresque finale se partage en deux thématiques différentes. Le pan de droite renferme une douzaine de rhinocéros majoritairement tournés à gauche. Ils se superposent, se masquent ou se recouvrent comme pour évoquer la représentation d’un troupeau. Les techniques mixtes (fusain et gravure) sont largement employées pour faire ressortir les silhouettes et certains détails.';
    image1.src="img/fresque3/fresque31.png";
    image2.src="img/fresque3/fresque32.png";
  }

  document.getElementById("text-fresque").style.display = "block";
}

//------------------------------------------------------------------------------
async function detectionGuide(scientist, rootScientist) {
  const user = await SDK3DVerse.engineAPI.cameraAPI.getActiveViewports();
  const posUser = await user[0].getTransform().position;

  if(stepScientist ==-1 || stepScientist ==3 || stepScientist ==7 || stepScientist ==14 || stepScientist ==15) {
    const scientistPosition = scientist[0].getGlobalTransform().position;
    const scientistTransform = rootScientist[0].getGlobalTransform();
    const dist = Math.sqrt( ((scientistPosition[0] - posUser[0]) **2 ) + ((scientistPosition[1] - posUser[1]) **2) + ((scientistPosition[2] - posUser[2]) **2));

    if(dist<2) {
      if(!scientistTalk && stepScientist>=0) {
        const audio = audioList[stepAudio];
        document.getElementById(audio).play();
        scientistTalk = true;
      }
      else {
        if(stepScientist!=0 && scientistTalk) {
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

//------------------------------------------------------------------------------
async function rotation(pointA, pointB) {
  const deltaX = pointB[0] - pointA[0];
  const deltaZ = pointB[2] - pointA[2];

  const angleRad = Math.atan2(deltaZ, deltaX);
  const angleDeg = -(((angleRad * 180) / Math.PI) - 90);

  return angleDeg;
}

//------------------------------------------------------------------------------
let lastTime = performance.now();
async function update(scientist, canvas) {
  //verification si la souris est lock pour désactiver le suivi de la caméra avec le curseur
  if (document.pointerLockElement == null) {
    deleteFPSCameraController();
  }

  const deltaTime = performance.now() - lastTime;
  lastTime = performance.now();
  const scientistTransform = scientist[0].getGlobalTransform();
  const scientistAnime = scientist[0].getComponent('animation_controller').dataJSON;
  if (listVector.length > stepScientist && listVector.length != 0) {
    const dist = Math.sqrt( ((pointPosition[stepScientist + 1][0] - scientistTransform.position[0]) **2 ) + ((pointPosition[stepScientist + 1][1] - scientistTransform.position[1]) **2) + ((pointPosition[stepScientist + 1][2] - scientistTransform.position[2]) **2));

    if(dist >= 0.1 && stepScientist >=0 ) {
      if(scientistAnime.Walking == false && (scientistAnime.Standing == true || scientistAnime.Talking == true)) {
        scientistAnime.Standing = false;
        scientistAnime.Talking = false;
        scientistAnime.Walking = true;
        scientist[0].setComponent("animation_controller", scientistAnime);
      }
      scientistTransform.position[0] += 0.0005 * deltaTime * listVector[stepScientist][0];
      scientistTransform.position[1] += 0.0005 * deltaTime * listVector[stepScientist][1];
      scientistTransform.position[2] += 0.0005 * deltaTime * listVector[stepScientist][2];
    }
    else if(stepScientist !=-1 && stepScientist !=3 && stepScientist !=7 && stepScientist !=14 && stepScientist !=15) {
      stepScientist += 1;
      const rot = await rotation(pointPosition[stepScientist], pointPosition[stepScientist + 1]);
      scientistTransform.eulerOrientation[1] = rot;
    }
    else {
      if(scientistTalk == true) {
        const rot = await rotation(pointPosition[stepScientist + 1], SDK3DVerse.engineAPI.cameraAPI.getActiveViewports()[0].getTransform().position);
        scientistTransform.eulerOrientation[1] = rot;
      }
      if(scientistTalk == true && scientistAnime.Talking == false) {
        scientistAnime.Standing = false;
        scientistAnime.Talking = true;
        scientist[0].setComponent("animation_controller", scientistAnime);
      }
      else if(scientistAnime.Walking == true) {
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