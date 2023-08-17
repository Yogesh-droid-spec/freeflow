const { app, BrowserWindow, ipcMain } = require('electron')
const electron = require('electron')
const path = require('path')
const child_process = require('child_process');
const dialog = electron.dialog;
const fs = require('fs');
const { spawnSync } = require('child_process');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      //preload: path.join(__dirname, 'preload.js'),
      contextIsolation:false,
      nodeIntegration:true
    }
  })

  win.loadURL('http://localhost:3000')
  //console.log('../build/index.html')
  //console.log(path.join(__dirname,'../','build/index.html'))
  // win.loadFile(path.join(__dirname,'../','build/index.html'))
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function execute(command, callback) {
  const child = child_process.exec(command, (error, stdout, stderr) => { 
      callback(stdout); 
  });
  // child.on('close', (code) => {
  //   //Here you can get the exit code of the script  
  //   console.log("closing")
  //   switch (code) {
  //       case 0:
  //           dialog.showMessageBox({
  //               title: 'Title',
  //               type: 'info',
  //               message: 'End process.\r\n'
  //           });
  //           break;
  //   }
  // })
};

function preprocess(){
  const pythonFilePath = 'hello.py';
const authtoken = '2RNUwo7HGjOrM9ZAVLDGr0cx6z1_7XbRkaNXjuRrPsviVnG18'; // Replace with your authtoken

// Read the content of the Python file
fs.readFile(pythonFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading Python file:', err);
    return;
  }

  // Append the ngrok related code to the content
  const modifiedContent = data + `
# main driver function
if __name__ == '__main__':
    from pyngrok import ngrok
    ngrok.set_auth_token('${authtoken}')
    tunnel = ngrok.connect(5000)
    print(tunnel)
  `;

  // Write the updated content back to the Python file
  fs.writeFile(pythonFilePath, modifiedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing to the Python file:', err);
    } else {
      console.log('Python file has been modified successfully.');
      // Now you can run the Python file using Python interpreter
      // For example, using Python3 on the command line:
      // spawnSync('python3', [pythonFilePath], { stdio: 'inherit' });
    }
  });
});
}

ipcMain.on('my-message',(e,message)=>{
  console.log("request received: ",message);
  const args = [message]
  execute(message,(output)=>{
    console.log(output);
    e.reply('my-reply',output);
  })

  //processing client-request data
  ipcMain.on('client-request',(event,data) => {
    var fileId = data.url;
    var commands = data.commands;
    var download = '$zipFile = "https://drive.google.com/uc?export=download&id="+fileId&&Invoke-WebRequest -Uri $zipFile -OutFile "tst.zip"';
    execute(download);
    var command = 'Expand-Archive -Path F:\tst.zip -DestinationPath F:\Extract -Verbose';
    execute(command);
    preprocess();
    ` `
  })
  // var child = child_process.spawn("dir", args, {
  //   encoding: 'utf8',
  //   shell: true
  // });
  // child.on('error', (error) => {
  //   dialog.showMessageBox({
  //       title: 'Title',
  //       type: 'warning',
  //       message: 'Error occured.\r\n' + error
  //   });
  // });
  // child.stdout.setEncoding('utf8');
  // child.stdout.on('data', (data) => {
  //     //Here is the output
  //     data=data.toString();   
  //     console.log(data);      
  // });

})
