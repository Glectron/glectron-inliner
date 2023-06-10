import fs from "fs";
import path from "path";

import mime from "mime-types";

export default async function(declaration, originalUrl, asset) {
    const data = fs.readFileSync(asset).toString("base64");
    const type = mime.lookup(path.extname(asset));
    const uri = `data:${type};base64,${data}`;
    declaration.value = declaration.value.replace(originalUrl, `url(${uri})`);
}