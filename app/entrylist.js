const entrylist = {
    addCar: (data) => {
        list.push(data)
    },
    addDriverToCar: (data) => {
        console.log(data)
    },
    getEntrylist: () => {
        return list;
    },
    /** 
    *Returns a the full entry of a car 
    *@param {string} teamName of the team in verbatim
    **/
    getCarByTeamName: (teamName) => {
        for (i in list) {
            if(list[i].teamName === teamName) {
                return list[i]
            }
        }
        return {'err': 'Not Found'};
    }, 
    /** 
    *Returns a the full entry of a car 
    *@param {number} carId
    **/
    getCarById: (carId) => {
        for (i in list) {
            if(list[i].carId === carId) {
                return list[i]
            }
        }
        return {'err': 'Not Found'};
    }
}

let list = []
module.exports = entrylist;