
const {GoogleSpreadsheet} =  require('google-spreadsheet');

const googleSpreadSheet = async()=>{
        
    const sheet = new GoogleSpreadsheet('1zv6XqkmkNqBz0EqW7iMTY3_9l8PUVUo90fju14-qIIc');

    await sheet.useServiceAccountAuth({
        private_key:process.env['GOOGLE_SERVICE_ACC_PK']?.replace(/\\n/g, "\n"),
        client_email:process.env['GOOGLE_SERVICE_ACC_EMAIL']
    });

    const sheetInfo = await sheet.loadInfo();

    console.log('google-sheet-info',sheetInfo,sheet.title);

    const sheet1 = sheet?.sheetsByTitle['Mailboxes'];

    const new_row = await sheet1.addRow({
        'Nickname AKA Alias':'Dayvvo2',
        'Given_First_Name':'Damilola',
        'Family_Last_Name':'Ademola'
    })

    console.log('new row',new_row)

}


module.exports = {
    googleSpreadSheet
}
