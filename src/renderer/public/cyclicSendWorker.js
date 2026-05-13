let timers = {};
let isRunning = {};
let currentIndices = {};
let selectedIndicesMap = {};
let delaysMap = {};

self.onmessage = function(e) {
  const { type, delay, index, tabId, selectedIndices, delays } = e.data;

  if (type === 'start') {
    if (selectedIndices) {
      selectedIndicesMap[tabId] = selectedIndices;
    }
    if (delays) {
      delaysMap[tabId] = delays;
    }

    const indices = selectedIndicesMap[tabId] || [];
    if (indices.length === 0) return;

    const currentPos = indices.indexOf(index);
    let nextPos = currentPos + 1;
    if (nextPos >= indices.length) {
      nextPos = 0;
    }
    const nextIndex = indices[nextPos];
    const nextDelay = (delaysMap[tabId] || [])[nextPos] || 0;

    if (timers[tabId]) {
      clearTimeout(timers[tabId]);
    }
    isRunning[tabId] = true;
    currentIndices[tabId] = nextPos;

    timers[tabId] = setTimeout(() => {
      if (!isRunning[tabId]) return;
      self.postMessage({
        type: 'tick',
        index: nextIndex,
        tabId: tabId,
        timestamp: Date.now()
      });
    }, nextDelay);

  } else if (type === 'stop') {
    if (timers[tabId]) {
      clearTimeout(timers[tabId]);
      delete timers[tabId];
    }
    delete isRunning[tabId];
    delete currentIndices[tabId];
    delete selectedIndicesMap[tabId];
    delete delaysMap[tabId];

  } else if (type === 'stopAll') {
    for (const id in timers) {
      clearTimeout(timers[id]);
      delete timers[id];
      delete isRunning[id];
      delete currentIndices[id];
      delete selectedIndicesMap[id];
      delete delaysMap[id];
    }
  } else if (type === 'continue') {
    if (!isRunning[tabId]) return;

    const indices = selectedIndicesMap[tabId] || [];
    if (indices.length === 0) return;

    let nextPos = (currentIndices[tabId] || 0) + 1;
    if (nextPos >= indices.length) {
      nextPos = 0;
    }
    const nextIndex = indices[nextPos];
    const nextDelay = (delaysMap[tabId] || [])[nextPos] || 0;

    currentIndices[tabId] = nextPos;

    timers[tabId] = setTimeout(() => {
      if (!isRunning[tabId]) return;
      self.postMessage({
        type: 'tick',
        index: nextIndex,
        tabId: tabId,
        timestamp: Date.now()
      });
    }, nextDelay);
  }
};
