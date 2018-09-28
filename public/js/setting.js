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
    if(data.directEdit) $('#directEdit').prop('checked', true);
    
    task = data.task;
});


$('.btn').off('click');
$('.btn').on('click', function() {
    settingBtnSelect(this.id);
});

function settingBtnSelect(id){
    if(id == 'saveBtn'){
        
        let json = {
            port: $('#port').val(),
            directEdit: $('#directEdit').prop('checked'),
            task: task
        };
        
        storage.set('config.json', json, function (error) {
            if (error) throw error;
        });
        
        ipcRenderer.send('relaunch');
    }
}