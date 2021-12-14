
const LoginPage = require('../pageobjects/login.page');
const SecurePage = require('../pageobjects/secure.page');
const GalleryPage = require('../pageobjects/gallery.page');
const galleryPage = new GalleryPage();

describe('Menu Button Tests', () => {
    before('should login with valid credentials and go to Gallery Page', () => {
        LoginPage.open();

        LoginPage.login('tomsmith', 'SuperSecretPassword!');
        expect(SecurePage.flashAlert).toBeExisting();
        expect(SecurePage.flashAlert).toHaveTextContaining(
            'You logged into a secure area!');
        galleryPage.open();
    });

    it('should verify image is present', () => {
        expect($('#content > div > img:nth-child(3)')).toBeExisting();
    });

});


