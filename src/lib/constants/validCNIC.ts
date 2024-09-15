import { config } from '../config';
import { Roles } from './roles';

export const cnicValidationMap = [
    {
        cnic: config.cnic.numberOne,
        assign: Roles.ADMIN
    },
    {
        cnic: config.cnic.numberTwo,
        assign: Roles.HPS
    },
    {
        cnic: config.cnic.numberThree,
        assign: Roles.HPS
    }
];

export const getRoleFromMap = (cnic: string): Roles => {
    const role = cnicValidationMap.find((item) => item.cnic === cnic);
    if (role) {
        return role.assign;
    }
    return Roles.READONLY;
};
