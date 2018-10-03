// レンダラープロセス
const {ipcRenderer} = require('electron');
const storage = require('electron-json-storage');

ipcRenderer.send('getPlatform');

ipcRenderer.on('receivePlatform', (event, arg) => {
    if(arg != 'darwin') $('header').remove();
});

ipcRenderer.on('console', (event, arg) => {
    logAppend(arg);
});

var currentPort = 1935,
    directEdit,chunk_size,gop_cache,ping,ping_timeout;

storage.get('config.json', function (error, data) {
    if (error) throw error;

    chunk_size = data.chunk_size;
    gop_cache = data.gop_cache;
    ping = data.ping;
    ping_timeout = data.ping_timeout;
    directEdit = data.directEdit;
    
    if (Object.keys(data).length === 0) configInit(); // 初回起動時
    else if(!data.chunk_size) { // v1.1.1未満のconfigを修復
        var json = { port: data.port, chunk_size: 60000, gop_cache: true, ping: 60, ping_timeout: 30, directEdit: data.directEdit, task: data.task };
        storage.set('config.json', json, function (error) {
            if (error) throw error;
            rendererlogAppend('config repair');
            ipcRenderer.send('relaunch');
        });
    } else if(data.directEdit) {
        $('.tab-group').html('');
        $('.pane-group').html('<textarea id="directEditer">'+JSON.stringify(data.task)+'</textarea>');
    } else {
        // データがあるときの処理
        if(data.port != currentPort) {
            currentPort = data.port;
            
            for(var i=0;i<2;i++) {
                let text = $('input#streamUrl').eq(i).val();   $('input#streamUrl').eq(i).val(text.replace('localhost','localhost:'+data.port));
            }
        }
        
        var cnt = [];
        var taskCnt = data.task.length;
        
        for(var i=0;i<taskCnt;i++) {
            if(cnt[data.task[i].app]) cnt[data.task[i].app].push(data.task[i].edge);
            else{
                cnt[data.task[i].app]=[];
                cnt[data.task[i].app].push(data.task[i].edge);
            }
        }
        
        for(var i=1;i<6;i++) {
            
            if(cnt['live'+i]){
                var liveCnt = cnt['live'+i].length;
                
                for(var j=1;j<liveCnt+1;j++) {

                    if(j == 1) $('#addStream0'+i+' #pushStream').eq(j-1).val(cnt['live'+i][j-1]);
                    
                    if(liveCnt >= 2){
                        if( j >= 2){
                            $('#addStream0'+i).append('<br><input id="pushStream" type="text" value="'+cnt['live'+i][j-1]+'" placeholder="Stream URL / Key" style="width: 100%;">');
                        }
                        
                    } else {
                        $('#addStream0'+i+' #pushStream').eq(j-1).val(cnt['live'+i][j-1]);
                    }           
                }
            }
        }
    }
});

tabEvent();
btnEvent();

function btnEvent() {
    $('.btn').off('click');
    $('.btn').on('click', function() {
        buttonSelect(this.id);
    });

    $('#addUrl').off('click');
    $('#addUrl').on('click', function() {
        let tabNo = $('div.tab-item').length+1;

        if (tabNo <= 5){
            $('.tab-group').append('<div class="tab-item" id="tab'+tabNo+'"><span class="icon icon-cancel icon-close-tab" id="tab'+tabNo+'"></span><span id="tabAppName">live'+tabNo+'</span></div>');

            tabEvent();
        }
    });
}

function tabEvent() {
    $('.icon-close-tab').off('click');
    $('.icon-close-tab').on('click', function() {
        $('div#'+this.id).remove();
        btnEvent();
    });
        
    $('.tab-item').off('click');
    $('.tab-item').on('click', function() {
        $(".tab-item").removeClass("active");
        $("#"+this.id).toggleClass("active");
        
        $('.main-border').css('display','none');
        $('.'+this.id+'html').css('display','block');
        
        btnEvent();
    });
}

function buttonSelect(id){
    
    if (id.slice(0,-5) == "addStream"){
        $('#'+id.slice(0,-3)).append('<br><input id="pushStream" type="text" value="" placeholder="Stream URL / Key" style="width: 100%;">');
    }
    
    if (id == "refreshBtn"){
        saveConfig();
        ipcRenderer.send('relaunch');
    }
        
    if (id == "startBtn"){
        serverStart();
        $('#startBtn').css('display','none');
        $('#stopBtn').css('display','block');
    }
    
    if (id == "stopBtn"){
        ipcRenderer.send('serverStop');
        
        $('#stopBtn').css('display','none');
        $('#startBtn').css('display','block');
        
        tabEvent();
    }
}

function saveConfig() {
    
    let task = [];
    
    if($('#directEditer').length) {
        task = JSON.parse( $('#directEditer').val() );
        console.log(task);
        
    } else {
        for(var i=1;i<3;i++) {
            let tabName = "tab"+i+"html";
            let appName = $('div.'+tabName).attr('app-name');
            let name = $('div.'+tabName+' #streamKey').val();
            let streamCnt = $('div.'+tabName+' #pushStream').length;

            for(var j=0;j<streamCnt;j++){
                let edge = $('div.'+tabName+' #pushStream').eq(j).val();
                if (edge) {
                    rendererlogAppend('appName:'+appName+' edge:'+edge+' name:'+name);
                    task.push({app: appName, mode: 'push', edge: edge});
                }
            }
        }
    }
    
    var json = {
        port: currentPort,
        chunk_size: chunk_size,
        gop_cache: gop_cache,
        ping: ping,
        ping_timeout: ping_timeout,
        directEdit: directEdit,
        task: task
    };
    
    storage.set('config.json', json, function (error) {
        if (error) throw error;
    });
    
    return json;
}

function serverStart(){
    ipcRenderer.send('serverStart', saveConfig());
}

function configInit() {
    var json = {
        port: 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 60,
        ping_timeout: 30,
        directEdit: false,
        task: []
    };
    
    storage.set('config.json', json, function (error) {
        if (error) throw error;
        rendererlogAppend('config initialization');
    });
}

function rendererlogAppend(text){
    let d = new Date();
    let month = parseInt(d.getMonth())+1;
    text = '['+d.getFullYear()+'/'+month+'/'+d.getDate()+' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()+'] '+text;
    logAppend(text);
}

function logAppend(text){
    console.log(text);
    $('#logTextArea').append(text+'\n');
}
