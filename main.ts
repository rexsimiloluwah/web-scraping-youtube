import * as puppeteer from "puppeteer";
import cheerio from "cheerio";
import axios from "axios";
import fs from "fs";
import path from "path";
import { PlaylistItemsResponse } from "./types";

// constants
const NPTEL_PLAYLIST_ID = "PL460BE04C4E59C01F";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // et this as an environment variable
const OUTPUT_DIR_NAME = "./output";
const PUPPETEER_HEADLESS_MODE = false; // change this to hide the headless browser

type Marker = {
  timestamp: string;
  label: string;
};

export class NptelPlaylistItem {
  id: number;
  title: string;
  videoId: string;
  description: string;
  markers: Array<Marker>;
  constructor(
    id: number,
    title: string,
    videoId: string,
    description: string,
    markers: Array<Marker>
  ) {
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
  getModuleAndLectureNumber(): { module: number; lecture: number } {
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
      module: Number((match as string[])[2]),
      lecture: Number((match as string[])[4]),
    };
  }

  /**
   * Initialize a new module directory i.e. `MODULE 1` for saving module 1 lectures
   * @returns
   */
  initModuleDirectory(): string {
    const { module } = this.getModuleAndLectureNumber();

    // create a new output directory (if it does not exist)
    if (!fs.existsSync(OUTPUT_DIR_NAME)) {
      fs.mkdirSync(OUTPUT_DIR_NAME);
    }

    const moduleDirPath = path.join(OUTPUT_DIR_NAME, `MODULE ${module}`);
    // create a new folder for the module (if it does not exist)
    if (!fs.existsSync(moduleDirPath)) {
      fs.mkdirSync(moduleDirPath);
    }

    return moduleDirPath;
  }

  /**
   * Initialize an `all` directory for saving all the files
   * This does not organize the files into their respective modules
   * However, it is the expected format as stated by Dr. Ayodele
   * @returns
   */
  initAllFilesDirectory(): string {
    // create a new output directory (if it does not exist)
    if (!fs.existsSync(OUTPUT_DIR_NAME)) {
      fs.mkdirSync(OUTPUT_DIR_NAME);
    }

    const allFilesDirPath = path.join(OUTPUT_DIR_NAME, "all");
    // create a new folder for the module (if it does not exist)
    if (!fs.existsSync(allFilesDirPath)) {
      fs.mkdirSync(allFilesDirPath);
    }

    return allFilesDirPath;
  }

  /**
   * Write the markers to a .csv file in its module folder
   * The file is saved in "MODULE {module_id}/{lecture_id}.csv"
   */
  async writeToCsv() {
    const { lecture } = this.getModuleAndLectureNumber();
    const moduleDirPath = this.initModuleDirectory();
    const outputFilePath = path.join(moduleDirPath, `${lecture}.csv`);
    try {
      for (let i = 0; i < this.markers.length; i++) {
        const { timestamp, label } = this.markers[i];
        fs.appendFileSync(outputFilePath, `${label}, ${timestamp}\n`);
      }
      console.log(`Successfully saved at: ${outputFilePath}`);
    } catch (error) {
      throw new Error(error as string);
    }
  }

  /**
   * Write the video markers to a .txt file in its module folder
   * The file is saved in "MODULE {module_id}/{lecture_id}.txt"
   */
  async writeToTxt() {
    const { lecture } = this.getModuleAndLectureNumber();
    const moduleDirPath = this.initModuleDirectory();
    const outputFilePath = path.join(moduleDirPath, `${lecture}.txt`);
    try {
      for (let i = 0; i < this.markers.length; i++) {
        const { timestamp, label } = this.markers[i];
        fs.appendFileSync(outputFilePath, `${label}, ${timestamp}\n`);
      }
      console.log(`Successfully saved at: ${outputFilePath}`);
    } catch (error) {
      throw new Error(error as string);
    }
  }

  /**
   * Write the video markers to a .csv file in the `all` folder
   * The file is saved in "all/{video_id}.csv"
   */
  async writeToCsvUsingVideoId() {
    const allFilesDirPath = this.initAllFilesDirectory();
    const outputFilePath = path.join(allFilesDirPath, `${this.id + 1}.csv`);
    try {
      for (let i = 0; i < this.markers.length; i++) {
        const { timestamp, label } = this.markers[i];
        fs.appendFileSync(outputFilePath, `${label}, ${timestamp}\n`);
      }
      console.log(`Successfully saved at: ${outputFilePath}`);
    } catch (error) {
      throw new Error(error as string);
    }
  }

