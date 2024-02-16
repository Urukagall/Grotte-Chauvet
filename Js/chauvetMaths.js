export async function rotation(pointA, pointB) {
    const deltaX = pointB[0] - pointA[0];
    const deltaZ = pointB[2] - pointA[2];
  
    const angleRad = Math.atan2(deltaZ, deltaX);
    const angleDeg = -(((angleRad * 180) / Math.PI) - 90);
  
    return angleDeg;
}

//------------------------------------------------------------------------------
export async function InitVector(pointList, pointPosition, listVector) {
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
      await Vector(pointA, pointB, listVector);
    }
}

//------------------------------------------------------------------------------
export async function Vector(a , b, listVector) {
    const vect = [0,0,0];
    const norm = Math.sqrt( ((b[0]-a[0])**2) + ((b[1]-a[1])**2) + ((b[2]-a[2])**2))
    vect[0] = (b[0] - a[0]) / norm;
    vect[1] = (b[1] - a[1]) / norm;
    vect[2] = (b[2] - a[2]) / norm;
    listVector.push(vect);
}

