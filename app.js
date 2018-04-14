const puppeteer = require('puppeteer');
const fs = require('fs');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const devices = require('puppeteer/DeviceDescriptors');
const streamifier = require('streamifier');
const config = require('./config');

const startTime = new Date();
let numberOfChanges = 0;

if (!fs.existsSync(config.FILES_DIR)){
    fs.mkdirSync(config.FILES_DIR);
}

const captureScreenshots = async () => {
    const browser = await puppeteer.launch();

    await Promise.all(config.devicesToEmulate.map(async (device) => {
        await Promise.all(config.pages.map(async (p) => {
            const filesDir = config.FILES_DIR + p.name;
            const page = await browser.newPage();
            await page.emulate(devices[device]);

            //open the page
            await page.goto(config.APP_URL + p.path);
            const screenshot = await page.screenshot({fullPage: true});

            if (!fs.existsSync(filesDir)){
                fs.mkdirSync(filesDir);
            }
            await compareScreenshots(`${filesDir}/${device}.png`, screenshot);
        }));
    }));

    await browser.close();
};


const compareScreenshots = (currentImgPath, screenshotBuffer) => {
    return new Promise((resolve) => {
        const img1 = streamifier.createReadStream(screenshotBuffer).on('error', fileError).pipe(new PNG()).on('parsed', doneReading);
        const img2 = fs.createReadStream(currentImgPath).on('error', fileError).pipe(new PNG()).on('parsed', doneReading);

        let filesRead = 0;

        function doneReading() {
            // Wait until both files are read.
            if (++filesRead < 2) return;

            // Do the visual diff.
            const diff = new PNG({width: img1.width, height: img2.height});
            const numDiffPixels = pixelmatch(
                img1.data, img2.data, diff.data, img1.width, img1.height,
                {threshold: 0.1});

            if (numDiffPixels > 0) {
                img1.pack().pipe(fs.createWriteStream(currentImgPath));
                console.log('File changed: ' + currentImgPath + ' with pixel diff of ' + numDiffPixels);
                numberOfChanges++;
            }

            resolve();
        }

        function fileError(error) {
            if (error.code === 'ENOENT') {
                //no such file, so just create one from buffer
                streamifier.createReadStream(screenshotBuffer).pipe(fs.createWriteStream(currentImgPath));
                console.log('New file:', currentImgPath);
                numberOfChanges++;
                resolve();
            }
        }
    });
};

captureScreenshots().then(() => {
    numberOfChanges === 0 ? console.log('Nothing changed.') : console.log('Number of files changed:', numberOfChanges);
    console.log('Completed in:', (new Date() - startTime) / 1000 + ' s');
});
