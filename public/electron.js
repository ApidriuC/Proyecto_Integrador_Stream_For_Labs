const path = require("path");
const { app, BrowserWindow, ipcMain, dialog, Menu, Tray, net} = require("electron");
const { sync } = require("sync-files-cipher");
const fs = require("fs");
const Store = require("electron-store");
const store = new Store();
const isDev = require("electron-is-dev");
const https = require('https')

const SYNC_PATH_KEY = "sync-path";
const USERNAME_SYNC_PATH_KEY = "username";
const TOKEN_KEY = "msal-token";
const GATEWAY_URI = isDev
  ? "http://localhost:8000"
  : "https://streamsforlab.bucaramanga.upb.edu.co/gateway";

var win = null;
var watcher = null;
var tray = null;

// --- app ---
// electon check if exist a dir synced for stat to sync
const checkIfPathToSynExist = () => {
  const path = store.get(SYNC_PATH_KEY);
  if (path) {
    console.log("resume-sync");
    startToSync(path);
  }
};

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      allowpopups: true,
      nativeWindowOpen: true,
      enableRemoteModule: false, // turn off remote
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "icons/png/icon.png"),
  });

  if (isDev) {
    win.loadURL("http://localhost:3000");
  } else {
    win.loadURL("https://streamsforlab.bucaramanga.upb.edu.co");
  }
}

const creatCloseEvent = () => {
  win.on("close", (event) => {
    if (app.quitting) {
      win = null;
    } else {
      event.preventDefault();
      win.hide();
      createTray();
      return false;
    }
  });
};

app.whenReady().then(async () => {
  await createWindow();
  await creatCloseEvent();
});

app.on("before-quit", () => (app.quitting = true));

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    if (win) {
      win.show();
    } else {
      createWindow();
    }
  }
});

// --- utils ---
const sendError = (message) => {
  win.webContents.send("sync-error", message);
};

const startToSync = async (path) => {
  try {
    const username = await store.get(USERNAME_SYNC_PATH_KEY);

    watcher = await sync(
      path,
      async function (eventType, pathChanged) {
        console.log(eventType, pathChanged);

        // get type
        const type = getMymeTypeByExtension(eventType, pathChanged);

        // if change file
        if (eventType === "SYNC") {
          const weight = fs.statSync(pathChanged).size;
          const file = {
            path: `/home/streams-for-lab.co/${username}${pathChanged.replace(path, '')}`,
            name: pathChanged.split("/").pop(),
            weight,
            type,
            sync: true,
          };

          // Ad dato to database
          addFileToDataBase(file);

          // if remove file
        } else if (eventType === "REMOVE_FILE") {
          // remove dato from database
          const file = {
            type,
            path: `/home/streams-for-lab.co/${username}${pathChanged.replace(path, '')}`,
            name: pathChanged.split("/").pop(),
          }
          removeFileFromDataBase(file)
        } else if(eventType === "REMOVE_DIR"){
          win.webContents.send("sync-change", `The dir ${pathChanged.split("/").pop()} was removed`);
        } else if(eventType === "ADD_DIR"){
          win.webContents.send("sync-change", `The dir ${pathChanged.split("/").pop()} was synced`);
        }
      },

      function (error) {
        console.log(error);
        sendError("An error occurred while syncing: ", error.message);
      },
      `/home/streams-for-lab.co/${username}`,
      9090,
      "207.248.81.157"
    );

    // catch any error
  } catch (error) {
    console.log(error);
    sendError(error.message);
  }
};

const getMymeTypeByExtension = (eventType, pathChanged) => {
  const imageExtensions = ["png", "jpeg", "gif"];
  let type = "file";

  if (!eventType.includes("DIR")) {
    const extension = pathChanged.split(".").pop().toLocaleLowerCase();
    if (imageExtensions.includes(extension)) type = "photo";
    if (extension === "mp4") type = "video";
  }

  console.log("Paht: ", pathChanged, " Type: ", type);
  return type;
};

const createTray = () => {
  if (!tray) {
    tray = new Tray(path.join(__dirname, "icons/png/icon.png"));
    const contextMenu = Menu.buildFromTemplate([
      { label: "Show", click: () => win.show() },
      { label: "Close", click: () => app.quit() },
    ]);
    tray.setToolTip("Streams for labs");
    tray.setContextMenu(contextMenu);
  }
};

const addFileToDataBase = async (file) => {
  const token = await store.get(TOKEN_KEY);
  const requestApi = {
    method: 'POST',
    headers: {'Authorization': `Bearer ${token}`, 'Content-Type' : 'application/json' },
    url: `${GATEWAY_URI}/api/file/sync`,
    httpsAgent: new https.Agent({   
      rejectUnauthorized: false
    })
  }

  const request = net.request(requestApi);
  request.on('response', res => { 
    if (res.statusCode !== 200) {
      sendError("Save file to db error: " + res.statusCode)
    }else {
      win.webContents.send("sync-change", `The file ${file.name} was synced`);
    }
   });

  request.write(JSON.stringify(file))
  request.end();
};



const removeFileFromDataBase = async (file) => {
  const token = await store.get(TOKEN_KEY);

  let targetService = 'file'
  if(file.type === 'photo') targetService = 'photo'
  else if(file.type === 'video') targetService = 'video'

  const requestApi = {
    method: 'DELETE',
    headers: {'Authorization': `Bearer ${token}`, 'Content-Type' : 'application/json' },
    url: `${GATEWAY_URI}/api/${targetService}/sync`,
    httpsAgent: new https.Agent({   
      rejectUnauthorized: false
    })
  }

  const request = net.request(requestApi);
  request.on('response', res => { 
    if (res.statusCode !== 200) {
      sendError("Remove file from db error: " + res.statusCode)
    }else {
      win.webContents.send("sync-change", `The file ${file.name} was removed`);
    }
   });

  request.write(JSON.stringify({ pathToRemove: file.path }))
  request.end();
};

// ---- IPC ----
ipcMain.on("start-sync", async (event, username) => {
  paths = dialog.showOpenDialogSync(win, {
    title: "Select a directory to sync",
    buttonLabel: "Select folder",
    properties: ["openDirectory"],
  });

  if (paths) {
    await store.set(SYNC_PATH_KEY, paths[0].replace(/\\/g, '/'));
    await store.set(USERNAME_SYNC_PATH_KEY, username);
    startToSync(paths[0].replace(/\\/g, '/'));
    event.sender.send("sync-success-dir", paths[0].replace(/\\/g, '/'));
  }else{
    event.sender.send("sync-success-dir", paths);
  }
  
});

ipcMain.on("resume-sync", async (event, arg) => {
  checkIfPathToSynExist();
});

// remove sync path
ipcMain.on("desynchronize", async (event, arg) => {
  watcher
    .close()
    .then(async () => {
      await store.delete(SYNC_PATH_KEY);
      await store.delete(USERNAME_SYNC_PATH_KEY);
     event.sender.send("desynchronize-success", null);
    })
    .catch((err) => sendError("Close watcher error: ", err.message));
});

ipcMain.on("sync-offline", async (event, arg) => {
  watcher
    .close()
    .then(async () => {
     event.sender.send("desynchronize-success", null);
    })
    .catch((err) => sendError("Close watcher error: ", err.message));
});

// get path sync if exiots and send to react sync section
ipcMain.on("get-path-syncronized", (event, arg) => {
  const path = store.get(SYNC_PATH_KEY);
  if (path) event.sender.send("path-syncronized", path);
});

ipcMain.on("set-auth", async (event, token) => {
  await store.set(TOKEN_KEY, token);
});
