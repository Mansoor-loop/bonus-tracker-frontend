
import maserati from  "../assests/Teams/maserati.png"  ;
import legends from  "../assests/Teams/phoenix.png"  ;
import falcon from  "../assests/Teams/falcon.png"  ;
const LOGO_MAP = {
  "MOZELL HARDY": maserati,
  "STEPHANIE SANTIAGO": legends,
  "MICHAEL LEADER": legends,
  "JOHN BARNES": falcon,
  "DONOVN ROMARIO": maserati,
  "CATHERINE CASSESE": legends,
  "TIA SPICER": falcon,
  "CHASE DUROUSSEAU": legends,
  "ROBERT FRATER": falcon,
  "LOREN MURRAY": legends,
  "MUSTAFA PUELLO": maserati,
  "VERRARICKA HOSEA": falcon,
  "KEVIN GONCALVES": maserati,
  "RON MASELKO": maserati,
  "RHODE RAPHAEL": legends,
  "MAX MUNROE" : maserati,
};

export function getAgentLogo(name) {
  if (!name) return "/logos/maserati.png";

  const key = name.trim().toUpperCase();
  return LOGO_MAP[key] || "/logos/maserati.png";
}
