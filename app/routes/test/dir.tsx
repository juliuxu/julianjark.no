import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

import fs from "fs";
import path from "path";

const getAllFiles = function (dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
};

export const loader: LoaderFunction = async () => {
  return json({
    __dirname,
    cwd: process.cwd(),
    ls: getAllFiles(path.resolve(__dirname, "..")),
  });
};
