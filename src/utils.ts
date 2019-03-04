import { none, Option, some } from "fp-ts/lib/Option";
import fs from "fs";

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// A function to load the privaty key from a file
export function loadPrivateKey(privateKeyPath: string): Option<string> {
  try {
    const privateKey = fs.readFileSync(privateKeyPath, "utf-8");
    return some(privateKey);
  } catch (e) {
    return none;
  }
}
