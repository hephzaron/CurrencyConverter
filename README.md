# Currency Converter

![Currency Converter Image]('build/public/imgs/web-page.JPG')

Currency converter is a mini app that can convert from  one currency to the other and can also display the trend of selected currency over a period of 6days.
It also made use of service worker api, indexedDb and cache api for offline capabilities

## Table of Contents

* [Installation and Setup](#installation-and-setup)
* [Service Worker](#service-worker)
* [Indexed Db](#indexed-db)
* [Cache](#cache)
* [Contributing guide](#contributing-guide)
* [Acknowledgement](#acknowledgement)

## Installation and setup

### Pre-requisites

Ensure the underlisted are installed on your PC before running this application

* Latest version of Nodejs - comes with a Node Package Manager

* A browser that supports the use of service worker and browser storage capabilities

### Installing

1. Download or clone this branch at https://github.com/hephzaron/CurrencyConverter.git"
2. Navigate to working directory and install dependencies:

```
npm install 
```
3. Build JS files and transpile to es5

```
npm run build
```

## Service Worker

This app makes use of a service worker that enables the app to download currencies, rates etc. and save to the browsers db. It also intercept requests to ensure user has an exciting experience when working offline.

> Conversion rates and historical data are only saved to indexedDb when a user at one time or the other have accessed the currency before. For currency list, it is independent of app usage.

## Indexed Db

This is the api used to store currency rates, history, lists etc. in various object stores on the browser, for a first time user get all currency list in the db might take some time due to the large volume of currency details been fetched from the network.

## Cache

This is mostly used to store in the cache  the app's page skeleton for a rich offline use experience.

## License

This project is authored by **Daramola Tobi** (hephzaron@gmail.com) and is licensed for your use, modification and distribution under the **MIT** license.
[MIT][license] © [hephzaron][author]
<!-- Definitions -->
[license]: LICENSE
[author]: hephzaron

## Author

**Daramola Tobi** (hephzaron@gmail.com)is an aspiring developer passionate about building real apps to enhance his learning and sharpen his programming skills, believes strongly in self learning and has variety of interest as it range from web application, data analysis and artificial intelligence.

## Contributing Guide

Thank you for your interest in contributing to this package. I currently accept contributions and corrections from everyone but should be according to standards
To contribute,

1. Fork the project
1. Create a feature branch, branch away from `master`
1. If you have multiple commits please combine them into a few logically organized commits by [squashing them](git-squash)
1. Push the commit(s) to your fork
1. Submit a merge request (MR) to the `master` branch
1. The MR title should describe the change you want to make
1. The MR description should give a motive for your change and the method you used to achieve it.
  1. Mention the issue(s) your merge request solves, using the `Solves #XXX` or
    `Closes #XXX` syntax to auto-close the issue(s) once the merge request will
    be merged.
1. Be prepared to answer questions and incorporate feedback even if requests for this arrive weeks or months after your MR submission
  1. If a discussion has been addressed, select the "Resolve discussion" button beneath it to mark it resolved.
1. When writing commit messages please follow
   [these guidelines](http://chris.beams.io/posts/git-commit).

## Acknowledgement

Throughout this project, the third party api used is [Currency Coverter API](https://free.currencyconverterapi.com/api/v5)
