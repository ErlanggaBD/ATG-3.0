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

// Firmware SlaveUDP (Arduino + W5100) memutus koneksi sendiri jika tidak ada
// paket masuk dalam 2000ms. Deteksi sisi desktop harus sedikit lebih santai:
// heartbeat dikirim tiap 1500ms, jadi jika 3x berturut-turut tanpa balasan,
// anggap koneksi putus.
const CONNECT_LOST_MS = 4500;
const HEARTBEAT_INTERVAL_MS = 1500;

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

function closeUdp() {
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
}

function createUdpSocket() {
  if (udpSocket) return udpSocket;

  udpSocket = dgram.createSocket('udp4');
  udpSocket.on('message', (message) => {
    const payload = message.toString('utf8').trim();
    if (!payload) return;
    udpLastRxAt = Date.now();
    // Firmware SlaveUDP membalas "online" saat menerima probe "response".
    if (!udpVerified && payload === 'online' && udpVerificationResolve) {
      const resolve = udpVerificationResolve;
      udpVerificationResolve = null;
      udpVerified = true;
      resolve(true);
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

function sendResponseProbe() {
  if (!udpSocket || !udpTarget) return;
  udpSocket.send('response', udpTarget.port, udpTarget.host, (error) => {
    if (error) sendHardwareLog('SYS', `UDP send error: ${error.message}`, 'ERR');
    else sendHardwareLog('TX', 'response', 'OK');
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

  sendResponseProbe();

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
      message: `Tidak ada balasan dari firmware Arduino di ${host}:${port}. Pastikan kabel Ethernet/WiFi terhubung dan IP-nya benar.`
    };
  }

  udpHeartbeat = setInterval(() => {
    sendResponseProbe();
    if (udpVerified && Date.now() - udpLastRxAt > CONNECT_LOST_MS) {
      sendHardwareLog('SYS', 'Koneksi ke firmware terputus (tidak ada balasan).', 'ERR');
      closeUdp();
      broadcastHardwareState(false);
    }
  }, HEARTBEAT_INTERVAL_MS);

  sendHardwareLog('SYS', `Terhubung ke firmware UDP ${host}:${port} (balasan 'online' diterima).`, 'OK');
  broadcastHardwareState(true);
  return { ok: true, connected: true, message: `Terhubung ke firmware Arduino ${host}:${port}` };
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
    title: 'Otomasi Pengujian ATG Horizontal',
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
