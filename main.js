///------------------------------------------------------------------------------
import {
  publicToken,
  mainSceneUUID,
  caveSceneUUID,
  caveLinkerEntityName,
  characterControllerSceneUUID,
} from "./Js/config.js";

import{
  rotation,
  InitVector,
  Vector
} from "./Js/chauvetMaths.js";

import{
  InitFresque,
  TextFresque,
}from "./Js/fresque.js"

import{
  detectionFresque,
  detectionGuide,
  InitFirstPersonController,
  deleteFPSCameraController,
  setFPSCameraController,
  changeStateTorch,
  onClick,
  checkKeyPressed,
}from "./Js/characterController.js"

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


export {stepScientist, stepAudio, rootCurrentCharacter,scientistTalk, pointPosition, audioList};

//------------------------------------------------------------------------------
async function InitApp(canvas) {
  // hide canvas until main assets are loaded
  canvas.style.display = "none";

  const isSessionCreator = await SDK3DVerse.joinSession({
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
    console.log("Session joined => creating a new session for you soon");
    // This is a single player project, so there should 
    // always be only one player per session. 
    // If you're not the creator, you'll be sent to a new one either way
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

     startStopwatch(2 * 60 + 30);
    //startStopwatch(10);
  });

  document.getElementById("choice2").addEventListener("click", function() {
    document.getElementById("home").style.display = "none";
    ChangeCharacter("caveman");

    startStopwatch(2 * 60 + 30);
  });

  await InitFirstPersonController(characterControllerSceneUUID);

  // hide NPC and player
  // SEB watch out: if you are multi players then you have to sync the game state among all the players
  // e.g the selection of the guide NPC character
  await initGameState();

  canvas.style.display = "block";

  window.addEventListener("keydown", (event) => checkKeyPressed(event, fresques, currentCharacter,rootCurrentCharacter));
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

export async function setStepScientist(step) {
  stepScientist = step;
}

export async function setStepAudio(step) {
  stepAudio = step;
}

export async function setScientistTalk(bool) {
  scientistTalk = bool;
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

  const panneau1 = await SDK3DVerse.engineAPI.findEntitiesByEUID('d33efefe-d949-4dbb-b9a5-1a1b5d173927');//bison
  const panneau2 = await SDK3DVerse.engineAPI.findEntitiesByEUID('aab72482-c83b-4904-bddd-752a90e2af22');//rhino
  const panneau3 = await SDK3DVerse.engineAPI.findEntitiesByEUID('00f35d2b-7382-45a4-b7cc-c322ff904b29');//lion
  const panneau4 = await SDK3DVerse.engineAPI.findEntitiesByEUID('8ce30aea-1df7-44b9-b4d3-5a19199e1ccb');//fresque

  const pointListCaveMan = await SDK3DVerse.engineAPI.findEntitiesByEUID('06e8ba40-27d4-4018-8bcd-ef1a122ee407');
  const pointListScientist = await SDK3DVerse.engineAPI.findEntitiesByEUID('db89ed9c-eb11-4974-8aae-d062753269ae');
  const listFire = await SDK3DVerse.engineAPI.findEntitiesByEUID('db89ed9c-eb11-4974-8aae-d062753269ae');
  const listLed = await SDK3DVerse.engineAPI.findEntitiesByEUID('67abe046-cf07-4f66-9a22-7c671702571c');
  const player = await SDK3DVerse.engineAPI.findEntitiesByEUID('2252d8f2-d48f-4210-99f9-069968904a45');

  if(character == "caveman"){
    InitVector(pointListCaveMan, pointPosition, listVector);


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
    InitVector(pointListScientist, pointPosition, listVector);

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
async function startStopwatch(duration) {
  let timer = duration, minutes, seconds;
  const chronometerElement = document.getElementById('chrono');
  const camera = await SDK3DVerse.engineAPI.cameraAPI.getActiveViewports()[0].getCamera();
  const cameraDataJSON = camera.getComponent('camera').dataJSON;
  var intensPlus = 1/5;
  var intens = 0;
  document.getElementById("chrono").style.display = "block";
  document.getElementById("tuto").style.display = "block";
  setInterval(function () {
      minutes = parseInt(timer / 60, 10);
      seconds = parseInt(timer % 60, 10);

      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;
      chronometerElement.textContent = minutes + ":" + seconds;
      console.log(minutes + ":" + seconds);
      console.log(timer);
      if(timer < 5){
        camera.setComponent('camera', { dataJSON: { ...cameraDataJSON, ambientIntensity: intensPlus + intens }});
        intens += intensPlus;
      }
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
