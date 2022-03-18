import {Video} from './video';
import { Uploader } from './upload';
import 'dotenv/config'

const video = new Video({
  title: 'Sample Video',
  localPath: '/Users/ray-ez/Desktop/Node/projectM/videos/Screen Recording 2022-02-28 at 12.09.42 PM.mov',
  madeForKid: true,
  visibility: 'public',
  playlist: 'meme2',
  tags: ['meme', 'meme2']
})
video.onProgress = (progress)=>{
  // console.log(progress);
}
if(!process.env.EMAIL || !process.env.PASSWORD) throw new Error('Email and Password required');

const uploader = new Uploader({email: process.env.EMAIL , password: process.env.PASSWORD});

uploader.upload([video],{headless: false, tolerence: 20000, skipProcessingAndChecks: true})