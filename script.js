
const progressBar = document.getElementById("scrollProgress");

// Update the reading progress as the visitor scrolls.
function updateScrollProgress() {
  const scrollable =
    document.documentElement.scrollHeight - window.innerHeight;

  const progress =
    scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;

  progressBar.style.width = `${progress}%`;
}

window.addEventListener("scroll", updateScrollProgress, {
  passive: true
});

updateScrollProgress();

// Reveal sections smoothly when they enter the viewport.
const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          currentObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -35px 0px"
    }
  );

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("visible"));
}


// Film-frame navigation: only frame-triggered navigation starts the 10-second return timer. Manual scrolling cancels it.
const filmFrameLinks = Array.from(document.querySelectorAll('.film-frames .film-frame[href^="#"]'));
const filmSelector = document.getElementById('journey');
let frameReturnTimer = null;
let selectedFilmFrame = null;

function cancelFrameReturnOnManualNavigation() {
  if (frameReturnTimer !== null) {
    window.clearTimeout(frameReturnTimer);
    frameReturnTimer = null;
  }
}

// If the visitor takes over with a manual scroll, do not pull them back to the reel.
['wheel', 'touchstart', 'pointerdown'].forEach(type => {
  window.addEventListener(type, cancelFrameReturnOnManualNavigation, { passive: true });
});
window.addEventListener('keydown', event => {
  if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
    cancelFrameReturnOnManualNavigation();
  }
});

filmFrameLinks.forEach((link, index) => {
  if (index === filmFrameLinks.length - 1) link.classList.add('future-frame');
  link.addEventListener('click', event => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;

    if (frameReturnTimer !== null) window.clearTimeout(frameReturnTimer);
    selectedFilmFrame = link;
    link.classList.add('film-selected', 'is-active');

    // Close burgundy curtains, move to the selected chapter behind them, then reveal it.
    const curtain = document.getElementById('cinemaCurtain');
    const frameIndex = filmFrameLinks.indexOf(link);
    if (typeof window.rollFilmToFrame === 'function') window.rollFilmToFrame(frameIndex);
    window.history.replaceState(null, "", link.getAttribute('href'));
    if (curtain) {
      curtain.classList.add('active');
      requestAnimationFrame(() => curtain.classList.add('closed'));
    }
    window.setTimeout(() => {
      const targetTop = target.getBoundingClientRect().top + window.scrollY - 18;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'instant' });
      target.classList.add('visible');
      if (curtain) {
        curtain.classList.remove('closed');
        window.setTimeout(() => curtain.classList.remove('active'), 1470);
      }
    }, 1470);

    frameReturnTimer = window.setTimeout(() => {
      filmSelector?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      frameReturnTimer = null;
    }, 10000);
  });
});

// Mark a chapter as seen only when its section actually enters the reading area.
// GyanSys (#future) is deliberately excluded because it represents the next chapter.
const chapterFramePairs = filmFrameLinks
  .map(link => ({ link, target: document.querySelector(link.getAttribute('href')) }))
  .filter(item => item.target && item.link.getAttribute('href') !== '#future');

// Vertical film rails give every chapter its own portrait-oriented film frame.
chapterFramePairs.forEach(({ target }) => {
  target.classList.add('chapter-film');
  ['left', 'right'].forEach(side => {
    const rail = document.createElement('span');
    rail.className = `chapter-film-rail chapter-film-rail-${side}`;
    rail.setAttribute('aria-hidden', 'true');
    target.appendChild(rail);
  });
});

function markChapterSeen(pair) {
  if (!pair.target.classList.contains('chapter-seen')) {
    pair.target.classList.add('chapter-color-developing');
    window.setTimeout(() => pair.target.classList.remove('chapter-color-developing'), 1100);
  }
  pair.link.classList.add('is-seen');
  pair.target.classList.add('chapter-seen');
}

if ('IntersectionObserver' in window) {
  const seenChapterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const pair = chapterFramePairs.find(item => item.target === entry.target);
      if (pair) markChapterSeen(pair);
    });
  }, {
    threshold: 0.03,
    // A chapter counts as seen when even a small, real part enters the main reading area.
    rootMargin: '-4% 0px -12% 0px'
  });
  chapterFramePairs.forEach(({ target }) => seenChapterObserver.observe(target));
} else {
  // Fallback for browsers without IntersectionObserver.
  const checkVisibleChapters = () => {
    chapterFramePairs.forEach(pair => {
      const rect = pair.target.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.82 && rect.bottom > window.innerHeight * 0.08) {
        markChapterSeen(pair);
      }
    });
  };
  window.addEventListener('scroll', checkVisibleChapters, { passive: true });
  checkVisibleChapters();
}

// Bidirectional film movement: the vertical sprocket rails roll with the page direction.
let previousScrollY = window.scrollY;
let scrollDirection = 'down';
let directionTicking = false;
function updateChapterFilmDirection() {
  const currentY = window.scrollY;
  if (Math.abs(currentY - previousScrollY) > 1) {
    scrollDirection = currentY < previousScrollY ? 'up' : 'down';
    document.documentElement.classList.toggle('film-scroll-up', scrollDirection === 'up');
    document.documentElement.classList.toggle('film-scroll-down', scrollDirection === 'down');
    previousScrollY = currentY;
  }
  directionTicking = false;
}
window.addEventListener('scroll', () => {
  if (!directionTicking) {
    window.requestAnimationFrame(updateChapterFilmDirection);
    directionTicking = true;
  }
}, { passive: true });
document.documentElement.classList.add('film-scroll-down');

// Interactive portfolio project frames.
const dialog = document.getElementById("projectDialog");
const dialogTitle = document.getElementById("dialogTitle");
const dialogStack = document.getElementById("dialogStack");
const dialogDescription = document.getElementById("dialogDescription");
const dialogClose = document.getElementById("dialogClose");

