import * as fcl from "@onflow/fcl";
import * as types from '@onflow/types';
import React, {useEffect, useState} from 'react'
import {updateHostStatus} from './flow/cadence/transactions/updateHostStatus'
import {pingClient} from './flow/cadence/transactions/pingClient'
import { getBalance } from './flow/cadence/scripts/getBalance';


import { Paper,Divider,List,ListItem,ListItemButton,ListItemText,Box, AppBar, CssBaseline, Drawer, IconButton, Toolbar, Typography, Button, Experimental_CssVarsProvider  } from '@mui/material';
import TextField from '@mui/material/TextField';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import MenuIcon from '@mui/icons-material/Menu';




import Background from './utils/lecture.png'

import './utils/index.css'
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const { ipcRenderer } = window.require('electron');

fcl.config({
  "app.detail.title":"Decentralized Hosting",
  "app.detail.icon":"https://i.imgur.com/ux3lYB9.png",
  "accessNode.api":"https://rest-testnet.onflow.org",
  "discovery.wallet":"https://fcl-discovery.onflow.org/testnet/authn",
  "0xDeployer":"0xd64cbb21bf1c30ee",
})

const drawerWidth = 240;
const navItems = ['About', 'Services', 'Contact'];

function App(props) {
  const { window } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };
  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        MUI
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item} disablePadding>
            <ListItemButton  sx={{ textAlign: 'center' }}>
              <ListItemText primary={item} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
  const container = window !== undefined ? () => window().document.body : undefined;

    const [balance,setBalance] = useState(0);
    const [user,setUser] = useState({loggedIn:false})
    const [clientUser,setClientUser] = useState()
    const [fileUrl,setFileUrl] = useState("")
    const [commands,setCommands] = useState([])
    const [endPoint,setEndPoint] = useState("")
    const hostAddressChangedEvent = "A.d64cbb21bf1c30ee.User.hostAddressChanged"
    const stopHostingEvent = "A.d64cbb21bf1c30ee.User.stopHostProcess"
    const [message,setMessage] = useState("Set Active Status")
    const login = () => {
      fcl.authenticate()
      fcl.currentUser().subscribe(setUser);
    }

    

    const logout = () => {
      fcl.unauthenticate();
    }
    useEffect(()=>{
      if (user && user.addr){
        console.log("fetch balance, user.addr",user.addr)
        getBal();
      }
    },[user])
    async function getBal(){
      console.log("get balance called")
      const result = await fcl.send([
        fcl.script(getBalance),
        fcl.args([
          fcl.arg(user.addr,types.Address)
        ])
      ]).then( fcl.decode);
      console.log(result);
      setBalance(result);
    }
    async function setStatus(){
      console.log("set status called")
      setMessage("Waiting for client request");
      const transactionId = await fcl.send([
        fcl.transaction(updateHostStatus),
        fcl.args([
          fcl.arg(true,types.Bool)
        ]),
        fcl.payer(fcl.currentUser),
        fcl.proposer(fcl.currentUser),
        fcl.authorizations([fcl.currentUser]),
        fcl.limit(9999)
      ]).then(fcl.decode)
      // .then((res)=> 
      //   console.log(res) // <- also gives transaction id
      // )
      console.log("transaction id : ",transactionId);
    }
    useEffect(()=>{
      if (user && user.addr){
        console.log("useEffect, adding listener")
        // const latestBlock = await fcl.send([
        //   fcl.getBlock(true)
        // ]).then(fcl.decode)
        // console.log(latestBlock.height)
        // if (latestBlock){
        //   console.log("hi");
        // }
        fcl.events(hostAddressChangedEvent).subscribe((eventData)=>{
          console.log(eventData);
          if (eventData.target_address===user.addr){
            setMessage("client request received");
            console.log("Data fetched success")
            setClientUser(eventData.my_address)
            setFileUrl(eventData.fileUrl)
            setCommands(eventData.commands)
            console.log("Client address : ",eventData.my_address)
            console.log("file url: ",eventData.fileUrl)
            console.log("commands: ",eventData.commands)
            // make function call instead
            executeCommands(eventData.my_address,eventData.fileUrl,eventData.commands)
            // unsubscribe this event
            unSubHostChangedEvent();
            // subscribe stop hosting
            subscribeStopHosting();
          }else{
            console.log("not my request")
          }
          //
        })
        setStatus()
      }
    },[user])

    function subscribeStopHosting(){
      console.log("listening for stopHosting")
      fcl.events(stopHostingEvent).subscribe((eventData)=>{
        setMessage("Client request to stop hosting")
        console.log(eventData)
        if (eventData.hostAddress===user.addr){
          console.log("I should stop hosting")
          // stop hosting
        }
      })
    }
    function unSubHostChangedEvent(){
      
    }
    async function stopHosting(){
      const transactionId = await fcl.send([
        fcl.transaction(updateHostStatus),
        fcl.args([
          fcl.arg(false,types.Bool)
        ]),
        fcl.payer(fcl.currentUser),
        fcl.proposer(fcl.currentUser),
        fcl.authorizations([fcl.currentUser]),
        fcl.limit(9999)
      ]).then(fcl.decode)
      // .then((res)=> 
      //   console.log(res) // <- also gives transaction id
      // )
      console.log("transaction id : ",transactionId);
    }
    function executeCommands(client_addr,file_url,commands){
      console.log("\nexecuting commands\n")
      setMessage("Executing Commands");
      //sending url file through the channel
      var data = {url:fileUrl,commands:commands};
      ipcRenderer.send('client-request',data);
      setTimeout(5000);

        let end_point = "https://f53a-103-201-134-66.ngrok-free.app"
        setEndPoint(end_point)
        sendEndPoint(client_addr,end_point)
    }

    function sendEndPoint(client_addr,end_point){
      console.log("End point Generated: ",end_point,"\n")
      setMessage("Pinging Client")
      const transactionId = fcl.send([
        fcl.transaction(pingClient),
        fcl.args([
          fcl.arg(client_addr,types.Address),
          fcl.arg(end_point,types.String)
        ]),
        fcl.payer(fcl.currentUser),
        fcl.proposer(fcl.currentUser),
        fcl.authorizations([fcl.currentUser]),
        fcl.limit(9999)
      ]).then(fcl.decode).then((res)=>{
        setMessage("End point given success: "+end_point)
        console.log("pinged client success : tId: ",res)
      });
    }

  return (
    <div>
      
      {
      user && user.addr ? (
        <Box >
        <CssBaseline />
        <AppBar component="nav" style={{backgroundColor:'#333333'}}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
            >
              FreeFlow
            </Typography>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Button key="Account" sx={{ color: '#fff' }}>{user.addr}</Button>
                <Button key="Balance" sx={{ color: '#fff' }}>{balance}&nbsp; <MonetizationOnIcon/> &nbsp;</Button>
                <Button onClick={logout} key="logout" variant='contained' sx={{ color: '#fff' }}>log out</Button>
            </Box>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ p: 3 ,textAlign:'center'}} style={{ backgroundImage: `url(${Background})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh', width: '100vw' }}>
          <br/><br/>
          <br/><br>
          </br><br/><br/><br/>
          <Typography variant='h4'>{message}</Typography>
        </Box>
      </Box>
      ) : (
        <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar component="nav" style={{backgroundColor:'#6BCB77'}}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block',color:'#000000',fontWeight:'bold' } }}
          >
            FreeFlow
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            {navItems.map((item) => (
              <Button key={item} sx={{ color: '#000000',fontWeight:'bold' }}>
                {item}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav">
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ p: 3 ,textAlign:'center'}} style={{ backgroundImage: `url(${Background})`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh', width: '100vw' }}>
        <Toolbar />
        <Box m={7} pt={10} style={{ marginTop: 'auto' }}>
          <Typography className='title' style={{fontSize:'150px'}} variant="h1" gutterBottom ></Typography>
          <Typography className='heading' fontWeight={'bold'} variant="subtitle1" style={{color:'#6BCB77',fontSize:'30px'}}>
            A Decentralized Hosting Platform...
          </Typography>
          <br/>
          <div>
          <div style={{ position: 'absolute', bottom: '30px', width: '100%' }}>
          <Button onClick={login}  style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)' }}>
          <button className="button-64" role="button" ><span className="text">Get Started as Host</span></button>
          </Button>
        </div>
          </div>
        </Box>
      </Box>
    </Box>
      )
      } 
    </div>
  )
}

export default App