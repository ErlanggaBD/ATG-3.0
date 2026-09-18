const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopApp', {
  isDesktop: true,
  close: () => ipcRenderer.send('desktop-close'),
  loadLastCalibration: () => ipcRenderer.invoke('load-last-calibration'),
  saveLastCalibration: (data) => ipcRenderer.sendSync('save-last-calibration-sync', data),
  connectHardware: (config) => ipcRenderer.invoke('hardware-connect', config),
  disconnectHardware: () => ipcRenderer.invoke('hardware-disconnect'),
  sendHardware: (payload) => ipcRenderer.invoke('hardware-send', payload),
  onHardwareLog: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('hardware-log', listener);
    return () => ipcRenderer.removeListener('hardware-log', listener);
  },
  onHardwareState: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on('hardware-state', listener);
    return () => ipcRenderer.removeListener('hardware-state', listener);
  }
});
