// filepath: c:\Users\jimmy\OneDrive\문서\Riroschool\main.js
import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "path";
import Store from "electron-store";
import { encrypt, decrypt } from './src/crypto.js';

const ipc = ipcMain;
const store = new Store();

ipc.on('extUrl', (e, argument) => {
    shell.openExternal(argument);
});

ipc.on('save', (e, argument) => {
    const { encryptedData, iv } = encrypt(argument[1]); // 암호화
    store.set(argument[0], { encryptedData, iv }); // 암호화된 데이터와 IV 저장
    console.log(`${argument[0]} saved securely.`);
});

function loadencdata(key) {
    const data = store.get(key);
    if (data) {
        const decrypted = decrypt(data.encryptedData, data.iv); // 복호화
        return decrypted;
    } else {
        return null;
    }
}

ipc.on('loadidpw', (e, argument) => {
    if (loadencdata("id") != null && loadencdata("pw") != null) {
        e.sender.send('idpwloaded', [loadencdata("id"), loadencdata("pw")]);
    }
});

ipc.on('resetidpw', (e, argument) => {
    store.delete('id');
    store.delete('pw');
    console.log("Reset Complete")
});

function createWindow() {
    const win = new BrowserWindow({
        icon: "./src/favicon.png",
        titleBarStyle: "hidden",
        titleBarOverlay: {
            color: '#ffffff00',
            symbolColor: '#02499b',
            height: 30,
        },
        autoHideMenuBar: true,
        frame: false,
        webPreferences: {
            webviewTag: true,
            nodeIntegration: true,
            contextIsolation: false
        },
        width: 1030,
        height: 600,
        minWidth: 600,
        minHeight: 600
    });
    win.loadFile("index.html");

    // win.webContents.setWindowOpenHandler(({ url }) => {
    //     shell.openExternal(url);
    //     console.log('asdf');
    //     return { action: 'deny' };
    // });
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    app.on('browser-window-created', (event, window) => {
        window.webContents.addListener("dom-ready", (e) => {
            if (window.webContents.getURL().includes("pdfjs/web/viewer.html")) {
                window.setMenuBarVisibility(false);
                window.setIcon('./src/favicon.png');
            }
            else if (window.webContents.getURL().includes("my_page")) {
                window.setMenuBarVisibility(false);
                window.setIcon('./src/favicon.png');
            }
            else if (window.webContents.getURL() == "https://dankook.riroschool.kr/home.php") {
                window.close();
            }
            else if (window.webContents.getURL().startsWith("https://dankook.riroschool.kr/itempool_test.php")) {
                window.setMenuBarVisibility(false);
                window.setIcon('./src/favicon.png');
            }
            else {
                shell.openExternal(window.webContents.getURL());
                console.log(window.webContents.getURL());
                window.close();
            }
        });
    })
});