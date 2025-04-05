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
    login(argument[0], argument[1]);
});

function resetidpw() {
    ipcRenderer.send('resetidpw');
}