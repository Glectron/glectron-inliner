import fs from "fs";
import path from "path";

import parser from "node-html-parser";
import mime from "mime-types";

import { isURL } from "../util.js";
import { doInline } from "../index.js";

function replaceWithDataUrls(dir, el, selector, attribute) {
    el.querySelectorAll(selector).forEach((v) => {
        const attr = v.getAttribute(attribute);
        if (attr && !isURL(attr)) {
            const assetPath = path.join(dir, attr);
            if (fs.existsSync(assetPath)) {
                const data = fs.readFileSync(assetPath).toString("base64");
                const type = mime.lookup(path.extname(assetPath));
                const uri = `data:${type};base64,${data}`;
                v.setAttribute(attribute, uri);
            }
        }
    })
}

export default async function(content, dir) {
    const el = parser.parse(content);
    el.querySelectorAll("script[src]").forEach((v) => {
        const src = v.getAttribute("src");
        if (!isURL(src)) {
            const assetPath = path.join(dir, src);
            if (fs.existsSync(assetPath)) {
                const content = fs.readFileSync(assetPath, "utf-8").toString();
                v.set_content(content);
                v.removeAttribute("src");
            }
        }
    });
    const cssProcessors = [];
    el.querySelectorAll("link[href]").forEach(async (v) => {
        const href = v.getAttribute("href");
        if (!isURL(href)) {
            const assetPath = path.join(dir, href);
            if (fs.existsSync(assetPath)) {
                const content = fs.readFileSync(assetPath, "utf-8");
                const result = doInline(content, "css", path.dirname(assetPath));
                cssProcessors.push(result);
                v.set_content(await result);
                v.tagName = "style";
                v.removeAttribute("rel");
                v.removeAttribute("href");
            }
        }
    });
    replaceWithDataUrls(dir, el, "img[src]", "src");
    replaceWithDataUrls(dir, el, "audio[src]", "src");
    await Promise.allSettled(cssProcessors);
    return el.toString();
}