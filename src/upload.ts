import puppeteer, { Puppeteer } from 'puppeteer';
import { Browser, Page } from 'puppeteer/lib/types'
import { Account, credential } from './account';
import { Video } from './video';
import { UploadError } from './Error/uploadError';
import { resolve } from 'path/posix';

export interface Progress{
  stage: number;
  stageName: 'uploading'|'processing'|'checking'
  percentage: number;
}
interface options {
  headless: boolean;
  skipProcessingAndChecks?: boolean;
  tolerence?: number;
}

export class Uploader {
  readonly _account: Account;
  browser?: Browser;
  page?: Page;
  tolerence?: number;
  skipProcessingAndChecks?: boolean;

  constructor(credentials: credential){
    // Context can be changed later
    this._account= new Account(credentials);
  }

  async upload(videos: Video[], options: options){
    try{
      if(!this.browser && !this.page){
        let { browser, page } = await this._account.login(options.headless);
        this.browser= browser;
        this.page = page;
      }
      
      const acceptBeforeUnload = (dialog:any )=> {
        dialog.type() === "beforeunload" && dialog.accept();

      }
      this.page?.on("dialog", acceptBeforeUnload); 
  
      this.tolerence = options.tolerence;
      this.skipProcessingAndChecks = options.skipProcessingAndChecks || true;
  
      for(let video of videos){
        video.onUploadStart?.();
        await this._uploadVideo(video);
      }
      console.log('DONE 😃 🚀')
      await this.browser?.close();
    } catch(e){
      console.log(e);
    }
    // Setup 
   
  }

  async _uploadVideo(video: Video){
    try{
      await this.page!.goto('https://studio.youtube.com');
      // await this.page!.waitForNavigation();
   
      await this.page?.click('#create-icon');
      await this.page!.click('tp-yt-paper-item#text-item-0');
      const [fileChooser] = await Promise.all([
        this.page!.waitForFileChooser(),
        this.page!.click('#select-files-button'), // some button that triggers file selection
      ]);
  
      await fileChooser.accept([video.localPath])
  
      const DialogPath = '/html/body/ytcp-uploads-dialog/tp-yt-paper-dialog';
      const progressLabel= 'span.progress-label.style-scope.ytcp-video-upload-progress';
      const errorLabel = '.error-short.style-scope.ytcp-uploads-dialog';
      const youtubeUploadDialog = await this.page!.waitForXPath(DialogPath);
  
      const _this = this;
      let stage: number = 0, percentage = 0, timeoutms = 500;
  
      async function loop(ms: number){
        // if(_this.tolerence == ms) return;
        if(_this.tolerence == ms){
          console.log('tolerence reached youtube upload stuck at something');
          return;
        }
  
        let error = await youtubeUploadDialog!.$eval(errorLabel, (el)=>el.innerHTML);
        let progress = await youtubeUploadDialog!.$eval(progressLabel,(el)=>el.innerHTML );
  
        if(error.toLocaleLowerCase()== 'daily upload limit reached') throw new UploadError('daily upload limit reached')
        // if(error.toLocaleLowerCase()== 'daily upload limit reached') return;
        let [state,...parameters] = progress.toLocaleLowerCase().split(' ');
        
        // stage 1 - Uploading or Upload Complete
        // console.log(state,parameters)
        if(state.startsWith('upload')){
          let currentPercent;
          if(parameters[0] == 'complete' || parameters[0] == '100%'){
            stage = 1;
            const uploadedLink = await _this.finalizeUpload(youtubeUploadDialog, video);
            video.uploadedLink = uploadedLink.trim();
            video.onUploadSuccess?.(uploadedLink);
            if(_this.skipProcessingAndChecks) return uploadedLink;
          }
          
          currentPercent = +parameters[0].slice(0,-1);
          if(currentPercent == percentage) ms +=timeoutms;  // raising timeout if yt stucks
          
          video.onProgress?.({stage, stageName: 'uploading', percentage: +parameters[0].slice(0,-1)})
        }
  
        if(!_this.skipProcessingAndChecks){
          // stage 2 - Checking or Check Complete
          if(state.startsWith('check')){
            // video.onProgress!({stage, stageName: 'checking', percentage: +parameters[0].slice(0,-1)})
          }
          // stage 3 - Processing or Processing complete
          if(state.startsWith('process')){
            // video.onProgress!({stage, stageName: 'processing', percentage: +parameters[0].slice(0,-1)})
          }
        }
  
        await new Promise(resolve => setTimeout(async ()=>{
          await loop(ms);
          resolve(null);
        },ms))
        // setTimeout(loop.bind(_this,ms),ms);
      }
      await loop(timeoutms);
      // Stage 1 - Uploading
      // Stage 2 - Processing
      // Stage 3 - Checks
    } catch(e){
      console.error(e)
    }
   
  }

