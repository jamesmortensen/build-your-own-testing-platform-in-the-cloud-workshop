
const loginPage = require("../pageobjects/login.page");
const securePage = require("../pageobjects/secure.page");


describe('Navigation tests', () => {

    it('should login, land on secure page, then go to floating_menus pages', () => {
        loginPage.open();
        loginPage.login('tomsmith', 'SuperSecretPassword!');
        securePage.flashAlert.waitForDisplayed();

        browser.url('/');
        const jQueryUILink = $('a[href="/jqueryui/menu"]');
        jQueryUILink.waitForClickable();
        jQueryUILink.click();

        browser.url('/floating_menu');
        $('#menu > ul > li:nth-child(1) > a').click();
        expect(browser).toHaveUrlContaining('/floating_menu#home');
        $('#menu > ul > li:nth-child(2) > a').click();
        expect(browser).toHaveUrlContaining('/floating_menu#news');
        $('#menu > ul > li:nth-child(3) > a').click();
        expect(browser).toHaveUrlContaining('/floating_menu#contact');
        $('#menu > ul > li:nth-child(4) > a').click();
        expect(browser).toHaveUrlContaining('/floating_menu#about');
    });
})