
const { body } = require('express-validator');



const validateIsRequired = (values = [])=>values.map(value=> {
        let splitValue = values.toString().split(' ')
            return(
                body(value,
                    `${splitValue.length >1 ?splitValue[1]:value} is required`
                )
            )
    }
)  

module.exports = {
    validateIsRequired
}