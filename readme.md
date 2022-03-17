# Youtube Uploader Bot

Simple youtube uploader bot made with puppeteer & ❤

## Features
Will include later or partially implemented
 - [X] Login and saving session
 - [X] Creating Playlist 
 - [ ] Better Error Handling
 - [ ] Code Refactoring or maybe event based approach
 - [ ] Uploading and Saving Link to a file
 - [ ] Continue where left off, if error occured
 - [ ] Adding Video constraint like title, description, and playlist length limit; special characters 
 - [ ] Writing test

## Installation

youtube uploader requires [Node.js](https://nodejs.org/) v10+ to run.

## Environment
enviornment variables for now 
create `.env` file in root directory

```.env
EMAIL="your@email.com"
PASSWORD="your_password"
```

Installing dependencies and running in development

```sh
npm install
npm run dev
```

trust me last step 
edit `index.js` file in `src` directory
```js
const video = new Video({
  title: 'Sample Video',
  localPath: '/Users/ray-ez/Desktop/Node/projectM/videos/Screen Recording 2022-02-28 at 12.09.42 PM.mov',
  madeForKid: false,
  visibility: 'public',
  playlist: 'meme2'
})
```
create instances of video or just edit the `localPath`

# Note
Still under development. This bot still not publishes the video, youtube defaults saves the video as private unless published.
