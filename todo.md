
export const handleWebRTC = (socket: Socket, io: Server) => {
	const logEvent = (event: string, fromUserId: string, toUserId: string) => {
		// Log to console as well for now
		console.log(
			`WebRTC Event: ${event}, From: ${fromUserId}, To: ${toUserId}`
		);
		logger.info(`WebRTC Event: ${event}`, { fromUserId, toUserId });
	};
	const handleError = (event: string, error: Error) => {
		// Log error to console
		console.error(`Error in ${event}:`, error);
		logger.error(`Error in ${event}`, {
			error: error.message,
			stack: error.stack
		});
	};
 

	socket.on('video-offer', ({ toUserId, signal }) => {
		console.log('Sending video offer to:', toUserId);
		console.log(signal, 'signal');
		io.to(toUserId).emit('video-answer', {
			from: socket.data.userId,
			signal
		});
	});
 
	socket.on(
		'video-answer',
		({ toUserId, signal }: { toUserId: string; signal: any }) => {
			emitMessage(io, {
				receivers: [toUserId],
				event: 'video-answer',
				payload: { fromUserId: socket.data.userId, signal }
			});
			logEvent('Video answer sent', socket.data.userId, toUserId);
		}
	);

	socket.on('reject-call', ({ toUserId }: { toUserId: string }) => {
		try {
			const fromUserId = socket.data.userId as string;
			emitMessage(io, {
				receivers: [toUserId],
				event: 'call-rejected',
				payload: { fromUserId }
			});
			logEvent('Call rejected', fromUserId, toUserId);
		} catch (error) {
			handleError('reject-call', error as Error);
		}
	});
 

	socket.on('initiate-call', ({ toUserId }: { toUserId: string }) => {
		try {
			const fromUserId = socket.data.userId as string;
			emitMessage(io, {
				receivers: [toUserId],
				event: 'incoming-call',
				payload: { fromUserId }
			});
			logEvent('Call initiated', fromUserId, toUserId);
		} catch (error) {
			handleError('initiate-call', error as Error);
		}
	});


	socket.on('accept-call', ({ toUserId }: { toUserId: string }) => {
		try {
			const fromUserId = socket.data.userId as string;
			emitMessage(io, {
				receivers: [toUserId],
				event: 'call-accepted',
				payload: { fromUserId }
			});
			logEvent('Call accepted', fromUserId, toUserId);
		} catch (error) {
			handleError('accept-call', error as Error);
		}
	});


	socket.on('end-call', ({ toUserId }: { toUserId: string }) => {
		try {
			const fromUserId = socket.data.userId as string;
			emitMessage(io, {
				receivers: [toUserId],
				event: 'call-ended',
				payload: { fromUserId }
			});
			logEvent('Call ended', fromUserId, toUserId);
		} catch (error) {
			handleError('end-call', error as Error);
		}
	});

	 
};

export type Student = Document & {
	name: string;
	registration_no: string;
	classId: IClass['_id'];
	className: IClass['className'];
	section: IClass['section'][number];
	tuition_fee: IClass['fee'];
};

const schema = new Schema<IClass>(
	{
		className: {
			type: Schema.Types.String,
			enum: [
				'Nursery',
				'Prep',
				'1st',
				'2nd',
				'3rd',
				'4th',
				'5th',
				'6th',
				'7th',
				'8th',
				'9th',
				'10th'
			],
			trim: true,

			unique: true,
			required: true
		},
		section: {
			type: [Schema.Types.String],
			required: true
		},
		fee: {
			type: Schema.Types.Number,
			required: true
		},
		subjects: {
			type: [classSubjectSchema],
			required: true
		},
		classTeacher: {
			type: {
				teacherId: {
					type: Schema.Types.ObjectId,
					ref: 'Teacher'
				},
				teacherName: {
					type: Schema.Types.String
				}
			}
		}
	},
	{
		timestamps: true,
		versionKey: false
	}
);

export interface IPayment extends mongoose.Document {
	studentId: mongoose.Schema.Types.ObjectId;
	classId: mongoose.Schema.Types.ObjectId;
	studentName: string;
	className: string;
	section: string;
	amount: number;
	paymentDate: Date;
	payId: string;
	invoiceId: string;
	createdAt: Date;
}