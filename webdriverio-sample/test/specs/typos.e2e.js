

describe('Typos page', () => {

    it('should load the page and print a sentence', () => {
        browser.url('/typos');
        $('.example > h3').waitForExist();
        expect($('#content > div > p:nth-child(3)')).toHaveText('Sometimes you\'ll see a typo, other times you won\'t.');
    })
})