const { ipcRenderer } = require('electron');

function save(key, value) {
    ipcRenderer.send('save', [key, value]);
}

// function load(key) {
//     return ipcRenderer.sendSync('load', key);
// }

function openExternal(url) {
    ipcRenderer.send('extUrl', url);
}

function loadidpw() {
    ipcRenderer.send('loadidpw');
}

ipcRenderer.on('idpwloaded', (e, argument) => {
    pgbar.value = 20;
    login(argument[0], argument[1]);
});

function resetidpw() {
    ipcRenderer.send('resetidpw');
}

ipcRenderer.on('idpwunk', (e) => {
    document.querySelector("#logininputs").style.display = 'block';
    pgbar.style.display = 'none';
});

ipcRenderer.on('idpwerr', (e) => {
    document.querySelector("#logininputs").style.display = 'block';
    document.querySelector(".loginerror").style.display = 'block';
    pgbar.style.display = 'none';
});

ipcRenderer.on('turnoffdark', () => {
    isdark = 0;
})


ipcRenderer.on('newwindow', (e) => {
    newWindow()
})

ipcRenderer.on('closewindow', (e) => closeWindow());

ipcRenderer.on('reload', (e) => {
    document.querySelectorAll("webview")[currenttab].reload();
})

ipcRenderer.on('goback', () => {
    document.querySelectorAll("webview")[currenttab].goBack();
})

ipcRenderer.on('goforward', () => {
    document.querySelectorAll("webview")[currenttab].goForward();
})

ipcRenderer.on('goto', (e, argument) => {
    document.querySelectorAll("webview")[currenttab].setAttribute('src', 'https://dankook.riroschool.kr' + argument)
})

// 전체 화면 모드 변경 시 헤더 표시/숨김 처리
ipcRenderer.on('fullscreen-changed', (e, isFullscreen) => {
    const header = document.querySelector('.header');
    const dragarea = document.querySelector('.dragarea');
    const newwindowBtn = document.querySelector('.newwindow-btn');
    const splitBtn = document.querySelector('.split-btn');
    
    if (isFullscreen) {
        header.style.display = 'none';
        dragarea.style.display = 'none';
    } else {
        header.style.display = 'block';
        dragarea.style.display = 'block';
    }
});

// 초기 전체 화면 상태 확인 함수
function checkInitialFullscreenStatus() {
    ipcRenderer.send('check-fullscreen-status');
}

// 전체화면 토글 함수
function toggleFullscreen() {
    ipcRenderer.send('toggle-fullscreen');
}

// 개발자 도구 열기 함수
function openDevTools() {
    ipcRenderer.send('open-devtools');
}

// 새 창 함수
function newWindow() {
    ipcRenderer.send('create-new-window');
}

// 창 닫기 함수
function closeWindow() {
    ipcRenderer.send('close-window');
}

// 전역으로 함수들 노출
window.checkInitialFullscreenStatus = checkInitialFullscreenStatus;
window.toggleFullscreen = toggleFullscreen;
window.openDevTools = openDevTools;
window.newWindow = newWindow;
window.closeWindow = closeWindow;
window.resetidpw = resetidpw;
window.save = save;
window.loadidpw = loadidpw;
window.openExternal = openExternal;