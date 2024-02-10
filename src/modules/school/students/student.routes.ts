import { Router } from "express";

import * as controller from './student.controller'

import * as schema from './student.schema'

import { validate } from "@/lib/handlers/validate";

const router = Router();



router.route('/').post(validate(schema.insterOne), controller.createStudent);