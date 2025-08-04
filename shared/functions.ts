const randomNumber = () => {return (Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))};

export function generateUniqueID(array: any[]) {
    let ID = randomNumber();

    while (array.some(elem => elem.ID == ID))
        ID = randomNumber();
    return (ID);
}