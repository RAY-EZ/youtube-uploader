import {Video} from './video';
import { Uploader } from './upload';
import path from 'path';
import fs from 'fs/promises'
import 'dotenv/config'
import FileType from 'file-type';
import fsSync, { Dirent } from 'fs';


const videosDir = process.env?.npm_config_videos_dir || '';
const LogDir = path.join(__dirname, 'logs');
const UploadVideoLog = path.join(LogDir, 'videoList.json');

const videosPath = []
const NotUploaded:Video[] = [];
const VideoList: Video[] = [];

const onProgress = function(progress: any){
  console.log(progress);
}
const onUploadStart = function(this: Video){
  console.log(`uploading - ${this.title}`)
}
const onUploadSuccess = function(this: Video, link: string){
  console.log(link)
}

// Recursively Traversing through directory
async function* walk(dir: string): AsyncGenerator<{d:Dirent; entry:string}>{
  for await (const d of await fs.opendir(dir)) {
      const entry = path.join(dir, d.name);
      if (d.isDirectory()){
        yield *walk(entry);
      } 
      else if (d.isFile()){
        
        yield {d , entry};
      } 
  }
}

(async ()=>{
  try{
    let count = 0;
    await fs.mkdir(LogDir, { recursive: true});

    try {
      const videoListJson = await fs.readFile(UploadVideoLog, { encoding: 'utf-8'});
      let videos = JSON.parse(videoListJson);
      // attaching callbacks
      videos.forEach((vid: Video, index: number) => {
        // some bad ways of writing js 😂 🙈
        videos[index] = new Video(vid);
        vid= videos[index];
        // now vid instanceof Video
        vid.tags = vid.tags?.filter((tag)=> tag.length < 30)
        vid.uploadedLink = vid.uploadedLink?.trim()
        vid.onProgress = onProgress;
        vid.onUploadStart = onUploadStart;
        vid.onUploadSuccess = onUploadSuccess;
      });
      // All Video List
      VideoList.push(...videos);
      // not uploaded Video
      videos = VideoList.filter((vid: Video)=> !vid.uploaded);
      NotUploaded.push(...videos);

      console.table([{ 'Videos To Upload': VideoList.length, 
                      'Videos Uploaded': VideoList.length - NotUploaded.length,
                      'Videos Not Uploaded': NotUploaded.length 
                    }]);
      // console.log(VideoList.filter((vid: Video)=> vid.uploaded))
      
    } catch(e){

      for await (const {d, entry} of walk(videosDir)){
        let type  = await FileType.fromFile(path.resolve(entry))

        if(type?.mime.search(/video/) === 0){
          count++;
          let video = new Video({
            title: d.name.length <= 100? d.name: d.name.slice(0,100) ,
            localPath: entry,
            madeForKid: false,
            visibility: 'unlisted',
            // playlist: entry.split('/')[5],
            // tags: entry.split('/').slice(4).filter((tag)=> tag.length < 30)
            playlist: 'your-playlist',
            tags: ['your', 'tags']
          })
          video.onProgress = onProgress;
          video.onUploadStart = onUploadStart;
          video.onUploadSuccess = onUploadSuccess;
          NotUploaded.push(video)
        }
      }
      /** Now videoList hold the `reference` to the Videos */
      VideoList.push(...NotUploaded);
      console.log(JSON.stringify(NotUploaded, null, 2))
    }

    
    if(!process.env.EMAIL || !process.env.PASSWORD) throw new Error('Email and Password required');
    
    const uploader = new Uploader({email: process.env.EMAIL , password: process.env.PASSWORD});
    await uploader.upload(NotUploaded,{headless: false, tolerence: 20000, skipProcessingAndChecks: true});
    await fs.writeFile(UploadVideoLog, JSON.stringify(VideoList));

  } catch(e){
    console.log('called catch')
    console.error(e);
  }
  // console.log(NotUploaded)
})()

process.on('unhandledRejection', (reason)=>{
  console.log(reason)
});

process.on('SIGTERM',()=>{

})
process.on('SIGINT', async ()=>{
  console.log('saved videos list to logs');
  console.log(VideoList.length)
  fsSync.writeFileSync(UploadVideoLog, JSON.stringify(VideoList), {
    flag: 'w'
  })
  
  process.exit();
})