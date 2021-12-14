const Page = require('./page');

/**
 * sub page containing specific selectors and methods for a specific page
 */
class GalleryPage extends Page {
    /**
     * define selectors using getter methods
     */
    get headerElem() { return $('.example h3') }
    imageSrc(index) { return $('.example img:nth-child(' + index + ')') }

    /**
     * overwrite specifc options to adapt it to page object
     */
    open() {
        return super.open('/gallery');
    }
}

module.exports = GalleryPage;
