import fetch from "node-fetch";

export async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    return new Error(`Failed ${res.status}`);
  }
  let json;
  try {
    json = await res.json();
    
  } catch(err) {
    json = {}
  }
  return json 
}
