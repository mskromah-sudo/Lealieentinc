#!/usr/bin/env node
import { chromium } from 'playwright';

async function run() {
  const url = process.env.TEST_URL || 'http://127.0.0.1:8080/';
  console.log('Gallery smoke test: connecting to', url);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { timeout: 20000 });

    // Ensure gallery exists
    const galleryCount = await page.$$eval('#gallery .gallery-item', els => els.length);
    if (galleryCount === 0) throw new Error('No gallery items found on the page');
    console.log('Found', galleryCount, 'gallery items');

    // Confirm images start with data-src (no src initially)
    const imgAttrs = await page.$$eval('#gallery img', imgs => imgs.map(i => ({ src: i.getAttribute('src'), dataSrc: i.getAttribute('data-src') })));
    const haveDataSrc = imgAttrs.every(a => !!a.dataSrc);
    if (!haveDataSrc) throw new Error('Expected gallery images to use data-src attributes for lazy loading');
    console.log('Gallery images use data-src attributes');

    // Scroll to the last image to trigger lazy-loading via IntersectionObserver
    await page.evaluate(() => document.querySelector('#gallery .gallery-item:last-child').scrollIntoView());

    // Wait for at least one image to get a src attribute or become loaded
    await page.waitForFunction(() => {
      const imgs = Array.from(document.querySelectorAll('#gallery img'));
      return imgs.some(i => i.getAttribute('src') || i.classList.contains('loaded'));
    }, { timeout: 8000 });

    console.log('Lazy loading observed: at least one image loaded');

    await browser.close();
    console.log('Gallery smoke test: PASS');
    process.exit(0);
  } catch (err) {
    await browser.close();
    console.error('Gallery smoke test: FAIL', err);
    process.exit(1);
  }
}

run();
