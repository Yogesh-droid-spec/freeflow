export const pingClient = `
import User from 0xd64cbb21bf1c30ee
transaction(clientAddress:Address,endPoint:String) {
    prepare(acct: AuthAccount) {
      User.endPointGenerated(clientAddress: clientAddress, endPoint: endPoint)
    }
  }
  
`