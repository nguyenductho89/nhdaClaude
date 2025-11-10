let landscapeRequired = false;
let containerOriginalStyle = null;
let pendingResizeDispatch = null;
let warningOverlay = null;
let orientationCallbacks = {
  onLandscape: null,
  onPortrait: null
};

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

const createWarningOverlay = () => {
  if (warningOverlay) return warningOverlay;

  warningOverlay = document.createElement('div');
  warningOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    padding: 20px;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  `;

  warningOverlay.innerHTML = `
    <div style="font-size: 64px; margin-bottom: 20px; animation: rotate-icon 2s infinite;">
      📱↻
    </div>
    <h2 style="font-size: 24px; margin-bottom: 10px; font-weight: bold;">
      Vui lòng xoay ngang màn hình
    </h2>
    <p style="font-size: 18px; color: rgba(255, 255, 255, 0.8);">
      Trò chơi được thiết kế tốt nhất ở chế độ landscape
    </p>
  `;

  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes rotate-icon {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(90deg); }
    }
  `;
  document.head.appendChild(style);

  return warningOverlay;
};

const showWarningOverlay = () => {
  const overlay = createWarningOverlay();
  if (!overlay.parentElement) {
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
  
  // Hide game container
  const container = getGameContainer();
  if (container) {
    container.style.visibility = 'hidden';
    container.style.pointerEvents = 'none';
  }
};

const hideWarningOverlay = () => {
  if (warningOverlay && warningOverlay.parentElement) {
    warningOverlay.style.display = 'none';
  }
  
  // Show game container - ensure it's fully visible
  const container = getGameContainer();
  if (container) {
    container.style.visibility = 'visible';
    container.style.pointerEvents = 'auto';
    container.style.opacity = '1';
    
    // Force a repaint to ensure visibility
    container.offsetHeight;
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
    hideWarningOverlay();
    return;
  }

  body.classList.add(FORCE_CLASS);

  if (!container) {
    return;
  }

  if (isLandscape()) {
    body.classList.remove(PORTRAIT_CLASS);
    restoreContainerStyle();
    hideWarningOverlay();
    
    // Ensure canvas is visible when switching to landscape
    const canvas = container.querySelector('canvas');
    if (canvas) {
      canvas.style.display = 'block';
      canvas.style.visibility = 'visible';
      canvas.style.opacity = '1';
    }
    
    // Trigger landscape callback
    if (orientationCallbacks.onLandscape) {
      orientationCallbacks.onLandscape();
    }
  } else {
    body.classList.add(PORTRAIT_CLASS);
    // Show warning overlay instead of rotating
    showWarningOverlay();
    
    // Trigger portrait callback
    if (orientationCallbacks.onPortrait) {
      orientationCallbacks.onPortrait();
    }
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

export const requireLandscapeOrientation = (callbacks = {}) => {
  landscapeRequired = true;
  orientationCallbacks.onLandscape = callbacks.onLandscape || null;
  orientationCallbacks.onPortrait = callbacks.onPortrait || null;
  updateOrientationState();
  scheduleSyntheticResizeEvent();
};

export const releaseLandscapeOrientation = () => {
  landscapeRequired = false;
  orientationCallbacks.onLandscape = null;
  orientationCallbacks.onPortrait = null;
  updateOrientationState();
  scheduleSyntheticResizeEvent();
  
  // Clean up warning overlay
  if (warningOverlay && warningOverlay.parentElement) {
    warningOverlay.parentElement.removeChild(warningOverlay);
    warningOverlay = null;
  }
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
