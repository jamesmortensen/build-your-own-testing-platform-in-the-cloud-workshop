
/**
* main page object containing all methods, selectors and functionality
* that is shared across all page objects
*/

//var port = browser.config.baseUrl.match('localhost') !== null ? 9292 : '80';
//port = browser.config.baseUrl.match('app') !== null ? 5000 : port;

module.exports = class Page {
    /**
    * Opens a sub page of the page
    * @param path path of the sub page (e.g. /path/to/page.html)
    */
    open(path) {
        return browser.url(browser.config.baseUrl + `/${path}`)
    }
}
