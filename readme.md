# Youtube Uploader Bot

Simple youtube uploader bot made with puppeteer & ❤

## Features
Will include later or partially implemented
 - [X] Login and saving session
 - [X] Creating Playlist 
 - [X] Can add tags 
 - [X] Publishes Video 
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
npm run dev --videos-dir=/absolute/path/to/the/video/containing/folder
```

edit `index.ts` file in `src` directory
```ts
  let video = new Video({
    title: d.name.length <= 100? d.name: d.name.slice(0,100) ,
    localPath: entry,
    madeForKid: false,
    visibility: 'public',
    playlist: 'your playlist',
    tags: ['your tag']
})
```
`d` and `entry` here passed by generator function that is looping through your directory. `d` hold the refernce to current file and `entry` path to the file.

you can add your logic here for adding dynamic playlist name 
I've kept my videos in nested folder so that my folder's name is video playlist(😎)

# Note
It can upload bunch of video at once.
If you find any sort of error while running feel free report a new issue

![should output link](/sample.png)
