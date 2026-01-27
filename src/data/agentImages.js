// frontend/src/data/qualifierImages.js

import stephanie from "../assests/agents/stephanie.png";
import mozell from "../assests/agents/Mozellblue.png";
import catherine from "../assests/agents/Catherineanimate.png";
import kevin from "../assests/agents/Kevinblue.png";
import donovan from "../assests/agents/donovanblue.png";
import robert from "../assests/agents/robertgreen.png";
import johnb from "../assests/agents/johngreen.png";
import chase from "../assests/agents/Chase.png";
import loren from "../assests/agents/Lorenmurray.png";
import tia from "../assests/agents/Tiagreen.png";
import mustafa from "../assests/agents/Mustafablue.png";
import leader from "../assests/agents/leader.png";
import ron from "../assests/agents/ron.png";
import verraricka from "../assests/agents/verrackia.png";
import rhode from "../assests/agents/rhode.png";

// fallback image
import placeholder from "../assests/agents/shadow.png";

export const QUALIFIER_IMAGE_MAP = {
  "MOZELL HARDY": mozell,
  "STEPHANIE SANTIAGO": stephanie,
  "MICHAEL LEADER": leader,
  "JOHN BARNES": johnb,
  "DONOVN ROMARIO": donovan,
  "CATHERINE CASSESE": catherine,
  "TIA SPICER": tia,
  "CHASE DUROUSSEAU": chase,
  "ROBERT FRATER": robert,
  "LOREN MURRAY": loren,
  "MUSTAFA PUELLO": mustafa,
  "VERRARICKA HOSEA": verraricka,
  "KEVIN GONCALVES": kevin,
  "RON MASELKO": ron,
  "RHODE RAPHAEL": rhode,
};

function normalizeKey(name) {
  return String(name || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

export function getQualifierImage(name) {
  const key = normalizeKey(name);
  return QUALIFIER_IMAGE_MAP[key] || placeholder;
}

export function normalizeQualifierKey(name) {
  return normalizeKey(name);
}
