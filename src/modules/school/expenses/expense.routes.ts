import { Router } from 'express';
import * as controller from './expense.controller';
import { RouteMap } from '@/types/routes';
import { setRouter } from '@/lib/utils/utils';
const router = Router()




const getRouteMap = ():RouteMap[] => {
    return [
        {
            path: '/',
            method: 'post',
            handler: controller.createExpense,
        },
        {
            path: '/',
            method: 'get',
            handler: controller.getExpenses,
        },
        {
            path: '/id/:id',
            method: 'get',
            handler: controller.getExpense,
        },
        {
            path: '/id/:id',
            method: 'put',
            handler: controller.updateExpense,
        },
        {
            path: '/id/:id',
            method: 'delete',
            handler: controller.deleteExpense,
        },

    ]
}


setRouter(router, getRouteMap())

export default router 