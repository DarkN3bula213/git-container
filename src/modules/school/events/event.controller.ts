import asyncHandler from '@/lib/handlers/asyncHandler';
import eventModel from './event.model';
import { NotFoundError, SuccessResponse } from '@/lib/api';
import { cache } from '@/data/cache/cache.service';
import { Key } from '@/data/cache/keys';
export const addEvent = asyncHandler(async (req, res) => {
    const newEvent = new eventModel(req.body);
    const savedEvent = await newEvent.save();
    new SuccessResponse(
        'Event created successfully',
        savedEvent.toObject()
    ).send(res);
});

export const fetchEvent = asyncHandler(async (req, res) => {
    const event = await eventModel.findById(req.params.id);
    if (!event) {
        throw new NotFoundError('Event not found');
    }
    new SuccessResponse('Event fetched successfully', event.toObject()).send(
        res
    );
});

export const fetchAllEvents = asyncHandler(async (req, res) => {
    const key = Key.Events;
    const events = await cache.getWithFallback(key, async () => {
        return await eventModel.find().lean().exec();
    });
    new SuccessResponse('Events fetched successfully', events).send(res);
});

export const updateEvent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const event = await eventModel.findByIdAndUpdate(id, req.body, {
        new: true
    });
    if (!event) {
        throw new NotFoundError('Event not found');
    }
    new SuccessResponse('Event updated successfully', event.toObject()).send(
        res
    );
});

export const deleteEvent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const event = await eventModel.findByIdAndDelete(id);
    if (!event) {
        throw new NotFoundError('Event not found');
    }
    new SuccessResponse('Event deleted successfully', event.toObject()).send(
        res
    );
});
