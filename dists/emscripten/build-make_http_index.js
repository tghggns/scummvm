/* 
 * Based on https://github.com/jvilk/BrowserFS/blob/master/scripts/make_http_index.ts
 * Copyright (c) 2013, 2014, 2015, 2016, 2017 John Vilk and other BrowserFS contributors.
 * MIT License  https://github.com/jvilk/BrowserFS/blob/master/LICENSE
 */
"use strict";
const fs = require("fs");
const path = require("path");
const symLinks = {};
const ignoreFiles = ['.git', 'node_modules', 'bower_components', 'build', 'index.json'];

var workingDirectory = process.cwd();

const args=process.argv;
args.indexOf('-d') > -1 ? workingDirectory=args[args.indexOf('-d') + 1] : null;

function rdSync(dpath, tree, name) {
    const files = fs.readdirSync(dpath);
    files.forEach((file) => {
        // ignore non-essential directories / files
        if (ignoreFiles.indexOf(file) !== -1 || file[0] === '.') {
            return;
        }
        const fpath = `${dpath}/${file}`;
        try {
            // Avoid infinite loops.
            const lstat = fs.lstatSync(fpath);
            if (lstat.isSymbolicLink()) {
                if (!symLinks[lstat.dev]) {
                    symLinks[lstat.dev] = {};
                }
                // Ignore if we've seen it before
                if (symLinks[lstat.dev][lstat.ino]) {
                    return;
                }
                symLinks[lstat.dev][lstat.ino] = true;
            }
            const fstat = fs.statSync(fpath);
            if (fstat.isDirectory()) {
                const child = tree[file] = {};
                rdSync(fpath, child, file);
            }
            else {
                tree[file] = fstat.size;
            }
        }
        catch (e) {
            // Ignore and move on.
        }
    });
    return tree;
}
const fsListing = JSON.stringify(rdSync(workingDirectory, {}, '/'));
if (args.indexOf('-out') > -1) {
    var fname = path.join(workingDirectory, args[args.indexOf('-out') + 1]);
    let parent = path.dirname(fname);
    while (!fs.existsSync(parent)) {
        fs.mkdirSync(parent);
        parent = path.dirname(parent);
    }
    fs.writeFileSync(fname, fsListing, { encoding: 'utf8' });
}
else {
    console.log(fsListing);
}