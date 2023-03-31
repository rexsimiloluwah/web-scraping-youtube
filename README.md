## How does this work?

1. Extracts information on the playlist videos from the YouTube API
2. Scrapes the video markers from the video's YouTube webpage (using a headless browser)
3. Saves the fetched video markers to the required files

## To run this script locally

1. Ensure you have Node.js and TypeScript installed on your system
2. Install the dependencies

```bash
$npm install
```

3. Obtain a YouTube API Key from your Google Account, and set it as an environment variable

```bash
$export YOUTUBE_API_KEY=<replace_with_your_api_key>
```

3. Execute the script

```bash
$npm run execute
```