function openProject(card) {
  dialogTitle.textContent = card.dataset.title;
  dialogStack.textContent = card.dataset.stack;
  dialogDescription.textContent = card.dataset.description;

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  }
}

document.querySelectorAll(".project-card").forEach((card) => {
  card.addEventListener("click", () => openProject(card));

  card.addEventListener("keydown", (event) => {
    if (
      (event.key === "Enter" || event.key === " ") &&
      event.target === card
    ) {
      event.preventDefault();
      openProject(card);
    }
  });
});

dialogClose.addEventListener("click", () => dialog.close());

// Clicking outside the project dialog closes it.
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    dialog.close();
  }
});


// Rolling vintage film strip: the entire strip travels horizontally like film passing through a projector.
const filmTrack = document.querySelector('.film-frames');
const filmStrip = document.querySelector('.film-strip');
const filmWindow = document.querySelector('.film-window');
if (filmTrack && filmStrip && filmWindow) {
  const frames = Array.from(filmTrack.querySelectorAll('.film-frame'));
  const arrows = document.querySelectorAll('.film-slider-arrow');
  let activeIndex = 0;
  let wheelAccumulator = 0;
  let wheelCooldown = false;
  let dragStartX = null;
  let dragStartIndex = 0;
  let dragging = false;
  let suppressClick = false;

  filmTrack.classList.add('is-rolling');
  filmTrack.setAttribute('aria-label', 'Rolling vintage film strip of portfolio chapters');

  const reelTitle = document.querySelector('.reel-current-title');
  const reelProgress = document.querySelector('.reel-progress span');

  function renderStrip(animate = true) {
    const frame = frames[activeIndex];
    if (!frame) return;
    if (reelTitle) reelTitle.innerHTML = `FRAME ${String(activeIndex + 1).padStart(3, '0')} <i>/ ${String(frames.length).padStart(3, '0')}</i>`;
    if (reelProgress) reelProgress.style.width = `${((activeIndex + 1) / frames.length) * 100}%`;
    filmStrip.classList.add('is-projecting');
    window.clearTimeout(filmStrip._projectionTimer);
    filmStrip._projectionTimer = window.setTimeout(() => filmStrip.classList.remove('is-projecting'), 1250);
    const frameCenter = frame.offsetLeft + frame.offsetWidth / 2;
    const offset = Math.max(0, Math.min(
      frameCenter - filmWindow.clientWidth / 2,
      filmTrack.scrollWidth - filmWindow.clientWidth
    ));
    filmTrack.style.setProperty('--film-offset', `${-offset}px`);
    filmTrack.classList.toggle('no-roll-transition', !animate);
    frames.forEach((item, index) => {
      item.classList.toggle('film-selected', index === activeIndex);
      item.setAttribute('aria-current', index === activeIndex ? 'true' : 'false');
    });
    window.setTimeout(() => filmTrack.classList.remove('no-roll-transition'), 30);
  }

  function moveStrip(direction, animate = true) {
    activeIndex = (activeIndex + direction + frames.length) % frames.length;
    renderStrip(animate);
  }

  window.rollFilmToFrame = function(index) {
    if (!Number.isInteger(index) || index < 0 || index >= frames.length) return;
    activeIndex = index;
    renderStrip();
  };

  arrows.forEach(button => {
    button.addEventListener('click', () => moveStrip(button.dataset.slide === 'next' ? 1 : -1));
    button.setAttribute('aria-label', button.dataset.slide === 'next' ? 'Roll film forward' : 'Roll film backward');
  });

  // Mouse wheel rolls the film strip one frame at a time. Native page scrolling is preserved outside it.
  filmStrip.addEventListener('wheel', event => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(delta) < 12 || wheelCooldown) return;
    event.preventDefault();
    moveStrip(delta > 0 ? 1 : -1);
    wheelCooldown = true;
    window.setTimeout(() => { wheelCooldown = false; }, 380);
  }, { passive: false });

  // Drag the film left/right like pulling a strip through a projector.
  filmWindow.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    dragStartX = event.clientX;
    dragStartIndex = activeIndex;
    dragging = true;
    suppressClick = false;
    filmWindow.classList.add('is-dragging');
    // Do not capture the pointer on the viewport: pointer capture retargets the click
    // away from the anchor and prevents the chapter link from firing.
  });
  filmWindow.addEventListener('pointermove', event => {
    if (!dragging || dragStartX === null) return;
    const delta = event.clientX - dragStartX;
    if (Math.abs(delta) > 10) {
      suppressClick = true;
      const step = Math.round(delta / Math.max(160, frames[0].offsetWidth * 0.72));
      activeIndex = Math.max(0, Math.min(frames.length - 1, dragStartIndex - step));
      renderStrip(false);
    }
  });
  ['pointerup', 'pointercancel'].forEach(name => filmWindow.addEventListener(name, () => {
    dragging = false;
    dragStartX = null;
    filmWindow.classList.remove('is-dragging');
    if (suppressClick) window.setTimeout(() => { suppressClick = false; }, 80);
  }));

  filmTrack.addEventListener('click', event => {
    const frame = event.target.closest('.film-frame');
    if (!frame) return;
    if (suppressClick) {
      event.preventDefault();
      suppressClick = false;
      return;
    }
    const index = frames.indexOf(frame);
    if (index >= 0) {
      activeIndex = index;
      renderStrip();
      // The navigation handler above performs the chapter jump on the very same tap.
    }
  });

  filmTrack.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault(); moveStrip(1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault(); moveStrip(-1);
    }
  });

  window.addEventListener('resize', () => renderStrip(false));
  requestAnimationFrame(() => renderStrip(false));
}

