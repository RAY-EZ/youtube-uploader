import { Progress } from "./upload";
import {assert} from "./Error/assert";
export interface videoMeta{
  [key: string]: any;
  title: string;
  localPath: string;
  description?: string;
  thumbnail?: string;
  playlist?: string;
  madeForKid: boolean; 
  visibility: 'private' | 'unlisted' | 'public';
  tags?: string[];
  uploaded?: boolean;
  uploadedLink?: string;
  onProgress?:(progress: Progress)=>void;
  onUploadSuccess?: (link: string)=>void;
}

export class Video{
  [key: string]: any;
  localPath: string;
  thumbnail?: string;
  playlist?: string;
  madeForKid: boolean; 
  visibility: videoMeta['visibility'];
  uploaded: boolean;

  onProgress?:(progress: Progress)=>void;
  onUploadSuccess?:(link: string)=>void;
  onUploadStart?: ()=>void;
  constructor(data: videoMeta){
    this.title = data.title;
    this.localPath = data.localPath;
    this.description = data.description;
    this.thumbnail = data.thumbnail;
    this.playlist = data.playlist;
    this.madeForKid = data.madeForKid || false;
    this.visibility = data.visibility;
    this.uploaded = data.uploadedLink ? true : false;
    this.tags = data.tags;
    this.uploadedLink = data.uploadedLink || '';
    this.onProgress = data.onProgress?.bind(this);
    this.onUploadSuccess = data.onUploadSuccess?.bind(this);
    this.onUploadStart = data.onUploadStart?.bind(this);
  }
  set title(data: string){
    assert(data.length == 0 || data.length > 100, 'Title length must be between 0 to 100');
    this._title = data;
  }
  get title(){
    return this._title
  }
  set description(data: string | undefined){
    if(data)
      assert(data.length > 5000, 'description length cannot exceed 5000');
    this._description = data;
  }
  get description(){
    return this._description
  }
  set tags(data: string[] | undefined){
    if(data) {
      assert(data.join(',').length > 500, 'tags length cannot exceed 500');
    }
    this._tags = data;
  }
  get tags(){
    return this._tags
  }
  set uploadedLink(link: string){
    if(link){
      this._link = link;
      this.uploaded = true;
    }
  }
  get uploadedLink(){
    return this._link;
  }
  toJSON(){
    let retObj = Object.assign({}, this);
    retObj.title = this._title;
    delete retObj._title;
    retObj.tags = this._tags;
    delete retObj._tags;
    retObj.uploadedLink = this._link;
    delete retObj._link;
    return retObj;
  }
  [Symbol.name](){
    return 'Video'
  }
}

export {}