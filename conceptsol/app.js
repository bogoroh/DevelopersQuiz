var express = require('express');
var path = require('path');
var logger = require('morgan');
var port = process.env.PORT || 3000;
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var engine = require('ejs-mate');
var request = require('request');
var jsonData = require('./data.json');
var app = express();
app.engine('ejs', engine);
var responseDataObj = {};
var AvailableModalityArray = [];
var AvailableModalityObject = {};
var responseDataArray = [];
var OperationObject = {};
var OperationArray = [];
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
var accessToken = {}
request.post({
    headers: {
        'content-type': 'application/x-www-form-urlencoded'
    },
    url: 'http://travellogix.api.test.conceptsol.com/Token',
    form: {
        grant_type: 'password',
        username: 'test1@test2.com',
        password: 'Aa23456!'
    }
}, function(error, response, body) {
    if (!error) {
        // console.log(JSON.parse(response.body).access_token)
        request.post({
            headers: {
                'Content-Type': 'application/json',
                'Authorization': JSON.parse(response.body).token_type + " " + JSON.parse(response.body).access_token
            },
            json: jsonData,
            url: 'http://travellogix.api.test.conceptsol.com/api/Ticket/Search',

        }, function(error, response, body) {
            // This is the result we are looking for
            //console.log(JSON.stringify(response))
            responseData = response;

            for (var i = 0; i < response.body.Result.length; i++) {
                for (var x = 0; x < response.body.Result[i].AvailableModality.length; x++) {
                    for (var z = 0; z < response.body.Result[i].AvailableModality[x].PriceList.length; z++) {
                        // If statement to check if the Description matches SERVICE PRICE that would be the correct price
                        if (response.body.Result[i].AvailableModality[x].PriceList[z].Description == "SERVICE PRICE") {
                            //console.log(response.body.Result[i].AvailableModality[x].PriceList[z].Amount)
                            var ServicePriceCorrect = response.body.Result[i].AvailableModality[x].PriceList[z].Amount
                        }
                        // For loop to update and reverse the date
                        for (var b = 0; b < response.body.Result[i].AvailableModality[x].OperationDateList.length; b++) {
                            var OperationDate = response.body.Result[i].AvailableModality[x].OperationDateList[b].Date;
                            var OperationEndDate = String(parseInt(response.body.Result[i].AvailableModality[x].OperationDateList[b].Date) + response.body.Result[i].AvailableModality[x].OperationDateList[b].MaximumDuration)
                            var OperationYearRes = OperationDate.substring(0, 4); // 2015
                            var OperationYearEndRes = OperationEndDate.substring(0, 4); // 11
                            var OperationMonthRes = OperationDate.substring(4, 6); // 24
                            // Operation Time with added Maximumduration
                            var OperationMonthEndRes = OperationEndDate.substring(4, 6);
                            var OperationDayRes = OperationDate.substring(6, 8);
                            var OperationDayEndRes = OperationEndDate.substring(6, 8);
                            var fromDate = OperationMonthRes + "/" + OperationDayRes + "/" + OperationYearRes;
                            var toDate = OperationMonthEndRes + "/" + OperationDayEndRes + "/" + OperationYearEndRes;
                            OperationObject = {
                                "From": fromDate,
                                "To": toDate
                            }
                            OperationArray.push(OperationObject)
                        }
                        AvailableModalityObject = {
                            "Code": response.body.Result[i].AvailableModality[x].Code,
                            "Name": response.body.Result[i].AvailableModality[x].Name,
                            "Contract": response.body.Result[i].AvailableModality[x].Contract.Name,
                            "ServicePrice": ServicePriceCorrect,
                            "OperationDateList": OperationArray,
                        }
                        AvailableModalityArray.push(AvailableModalityObject)
                        // Empty the OperationArray for the new object
                        OperationArray = [];
                    };
                };
                responseDataObj = {
                    "Destination": response.body.Result[i].TicketInfo.Destination.Code,
                    "Code": response.body.Result[i].TicketInfo.Code,
                    "Classification": response.body.Result[i].TicketInfo.Classification.Value,
                    "Name": response.body.Result[i].TicketInfo.Name,
                    "Description": response.body.Result[i].TicketInfo.DescriptionList[0].Value,
                    "ImageThumb": response.body.Result[i].TicketInfo.ImageList[1].Url,
                    "ImageFull": response.body.Result[i].TicketInfo.ImageList[0].Url,
                    "AvailableModality": AvailableModalityArray
                }
                console.log(responseDataObj)
                // Place the Whole dataobject in an array
                responseDataArray.push(responseDataObj)
            };
        });
    }
});


/* GET home page. */
app.get('/', function(req, res, next) {
    res.render('index', {
        title: 'Mike Taatgen',
        data: JSON.stringify(responseDataArray)
    });
});

app.listen(port);
