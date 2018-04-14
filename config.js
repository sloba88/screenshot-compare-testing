module.exports = {
    APP_URL: 'http://localhost:8080/', // location of your website
    FILES_DIR: 'screenshots/', // directory where screenshots will be stored
    pages: [
        {
            'name': 'home', // page name will be directory name
            'path': '',
        },
        {
            'name': 'pricing',
            'path': 'pricing.html',
        }
    ],
    devicesToEmulate: [ // check https://github.com/GoogleChrome/puppeteer/blob/master/DeviceDescriptors.js
        'iPhone 6',
        'iPhone 6 landscape',
        'iPhone 6 Plus',
        'Nexus 6',
        'iPad Pro',
    ]
};