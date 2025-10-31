let landscapeRequired = false;

const getBody = () => document.body || document.documentElement;

const isLandscape = () => window.innerWidth >= window.innerHeight;

const updateWarningState = () => {
  const body = getBody();
  if (!body) {
    return;
  }

  if (landscapeRequired && !isLandscape()) {
    body.classList.add('show-landscape-warning');
  } else {
    body.classList.remove('show-landscape-warning');
  }
};

const handleViewportChange = () => {
  updateWarningState();
};

if (typeof window !== 'undefined') {
  window.addEventListener('orientationchange', () => {
    // Use a slight delay to allow viewport values to settle after rotation
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
  updateWarningState();
};

export const releaseLandscapeOrientation = () => {
  landscapeRequired = false;
  updateWarningState();
};

export const isLandscapeOrientation = () => isLandscape();
