const expectChai = require('chai').expect;

describe('Entry Ad Tests', () => {

    beforeEach(() => {
        logger.log('loading the home page');
        browser.url('/');
    })

    it('should display the popup on the first pageload', () => {
        browser.url('/');
        logger.debug('resetting the ad state to be able to trigger it on the next page load.')
        browser.execute(() => {
            $.post('/entry-ad');
        });

        browser.url('/entry_ad');

        expect($('#modal')).toBeDisplayed();
        logger.info('Test 1 completed.')
    });

    it('should not display the popup on subsequent pageloads', () => {
        logger.info('Test 2 begins...');
        browser.url('/entry_ad');

        // wait for the page to load. we don't care if the modal is there or not the first time.
        browser.waitUntil(() => {
            var isExampleDisplayed = $('.example').isDisplayed();
            var isModalDisplayed = $('#modal').isDisplayed();
            logger.log('isModalDisplayed = ' + isModalDisplayed);
            logger.log('isExampleDisplayed = ' + isExampleDisplayed);
            return isExampleDisplayed || isModalDisplayed;
        });

        browser.url('/entry_ad');
        expect($('#modal')).toExist();

        expectChai($('#modal').isDisplayed()).to.be.false;
        logger.info('Test 2 ends...');
    })

});