export async function InitFresque(fresques) {
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
export async function TextFresque(fresque) {
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
  