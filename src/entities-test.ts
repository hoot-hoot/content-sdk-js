import { expect } from 'chai'
import 'mocha'

import { Event, Picture, PictureSet, SubEventDetails } from './entities'


describe('Event', () => {
    describe('doesLookActive', () => {
        const picture = new Picture();
        picture.position = 0;
        picture.uri = 'https://example.com/picture.jpeg';
        picture.width = Picture.DEFAULT_WIDTH;
        picture.height = Picture.DEFAULT_HEIGHT;

        const subEventDetails1 = new SubEventDetails();
        subEventDetails1.haveEvent = true;

        const subEventDetails2 = new SubEventDetails();
        subEventDetails2.haveEvent = false;

        it('should return true for an event with active subevents and pictures', () => {
            const event = new Event();
            event.pictureSet = new PictureSet();
            event.pictureSet.pictures = [picture];
            event.subEventDetails = [
                subEventDetails1,
                subEventDetails2
            ];

            expect(event.doesLookActive).to.be.true;
        });

        it('should return false for an event with no pictures', () => {
            const event = new Event();
            event.pictureSet = new PictureSet();
            event.pictureSet.pictures = [];
            event.subEventDetails = [
                subEventDetails1,
                subEventDetails2
            ];

            expect(event.doesLookActive).to.be.false;
        });

        it('should return false for an event with no subevents', () => {
            const event = new Event();
            event.pictureSet = new PictureSet();
            event.pictureSet.pictures = [picture];
            event.subEventDetails = [];

            expect(event.doesLookActive).to.be.false;
        });

        it('should return false for an event with all subevents disabled', () => {
            const event = new Event();
            event.pictureSet = new PictureSet();
            event.pictureSet.pictures = [picture];
            event.subEventDetails = [subEventDetails2];

            expect(event.doesLookActive).to.be.false;
        });
    });
})
