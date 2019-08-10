import { TaggedLogger } from "./log";
import {
  $, ID_TAKE_PHOTO, ID_REG_VIDEO,
  ID_UPLOAD_PHOTO, ID_UPLOAD_PHOTO_INPUT,
  ID_REG_PHOTO,
} from './dom';

const MP4_SAMPLE = '/test/sample.mp4';

const log = new TaggedLogger('reg');

export function init() {
  $(ID_TAKE_PHOTO).addEventListener('click',
    () => initWebCam());

  $(ID_UPLOAD_PHOTO).addEventListener('click',
    () => uploadPhoto());
}

async function initWebCam() {
  try {
    log.i('initWebCam()');
    let video = $<HTMLVideoElement>(ID_REG_VIDEO);

    try {
      let stream = await navigator.mediaDevices
        .getUserMedia({ video: true, audio: false });

      log.i('Local video stream:', video.id);
      video.srcObject = stream;
    } catch (err) {
      log.i('getUserMedia() failed:', err.message);
      video.src = MP4_SAMPLE;
      video.loop = true;
    }

    await video.play();
    
    video.oncanplay = () => {
      video.oncanplay = null;
      let w = video.videoWidth;
      let h = video.videoHeight;
      log.i('streaming video:', w, 'x', h);
    };
  } catch (err) {
    log.e('initWebCam() failed:', err.message);
    $(ID_REG_VIDEO).textContent = err.message;
  }
}

function takePhoto() {
  let video = $<HTMLVideoElement>(ID_REG_VIDEO);
  let w = video.videoWidth;
  let h = video.videoHeight;

  log.i('taking photo:', w, 'x', h);

  let canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  let context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, w, h);
  let dataUrl = canvas.toDataURL('image/png');
  log.i('photo:', dataUrl.slice(0, 20));
  return dataUrl;
}

function uploadPhoto() {
  log.i('clicked "upload photo"');
  let input = $<HTMLInputElement>(ID_UPLOAD_PHOTO_INPUT);
  input.click();
  input.onchange = () => {
    let file = input.files[0];
    log.i('selected file:', file.type,
      (file.size / 2 ** 20).toFixed(1), 'MB');
    let url = URL.createObjectURL(file);
    let img = $<HTMLImageElement>(ID_REG_PHOTO);
    img.src = url;
  };
}
