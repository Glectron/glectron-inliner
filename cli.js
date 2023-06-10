import fs from "fs";
import path from "path";

import watch from "node-watch";
import minimist from 'minimist';
import inline from './index.js';

const argv = minimist(process.argv.slice(2));

const targetFile = argv._[0];
const outputFile = argv.o || argv.output;
const watchDir = argv.w || argv.watch;
const minifyJs = (argv.j || argv.minifyjs) !== undefined;
const minifyCss = (argv.c || argv.minifycss) !== undefined;
const minifyHtml = (argv.h || argv.minifyhtml) !== undefined;

async function runInline() {
    const result = await inline(path.resolve(process.cwd(), targetFile), {
        minifyHtml,
        minifyJs,
        minifyCss
    });
    if (outputFile) {
        fs.writeFileSync(path.resolve(process.cwd(), outputFile), result, "utf-8");
    } else {
        console.log(result);
    }
}

await runInline();

if (watchDir) {
    console.log("Watching", path.resolve(process.cwd(), watchDir), "for changes...");
    const watcher = watch(path.resolve(process.cwd(), watchDir), {recursive: true}, async (_e, _file) => {
        await runInline();
        console.log("File updated");
    });
    process.on('SIGINT', () => {
        watcher.close();
    });
    process.on('SIGTERM', () => {
        watcher.close();
    });
}