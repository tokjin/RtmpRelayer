// メインプロセス
console.log = function(t,i,c,m) {
    let text;
    if(m) text = '['+t+'] '+m;
    else {
        let d = new Date();
        text = '['+d.getFullYear()+'/'+d.getMonth()+1+'/'+d.getDate()+' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds()+'] '+t;
    }
    
    mainWindow.webContents.send('console', text);
}

const { app, BrowserWindow, Menu, ipcMain, dialog, net } = require('electron');
const electron = require('electron');
const { NodeMediaServer } = require('node-media-server');

const reportUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdn0O0E6c_ykV0kkguqiPlISwJT06yjH_U4pUx02iqb54tkeA/viewform?usp=pp_url&entry.566470570="+app.getName()+"&entry.870996473="+app.getVersion();

var nms;
var mainWindow,setWindow;

ipcMain.on('serverStart', (event, task, port) => {
    serverStart(task, port);
});

ipcMain.on('serverStop', (event, arg) => {
    nms.stop();
});

ipcMain.on('getPlatform', (event, arg) => {
    event.sender.send('receivePlatform', process.platform);
});

ipcMain.on('relaunch', (event, arg) => {
    app.exit();
    app.relaunch();
});

app.on('ready', createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});


function createWindow() {
    
	mainWindow = new BrowserWindow({
		width: 500,
		height: 350,
		titleBarStyle: 'hidden',
		acceptFirstMouse: true,
        show: false,
	});
    
	mainWindow.loadFile('public/index.html');
    initMenu();
//	mainWindow.webContents.openDevTools(); // デベロッパーツールの起動

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
    
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        console.log('mainWindows.show');
    })
}

function settingWindow() {

    setWindow = new BrowserWindow({
		width: 500,
		height: 300,
		titleBarStyle: 'hidden',
		acceptFirstMouse: true,
        show: false,
	});
    
    setWindow.loadFile('public/setting.html');
//    setWindow.webContents.openDevTools();
    
    setWindow.on('closed', () => {
		setWindow = null;
	});
    
    setWindow.once('ready-to-show', () => {
        setWindow.show()
        mainWindow.hide();
    })    
}

function onExit() {
	app.quit();
}

function initMenu(){
    if(process.platform == 'darwin') {
        var template = [{
            label: 'ファイル',
            submenu: [{
                    label: 'このソフトについて',
                    selector: "orderFrontStandardAboutPanel:"
                },{
                    type: 'separator'
                },{
                    label: '設定',
                    click: settingWindow
                },{
                    type: 'separator'
                },{
                    label: '終了',
                    accelerator: "CmdOrCtrl+Q",
                    click: onExit
                }
            ]
        }, {
         label: "編集",
         submenu: [
             { label: "取り消し", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
             { label: "やり直し", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
             { type: "separator" },
             { label: "カット", accelerator: "CmdOrCtrl+X", selector: "cut:" },
             { label: "コピー", accelerator: "CmdOrCtrl+C", selector: "copy:" },
             { label: "ペースト", accelerator: "CmdOrCtrl+V", selector: "paste:" },
             { label: "全て選択", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
         ]},{
            label: 'ヘルプ',
            role: 'help',
            submenu: [{
                    label: '更新をチェックする',
                    click: updateCheck
                },{
                type: 'separator'
                },{
                    label: '問題の報告...',
                    click() {
                        electron.shell.openExternal(reportUrl);
                    }
                },{
                type: 'separator'
                },{
                    label: 'とかい育ち のホームページ',
                    click() {
                        electron.shell.openExternal('https://tokaisodachi.com')
                    }
                },{
                    label: 'Twitterで とかい育ち をフォロー',
                    click() {
                        electron.shell.openExternal('https://twitter.com/jintokai')
                    }
                }]
            }
        ]
    } else {
        var template = [{
            label: 'ファイル',
            submenu: [{
                    label: '設定',
                    click: settingWindow
                },{
                    type: 'separator'
                },{
                    label: '終了',
                    accelerator: "CmdOrCtrl+Q",
                    click: onExit
                }
            ]
        },{
            label: 'ヘルプ',
            role: 'help',
            submenu: [{
                    label: '更新をチェックする',
                    click: updateCheck
                },{
                type: 'separator'
                },{
                    label: '問題の報告...',
                    click() {
                        electron.shell.openExternal(reportUrl);
                    }
                },{
                type: 'separator'
                },{
                    label: 'とかい育ち のホームページ',
                    click() {
                        electron.shell.openExternal('https://tokaisodachi.com')
                    }
                },{
                    label: 'Twitterで とかい育ち をフォロー',
                    click() {
                        electron.shell.openExternal('https://twitter.com/jintokai')
                    }
                }]
            }
        ]
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function serverStart(task, port){ 
    
    if (process.platform !== 'darwin') var fileName = 'ffmpeg.exe';
    else var fileName = 'ffmpeg';

    var config = {
        rtmp: {
            port: parseInt(port),
            chunk_size: 60000,
            gop_cache: true,
            ping: 60,
            ping_timeout: 30
        },
        relay: {
            ffmpeg: __dirname+'/ffmpeg/'+fileName,
            tasks: task
        }
    };
    
    nms = new NodeMediaServer(config)
    nms.run();
}

function updateCheck(){
    console.log('updateCheck.start');

    const request = net.request('https://api.github.com/repos/tokjin/RtmpRelayer/releases/latest')
    request.on('response', (response) => {
        let body = '';
        response.on('data', (chunk) => {
            body += chunk;
        })
        response.on('end', () => {
            console.log('updateCheck.end');
            let gitJson = JSON.parse(body);
            let latestVer = gitJson.tag_name;
            let currentVer = 'v'+app.getVersion();
            
            if(latestVer == currentVer){
                var options = {
                    type: 'info',
                    title: 'there are no updates.',
                    message: "お使いのバージョンは最新のものです。\n("+currentVer+")",
                    buttons: ['完了']
                }
                dialog.showMessageBox(options);
                
            } else {
                var options = {
                    type: 'info',
                    title: 'a new update is now available.',
                    message: "新しいバージョンが見つかりました。\n\nダウンロードページを開きますか？\n("+currentVer+" → "+latestVer+")",
                    buttons: ['Yes', 'No']
                }
                dialog.showMessageBox(options, function(i) {
                    console.log('dialog.button: '+i);
                    if(!i) electron.shell.openExternal('https://github.com/tokjin/RtmpRelayer/releases/latest');
                })
            }
        })
    })
    
    request.end()
}
