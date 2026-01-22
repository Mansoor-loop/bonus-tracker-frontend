// frontend/src/data/qualifierImages.js

import stephanie from "../assests/agents/stephanie.png" ;
import mozell from  "../assests/agents/MozellHardy.png"  ;
import catherine from  "../assests/agents/Catherineanimate.png"  ;
import kevin from  "../assests/agents/Kevin.png"  ;
import donovan from  "../assests/agents/stephanie.png"  ;
import robert from  "../assests/agents/Robert.png"  ;
import johnb from  "../assests/agents/Johnb.png"  ;
import chase from  "../assests/agents/Chase.png"  ;
import loren from  "../assests/agents/Lorenmurray.png"  ;
import tia from  "../assests/agents/tia spice.png"  ;
import mustafa from  "../assests/agents/Mustafa.png"  ;

// fallback image
import placeholder from  "../assests/agents/shadow.png" ;

export const QUALIFIER_IMAGE_MAP = {
  "MOZELL HARDY": mozell,
  "STEPHANIE SANTIAGO": stephanie,
  "MICHAEL LEADER": placeholder,
  "JOHN BARNES": johnb,
  "Donovn Romario": donovan,
  "CATHERINE CASSESE": catherine,
  "TIA SPICER": tia,
  "CHASE DUROUSSEAU": chase,
  "Robert Frater": robert,
  "Loren Murray": loren,
  "Mustafa Puello": mustafa,
  "Verraricka Hosea": donovan,
  "KEVIN GONCALVES": kevin,
  "Ron Maselko": donovan,

};

export function getQualifierImage(name) {
  if (!name) return placeholder;

  const key = String(name).trim().toUpperCase();
  return QUALIFIER_IMAGE_MAP[key] || placeholder;
}
