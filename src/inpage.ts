const tingle = require('tingle.js/dist/tingle');

const modal = new tingle.modal({
  footer: true,
  stickyFooter: false,
  closeMethods: ['overlay', 'button', 'escape'],
  closeLabel: 'Close',
  // cssClass: ['custom-class-1', 'custom-class-2'],
  // onOpen: function() {
  //   console.log('modal open');
  // },
  // onClose: function() {
  //   console.log('modal closed');
  // },
  // beforeClose: function() {
  //   // here's goes some logic
  //   // e.g. save content before closing the modal
  //   return true; // close the modal
  //   return false; // nothing happens
  // }
});

modal.addFooterBtn('Save', 'tingle-btn tingle-btn--primary', function() {
  const image = document.getElementById('cyb-content-image');
  const event = new CustomEvent('cyb:save', {
    detail: {
      contentType: 'image',
      src: image.getAttribute('src'),
    },
  });
  document.dispatchEvent(event);
  modal.close();
});

function saveImage(imgSrc) {
  modal.setContent(`
<div id="cyb-modal-container">
    <div class="img-container"><img id="cyb-content-image" src="${imgSrc}"></div>
    <div class="inputs-container">
      <div>
        <div>Description:</div>
        <textarea id="cyb-content-description"></textarea>
      </div>
      
      <div><label><input type="checkbox" id="cyb-content-link-checkbox"> Link content</label></div>
      
      <div id="cyb-content-link-inputs" style="display: none;">
        <div>Keywords:</div>
        <textarea id="cyb-content-keywords"></textarea>
      </div>
    </div>
</div>`);
  modal.open();

  const linkCheckBox = document.getElementById('cyb-content-link-checkbox');
  linkCheckBox.addEventListener('change', event => {
    const linkCheckBoxInputs = document.getElementById('cyb-content-link-inputs');
    linkCheckBoxInputs.style.display = event.target['checked'] ? `block` : 'none';
  });
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

  let imgSrc = null;
  document.querySelectorAll('img').forEach(el => {
    el.addEventListener('mouseenter', () => {
      imgSrc = el.getAttribute('src');
      preventHide();
      const offset = getElOffset(el);
      buttonContainer.style.display = `block`;
      buttonContainer.style.top = `${offset.top}px`;
      buttonContainer.style.left = `${offset.left}px`;
      buttonContainer.style.bottom = `${offset.top + el.offsetHeight}px`;
      buttonContainer.style.right = `${offset.left + el.offsetWidth}px`;
    });
    el.addEventListener('mouseleave', () => {
      hide();
    });
  });

  button.addEventListener('mouseenter', () => {
    preventHide();
  });
  button.addEventListener('click', () => {
    hide();
    saveImage(imgSrc);
  });
  button.addEventListener('mouseleave', () => {
    hide();
  });

  document.body.addEventListener('click', () => {
    hide();
  });
});
