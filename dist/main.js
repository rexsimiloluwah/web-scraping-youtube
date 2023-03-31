"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NptelPlaylistItem = void 0;
const puppeteer = __importStar(require("puppeteer"));
const cheerio_1 = __importDefault(require("cheerio"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// constants
const NPTEL_PLAYLIST_ID = "PL460BE04C4E59C01F";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const OUTPUT_DIR_NAME = "./output";
const PUPPETEER_HEADLESS_MODE = false; // change this to hide the headless browser
class NptelPlaylistItem {
    constructor(id, title, videoId, description, markers) {
        this.id = id;
        this.title = title;
        this.videoId = videoId;
        this.description = description;
        this.markers = markers;
    }
    /**
     * Parses the video's module and lecture index from the video's title
     * @returns
     */
    getModuleAndLectureNumber() {
        // an edge case due to the inconsistent naming convention in the 'introduction' lecture
        if (this.title.split(" ")[0].toLowerCase() === "introduction") {
            return {
                module: 1,
                lecture: 0,
            };
        }
        const re = new RegExp(/(mod|module|imod) (\d+) (lec|lecture|lect) (\d+)/i);
        const match = this.title.match(re);
        return {
            module: Number(match[2]),
            lecture: Number(match[4]),
        };
    }
    /**
     * Initialize a new module directory i.e. `MODULE 1` for saving module 1 lectures
     * @returns
     */
    initModuleDirectory() {
        const { module } = this.getModuleAndLectureNumber();
        // create a new output directory (if it does not exist)
        if (!fs_1.default.existsSync(OUTPUT_DIR_NAME)) {
            fs_1.default.mkdirSync(OUTPUT_DIR_NAME);
        }
        const moduleDirPath = path_1.default.join(OUTPUT_DIR_NAME, `MODULE ${module}`);
        // create a new folder for the module (if it does not exist)
        if (!fs_1.default.existsSync(moduleDirPath)) {
            fs_1.default.mkdirSync(moduleDirPath);
        }
        return moduleDirPath;
    }
    /**
     * Initialize an `all` directory for saving all the files
     * This does not organize the files into their respective modules
     * However, it is the expected format as stated by Dr. Ayodele
     * @returns
     */
    initAllFilesDirectory() {
        // create a new output directory (if it does not exist)
        if (!fs_1.default.existsSync(OUTPUT_DIR_NAME)) {
            fs_1.default.mkdirSync(OUTPUT_DIR_NAME);
        }
        const allFilesDirPath = path_1.default.join(OUTPUT_DIR_NAME, "all");
        // create a new folder for the module (if it does not exist)
        if (!fs_1.default.existsSync(allFilesDirPath)) {
            fs_1.default.mkdirSync(allFilesDirPath);
        }
        return allFilesDirPath;
    }
    /**
     * Write the markers to a .csv file in its module folder
     * The file is saved in "MODULE {module_id}/{lecture_id}.csv"
     */
    writeToCsv() {
        return __awaiter(this, void 0, void 0, function* () {
            const { lecture } = this.getModuleAndLectureNumber();
            const moduleDirPath = this.initModuleDirectory();
            const outputFilePath = path_1.default.join(moduleDirPath, `${lecture}.csv`);
            try {
                for (let i = 0; i < this.markers.length; i++) {
                    const { timestamp, label } = this.markers[i];
                    fs_1.default.appendFileSync(outputFilePath, `${label}, ${timestamp}\n`);
                }
                console.log(`Successfully saved at: ${outputFilePath}`);
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
    /**
     * Write the video markers to a .txt file in its module folder
     * The file is saved in "MODULE {module_id}/{lecture_id}.txt"
     */
    writeToTxt() {
        return __awaiter(this, void 0, void 0, function* () {
            const { lecture } = this.getModuleAndLectureNumber();
            const moduleDirPath = this.initModuleDirectory();
            const outputFilePath = path_1.default.join(moduleDirPath, `${lecture}.txt`);
            try {
                for (let i = 0; i < this.markers.length; i++) {
                    const { timestamp, label } = this.markers[i];
                    fs_1.default.appendFileSync(outputFilePath, `${label}, ${timestamp}\n`);
                }
                console.log(`Successfully saved at: ${outputFilePath}`);
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
    /**
     * Write the video markers to a .csv file in the `all` folder
     * The file is saved in "all/{video_id}.csv"
     */
    writeToCsvUsingVideoId() {
        return __awaiter(this, void 0, void 0, function* () {
            const allFilesDirPath = this.initAllFilesDirectory();
            const outputFilePath = path_1.default.join(allFilesDirPath, `${this.id + 1}.csv`);
            try {
                for (let i = 0; i < this.markers.length; i++) {
                    const { timestamp, label } = this.markers[i];
                    fs_1.default.appendFileSync(outputFilePath, `${label}, ${timestamp}\n`);
                }
                console.log(`Successfully saved at: ${outputFilePath}`);
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
    /**
     * Write the video markers to a .txt file in the `all` folder
     * The file is saved in "all/{video_id}.txt"
     */
    writeToTxtUsingVideoId() {
        return __awaiter(this, void 0, void 0, function* () {
            const allFilesDirPath = this.initAllFilesDirectory();
            const outputFilePath = path_1.default.join(allFilesDirPath, `${this.id + 1}.txt`);
            try {
                for (let i = 0; i < this.markers.length; i++) {
                    const { timestamp, label } = this.markers[i];
                    fs_1.default.appendFileSync(outputFilePath, `${label}, ${timestamp}\n`);
                }
                console.log(`Successfully saved at: ${outputFilePath}`);
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
}
exports.NptelPlaylistItem = NptelPlaylistItem;
/**
 * Fetch the NPTEL "Intelligent Control" playlist items data using the Youtube API
 * @returns
 */
function fetchNptelPlaylistData() {
    return __awaiter(this, void 0, void 0, function* () {
        const playlistItemsResponse = yield axios_1.default.get("https://www.googleapis.com/youtube/v3/playlistItems", {
            params: {
                part: "snippet",
                playlistId: NPTEL_PLAYLIST_ID,
                key: YOUTUBE_API_KEY,
                maxResults: 32,
            },
        });
        return playlistItemsResponse.data.items.map((item) => {
            const { snippet: { title, description, position, resourceId }, } = item;
            return {
                id: position,
                videoId: resourceId.videoId,
                title: title,
                description: description,
            };
        });
    });
}
function scrapeNptelVideoSectionsUsingPuppeteer(videoIds) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const browser = yield puppeteer.launch({
                headless: PUPPETEER_HEADLESS_MODE,
            });
            const page = yield browser.newPage();
            let playlistMarkers = [];
            // using a for loop here offers a significant performance boost
            for (let i = 0; i < videoIds.length; i++) {
                const videoId = videoIds[i];
                yield page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
                    waitUntil: "networkidle2",
                });
                yield page.waitForSelector(".button.ytd-text-inline-expander");
                yield page.click(".button.ytd-text-inline-expander");
                yield page.click("aria/View all[role='button']");
                // example: get innerHTML of an element
                const markers = yield page.$$eval("ytd-macro-markers-list-item-renderer", (els) => els.map((e) => {
                    return e.innerHTML;
                }));
                const response = markers.map((marker) => {
                    const $ = cheerio_1.default.load(marker);
                    const timestamp = $("#details #time").first().text();
                    const label = $("#details h4").first().text();
                    return { timestamp, label };
                });
                const videoMarkers = [
                    ...new Set(response.map((r) => JSON.stringify(r))),
                ].map((s) => JSON.parse(s));
                playlistMarkers.push(videoMarkers);
                setTimeout(() => { }, 2000);
            }
            yield browser.close();
            return playlistMarkers;
        }
        catch (error) {
            console.error(error);
        }
    });
}
// to prevent any memory leaks
process.setMaxListeners(100);
// main execution block
fetchNptelPlaylistData().then((playlistItems) => __awaiter(void 0, void 0, void 0, function* () {
    const videoIds = playlistItems.map((item) => item.videoId);
    // fetch the playlist markers
    const playlistMarkers = yield scrapeNptelVideoSectionsUsingPuppeteer(videoIds);
    playlistMarkers === null || playlistMarkers === void 0 ? void 0 : playlistMarkers.map((markers, i) => __awaiter(void 0, void 0, void 0, function* () {
        const { id, title, videoId, description } = playlistItems[i];
        const newNptelPlaylistItem = new NptelPlaylistItem(id, title, videoId, description, markers);
        // write to .csv (using the module organization)
        yield newNptelPlaylistItem.writeToCsv();
        // write to .txt (using the module organization)
        yield newNptelPlaylistItem.writeToTxt();
        // write to .csv using the video id
        yield newNptelPlaylistItem.writeToCsvUsingVideoId();
        // write  to .txt using the video id
        yield newNptelPlaylistItem.writeToTxtUsingVideoId();
    }));
}));
