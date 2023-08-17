// 监听node文件的变化
// 1. 通过chokidar监听文件变化
const { spawn } = require("child_process");
const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");

let cp = null;
const pkgFile = path.resolve(__dirname, "../package.json");

function stopParcel() {
    if (cp) {
        cp.kill("SIGINT");
        cp = null;
    }
}

function startParcel() {
    cp = spawn("parcel", ["index.html", "--port", "1234"], {
        stdio: "inherit",
    });
}

function tryParseJson(jsonStr) {
    try {
        return JSON.parse(jsonStr);
    } catch (error) {
        return null;
    }
}

function readPkgJson() {
    return new Promise((resolve, reject) => {
        fs.readFile(pkgFile, "utf8", (err, data) => {
            if (!err) {
                resolve(tryParseJson(data));
            } else {
                reject(err);
            }
        });
    });
}

function writePkgJson(data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(pkgFile, JSON.stringify(data, null, 4), err => {
            if (!err) {
                resolve();
            } else {
                reject(err);
            }
        });
    });
}

async function startWatchModules() {
    let pkgJson = await readPkgJson();
    if (pkgJson.watcher) {
        const watcher = chokidar.watch(pkgJson.watcher, {
            persistent: true,
        });
        pkgJson.devVersion = 0;
        watcher.on("change", async filePath => {
            console.log("文件变化", filePath);
            const devVersion = (Number(pkgJson.devVersion || 0) + 1) % 2;
            pkgJson.devVersion = devVersion;
            await writePkgJson(pkgJson);
        });
    }
}

startParcel();
startWatchModules();
process.on("exit", () => {
    stopParcel();
});
