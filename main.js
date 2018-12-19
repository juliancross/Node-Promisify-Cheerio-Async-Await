const { readFile, writeFile } = require('fs');
const cheerio = require('cheerio');
const { promisify } = require('util');

//Scrapping Data
var scrap = (data) => {
    var $ = cheerio.load(data);

    if (!data) {
        throw err;
    }
    var jsonConstructor = {
        "status": (true) ? 'ok' : 'not ok',
        "results": {
            "trips": [{
                "ref": $('#block-travel > tbody > tr > td > table.block-pnr > tbody > tr > td.pnr-ref > span').text().trim(),
                "name": $('#block-travel > tbody > tr > td > table.block-pnr > tbody > tr > td.pnr-name > span').text().trim(),
                "détails": {
                    "price": parseFloat(parseFloat($('#block-payment > tbody > tr > td > table.total-amount > tbody > tr >td.very-important').text().replace(',', '.').replace('€', ' ').trim()).toFixed(1)),
                    "roundTrips": []
                }
            }],
            "customs": {
                "prices": []
            }
        }
    };
    let length = $('#block-command > tbody > tr > td > table.product-details').length;
    let roundTrips = jsonConstructor.results.trips[0].détails.roundTrips;
    let date = $('table.block-pnr > tbody > tr:nth-child(1) > td').text().match(/\d{2}\/\d{2}\/\d{4}/g);
    $('#block-command > tbody > tr > td > table.product-details').each((i, el) => {
        let x = {
            "type": $(el).find('td.travel-way').text(),
            "date": new Date(date[i].split('/').reverse().join('-')),
            "trains": [{
                "departureStation": $(el).find('td.origin-destination-station.segment-departure').text().trim(),
                "arrivalTime": $(el).find('td.origin-destination-border.origin-destination-hour.segment-arrival').text().trim(),
                "arrivalStation": $(el).find('td.origin-destination-border.origin-destination-station.segment-arrival').text().trim(),
                "type": $(el).find('td.segment').eq(0).text().trim(),
                "number": $(el).find('td.segment').eq(1).text().trim()
            }]
        };
        roundTrips.push(x);
        if (i + 1 === length) {
            let x = roundTrips[i].trains[0]["passsengers"] = [];
            for (let j = 0; j < length; j++) {
                x.push({
                    "type": "échangeable",
                    "age": "(26 à 59 ans)"
                });
            }
        }
    });

    let customPrices = jsonConstructor.results.customs.prices;
    $('#block-command > tbody > tr > td > table.product-header').each((i, el) => {
        let y = {
            "value": parseFloat(parseFloat($(el).find('tbody > tr > td.cell').eq(1).text().replace(',', '.').replace('€', ' ').trim()).toFixed(1))
        };
        customPrices.push(y);
    })

    return jsonConstructor;
};


var construct = async (data) => {
    try {
        var newData = await scrap(data);
        return newData;
    } catch (e) {
        console.log(e.message);
    }
};

//Create JSON
var display = (json) => {
    if (!json) {
        throw new Error("JSON file can't be create");
    }
    return (file) => {
        return writeFile(file, JSON.stringify(json), (err) => {
            if (err) {
                console.log("An error was detected");
            }
            console.log('JSON CREATED');
        });
    }
};

//Start
var start = (path, encoding, file) => {
    let read_File = promisify(readFile);

    read_File(__dirname + path, encoding)
        .then((data) => data = data.replace(/\\["]/g, '"'))
        .then((data) => data = data.replace(/[\\(rn)]{4}/g, ''))
        .then((data) => construct(data))
        .then((data) => display(data)(file))
        .catch((err) => console.log(err))
};

start('/test.html', 'utf8', 'final.json');
