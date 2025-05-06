import { app, BrowserWindow, ipcMain, shell, TouchBar } from "electron";
const { TouchBarLabel, TouchBarButton, TouchBarSpacer } = TouchBar
import path from "path";
import Store from "electron-store";
import { encrypt, decrypt } from './src/crypto.js';
import contextMenu from 'electron-context-menu';
import { create } from "domain";



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
    try {
        if (loadencdata("id") != null && loadencdata("pw") != null) {
            e.sender.send('idpwloaded', [loadencdata("id"), loadencdata("pw")]);
            if (store.get('darkmode') == '0') {
                e.sender.send('turnoffdark');
            }
        }
        else {
            e.sender.send('idpwunk');
        }
    }
    catch {
        store.delete('id');
        store.delete('pw');
        console.log("Reset Complete")
        e.sender.send('idpwerr');
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
            color: '#ffffff88',
            symbolColor: '#00499d',
            height: 30,
        },
        fullscreenable: false,
        autoHideMenuBar: true,
        frame: false,
        trafficLightPosition: { x: 10, y: 10 },
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

    const touchBar = new TouchBar({
        items: [
            new TouchBarButton({label:'←',click: () => {
                win.webContents.send('goback');
            }}),
            new TouchBarButton({label:'→',click: () => {
                win.webContents.send('goforward');
            }}),
            new TouchBarButton({label:'새 탭',click: () => {
                win.webContents.send('newtab');
            }}),
            new TouchBarButton({label:'새로고침',click: () => {
                win.webContents.send('reload');
            }}),
            new TouchBarSpacer({size: "flexible"}),
            new TouchBarButton({label: '교과활동', click: () => {
                win.webContents.send('goto', '/portfolio.php?db=1551')
            }})
        ]
    });
    win.setTouchBar(touchBar);
    win.setWindowButtonVisibility(true);
    return win;
}

function createPopupWindow(url) {
    const win = new BrowserWindow({
        icon: "./src/favicon.png",
        width: 1030,
        height: 600,
        minWidth: 600,
        minHeight: 600
    });
    win.loadURL(url);

    const touchBar2 = new TouchBar({
        items: [
            new TouchBarButton({label:'닫기', backgroundColor:'#FF0000',click: () => {
                win.close()
            }})
        ]
    });
    win.setTouchBar(touchBar2);
}



app.whenReady().then(() => {
    createWindow();
    

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    app.on('browser-window-created', (event, window) => {
        const touchBar3 = new TouchBar({
            items: [
                new TouchBarButton({label:'닫기', backgroundColor:'#FF0000',click: () => {
                    window.close()
                }})
            ]
        });
        window.setTouchBar(touchBar3);
        if (true) {
            window.webContents.addListener("dom-ready", (e) => {
                if (window.webContents.getURL() == "https://dankook.riroschool.kr/lecture.php" || window.webContents.getURL().includes("pdfjs/web/viewer.html") || window.webContents.getURL().startsWith("https://dankook.riroschool.kr/itempool_test.php") || window.webContents.getURL().includes("my_page") || window.webContents.getURL().startsWith("https://dankook.riroschool.kr/WebEditor/index.php?") || window.webContents.getURL().startsWith("https://dankook.riroschool.kr/policy.php") || window.webContents.getURL().startsWith("https://dankook.riroschool.kr/board.php?action=stat_all") || window.webContents.getURL().includes("dict.naver.com/#/mini")) {
                    window.setMenuBarVisibility(false);
                }
                else if (window.webContents.getURL() == "https://dankook.riroschool.kr/home.php") {
                    window.close();
                }
                else {
                    shell.openExternal(window.webContents.getURL());
                    console.log(window.webContents.getURL());
                    window.close();
                }
            });
        }
    });

    app.on("web-contents-created", (e, contents) => { 
        if (contents.getType() == "webview") { 
            // set context menu in webview 
            contextMenu({
                window: contents,
                labels: {
                    learnSpelling: "사전에 추가",
                    searchWithGoogle: "Google 검색",
                    copyImage: "이미지 복사",
                    copyLink: "링크 복사",
                    inspect: "DevTools",
                    spellCheck: "맞춤법 검사",
                    cut: "잘라내기",
                    copy: "복사",
                    paste: "붙여넣기",
                },
                menu: (actions, props, browserWindow) => [
                    actions.copy(),
                    actions.cut(),
                    actions.paste(),
                    actions.separator(),
                    actions.copyImage(),
                    actions.copyLink(),
                    //  actions.inspect(),
                ],
                append: (defaultActions, parameters, browserWindow) => [
                    {
                        label: 'Google에서 {selection} 검색',
                        visible: parameters.selectionText.trim().length > 0,
                        click: () => {
                            shell.openExternal(`https://google.com/search?q=${encodeURIComponent(parameters.selectionText)}`);
                        }
                    },
                    {
                        label: '네이버 사전에서 {selection} 검색',
                        visible: parameters.selectionText.trim().length > 0,
                        click: () => {
                            createPopupWindow('https://en.dict.naver.com/#/mini/search?query='+parameters.selectionText)
                        }
                    }
                ]
            });
            contents.on('before-input-event', (event, input) => {
                if (input.control && input.key.toLowerCase() === 'r') {
                    event.preventDefault();
                    contents.reload();
                }
                else if (input.control && input.key.toLowerCase() === 'n' || input.control && input.key.toLowerCase() === 't') {
                    event.preventDefault();
                    console.log('newtab');
                    contents.hostWebContents.send('newtab')
                }
                else if (input.control && input.key.toLowerCase() === 'w') {
                    event.preventDefault();
                    console.log('newtab');
                    contents.hostWebContents.send('closetab')
                }
                else if (input.alt && input.code === 'ArrowLeft') {
                    event.preventDefault();
                    contents.navigationHistory.goBack();
                }
                
                else if (input.alt && input.code === 'ArrowRight') {
                    event.preventDefault();
                    contents.navigationHistory.goForward();
                }
                // console.log(input.code);
            })
        }
    });
});