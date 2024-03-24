import {
  nameFresque,
  TextFresque
}from "./fresque.js"

import {
  rotation
}from "./chauvetMaths.js"

import{
  stepScientist,
  stepAudio,
  rootCurrentCharacter,
  scientistTalk, 
  pointPosition,
  audioList,
  setStepAudio,
  setStepScientist,
  setScientistTalk
}from "../main.js"

let trueFresque = null;
let distFresque = 4;

export async function detectionFresque(fresques, currentCharacter) {
  const user = await SDK3DVerse.engineAPI.cameraAPI.getActiveViewports();
  const posUser = await user[0].getTransform().position;
  let posFresque;

  if(document.getElementById("text-fresque").style.display == "block") {
    document.getElementById("text-fresque").style.display = "none";
    if(nameFresque == "Fresque"){
      document.getElementById("animation").style.display = "block";
      document.getElementById("video").src = "anime/anim.mp4";
    }
  }else if(document.getElementById("animation").style.display == "block"){
    document.getElementById("animation").style.display = "none";
  }else {
    trueFresque = 0;
    distFresque = 4;
    await fresques.forEach(async function(fresque) {
      const childrenFresque = await fresque.getChildren();
      if(currentCharacter[0].components.debug_name.value == "caveman") {
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

      if( dist < 4 && dist < distFresque) {
        distFresque = dist;
        trueFresque = fresque;
        TextFresque(trueFresque, currentCharacter);
      }
    });
  }
}

//------------------------------------------------------------------------------
export async function detectionGuide(scientist, rootScientist) {
  const user = await SDK3DVerse.engineAPI.cameraAPI.getActiveViewports();
  const posUser = await user[0].getTransform().position;
  let step = [0,0];


  if(stepScientist ==-1 || stepScientist ==3 || stepScientist ==7 || stepScientist ==14 || stepScientist ==15) {
    const scientistPosition = scientist[0].getGlobalTransform().position;
    const scientistTransform = rootScientist[0].getGlobalTransform();
    const dist = Math.sqrt( ((scientistPosition[0] - posUser[0]) **2 ) + ((scientistPosition[1] - posUser[1]) **2) + ((scientistPosition[2] - posUser[2]) **2));

    if(dist<7) {

      if(!scientistTalk && stepScientist>=0) {
        const audio = audioList[stepAudio];
        document.getElementById(audio).play();
        setScientistTalk(true);
      }
      else {
        if(stepScientist!=0 && scientistTalk) {
          document.getElementById(audioList[stepAudio]).pause();
          document.getElementById(audioList[stepAudio]).currentTime = 0;
          setStepAudio(stepAudio + 1);
          // stepAudio += 1;
        }
        setStepScientist(stepScientist + 1);
        // stepScientist += 1 ;

        setScientistTalk(false);
        scientistTransform.eulerOrientation[1] = await rotation(pointPosition[stepScientist], pointPosition[stepScientist + 1]);
        rootScientist[0].setGlobalTransform({ eulerOrientation : scientistTransform.eulerOrientation});
      }
    }
  }
  return step;
}

//------------------------------------------------------------------------------
export async function InitFirstPersonController(charCtlSceneUUID) {
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
export async function deleteFPSCameraController() {
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
export async function setFPSCameraController(canvas) {
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
export async function changeStateTorch() {
    const torch = await SDK3DVerse.engineAPI.findEntitiesByEUID('bcc769ca-6cec-4c89-a8d7-bd408a3f4142');
    if(torch[0].components.point_light.intensity == 1) {
      torch[0].setComponent('point_light', { intensity: 0 });
    }
    else {
      torch[0].setComponent('point_light', { intensity: 1 });
    }
}
  
//------------------------------------------------------------------------------
export async function onClick(event) {
  const target = await SDK3DVerse.engineAPI.castScreenSpaceRay(
    event.clientX,
    event.clientY
  );
  if (!target.pickedPosition) return;
  const clickedEntity = target.entity;
}

//------------------------------------------------------------------------------
export async function checkKeyPressed(event, fresques, currentCharacter, rootCurrentCharacter) {
  switch(event.key) {
    case 'e':
      detectionFresque(fresques, rootCurrentCharacter);
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
