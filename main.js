// メインプロセス

// アプリケーション作成用のモジュールを読み込み
const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const electron = require('electron');
const { NodeMediaServer } = require('node-media-server');

const reportUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdn0O0E6c_ykV0kkguqiPlISwJT06yjH_U4pUx02iqb54tkeA/viewform?usp=pp_url&entry.566470570="+app.getName()+"&entry.870996473="+app.getVersion();

ipcMain.on('serverStart', (event, arg) => {
    serverStart(arg);
//    event.sender.send('asynchronous-reply', 'pong')
})

ipcMain.on('serverStop', (event, arg) => {
    nms.stop();
})

ipcMain.on('relaunch', (event, arg) => {
    app.exit();
    app.relaunch();
})

//console.log(app.getPath('userData'));

var nms;


// メインウィンドウ
let mainWindow,setWindow;

function createWindow() {
	// メインウィンドウを作成します
    
	mainWindow = new BrowserWindow({
		width: 500,
		height: 300,
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
        mainWindow.show()
    })
}

function onExit() {
	app.quit();
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

function initMenu(){
    const template = [{
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
     ]},
	{
        label: 'ヘルプ',
		role: 'help',
		submenu: [{
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

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});




function serverStart(task){
    
    var config = {
        rtmp: {
            port: 1935,
            chunk_size: 60000,
            gop_cache: true,
            ping: 60,
            ping_timeout: 30
        },
        relay: {
            ffmpeg: __dirname+'/ffmpeg/ffmpeg',
            tasks: task
        }
    };
    
    nms = new NodeMediaServer(config)
    
    nms.run();
    
}

