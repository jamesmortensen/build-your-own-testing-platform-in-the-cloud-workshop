
xdescribe('Event Listeners', () => {
    it('should listen on network events', () => {
        browser.cdp('Network', 'enable')
        browser.on('Network.responseReceived', (params) => {
            logger.log(`Loaded ${params.response.url}`)
        })
        browser.url('https://www.google.com')
    });
});
