import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export function useLoader(loadingFn) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState();
  const [error, setError] = useState();

  async function load() {
    try {
      setLoading(true);
      setData(await loadingFn());
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => load(), []);
  return { loading, data, error };
}

export async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    console.log(`Failed ${res.status}`);
    return false;
  }
  return await res.json();
}

export function randomString(length) {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmopqrstuvwxyz1234567890";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return result;
}

export async function sha256(string) {
  const binaryHash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder("utf-8").encode(string)
  );
  return btoa(String.fromCharCode.apply(null, new Uint8Array(binaryHash)))
    .split("=")[0]
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function getCats() {
  return ["Health", "Technology", "Global"];
}
