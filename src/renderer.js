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