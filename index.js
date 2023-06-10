import fs from "fs";
import path from "path";

const __dirname = path.dirname(import.meta.url);

export async function doInline(content, ext, dir) {
    const inliner = await import(path.join(__dirname, "inliners", `${ext}.js`));
    return inliner.default(content, dir);
}

async function inline(file) {
    const content = fs.readFileSync(file, "utf-8");
    const ext = path.extname(file).substring(1);
    const dir = path.dirname(file);
    return doInline(content, ext, dir);
}

export default inline;