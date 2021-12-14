const Page = require('./page');

/**
 * sub page containing specific selectors and methods for a specific page
 */
class DynamicLoading1 extends Page {
    /**
     * define selectors using getter methods
     */
    get startButton() { return $('#start > button'); }
    get helloWorldElem() { return $('#finish > h4'); }

    /**
     * overwrite specifc options to adapt it to page object
     */
    open() {
        return super.open('dynamic_loading/1');
    }
}

module.exports = new DynamicLoading1();