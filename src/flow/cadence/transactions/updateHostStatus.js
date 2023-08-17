export const updateHostStatus = `
import HostContract from 0xd64cbb21bf1c30ee

transaction(activeStatus:Bool){
    prepare(currentUser: AuthAccount){
        HostContract.changeHostStatus(address: currentUser.address, activeStatus: activeStatus)
    }
}
`