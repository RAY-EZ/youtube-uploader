import {Video} from './video';
import { Uploader } from './upload';
import path from 'path';
import fs from 'fs/promises'
import 'dotenv/config'
import FileType from 'file-type';
import { Dirent } from 'fs';


const videosDir = process.env?.npm_config_videos_dir || '';

const videosPath = []
const videosList:any[] = [];

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
    await fs.mkdir(path.join(__dirname, 'logs'), { recursive: true});

    for await (const {d, entry} of walk(videosDir)){
      let type  = await FileType.fromFile(path.resolve(entry))

      if(type?.mime.search(/video/) === 0){
        count++;
        let video = new Video({
          title: d.name.length <= 100? d.name: d.name.slice(0,100) ,
          localPath: entry,
          madeForKid: false,
          visibility: 'public',
          playlist: 'your playlist',
          tags: ['your tag']
        })
        video.onProgress = onProgress;
        video.onUploadStart = onUploadStart;
        video.onUploadSuccess = onUploadSuccess;
        videosList.push(video)
      }
    }
    
    if(!process.env.EMAIL || !process.env.PASSWORD) throw new Error('Email and Password required');

    const uploader = new Uploader({email: process.env.EMAIL , password: process.env.PASSWORD});
    uploader.upload(videosList,{headless: false, tolerence: 20000, skipProcessingAndChecks: true});

  } catch(e){
    console.log('called catch')
    await fs.writeFile(path.join(__dirname, 'logs/videoList.json'), JSON.stringify(videosList));
    console.error(e);
  }
  // console.log(videosList)
})()

process.on('unhandledRejection', (reason)=>{
  console.log(reason)
});

process.on('SIGTERM',()=>{

})
process.on('SIGINT', async ()=>{
  console.log('saved list to logs')
  console.log(videosList.length)
  await fs.writeFile(path.join(__dirname, 'logs/videoList.json'), 'something is written', {
    flag: 'w'
  });
  process.exit();
})