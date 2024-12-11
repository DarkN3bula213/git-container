import { validateReq } from '@/lib/handlers/validate';
import Joi from 'joi';

const registerUser = Joi.object({
	email: Joi.string().required(),
	password: Joi.string().required(),
	name: Joi.string().required()
});

const login = Joi.object({
	email: Joi.string().required(),
	password: Joi.string().required()
});
// its the nano
const verifyEmail = Joi.object({
	code: Joi.string().required()
});

const fotgotPassword = Joi.object({
	email: Joi.string().required()
});

const verifyCode = Joi.object({
	code: Joi.string().required().length(6).pattern(/^\d+$/) // 6 digit number
});

export default {
	register: validateReq({
		body: registerUser
	}),
	login: validateReq({
		body: login
	}),
	verfify: validateReq({
		body: verifyEmail
	}),
	forgotPass: validateReq({
		body: fotgotPassword
	}),
	reissueEmail: validateReq({
		body: fotgotPassword
	}),
	verifyNewUser: validateReq({
		body: verifyCode
	}),
	resetPass: validateReq({
		body: Joi.object({
			password: Joi.string().required()
		}),
		params: Joi.object({
			token: Joi.string().required()
		})
	}),
	reissueToken: validateReq({
		body: Joi.object({
			email: Joi.string().email().required()
		})
	})
};