  async finalizeUpload( ytDialog: puppeteer.ElementHandle|null, video: Video ):Promise<string>{
    const videoLinkSelector = 'a.style-scope.ytcp-video-info';
    const playlistDialogSelector = 'tp-yt-paper-dialog.style-scope.ytcp-playlist-dialog';
    const doneButtonSelector = 'ytcp-button.done-button .label'
    const tagsTextSelector = 'ytcp-chip-bar .chip-and-bar #text-input'
    const nextButtonSelector = '#next-button';
    const backButtonSelector = '#back-button';

    await this.page?.waitForTimeout(3000);
    const link = await ytDialog?.$eval(videoLinkSelector, (el)=>el.innerHTML);

    const textElementSelector = '#textbox'
    const [titleElement, descriptionElement ] = await ytDialog!.$$(textElementSelector);
    await titleElement.click();
    await titleElement.evaluateHandle((el)=>{
      el.innerHTML = '';
    })
    await titleElement.type(video.title, { delay: 100});
    await descriptionElement.click();
    await descriptionElement.evaluateHandle((el)=>{
      el.innerHTML = '';
    })
    await descriptionElement.type(video?.description || '', {delay: 100})

    // scrolling Playlist into view 
    const basicElement = await ytDialog!.$('#scrollable-content');
    const basicElementBoundingBox = await basicElement?.boundingBox();
    if(!basicElementBoundingBox)
      await this.page!.mouse.move(basicElementBoundingBox!.x + 100, basicElementBoundingBox!.y + 100)
    await this.page!.mouse.wheel({ deltaY: -493});

    if(video.playlist){
      const videoPlaylist = video.playlist
      const playListSelector = '.use-placeholder.style-scope.ytcp-text-dropdown-trigger';
      const playListElement = await ytDialog!.$(playListSelector);

      await playListElement?.click();
      await this.page!.waitForTimeout(5000)
      const playlistDialog = await this.page!.$(playlistDialogSelector);
      const doneButtonElement = await playlistDialog?.$(doneButtonSelector);
      // Look for existing playlist
      const playListItem = '[id^=checkbox-label-] > span'
      // const playListItem = '.style-scope.ytcp-checkbox-group.ytcp-checkbox-label.compact > span > span'
      let playlist: puppeteer.ElementHandle | null | undefined;
      let playlistNames: string[] | undefined
      
      playlistNames = await playlistDialog?.$$eval( playListItem , (nodes)=>{
        return nodes.map((el)=>el.innerHTML)
      })
      ;
      let playlistIndex = playlistNames?.indexOf(videoPlaylist)
      
      let videoPlaylistElement = await playlistDialog!.$(`[id^=checkbox-label-${playlistIndex}] > span`);

      // create Playlist
      if(!videoPlaylistElement){
        const newPlaylistButton = await playlistDialog!.$('.new-playlist-button.action-button.style-scope.ytcp-playlist-dialog');
        await newPlaylistButton?.click();
        await this.page!.waitForTimeout(500)
        const titleTextArea = await playlistDialog!.$('.style-scope.ytcp-form-textarea');
        await titleTextArea?.type(videoPlaylist, { delay: 100});
        (await playlistDialog!.$('ytcp-button.create-playlist-button'))?.click();

        await this.page?.waitForTimeout(4000);

        playlistNames = await playlistDialog?.$$eval( playListItem , (nodes)=>{
          return nodes.map((el)=>el.innerHTML)
        })
        playlistIndex = playlistNames?.indexOf(videoPlaylist)
        videoPlaylistElement = await playlistDialog!.$(`[id^=checkbox-label-${playlistIndex}] > span`);
      }
      await videoPlaylistElement?.click();
      await doneButtonElement?.click();
    }
    
    // Setting made for Kids
    const madeForKidSelector= 'VIDEO_MADE_FOR_KIDS_MFK';
    const notMadeForKidSelector= 'VIDEO_MADE_FOR_KIDS_NOT_MFK';

    const radioButton = await ytDialog!.$(`[name=${video.madeForKid ? madeForKidSelector: notMadeForKidSelector}]`);
    await radioButton?.click();
    

    //show More
    await (await ytDialog!.$('tp-yt-paper-dialog #toggle-button'))?.click();

    // Adding Tags
    if(video.tags && video.tags.length > 0){
      const tags = video.tags.join(',');
      const tagsTextArea = await ytDialog!.$(tagsTextSelector);
      await tagsTextArea?.type(tags, { delay: 200});
    }

    await (await ytDialog!.$(nextButtonSelector))?.click({delay: 100});
    /**
     * more step can be added here
     * Add cards, end screen, Subtitles etc..
     */
    await (await ytDialog!.$(nextButtonSelector))?.click({delay: 100});

    // Checks Page
    /**
     * copyright related error can be handled here
     */
    await (await ytDialog!.$(nextButtonSelector))?.click({delay: 100})

     const visibilityRadio =await ytDialog!.$(`#privacy-radios [name=${video.visibility.toUpperCase()}]`);
     visibilityRadio?.click();
     /**
      * scheduling can be added here
      */
    await this.page?.waitForTimeout(1000);
    await (await ytDialog!.$('#done-button'))?.click({delay: 100});
    await this.page?.waitForTimeout(5000);
    return link || '';
  }
}
