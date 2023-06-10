import fs from "fs";
import path from "path";

import parser from "css";
import mime from "mime-types";

import { isURL } from "../util.js";

export default async function(content, dir) {
    const css = parser.parse(content);
    for (const rule of css.stylesheet.rules) {
        for (const declaration of rule.declarations) {
            if (declaration.value) {
                let value = declaration.value;
                const urls = value.matchAll(/url\((.+?)\)/g);
                for (const url of urls) {
                    const originalUrl = url[0];
                    const urlCont = url[1];
                    if (!isURL(urlCont)) {
                        const assetPath = path.join(dir, urlCont);
                        if (fs.existsSync(assetPath)) {
                            const data = fs.readFileSync(assetPath).toString("base64");
                            const type = mime.lookup(path.extname(assetPath));
                            const uri = `data:${type};base64,${data}`;
                            value = value.replace(originalUrl, `url(${uri})`);
                        }
                    }
                }
                declaration.value = value;
            }
        }
    }
    return parser.stringify(css);
}