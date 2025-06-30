import { app, BrowserWindow, ipcMain, shell, TouchBar, Menu } from "electron";
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
        store.delete('encryption_key');
        console.log("Reset Complete")
        e.sender.send('idpwerr');
    }
});

ipc.on('resetidpw', (e, argument) => {
    store.delete('id');
    store.delete('pw');
    console.log("Reset Complete")
});

ipc.on('check-fullscreen-status', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (win) {
        e.sender.send('fullscreen-changed', win.isFullScreen());
    }
});

ipc.on('toggle-fullscreen', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (win) {
        win.setFullScreen(!win.isFullScreen());
    }
});

ipc.on('open-devtools', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (win) {
        if (win.webContents.isDevToolsOpened()) {
            win.webContents.closeDevTools();
        } else {
            win.webContents.openDevTools();
        }
    }
});

ipc.on('create-new-window', (e) => {
    createWindow();
});

ipc.on('close-window', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (win) {
        win.close();
    }
});

function createApplicationMenu() {
    const isMac = process.platform === 'darwin';
    
    const template = [
        // macOS에서는 앱 메뉴가 첫 번째
        ...(isMac ? [{
            label: app.getName(),
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { 
                    label: '전체화면',
                    accelerator: 'Cmd+Ctrl+F',
                    click: () => {
                        const focusedWindow = BrowserWindow.getFocusedWindow();
                        if (focusedWindow) {
                            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                        }
                    }
                },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }] : []),
        
        // 파일 메뉴
        {
            label: '파일',
            submenu: [
                {
                    label: '새 창',
                    accelerator: isMac ? 'Cmd+N' : 'Ctrl+N',
                    click: () => {
                        createWindow();
                    }
                },
                {
                    label: '창 닫기',
                    accelerator: isMac ? 'Cmd+W' : 'Ctrl+W',
                    click: () => {
                        const focusedWindow = BrowserWindow.getFocusedWindow();
                        if (focusedWindow) {
                            focusedWindow.close();
                        }
                    }
                },
                { type: 'separator' },
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },
        
        // 편집 메뉴
        {
            label: '편집',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                ...(isMac ? [
                    { role: 'pasteAndMatchStyle' },
                    { role: 'delete' },
                    { role: 'selectAll' }
                ] : [
                    { role: 'delete' },
                    { type: 'separator' },
                    { role: 'selectAll' }
                ])
            ]
        },
        
        // 보기 메뉴
        {
            label: '보기',
            submenu: [
                { 
                    label: '새로고침',
                    accelerator: isMac ? 'Cmd+R' : 'Ctrl+R',
                    click: () => {
                        const focusedWindow = BrowserWindow.getFocusedWindow();
                        if (focusedWindow) {
                            focusedWindow.webContents.send('reload');
                        }
                    }
                },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { 
                    label: '전체화면',
                    accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11',
                    click: () => {
                        const focusedWindow = BrowserWindow.getFocusedWindow();
                        if (focusedWindow) {
                            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                        }
                    }
                }
            ]
        },
        
        // 탐색 메뉴
        {
            label: '탐색',
            submenu: [
                {
                    label: '뒤로가기',
                    accelerator: isMac ? 'Cmd+Left' : 'Alt+Left',
                    click: () => {
                        const focusedWindow = BrowserWindow.getFocusedWindow();
                        if (focusedWindow) {
                            focusedWindow.webContents.send('goback');
                        }
                    }
                },
                {
                    label: '앞으로가기',
                    accelerator: isMac ? 'Cmd+Right' : 'Alt+Right',
                    click: () => {
                        const focusedWindow = BrowserWindow.getFocusedWindow();
                        if (focusedWindow) {
                            focusedWindow.webContents.send('goforward');
                        }
                    }
                }
            ]
        },
        
        // 창 메뉴
        {
            label: '창',
            submenu: [
                { role: 'minimize' },
                { role: 'close' },
                ...(isMac ? [
                    { type: 'separator' },
                    { role: 'front' },
                    { type: 'separator' },
                    { role: 'window' }
                ] : [
                    { role: 'close' }
                ])
            ]
        },
        
        // 도움말 메뉴
        {
            role: 'help',
            submenu: [
                {
                    label: '리로스쿨에 대해',
                    click: async () => {
                        await shell.openExternal('https://dankook.riroschool.kr');
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createWindow() {
    const win = new BrowserWindow({
        titleBarStyle: "hidden",
        titleBarOverlay: {
            color: '#ffffff88',
            symbolColor: '#00499d',
            height: 30,
        },
        fullscreenable: true,
        autoHideMenuBar: false,
        frame: false,
        trafficLightPosition: { x: 15, y: 14 },
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
    
    // 메인 창임을 표시하는 속성 추가
    win.isMainWindow = true;

    // webview에서 새 창 열기 요청 처리
    win.webContents.setWindowOpenHandler(({ url }) => {
        // 리로스쿨 관련 URL이거나 특정 도메인은 새 창에서 열기
        if (url.startsWith('https://dankook.riroschool.kr/') || 
            url.includes('pdfjs/web/viewer.html') || 
            url.includes('dict.naver.com')) {
            return {
                action: 'allow',
                overrideBrowserWindowOptions: {
                    width: 1030,
                    height: 600,
                    minWidth: 600,
                    minHeight: 600,
                    webPreferences: {
                        nodeIntegration: false,
                        contextIsolation: true
                    }
                }
            };
        } else {
            // 외부 사이트는 기본 브라우저에서 열기
            shell.openExternal(url);
            return { action: 'deny' };
        }
    });

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
            new TouchBarButton({label:'새 창',click: () => {
                createWindow();
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

    // 전체 화면 모드 이벤트 리스너 추가
    win.on('enter-full-screen', () => {
        win.webContents.send('fullscreen-changed', true);
    });

    win.on('leave-full-screen', () => {
        win.webContents.send('fullscreen-changed', false);
    });

    return win;
}

function createPopupWindow(url) {
    const win = new BrowserWindow({
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
    createApplicationMenu();
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
        
        // 메인 창 (index.html을 로드하는 창)인지 확인
        if (!window.isMainWindow) {
            window.webContents.addListener("dom-ready", (e) => {
                const currentURL = window.webContents.getURL();
                
                // 리로스쿨 관련 특정 페이지들은 창에서 열기
                if (currentURL == "https://dankook.riroschool.kr/lecture.php" || 
                    currentURL.includes("pdfjs/web/viewer.html") || 
                    currentURL.startsWith("https://dankook.riroschool.kr/itempool_test.php") || 
                    currentURL.includes("my_page") || 
                    currentURL.startsWith("https://dankook.riroschool.kr/WebEditor/index.php?") || 
                    currentURL.startsWith("https://dankook.riroschool.kr/policy.php") || 
                    currentURL.startsWith("https://dankook.riroschool.kr/board.php?action=stat_all") || 
                    currentURL.includes("dict.naver.com/#/mini") ||
                    currentURL.includes("index.html")) {
                    window.setMenuBarVisibility(true);
                }
                else if (currentURL == "https://dankook.riroschool.kr/home.php") {
                    window.close();
                }
                else {
                    // 기타 외부 사이트는 기본 브라우저에서 열기
                    shell.openExternal(currentURL);
                    console.log('외부 브라우저에서 열기:', currentURL);
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