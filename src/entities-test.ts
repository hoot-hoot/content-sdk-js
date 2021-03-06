import { expect } from 'chai'
import 'mocha'

import { Event, Image, Picture, PictureSet, SubEventDetails } from './entities'


describe('Event', () => {
    describe('doesLookActive', () => {
        const mainImage = new Image();
        mainImage.uri = 'https://example.com/picture.jpeg';
        mainImage.format = Picture.FORMAT;
        mainImage.width = Picture.MAIN_WIDTH;
        mainImage.height = Picture.MAIN_HEIGHT;

        const thumbnailImage = new Image();
        thumbnailImage.uri = 'https://example.com/picture-thumb.jpeg';
        thumbnailImage.format = Picture.FORMAT;
        thumbnailImage.width = Picture.THUMBNAIL_WIDTH;
        thumbnailImage.height = Picture.THUMBNAIL_HEIGHT;

        const picture = new Picture();
        picture.position = 0;
        picture.mainImage = mainImage;
        picture.thumbnailImage = thumbnailImage;

        const subEventDetails1 = new SubEventDetails();
        subEventDetails1.haveEvent = true;
        subEventDetails1.title = { 'en': 'A title' };
        subEventDetails1.slug = 'a-title';

        const subEventDetails2 = new SubEventDetails();
        subEventDetails2.haveEvent = false;
        subEventDetails2.title = { 'en': 'Another title' };
        subEventDetails2.slug = 'another-title';

        const subEventDetails3 = new SubEventDetails();
        subEventDetails3.haveEvent = true;
        subEventDetails3.title = {};
        subEventDetails3.slug = '';


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

        it('should return false for an event with an enabled but not active subevent', () => {
            const event = new Event();
            event.pictureSet = new PictureSet();
            event.pictureSet.pictures = [picture];
            event.subEventDetails = [subEventDetails3];

            expect(event.doesLookActive).to.be.false;
        });
    });
})
