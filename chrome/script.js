// Copyright 2020 gaerae.com
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Initialize
 */
var urlHost = window.location.host;
var videoLength = 0, delayTime = 5000, pipNotMultiple = false;
if (typeof chrome.storage != 'undefined') {
  chrome.storage.sync.get({
    delayTime: 5,
    pipNotMultiple: false
  }, items => {
    // storage number is seconds
    delayTime = items.delayTime * 1000;
    pipNotMultiple = items.pipNotMultiple;
  });
}

/**
 * Find largest playing video in a document
 */
function findVideo() {
  return Array.from(document.querySelectorAll('video'))
    .filter(video => video.readyState !== 0)
    .filter(video => video.disablePictureInPicture === false)
    .filter(video => {
      // google meet
      let isVideo = true;
      if (urlHost !== 'undefined' && urlHost === 'meet.google.com') {
        let videoParentElement = 'div[jscontroller="J3CtX"]';
        let presentationElement = 'div[jscontroller="LvT0m"]';
        let peopleNameElement = '[data-self-name]';
        let videoParent = video.closest(videoParentElement);
        isVideo = false;

        if (videoParent != null && videoParent.querySelector(presentationElement) != null) {
          let selfName = videoParent.querySelector(peopleNameElement);
          isVideo = selfName.dataset.selfName !== selfName.innerHTML
        }
      }
      return isVideo;
    })
    .sort((video1, video2) => {
      const video1Rect = video1.getClientRects()[0]||{width:0,height:0};
      const video2Rect = video2.getClientRects()[0]||{width:0,height:0};
      return ((video2Rect.width * video2Rect.height) - (video1Rect.width * video1Rect.height));
    });
}

/**
 * Delays a video change for the given number of milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Requesting Picture-in-Picture
 */
async function requestPiP(video) {
  if (video) {
    await video.requestPictureInPicture();
    video.setAttribute('__pip__', true);
    video.addEventListener('leavepictureinpicture', () => {
      video.removeAttribute('__pip__');
    }, {once: true});
    new ResizeObserver(resizeObserverVideo).observe(video);
  }
}

/**
 * Picture-in-Picture events
 */
function resizeObserverVideo(entries, observer) {
  const observedVideo = entries[0].target;
  if (!document.querySelector('[__pip__]')) {
    observer.unobserve(observedVideo);
    return;
  }

  let videos = findVideo();
  if (document.body.hasAttribute('__pip_watch__') === true && videoLength !== videos.length) {
    observer.unobserve(observedVideo);
    watch();
  }
}

/**
 * Entering Picture-in-Picture mode
 */
async function enterPiP(videos, position) {
  position = (position < videoLength) ? position : 0;
  if (videoLength === 0 || document.body.hasAttribute('__pip_watch__') === false) {
    exitPiP();
    return;
  }

  try {
    await requestPiP(videos[position]);
  } catch(e) {
    //console.log(e);
    videos = videos.splice(position, 1);
    videoLength = videos.length;
  }

  if (videoLength > 1) {
    await sleep(delayTime);
    await enterPiP(videos, position + 1);
  }
}

/**
 * Exiting Picture-in-Picture mode
 */
function exitPiP() {
  let hasExitPiP = false;
  if (document.querySelector('[__pip__]')) {
    document.exitPictureInPicture().catch(() => {});
    document.querySelectorAll('[__pip__]').forEach(video => video.removeAttribute('__pip__'));
    document.body.removeAttribute('__pip_watch__');
    hasExitPiP = true;
  }

  return hasExitPiP;
}

/**
 * watching Picture-in-Picture mode
 */
async function watch() {
  let videos = findVideo();
  let position = 0;
  videoLength = videos.length;

  if (videoLength === 0) {
    return;
  }
  document.body.setAttribute('__pip_watch__', true);
  if (pipNotMultiple === true) {
    if (videos.length > 1) { 
      videos = videos.slice(1);
    }
  }
  enterPiP(videos, position);
}

/**
 * main
 */
(async () => {
  let hasExitPiP = exitPiP();
  if (hasExitPiP === false) {
    await watch();
  }
  
  if (chrome.runtime.id) {
    chrome.runtime.sendMessage({ message: 'enter' });
  }
})();
