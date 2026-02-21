const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getTasks: () => ipcRenderer.invoke('get-tasks'),
    addTask: (text, deadline) => ipcRenderer.invoke('add-task', text, deadline),
    toggleTask: (id) => ipcRenderer.invoke('toggle-task', id),
    deleteTask: (id) => ipcRenderer.invoke('delete-task', id),
    hideWindow: () => ipcRenderer.invoke('hide-window'),
    onWindowShown: (callback) => ipcRenderer.on('window-shown', callback)
});
