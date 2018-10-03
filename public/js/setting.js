const {ipcRenderer} = require('electron');
const storage = require('electron-json-storage');

ipcRenderer.send('getPlatform');

ipcRenderer.on('receivePlatform', (event, arg) => {
    if(arg != 'darwin') $('header').remove();
});

let task = [];

storage.get('config.json', function (error, data) {
    if (error) throw error;
    
    $('#port').val(data.port);
    $('#chunkSize').val(data.chunk_size);
    $('#ping').val(data.ping);
    $('#pingTimeout').val(data.ping_timeout);
    if(data.gop_cache) $('#gopCache').prop('checked', true);
    if(data.directEdit) $('#directEdit').prop('checked', true);
    
    task = data.task;
});


$('.btn').off('click');
$('.btn').on('click', function() {
    settingBtnSelect(this.id);
});

function settingBtnSelect(id){
    
    if(id == 'canselBtn') ipcRenderer.send('relaunch');
    if(id == 'resetBtn') saveConfig({port: 1935, chunk_size: 60000, gop_cache: true, ping: 60, ping_timeout: 30, directEdit: false, task: []});
    if(id == 'saveBtn'){
        let json = {
            port: parseInt($('#port').val()),
            chunk_size: parseInt($('#chunkSize').val()),
            gop_cache: $('#gopCache').prop('checked'),
            ping: parseInt($('#ping').val()),
            ping_timeout: parseInt($('#pingTimeout').val()),
            directEdit: $('#directEdit').prop('checked'),
            task: task
        };
        saveConfig(json);
    }
}

function saveConfig(json){
    storage.set('config.json', json, function (error) {
        if (error) throw error;
    });
        
    ipcRenderer.send('relaunch');
}