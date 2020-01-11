const tingle = require('tingle.js/dist/tingle');
const Toastify = require('toastify-js/src/toastify');

function showToast(message, timeout?) {
  Toastify({
    text: message,
    className: 'cyb-notify',
    duration: timeout || 5000,
    gravity: 'bottom', // `top` or `bottom`
    positionLeft: false, // `true` or `false`
    stopOnFocus: true, // Prevents dismissing of toast on hover
  }).showToast();
}

let onPopupOpen;
document.addEventListener('cyb:popup-opened', async function(data: any) {
  if (onPopupOpen) {
    onPopupOpen();
  }
});

let onIsContentExistsResponse;
document.addEventListener('cyb:is-content-exists:response', async function(data: any) {
  if (onIsContentExistsResponse) {
    onIsContentExistsResponse(data.detail);
  }
});

const modal = new tingle.modal({
  footer: true,
  stickyFooter: false,
  closeMethods: ['overlay', 'button', 'escape'],
  closeLabel: 'Close',
  cssClass: ['cyb-extension-modal'],
});

function saveContent(contentType, contentSrc) {
  const videoElement = `<iframe src="${contentSrc}" frameborder="0" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen="" class="cyb-content-to-save"></iframe>`;
  const imageElement = `<img id="cyb-content-image" src="${contentSrc}" class="cyb-content-to-save">`;

  modal.setContent(`
<div id="cyb-modal-container">
    <div class="img-container">
      ${contentType === 'image' ? imageElement : videoElement}
    </div>
    <div class="inputs-container">
      <h3>Save content to IPFS</h3>
      
      <div id="cyb-content-description-container">
        <div>Description:</div>
        <textarea id="cyb-content-description" class="cyb-textarea"></textarea>
      </div>
      
      <div id="cyb-content-link-checkbox-container">
        <label><input type="checkbox" id="cyb-content-link-checkbox"><span id="cyb-content-link-checkbox-view"></span><span id="cyb-content-link-checkbox-text">Link content</span></label>
      </div>
      
      <div id="cyb-content-link-inputs" style="display: none;">
        <div>Keywords:</div>
        <textarea id="cyb-content-keywords" class="cyb-textarea"></textarea>
      </div>
      
      <div id="cyb-save-confirm-button-container">
        <button id="cyb-save-confirm-button" class="cyb-button">Save</button>
      </div>
      
      <div id="cyb-link-attention" class="cyb-warn" style="display: none;">
        You have to open Cyb extension for confirm content linking.
      </div>
    </div>
</div>`);

  onIsContentExistsResponse = isContentExists => {
    onIsContentExistsResponse = null;
    if (isContentExists.result) {
      return showToast('Content already exists!<br/>Hash: ' + isContentExists.contentHash);
    }
    modal.open();

    const saveConfirmButton = document.getElementById('cyb-save-confirm-button');
    const linkCheckBox = document.getElementById('cyb-content-link-checkbox');
    const linkCheckBoxView = document.getElementById('cyb-content-link-checkbox-view');

    linkCheckBox.addEventListener('change', event => {
      const linkCheckBoxInputs = document.getElementById('cyb-content-link-inputs');
      linkCheckBoxInputs.style.display = event.target['checked'] ? `block` : 'none';
      saveConfirmButton.innerText = event.target['checked'] ? `Save and link` : 'Save';
      linkCheckBoxView.className = event.target['checked'] ? `checked` : '';
    });

    saveConfirmButton.addEventListener('click', () => {
      const description = document.getElementById('cyb-content-description');
      const keywords = document.getElementById('cyb-content-keywords');
      const linkChecked = linkCheckBox['checked'];

      let iconSrc;
      let icons = document.querySelectorAll('[rel="icon"]');
      if (icons && icons[0]) {
        iconSrc = icons[0].getAttribute('href');
      }
      if (!iconSrc) {
        icons = document.querySelectorAll('[rel="shortcut icon"]');
        if (icons && icons[0]) {
          iconSrc = icons[0].getAttribute('href');
        }
      }
      const event = new CustomEvent('cyb:save', {
        detail: {
          contentType,
          src: contentSrc,
          iconSrc: iconSrc,
          description: description['value'],
          link: linkChecked,
          keywords: keywords ? keywords['value'] : '',
        },
      });

      document.dispatchEvent(event);

      if (linkChecked) {
        const cybLinkAttention = document.getElementById('cyb-link-attention');
        cybLinkAttention.style.display = 'block';
        onPopupOpen = () => {
          modal.close();
          onPopupOpen = null;
        };

        return showToast('Content saved! Please open Cyb extension for link.');
      } else {
        modal.close();
        return showToast('Content saved!');
      }
    });
  };

  const event = new CustomEvent('cyb:is-content-exists', { detail: { contentType, src: contentSrc } });

  document.dispatchEvent(event);
}

function getElOffset(el) {
  const rect = el.getBoundingClientRect();
  const docEl = document.documentElement;

  const top = rect.top + window.pageYOffset - docEl.clientTop;
  const left = rect.left + window.pageXOffset - docEl.clientLeft;
  return { top, left };
}

function ready(fn) {
  if (document['attachEvent'] ? document.readyState === 'complete' : document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(() => {
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'position:absolute;z-index:10000;display:none;';

  const button = document.createElement('button');
  button.innerHTML = 'Save';
  button.setAttribute('id', 'cyb-save-button');
  button.setAttribute('class', 'cyb-button cyb-small-btn');
  buttonContainer.appendChild(button);

  document.body.appendChild(buttonContainer);

  let isPreventHide = false;

  function hide() {
    setTimeout(() => {
      if (isPreventHide) {
        return;
      }
      buttonContainer.style.display = `none`;
    }, 100);
  }
  function preventHide() {
    isPreventHide = true;
    setTimeout(() => {
      isPreventHide = false;
    }, 200);
  }

  let contentType = null;
  let contentSrc = null;

  function subscribeToImageEvents() {
    //TODO: implement youtube downloading in background.ts and use this commented code:
    //,iframe[src*=youtube]:not(.cyb-content-to-save)
    document.querySelectorAll('img:not(.cyb-content-to-save)').forEach(el => {
      if (el['cyb_onMouseEnter']) {
        el.removeEventListener('mouseenter', el['cyb_onMouseEnter']);
        el.removeEventListener('mouseleave', el['cyb_onMouseLeave']);
      }

      el['cyb_onMouseEnter'] = () => {
        console.log('el', el);
        if (el.tagName === 'IMG') {
          contentType = 'image';
        } else {
          contentType = 'video';
        }
        contentSrc = el.getAttribute('src');
        preventHide();
        const offset = getElOffset(el);
        buttonContainer.style.display = `block`;
        buttonContainer.style.top = `${offset.top}px`;
        buttonContainer.style.left = `${offset.left}px`;
        buttonContainer.style.bottom = `${offset.top + el['offsetHeight']}px`;
        buttonContainer.style.right = `${offset.left + el['offsetWidth']}px`;
      };
      el['cyb_onMouseLeave'] = () => {
        hide();
      };

      el.addEventListener('mouseenter', el['cyb_onMouseEnter']);
      el.addEventListener('mouseleave', el['cyb_onMouseLeave']);
    });
  }

  subscribeToImageEvents();

  setInterval(() => {
    subscribeToImageEvents();
  }, 1000);

  button.addEventListener('mouseenter', () => {
    preventHide();
  });
  button.addEventListener('click', () => {
    hide();
    saveContent(contentType, contentSrc);
  });
  button.addEventListener('mouseleave', () => {
    hide();
  });

  document.body.addEventListener('click', () => {
    hide();
  });
});
