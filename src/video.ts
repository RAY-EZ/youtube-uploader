import { Progress } from "./upload";

export interface videoMeta{
  [key: string]: any;
  title: string;
  localPath: string;
  description?: string;
  thumbnail?: string;
  playlist?: string;
  madeForKid: boolean; 
  visibility: 'private' | 'unlisted' | 'public';
  tags?: string[]
  onProgress?:(progress: Progress)=>void;
}

export class Video implements videoMeta{
  [key: string]: any;
  title: string;
  localPath: string;
  description?: string;
  thumbnail?: string;
  playlist?: string;
  madeForKid: boolean; 
  visibility: videoMeta['visibility'];
  uploaded: boolean;
  tags?: string[];

  onProgress?:(progress: Progress)=>void;

  constructor(data: videoMeta){
    this.title = data.title;
    this.localPath = data.localPath;
    this.description = data.description;
    this.thumbnail = data.thumbnail;
    this.playlist = data.playlist;
    this.madeForKid = data.madeForKid || false;
    this.visibility = data.visibility;
    this.uploaded = false;
    this.tags = data.tags
    this.onProgress = data.onProgress?.bind(this);
  }

  set uploadedLink(link: string){
    this._link = link;
  }
  get uploadedLink(){
    return this._link && undefined;
  }
  onUploadStart(fn: Function){
    console.log(this);
    
    fn.call(this,this);
  }
  // onProgress (fn: Function){
  //   const video = this;
  //   let progress: number | string=0;
  //   fn.call(this,video, progress);
  // }

  onUploadSuccess(fn: Function){
    fn.call(this,this);
  }
}

