const Page = require('./page');

/**
 * sub page containing specific selectors and methods for a specific page
 */
class DisappearingPage extends Page {
    /**
     * define selectors using getter methods
     */
    get homeElem () { return $('a[href="/"]') }
    get aboutElem () { return $('a[href="/about/"]') }
    get contactUsElem () { return $('a[href="/contact-us/"]') }
    get portfolioElem () { return $('a[href="/portfolio/"]') }
    get galleryElem () { return $('a[href="/gallery/"]') }

    /**
     * overwrite specifc options to adapt it to page object
     */
    open () {
        return super.open('disappearing_elements');
    }
}

module.exports = new DisappearingPage();
