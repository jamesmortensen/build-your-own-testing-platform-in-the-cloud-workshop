


describe('Test inputs page', () => {

    var inputElem;

    beforeEach(() => {
        browser.url('/inputs');
        inputElem = $('#content > div > div > div > input');
        inputElem.click();
    })

    it('should show 34 when we enter 34', () => {
        browser.keys(['3', '4']);
        expect(inputElem).toHaveValue('34');
    });

    it('should show 56 when we enter 5ty6', () => {
        browser.keys(['3', 't', 'y', '4']);
        expect(inputElem).toHaveValue('34');
    });

    it('should allow decimals', () => {
        browser.keys(['3', '.', '4']);
        expect(inputElem).toHaveValue('3.4');
    });

    it('should not allow any other special characters', () => {
        browser.keys(['~', '!', '@', '#', '$', '%', '^', '&', '-', '*', '*', '(', ')', '+', '=']);
        expect(inputElem).toHaveValue('');
        logger.log(inputElem.getValue())
    })
})