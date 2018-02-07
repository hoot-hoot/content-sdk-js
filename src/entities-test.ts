import { expect } from 'chai'
import 'mocha'

import { Event, SubEventDetails } from './entities'


describe('Event', () => {
    describe('doesLookActive', () => {
        const subEventDetails1 = new SubEventDetails();
        subEventDetails1.haveEvent = true;
        const subEventDetails2 = new SubEventDetails();
        subEventDetails2.haveEvent = false;

        it('should return true for an event with active subevents', () => {
            const event = new Event();
            event.subEventDetails = [
                subEventDetails1,
                subEventDetails2
            ];

            expect(event.doesLookActive).to.be.true;
        });

        it('should return false for an event with no subevents', () => {
            const event = new Event();
            event.subEventDetails = [];

            expect(event.doesLookActive).to.be.false;
        });

        it('should return false for an event with all subevents disabled', () => {
            const event = new Event();
            event.subEventDetails = [subEventDetails2];

            expect(event.doesLookActive).to.be.false;
        });
    });
})
