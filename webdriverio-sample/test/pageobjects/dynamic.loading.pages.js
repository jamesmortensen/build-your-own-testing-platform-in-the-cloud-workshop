const Page = require('./page');

class DynamicLoading extends Page {
    /**
     * define selectors using getter methods
     */
    get startButton() { return $('#start > button'); }
    get helloWorldElem() { return $('#finish > h4'); }
}

module.exports = DynamicLoading;