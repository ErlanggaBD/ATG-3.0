const { app, BrowserWindow, shell, session, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const dgram = require('node:dgram');

const isDevelopment = !app.isPackaged;
const rendererUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:3000';
const calibrationFile = () => path.join(app.getPath('userData'), 'last-calibration.json');
let udpSocket = null;
let udpTarget = null;
let udpHeartbeat = null;
let udpVerified = false;
let udpLastRxAt = 0;
let udpVerificationResolve = null;

// Firmware Basic_Test_UDP (Arduino + W5100) membalas ping "y" dengan "OK".
// Firmware memproses paket UDP di dalam loop gerak (serviceEvents), jadi
// ping tetap dibalas selama motor bergerak; E-STOP 's' pun langsung diproses.
const CONNECT_LOST_MS = 4500;
const HEARTBEAT_INTERVAL_MS = 1500;

let lastMoveAt = 0;

// Perintah yang membuat firmware sibuk bergerak (blocking) hingga selesai
// atau bertemu limit/E-STOP. Dipakai untuk menandai beban gerak & respon done.
const MOVE_PREFIXES = ['@', '+', '-', 'x', '%', '#'];

function isMoveCommand(payload) {
  const p = String(payload).trim();
  if (!p) return false;
  return MOVE_PREFIXES.some((prefix) => p.startsWith(prefix));
}

function sendHardwareLog(direction, payload, status = 'OK') {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send('hardware-log', { direction, payload, status });
  });
}

function broadcastHardwareState(connected) {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send('hardware-state', { connected });
  });
}

function sendBestEffortStop() {
  if (!udpSocket || !udpTarget) return;
  try {
    // Firmware Basic_Test_UDP: 's' = emergency stop, memotong loop gerak.
    udpSocket.send('s', udpTarget.port, udpTarget.host, () => {});
  } catch {
    // Socket may already be closing; firmware keeps stepping only until
    // the running command finishes, otherwise no reliable stop path.
  }
}

function closeUdp() {
  sendBestEffortStop();
  if (udpHeartbeat) {
    clearInterval(udpHeartbeat);
    udpHeartbeat = null;
  }
  if (udpSocket) {
    udpSocket.close();
    udpSocket = null;
  }
  if (udpVerificationResolve) {
    udpVerificationResolve(false);
    udpVerificationResolve = null;
  }
  udpTarget = null;
  udpVerified = false;
  lastMoveAt = 0;
}

function createUdpSocket() {
  if (udpSocket) return udpSocket;

  udpSocket = dgram.createSocket('udp4');
  udpSocket.on('message', (message) => {
    const payload = message.toString('utf8').trim();
    if (!payload) return;
    udpLastRxAt = Date.now();
    // Firmware Basic_Test_UDP: verifikasi koneksi adalah balasan "OK" untuk ping "y".
    if (!udpVerified && payload === 'OK' && udpVerificationResolve) {
      const resolve = udpVerificationResolve;
      udpVerificationResolve = null;
      udpVerified = true;
      resolve(true);
    }
    // Respon "..._DONE" / "OK" / "ACK" menandakan gerakan selesai → gerakan
    // berikutnya tidak lagi mendapat masa tenggang.
    if (payload.endsWith('_DONE') || payload === 'OK' || payload === 'ACK') {
      lastMoveAt = 0;
    }
    sendHardwareLog('RX', payload, 'OK');
  });
  udpSocket.on('error', (error) => {
    sendHardwareLog('SYS', `UDP error: ${error.message}`, 'ERR');
    closeUdp();
    broadcastHardwareState(false);
  });
  return udpSocket;
}

function sendPingProbe() {
  if (!udpSocket || !udpTarget) return;
  udpSocket.send('y', udpTarget.port, udpTarget.host, (error) => {
    if (error) sendHardwareLog('SYS', `UDP send error: ${error.message}`, 'ERR');
    else sendHardwareLog('TX', 'y', 'OK');
  });
}

ipcMain.handle('hardware-connect', async (_event, config) => {
  closeUdp();
  const socket = createUdpSocket();
  const host = String(config.host);
  const port = Number(config.port);
  const timeoutMs = Number(config.timeoutMs) || 3000;
  udpTarget = { host, port };
  udpVerified = false;

  await new Promise((resolve, reject) => {
    socket.bind(0, (error) => (error ? reject(error) : resolve()));
  });

  const verification = new Promise((resolve) => {
    udpVerificationResolve = resolve;
  });

  sendPingProbe();

  const verified = await Promise.race([
    verification,
    new Promise((resolve) => setTimeout(() => resolve(false), timeoutMs))
  ]);

  if (!verified) {
    closeUdp();
    sendHardwareLog('SYS', `Tidak ada balasan dari firmware di ${host}:${port}.`, 'ERR');
    return {
      ok: false,
      connected: false,
      message: `Tidak ada balasan 'OK' dari firmware Arduino UDP di ${host}:${port}. Pastikan kabel Ethernet terhubung dan IP-nya benar.`
    };
  }

  udpHeartbeat = setInterval(() => {
    sendPingProbe();
    if (udpVerified && Date.now() - udpLastRxAt > CONNECT_LOST_MS) {
      sendHardwareLog('SYS', 'Koneksi ke firmware terputus (tidak ada balasan).', 'ERR');
      closeUdp();
      broadcastHardwareState(false);
    }
  }, HEARTBEAT_INTERVAL_MS);

  sendHardwareLog('SYS', `Terhubung ke firmware UDP ${host}:${port} (balasan 'OK' diterima).`, 'OK');
  broadcastHardwareState(true);
  return { ok: true, connected: true, message: `Terhubung ke firmware Arduino UDP ${host}:${port}` };
});

ipcMain.handle('hardware-disconnect', () => {
  closeUdp();
  broadcastHardwareState(false);
  sendHardwareLog('SYS', 'Koneksi UDP diputus.', 'INFO');
  return { ok: true, connected: false };
});

ipcMain.handle('hardware-send', async (_event, payload) => {
  if (!udpSocket || !udpTarget) {
    return { ok: false, message: 'Belum terhubung ke firmware.' };
  }

  const message = String(payload);
  await new Promise((resolve, reject) => {
    udpSocket.send(message, udpTarget.port, udpTarget.host, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
  if (isMoveCommand(message)) {
    lastMoveAt = Date.now();
  }
  if (message === 's') {
    // E-STOP: firmware memotong loop gerak; tidak ada masa tenggang lagi.
    lastMoveAt = 0;
  }
  sendHardwareLog('TX', message, 'OK');
  return { ok: true };
});

function saveCalibration(data) {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(calibrationFile(), JSON.stringify(data, null, 2), 'utf8');
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0a0c10',
    show: false,
    autoHideMenuBar: true,
    title: 'ATG-3.0',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDevelopment) {
    void window.loadURL(rendererUrl);
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    void window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.on('desktop-close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });
  ipcMain.handle('load-last-calibration', () => {
    try {
      return JSON.parse(fs.readFileSync(calibrationFile(), 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  });
  ipcMain.on('save-last-calibration-sync', (event, data) => {
    saveCalibration(data);
    event.returnValue = true;
  });

  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  closeUdp();
  if (process.platform !== 'darwin') app.quit();
});