  /**
   * Write the video markers to a .txt file in the `all` folder
   * The file is saved in "all/{video_id}.txt"
   */
  async writeToTxtUsingVideoId() {
    const allFilesDirPath = this.initAllFilesDirectory();
    const outputFilePath = path.join(allFilesDirPath, `${this.id + 1}.txt`);
    try {
      for (let i = 0; i < this.markers.length; i++) {
        const { timestamp, label } = this.markers[i];
        fs.appendFileSync(outputFilePath, `${label}, ${timestamp}\n`);
      }
      console.log(`Successfully saved at: ${outputFilePath}`);
    } catch (error) {
      throw new Error(error as string);
    }
  }
}

/**
 * Fetch the NPTEL "Intelligent Control" playlist items data using the Youtube API
 * @returns
 */
async function fetchNptelPlaylistData(): Promise<
  Array<{
    id: number;
    videoId: string;
    description: string;
    title: string;
  }>
> {
  const playlistItemsResponse = await axios.get<PlaylistItemsResponse>(
    "https://www.googleapis.com/youtube/v3/playlistItems",
    {
      params: {
        part: "snippet",
        playlistId: NPTEL_PLAYLIST_ID,
        key: YOUTUBE_API_KEY,
        maxResults: 32,
      },
    }
  );

  return playlistItemsResponse.data.items.map((item) => {
    const {
      snippet: { title, description, position, resourceId },
    } = item;
    return {
      id: position,
      videoId: resourceId.videoId,
      title: title,
      description: description,
    };
  });
}

/**
 * Scrapes the video section markers using puppeteer
 * @param videoIds // an array of the YouTube video ids
 * @returns
 */
async function scrapeNptelVideoSectionsUsingPuppeteer(
  videoIds: string[]
): Promise<
  | Array<
      Array<{
        timestamp: string;
        label: string;
      }>
    >
  | undefined
> {
  try {
    const browser = await puppeteer.launch({
      headless: PUPPETEER_HEADLESS_MODE,
    });
    const page = await browser.newPage();

    let playlistMarkers: Array<Array<Marker>> = [];

    // using a for loop here offers a significant performance boost
    for (let i = 0; i < videoIds.length; i++) {
      const videoId = videoIds[i];
      await page.goto(`https://www.youtube.com/watch?v=${videoId}`, {
        waitUntil: "networkidle2",
      });

      await page.waitForSelector(".button.ytd-text-inline-expander");

      await page.click(".button.ytd-text-inline-expander");
      await page.click("aria/View all[role='button']");

      // get the innerHTML of all the video marker elements
      const markers = await page.$$eval(
        "ytd-macro-markers-list-item-renderer",
        (els) =>
          els.map((e) => {
            return e.innerHTML;
          })
      );

      const response = markers.map((marker) => {
        const $ = cheerio.load(marker);
        const timestamp = $("#details #time").first().text();
        const label = $("#details h4").first().text();
        return { timestamp, label };
      });

      const videoMarkers: Array<Marker> = [
        ...new Set(response.map((r) => JSON.stringify(r))),
      ].map((s) => JSON.parse(s));

      playlistMarkers.push(videoMarkers);
      setTimeout(() => {}, 2000);
    }
    await browser.close();
    return playlistMarkers;
  } catch (error) {
    console.error(error);
  }
}

// to prevent any memory leaks
process.setMaxListeners(100);

// main execution block
fetchNptelPlaylistData().then(async (playlistItems) => {
  const videoIds = playlistItems.map((item) => item.videoId);
  // fetch the playlist markers
  const playlistMarkers = await scrapeNptelVideoSectionsUsingPuppeteer(
    videoIds
  );
  playlistMarkers?.map(async (markers, i) => {
    const { id, title, videoId, description } = playlistItems[i];
    const newNptelPlaylistItem = new NptelPlaylistItem(
      id,
      title,
      videoId,
      description,
      markers
    );

    // write to .csv (using the module organization)
    await newNptelPlaylistItem.writeToCsv();
    // write to .txt (using the module organization)
    await newNptelPlaylistItem.writeToTxt();
    // write to .csv using the video id
    await newNptelPlaylistItem.writeToCsvUsingVideoId();
    // write  to .txt using the video id
    await newNptelPlaylistItem.writeToTxtUsingVideoId();
  });
});
