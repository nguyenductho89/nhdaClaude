let landscapeRequired = false;
let containerOriginalStyle = null;
let pendingResizeDispatch = null;

const FORCE_CLASS = 'force-landscape';
const PORTRAIT_CLASS = 'force-landscape-portrait';

const getBody = () => document.body || document.documentElement;
const getGameContainer = () => document.getElementById('game-container');
const isLandscape = () => window.innerWidth >= window.innerHeight;

const storeOriginalContainerStyle = (container) => {
  if (!container) {
    return;
  }

  if (containerOriginalStyle === null) {
    containerOriginalStyle = container.getAttribute('style');
  }
};

const restoreContainerStyle = (resetCache = false) => {
  const container = getGameContainer();
  if (!container) {
    if (resetCache) {
      containerOriginalStyle = null;
    }
    return;
  }

  if (containerOriginalStyle !== null) {
    if (containerOriginalStyle) {
      container.setAttribute('style', containerOriginalStyle);
    } else {
      container.removeAttribute('style');
    }
  } else {
    container.removeAttribute('style');
  }

  if (resetCache) {
    containerOriginalStyle = null;
  }
};

const applyPortraitLayout = () => {
  const container = getGameContainer();
  if (!container) {
    return;
  }

  storeOriginalContainerStyle(container);

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const style = container.style;
  style.position = 'absolute';
  style.top = '50%';
  style.left = '50%';
  style.width = `${vh}px`;
  style.height = `${vw}px`;
  style.transformOrigin = 'center center';
  style.transform = 'translate(-50%, -50%) rotate(90deg)';
  style.maxWidth = 'none';
  style.maxHeight = 'none';
  style.overflow = 'visible';
};

const updateOrientationState = () => {
  const body = getBody();
  if (!body) {
    return;
  }

  const container = getGameContainer();

  if (!landscapeRequired) {
    body.classList.remove(FORCE_CLASS);
    body.classList.remove(PORTRAIT_CLASS);
    restoreContainerStyle(true);
    return;
  }

  body.classList.add(FORCE_CLASS);

  if (!container) {
    return;
  }

  if (isLandscape()) {
    body.classList.remove(PORTRAIT_CLASS);
    restoreContainerStyle();
  } else {
    body.classList.add(PORTRAIT_CLASS);
    applyPortraitLayout();
  }
};

const scheduleSyntheticResizeEvent = () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (pendingResizeDispatch !== null) {
    return;
  }

  pendingResizeDispatch = window.requestAnimationFrame(() => {
    pendingResizeDispatch = null;
    window.dispatchEvent(new Event('resize'));
  });
};

const handleViewportChange = () => {
  updateOrientationState();
};

if (typeof window !== 'undefined') {
  window.addEventListener('orientationchange', () => {
    setTimeout(handleViewportChange, 200);
  });
  window.addEventListener('resize', handleViewportChange);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      handleViewportChange();
    }
  });
}

export const requireLandscapeOrientation = () => {
  landscapeRequired = true;
  updateOrientationState();
  scheduleSyntheticResizeEvent();
};

export const releaseLandscapeOrientation = () => {
  landscapeRequired = false;
  updateOrientationState();
  scheduleSyntheticResizeEvent();
};

export const refreshOrientationLayout = () => {
  updateOrientationState();
};

export const getLandscapeViewportSize = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  if (landscapeRequired && height > width) {
    return {
      width: height,
      height: width
    };
  }

  return { width, height };
};

export const isLandscapeOrientation = () => isLandscape();
